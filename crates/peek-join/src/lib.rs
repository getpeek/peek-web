//! Browser guest client for Peek multiplayer. Compiles to wasm and dials a
//! `DocTicket` shared by a Peek desktop host, syncing the canvas doc over
//! relay + WebTransport. See `../../../plans` for the design.

pub mod node;
pub mod protocol;
pub mod session;

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
pub mod wasm;
