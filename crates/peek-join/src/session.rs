//! Guest session. Mirrors the join path of
//! `peek/src-tauri/src/multiplayer/session.rs`, minus the reconnect loop (v0).
//! A guest is view-only: it reads remote entries, shows/sends cursors over
//! gossip, and asks the host to run queries via `exec-requests/<id>` entries.

use std::sync::atomic::{AtomicU64, Ordering};

use anyhow::{Context, Result};
use bytes::Bytes;
use iroh::{EndpointAddr, EndpointId};
use iroh_blobs::api::downloader::{Downloader, Shuffled};
use iroh_blobs::{Hash, store::mem::MemStore};
use iroh_docs::{
    AuthorId, DocTicket, api::Doc, engine::LiveEvent, store::DownloadPolicy, store::Query,
};
use iroh_gossip::api::{Event as GossipEvent, GossipReceiver, GossipSender};
use n0_future::{
    StreamExt,
    task::AbortOnDropHandle,
    time::{Duration, sleep},
};
use serde::Serialize;

use crate::node::GuestNode;
use crate::protocol::{EXEC_REQUESTS_PREFIX, app_gossip_topic};

/// Cap on re-`start_sync` attempts after a failed initial sync before we unblock
/// the UI with whatever (possibly empty) state we have.
const MAX_SYNC_ATTEMPTS: u32 = 8;
/// Cap on per-blob download retries before an entry is dropped from the canvas.
const MAX_DOWNLOAD_ATTEMPTS: u32 = 5;

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

    // Seed the endpoint address book with the ticket's full addrs (relay +
    // direct) so gossip's bootstrap dial can reach the host over the relay.
    // Gossip subscribes by bare EndpointId and resolves the route through these
    // lookups; in the browser (relay-only, no hole-punching) discovery alone
    // never finds the host, so without this seed cursor/presence never arrive.
    for addr in &nodes {
        node.address_book.add_endpoint_info(addr.clone());
    }

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
        doc.clone(),
        nodes.clone(),
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

/// Ferry remote doc changes to the event stream, and make the initial load
/// resilient. Two iroh-docs behaviours otherwise strand a guest on a blank
/// canvas with no retry:
///
///   1. `SyncFinished` fires for FAILED syncs too (its `result` is an `Err`).
///      After a failed sync the engine goes Idle and never re-syncs on its own —
///      the `NewNeighbor` trigger that lands mid initial-sync is dropped. We
///      inspect the result and re-`start_sync` (with backoff, and again on every
///      `NeighborUp`) until a sync actually succeeds.
///   2. Sync reconciles entry *records*, not blob content, and the host never
///      re-announces content it already had — so relying on the live
///      `InsertRemote` stream drops any entry whose one-shot download failed. On
///      the first successful sync we snapshot the whole doc and fetch every blob
///      ourselves (with retries), so the canvas always fully materializes.
///
/// Fetches run in their own tasks so a large result blob doesn't stall the rest
/// of the canvas from rendering.
async fn subscribe_loop<S>(
    doc: Doc,
    bootstrap: Vec<EndpointAddr>,
    mut stream: S,
    blobs: MemStore,
    downloader: Downloader,
    providers: Vec<EndpointId>,
    tx: async_channel::Sender<GuestEvent>,
) where
    S: n0_future::Stream<Item = Result<LiveEvent>> + Unpin,
{
    let mut synced_ok = false;
    let mut sync_attempts: u32 = 0;

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
                // The initial canvas is loaded by the post-sync snapshot. Until
                // then, skip per-event downloads: a burst of them over the one
                // relay link races and starves the snapshot's own fetches.
                if !synced_ok {
                    continue;
                }
                let key = String::from_utf8_lossy(entry.key()).into_owned();
                let author = from.to_string();
                if entry.content_len() == 0 {
                    let _ = tx.send(GuestEvent::Delete { key, author }).await;
                    continue;
                }
                spawn_fetch(
                    &blobs,
                    &downloader,
                    &providers,
                    &tx,
                    entry.content_hash(),
                    key,
                    author,
                );
            }
            LiveEvent::SyncFinished(ev) => match ev.result {
                Ok(_) => {
                    tracing::info!("sync-finished ok");
                    if !synced_ok {
                        synced_ok = true;
                        // The live InsertRemote stream is lossy (missed events,
                        // failed downloads); the snapshot is the source of truth
                        // that guarantees the full canvas on first load.
                        reconcile_snapshot(&doc, &blobs, &downloader, &providers, &tx).await;
                    }
                    let _ = tx.send(GuestEvent::SyncFinished).await;
                }
                Err(err) => {
                    tracing::warn!(%err, attempt = sync_attempts, "sync failed");
                    if synced_ok {
                        // Already have the canvas; a later failed re-sync is fine.
                    } else if sync_attempts < MAX_SYNC_ATTEMPTS {
                        sync_attempts += 1;
                        sleep(backoff_delay(sync_attempts)).await;
                        if let Err(err) = doc.start_sync(bootstrap.clone()).await {
                            tracing::warn!(%err, "re-start_sync failed");
                        }
                    } else {
                        // Stop retrying, but unblock the UI rather than hang on
                        // the sync spinner forever.
                        tracing::warn!("sync retries exhausted; surfacing partial state");
                        let _ = tx.send(GuestEvent::SyncFinished).await;
                    }
                }
            },
            LiveEvent::NeighborUp(_) => {
                tracing::info!("neighbor-up");
                let _ = tx.send(GuestEvent::PeerUp).await;
                // A neighbor arriving mid initial-sync is exactly the trigger
                // iroh-docs drops internally, so re-sync to recover a dropped
                // first attempt.
                if !synced_ok && let Err(err) = doc.start_sync(bootstrap.clone()).await {
                    tracing::warn!(%err, "re-start_sync on neighbor-up failed");
                }
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

/// Read the entire current doc and fetch every entry's content ourselves. Runs
/// once after the first successful sync as the source of truth for the initial
/// canvas, independent of the lossy live `InsertRemote` + auto-download path.
async fn reconcile_snapshot(
    doc: &Doc,
    blobs: &MemStore,
    downloader: &Downloader,
    providers: &[EndpointId],
    tx: &async_channel::Sender<GuestEvent>,
) {
    let stream = match doc.get_many(Query::all()).await {
        Ok(stream) => stream,
        Err(err) => {
            tracing::warn!(%err, "snapshot get_many failed");
            return;
        }
    };
    // Collect the entry records first so the query stream isn't held open
    // across the (slow) content downloads.
    let mut items: Vec<(Hash, String, String)> = Vec::new();
    let mut stream = Box::pin(stream);
    while let Some(entry) = stream.next().await {
        let entry = match entry {
            Ok(entry) => entry,
            Err(err) => {
                tracing::warn!(%err, "snapshot entry error");
                continue;
            }
        };
        if entry.content_len() == 0 {
            continue;
        }
        let key = String::from_utf8_lossy(entry.key()).into_owned();
        let author = entry.author().to_string();
        items.push((entry.content_hash(), key, author));
    }
    drop(stream);

    // Download one at a time. A burst of concurrent fetches over the single
    // relay connection is what was collapsing the transfer and leaving the
    // canvas blank; serial is slower but reliable, and the emitted/failed
    // counts make the outcome unambiguous in the logs.
    let total = items.len();
    let mut emitted: u32 = 0;
    let mut failed: u32 = 0;
    for (hash, key, author) in items {
        match fetch_and_emit(blobs, downloader, providers.to_vec(), tx, hash, &key, author).await {
            Ok(()) => emitted += 1,
            Err(err) => {
                failed += 1;
                tracing::warn!(%key, %err, "snapshot fetch failed");
            }
        }
    }
    tracing::info!(total, emitted, failed, "snapshot complete");
}

/// Download (if needed) and emit one entry's content on its own task. Shared by
/// the live `InsertRemote` path and the initial snapshot.
fn spawn_fetch(
    blobs: &MemStore,
    downloader: &Downloader,
    providers: &[EndpointId],
    tx: &async_channel::Sender<GuestEvent>,
    hash: Hash,
    key: String,
    author: String,
) {
    let blobs = blobs.clone();
    let downloader = downloader.clone();
    let providers = providers.to_vec();
    let tx = tx.clone();
    n0_future::task::spawn(async move {
        if let Err(err) =
            fetch_and_emit(&blobs, &downloader, providers, &tx, hash, &key, author).await
        {
            tracing::warn!(%key, %err, "content fetch failed");
        }
    });
}

/// Read a blob locally, downloading it from the host first if we don't have it.
/// The download is retried with backoff: over a relay the blobs connection fails
/// transiently, and iroh-docs never re-offers content, so a single failed fetch
/// would drop that node from the canvas permanently.
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
        let mut attempt: u32 = 0;
        loop {
            attempt += 1;
            match downloader
                .download(hash, Shuffled::new(providers.clone()))
                .await
            {
                Ok(_) => break,
                Err(err) if attempt < MAX_DOWNLOAD_ATTEMPTS => {
                    tracing::warn!(%key, attempt, %err, "content download failed; retrying");
                    sleep(backoff_delay(attempt)).await;
                }
                Err(err) => {
                    return Err(anyhow::anyhow!(
                        "download {hash} after {attempt} attempts: {err}"
                    ));
                }
            }
        }
    }
    let bytes = blobs
        .get_bytes(hash)
        .await
        .map_err(|err| anyhow::anyhow!("get_bytes after download: {err}"))?;
    emit_entry(tx, key.to_owned(), author, &bytes).await;
    Ok(())
}

/// Exponential backoff for sync/download retries: 500ms, 1s, 2s, then 4s.
fn backoff_delay(attempt: u32) -> Duration {
    let shift = attempt.saturating_sub(1).min(3);
    Duration::from_millis(500u64 << shift)
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
            // A gossip neighbor is the prerequisite for receiving any broadcast;
            // logging membership makes it obvious at runtime whether the swarm
            // formed (empty inbound gossip == we never got a NeighborUp).
            Ok(GossipEvent::NeighborUp(id)) => tracing::info!(%id, "gossip neighbor-up"),
            Ok(GossipEvent::NeighborDown(id)) => tracing::info!(%id, "gossip neighbor-down"),
            Ok(_) => {}
            Err(err) => tracing::warn!("gossip recv error: {err}"),
        }
    }
}
