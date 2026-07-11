//! Guest session. Mirrors the join path of
//! `peek/src-tauri/src/multiplayer/session.rs`, minus the reconnect loop (v0).
//! A guest is view-only: it reads remote entries, shows/sends cursors over
//! gossip, and asks the host to run queries via `exec-requests/<id>` entries.

use std::sync::atomic::{AtomicU64, Ordering};

use anyhow::{Context, Result};
use bytes::Bytes;
use iroh::EndpointId;
use iroh_blobs::api::downloader::{Downloader, Shuffled};
use iroh_blobs::{Hash, store::mem::MemStore};
use iroh_docs::{AuthorId, DocTicket, api::Doc, engine::LiveEvent, store::DownloadPolicy};
use iroh_gossip::api::{Event as GossipEvent, GossipReceiver, GossipSender};
use n0_future::{StreamExt, task::AbortOnDropHandle};
use serde::Serialize;

use crate::node::GuestNode;
use crate::protocol::{EXEC_REQUESTS_PREFIX, app_gossip_topic};

/// Events pushed to the JS side over a ReadableStream. Serialized with
/// serde-wasm-bindgen (`type` tag → discriminant, camelCase fields).
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum GuestEvent {
    /// A doc entry was inserted/updated. `value` is the UTF-8 blob body (all
    /// Peek doc values are JSON/text).
    Entry {
        key: String,
        value: String,
        author: String,
    },
    /// A doc entry was deleted (empty-content marker).
    Delete {
        key: String,
        author: String,
    },
    /// Initial reconciliation with the host completed.
    SyncFinished,
    /// An ephemeral gossip payload (cursor/presence) from a peer.
    Gossip {
        payload: serde_json::Value,
        author: String,
    },
    /// A doc-sync neighbor connected / disconnected.
    PeerUp,
    PeerDown,
}

/// A live guest session. Owns the iroh node (dropping it tears the endpoint
/// down) and the background loops (aborted on drop).
pub struct GuestSession {
    node: GuestNode,
    doc: Doc,
    author_id: AuthorId,
    gossip_sender: GossipSender,
    exec_counter: AtomicU64,
    _tasks: Vec<AbortOnDropHandle<()>>,
}

impl GuestSession {
    /// This node's endpoint id (useful for attributing our own cursor).
    pub fn endpoint_id(&self) -> String {
        self.node.endpoint.id().to_string()
    }

    /// Broadcast an ephemeral JSON payload (cursor/presence) on the app gossip
    /// topic. Lossy, fire-and-forget.
    pub async fn send_gossip(&self, json: String) -> Result<()> {
        self.gossip_sender
            .broadcast(Bytes::from(json.into_bytes()))
            .await
            .context("gossip broadcast")?;
        Ok(())
    }

    /// Ask the host to run `queries` against the node `node_id`, via an
    /// `exec-requests/<id>` entry the host picks up and executes. The host
    /// deletes the entry and syncs the resulting `results/<id>` back to us.
    pub async fn request_exec(&self, node_id: &str, queries: Vec<String>) -> Result<()> {
        let seq = self.exec_counter.fetch_add(1, Ordering::Relaxed);
        // Author-scoped + monotonic → unique without an RNG dependency.
        let short_author = &self.author_id.to_string()[..8.min(self.author_id.to_string().len())];
        let key = format!("{EXEC_REQUESTS_PREFIX}{short_author}-{seq}");
        let payload = serde_json::json!({ "nodeId": node_id, "queries": queries });
        let value = serde_json::to_vec(&payload).context("serialize exec request")?;
        self.doc
            .set_bytes(self.author_id, key.into_bytes(), Bytes::from(value))
            .await
            .context("set_bytes exec request")?;
        Ok(())
    }

    /// Write a UTF-8 doc entry signed by this guest's author. `value` must not
    /// be empty — receivers treat zero-length content as a tombstone.
    pub async fn doc_put(&self, key: &str, value: String) -> Result<()> {
        self.doc
            .set_bytes(
                self.author_id,
                key.as_bytes().to_vec(),
                Bytes::from(value.into_bytes()),
            )
            .await
            .context("set_bytes doc put")?;
        Ok(())
    }

    /// Delete doc entries under `key`. iroh-docs `del` is a prefix delete, so
    /// this tombstones every key that starts with `key` — matching the host's
    /// `mp_doc_del` semantics.
    pub async fn doc_del(&self, key: &str) -> Result<()> {
        self.doc
            .del(self.author_id, key.as_bytes().to_vec())
            .await
            .context("doc del")?;
        Ok(())
    }
}

/// Spawn a browser node, import the ticket's namespace, and start syncing.
/// Returns the session and the receiver half of its event stream.
pub async fn join(ticket_str: &str) -> Result<(GuestSession, async_channel::Receiver<GuestEvent>)> {
    let node = GuestNode::spawn().await.context("spawn node")?;

    let ticket = ticket_str
        .parse::<DocTicket>()
        .context("parse doc ticket")?;
    let DocTicket { capability, nodes } = ticket;
    let bootstrap_ids: Vec<EndpointId> = nodes.iter().map(|addr| addr.id).collect();
    // Same peers act as blob providers for our explicit content downloads.
    let providers = bootstrap_ids.clone();

    // `import_namespace` (not `import`) so we can subscribe BEFORE sync starts —
    // see the extended note in the desktop `session.rs::join`. Getting this
    // ordering wrong makes the guest render an empty canvas.
    let doc = node
        .docs
        .import_namespace(capability)
        .await
        .context("import namespace")?;
    let author_id = node.docs.author_create().await.context("author create")?;
    let namespace_id = doc.id();

    doc.set_download_policy(DownloadPolicy::EverythingExcept(vec![]))
        .await
        .context("set download policy")?;

    let stream = doc.subscribe().await.context("subscribe to doc")?;

    let (tx, rx) = async_channel::unbounded::<GuestEvent>();

    let downloader = node.blobs.downloader(&node.endpoint);
    let sub_task = AbortOnDropHandle::new(n0_future::task::spawn(subscribe_loop(
        Box::pin(stream),
        node.blobs.clone(),
        downloader,
        providers,
        tx.clone(),
    )));

    let topic = app_gossip_topic(&namespace_id);
    let topic_handle = node
        .gossip
        .subscribe(topic, bootstrap_ids)
        .await
        .context("gossip subscribe")?;
    let (gossip_sender, gossip_receiver) = topic_handle.split();
    let gossip_task = AbortOnDropHandle::new(n0_future::task::spawn(gossip_loop(
        gossip_receiver,
        tx.clone(),
    )));

    // Sync only after the subscriber is attached.
    let node_count = nodes.len();
    doc.start_sync(nodes).await.context("start sync")?;
    tracing::info!(node_count, %namespace_id, "join complete, sync started");

    let session = GuestSession {
        node,
        doc,
        author_id,
        gossip_sender,
        exec_counter: AtomicU64::new(0),
        _tasks: vec![sub_task, gossip_task],
    };
    Ok((session, rx))
}

/// Ferry remote doc changes to the event stream. iroh-docs' engine only
/// auto-downloads content the remote reports as `Complete` during sync, and the
/// host never re-announces `ContentReady` for its own pre-existing content — so
/// a fresh joiner's content downloads never fire and every entry is stuck with
/// only its hash. We therefore fetch each blob from the host ourselves via the
/// blobs `Downloader`, then emit. Fetches run in their own tasks so a large
/// result blob doesn't stall the rest of the canvas from rendering.
async fn subscribe_loop<S>(
    mut stream: S,
    blobs: MemStore,
    downloader: Downloader,
    providers: Vec<EndpointId>,
    tx: async_channel::Sender<GuestEvent>,
) where
    S: n0_future::Stream<Item = Result<LiveEvent>> + Unpin,
{
    while let Some(event) = stream.next().await {
        let event = match event {
            Ok(event) => event,
            Err(err) => {
                tracing::warn!("doc subscribe error: {err}");
                continue;
            }
        };

        match event {
            LiveEvent::InsertRemote { from, entry, .. } => {
                let key = String::from_utf8_lossy(entry.key()).into_owned();
                let author = from.to_string();
                let len = entry.content_len();
                if len == 0 {
                    let _ = tx.send(GuestEvent::Delete { key, author }).await;
                    continue;
                }
                let hash = entry.content_hash();
                let blobs = blobs.clone();
                let downloader = downloader.clone();
                let providers = providers.clone();
                let tx = tx.clone();
                n0_future::task::spawn(async move {
                    if let Err(err) =
                        fetch_and_emit(&blobs, &downloader, providers, &tx, hash, &key, author)
                            .await
                    {
                        tracing::warn!(%key, %err, "content fetch failed");
                    }
                });
            }
            LiveEvent::SyncFinished(_) => {
                tracing::info!("sync-finished");
                let _ = tx.send(GuestEvent::SyncFinished).await;
            }
            LiveEvent::NeighborUp(_) => {
                tracing::info!("neighbor-up");
                let _ = tx.send(GuestEvent::PeerUp).await;
            }
            LiveEvent::NeighborDown(_) => {
                tracing::info!("neighbor-down");
                let _ = tx.send(GuestEvent::PeerDown).await;
            }
            // InsertLocal (our own writes), ContentReady, PendingContentReady ignored.
            _ => {}
        }
    }
}

/// Read a blob locally, downloading it from the host first if we don't have it.
async fn fetch_and_emit(
    blobs: &MemStore,
    downloader: &Downloader,
    providers: Vec<EndpointId>,
    tx: &async_channel::Sender<GuestEvent>,
    hash: Hash,
    key: &str,
    author: String,
) -> Result<()> {
    if blobs.get_bytes(hash).await.is_err() {
        downloader
            .download(hash, Shuffled::new(providers))
            .await
            .map_err(|err| anyhow::anyhow!("download {hash}: {err}"))?;
    }
    let bytes = blobs
        .get_bytes(hash)
        .await
        .map_err(|err| anyhow::anyhow!("get_bytes after download: {err}"))?;
    emit_entry(tx, key.to_owned(), author, &bytes).await;
    Ok(())
}

async fn emit_entry(
    tx: &async_channel::Sender<GuestEvent>,
    key: String,
    author: String,
    bytes: &[u8],
) {
    let value = String::from_utf8_lossy(bytes).into_owned();
    let _ = tx.send(GuestEvent::Entry { key, value, author }).await;
}

/// Ferry ephemeral gossip payloads (cursors/presence) to the event stream.
async fn gossip_loop(mut receiver: GossipReceiver, tx: async_channel::Sender<GuestEvent>) {
    while let Some(event) = receiver.next().await {
        match event {
            Ok(GossipEvent::Received(msg)) => {
                let payload: serde_json::Value = match serde_json::from_slice(&msg.content) {
                    Ok(value) => value,
                    Err(err) => {
                        tracing::warn!("gossip payload parse error: {err}");
                        continue;
                    }
                };
                let _ = tx
                    .send(GuestEvent::Gossip {
                        payload,
                        author: msg.delivered_from.to_string(),
                    })
                    .await;
            }
            Ok(_) => {}
            Err(err) => tracing::warn!("gossip recv error: {err}"),
        }
    }
}
