//! Wire-protocol constants shared with the Peek desktop app. These MUST stay
//! byte-for-byte identical to the desktop side or a session silently fails to
//! converge. Desktop sources:
//!   - gossip topic:  peek/src-tauri/src/multiplayer/session.rs  (`app_gossip_topic`)
//!   - key scheme:    peek/src/multiplayer/diff.ts

use iroh_blobs::Hash;
use iroh_docs::NamespaceId;
use iroh_gossip::proto::TopicId;

/// Ephemeral cursor/presence traffic rides a topic distinct from iroh-docs'
/// internal sync topic (which equals the namespace id). Sharing that topic
/// would feed our JSON into iroh-docs' postcard receive loop and kill live
/// entry propagation. Derivation is `blake3("peek/multiplayer:" ++ namespace)`,
/// matching `session.rs::app_gossip_topic`.
pub fn app_gossip_topic(namespace_id: &NamespaceId) -> TopicId {
    let mut buf = Vec::with_capacity(17 + 32);
    buf.extend_from_slice(b"peek/multiplayer:");
    buf.extend_from_slice(namespace_id.as_bytes());
    TopicId::from_bytes(*Hash::new(&buf).as_bytes())
}

/// Prefix for joiner→host "run these queries" requests. Matches
/// `EXEC_REQUESTS_PREFIX` in `diff.ts`.
pub const EXEC_REQUESTS_PREFIX: &str = "exec-requests/";
