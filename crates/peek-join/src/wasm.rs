//! JS-facing wasm-bindgen surface for the browser guest client.

use serde::Serialize;
use wasm_bindgen::{JsError, prelude::wasm_bindgen};
use wasm_streams::{ReadableStream, readable::sys::ReadableStream as JsReadableStream};

use crate::session::{self, GuestEvent, GuestSession};

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();
    // Quiet globally, verbose for our own crate — surfaces the sync/content
    // flow in the browser console without drowning in iroh internals.
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::new("warn,peek_join=debug"))
        .with_writer(tracing_subscriber_wasm::MakeConsoleWriter::default())
        .without_time()
        .with_ansi(false)
        .init();
    tracing::info!("peek-join wasm initialized");
}

/// A live browser guest session. Construct with `PeekJoinSession.join(ticket)`,
/// then read `events()` once for the doc/cursor event stream.
#[wasm_bindgen]
pub struct PeekJoinSession {
    session: GuestSession,
    events: Option<async_channel::Receiver<GuestEvent>>,
}

#[wasm_bindgen]
impl PeekJoinSession {
    /// Dial the host from a `DocTicket` string and begin syncing.
    pub async fn join(ticket: String) -> Result<PeekJoinSession, JsError> {
        let (session, rx) = session::join(&ticket).await.map_err(to_js_err)?;
        Ok(PeekJoinSession {
            session,
            events: Some(rx),
        })
    }

    /// Take the event stream. Yields `GuestEvent`-shaped objects
    /// (`{ type: "entry" | "delete" | "syncFinished" | "gossip" | "peerUp" | "peerDown", ... }`).
    /// Callable once.
    pub fn events(&mut self) -> Result<JsReadableStream, JsError> {
        let rx = self
            .events
            .take()
            .ok_or_else(|| JsError::new("events() already consumed"))?;
        Ok(into_js_readable_stream(rx))
    }

    /// This guest's endpoint id.
    #[wasm_bindgen(js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.session.endpoint_id()
    }

    /// Broadcast an ephemeral JSON string (cursor/presence) over gossip.
    #[wasm_bindgen(js_name = sendGossip)]
    pub async fn send_gossip(&self, json: String) -> Result<(), JsError> {
        self.session.send_gossip(json).await.map_err(to_js_err)
    }

    /// Ask the host to run `queries` against node `node_id`.
    #[wasm_bindgen(js_name = requestExec)]
    pub async fn request_exec(&self, node_id: String, queries: Vec<String>) -> Result<(), JsError> {
        self.session
            .request_exec(&node_id, queries)
            .await
            .map_err(to_js_err)
    }

    /// Write a UTF-8 doc entry (non-empty — empty values read as deletes).
    #[wasm_bindgen(js_name = docPut)]
    pub async fn doc_put(&self, key: String, value: String) -> Result<(), JsError> {
        self.session.doc_put(&key, value).await.map_err(to_js_err)
    }

    /// Prefix-delete doc entries under `key`.
    #[wasm_bindgen(js_name = docDel)]
    pub async fn doc_del(&self, key: String) -> Result<(), JsError> {
        self.session.doc_del(&key).await.map_err(to_js_err)
    }
}

fn to_js_err(err: impl Into<anyhow::Error>) -> JsError {
    let err: anyhow::Error = err.into();
    JsError::new(&err.to_string())
}

fn into_js_readable_stream<T: Serialize>(
    stream: impl n0_future::Stream<Item = T> + 'static,
) -> JsReadableStream {
    let stream = n0_future::StreamExt::map(stream, |event| {
        Ok(serde_wasm_bindgen::to_value(&event).unwrap_or(wasm_bindgen::JsValue::NULL))
    });
    ReadableStream::from_stream(stream).into_raw()
}
