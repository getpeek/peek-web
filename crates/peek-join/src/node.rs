//! Browser iroh node. Mirrors `peek/src-tauri/src/multiplayer/node.rs`, but
//! binds the endpoint with the browser builder (relay + WebTransport, no UDP).

use anyhow::Result;
use iroh::{Endpoint, address_lookup::MemoryLookup, endpoint::presets, protocol::Router};
use iroh_blobs::{ALPN as BLOBS_ALPN, BlobsProtocol, store::mem::MemStore};
use iroh_docs::{ALPN as DOCS_ALPN, protocol::Docs};
use iroh_gossip::{ALPN as GOSSIP_ALPN, net::Gossip};

/// A browser-side iroh node: endpoint + blobs/gossip/docs behind a router.
/// All storage is in-memory — a guest session has no persistence.
pub struct GuestNode {
    pub endpoint: Endpoint,
    pub blobs: MemStore,
    pub docs: Docs,
    pub gossip: Gossip,
    /// Static address book seeded from the join ticket. iroh-docs seeds its own
    /// copy internally, but app-gossip's bootstrap dial resolves through the
    /// endpoint's lookups — without a relay route here it never finds the host
    /// in-browser and cursor/presence silently never arrive.
    pub address_book: MemoryLookup,
    _router: Router,
}

impl GuestNode {
    /// Bind an endpoint and spin up blobs/gossip/docs. In the browser the
    /// endpoint reaches peers only through a relay (no hole-punching), which is
    /// why the host must share a `RelayAndAddresses` ticket.
    pub async fn spawn() -> Result<Self> {
        let address_book = MemoryLookup::new();
        let endpoint = Endpoint::builder(presets::N0)
            .address_lookup(address_book.clone())
            .bind()
            .await?;
        let blobs = MemStore::default();
        let gossip = Gossip::builder().spawn(endpoint.clone());
        let docs = Docs::memory()
            .spawn(endpoint.clone(), (*blobs).clone(), gossip.clone())
            .await?;

        let router = Router::builder(endpoint.clone())
            .accept(BLOBS_ALPN, BlobsProtocol::new(&blobs, None))
            .accept(GOSSIP_ALPN, gossip.clone())
            .accept(DOCS_ALPN, docs.clone())
            .spawn();

        Ok(Self {
            endpoint,
            blobs,
            docs,
            gossip,
            address_book,
            _router: router,
        })
    }
}
