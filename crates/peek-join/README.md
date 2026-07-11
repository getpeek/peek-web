# peek-join

Browser guest client for Peek multiplayer. Compiles to wasm and dials a
`DocTicket` shared by a Peek desktop host, syncing the canvas doc over iroh
(relay + WebTransport). Powers `getpeek.dev/join/{ticket}`.

A guest is **view-only**: it mirrors the host's canvas, shows/sends cursors over
gossip, and can ask the host to run queries via `exec-requests/<id>` doc entries.

## Build

Prerequisites (macOS):

- `rustup target add wasm32-unknown-unknown`
- `cargo install wasm-pack`
- `brew install llvm` — the `ring` crypto backend (`tls-ring`) compiles C for
  the wasm target, and macOS system clang has no wasm target. The crate's
  `.cargo/config.toml` points `CC_wasm32_unknown_unknown` / `AR_wasm32_unknown_unknown`
  at Homebrew LLVM. On Linux/CI, override those env vars to a wasm-capable
  `clang` / `llvm-ar` on `PATH`.

```sh
# JS package for the Next.js app (produces ./pkg)
wasm-pack build --target web            # release (small; runs wasm-opt)
wasm-pack build --target web --dev      # fast, unoptimized

# Compile-only wasm gate (mirrors upstream iroh-docs/iroh-blobs CI)
cargo build --target wasm32-unknown-unknown
wasm-tools print --skeleton target/wasm32-unknown-unknown/debug/peek_join.wasm \
  | grep 'import "env"'   # must print nothing
```

## JS surface

```ts
import init, { PeekJoinSession } from "peek-join";
await init();
const session = await PeekJoinSession.join(ticket); // dials + syncs
const events = session.events(); // ReadableStream, read once
// events yield { type: "entry"|"delete"|"syncFinished"|"gossip"|"peerUp"|"peerDown", ... }
await session.sendGossip(JSON.stringify(cursor));
await session.requestExec(nodeId, ["select 1"]);
```

## Protocol parity (must match the desktop app exactly)

- Gossip topic: `blake3("peek/multiplayer:" ++ namespace_id)` — see `src/protocol.rs`
  and `peek/src-tauri/src/multiplayer/session.rs`.
- Key scheme + value JSON: `peek/src/multiplayer/diff.ts`.
- Subscribe before `start_sync` (see `src/session.rs`), or the guest renders empty.
