# @tawf/verify-server

Stub package - structured to match `prd.md` Section 11.1's API surface, but with **mocked
internals** until Phase 1/2 fund the real relayer:

| Function | Status |
|---|---|
| `record()` | Real logic against an **in-memory outbox** - lost on process restart. A real deployment needs a durable store (Postgres, SQLite, anything) behind the same interface. |
| `flushBatch()` | Real Merkle tree construction via `@tawf/verify-core`. Signing/submission is **mocked** in `anchorClient.ts` - see the `// MOCK:` comment for exactly where a real viem wallet client + `anchorBatch()` call needs to go. |
| `verifyRecord()` | **Fully real end to end** - builds a viem-backed chain reader from `rpcUrl` and delegates to `@tawf/verify-core`'s real `verifyProof`. This is the one function here that isn't a stub. |
| `audit()` | Structural stub: real shape (`{total, verified, missing, mismatched, gaps}`), computed against the in-memory outbox rather than a real chain scan. |

Do not point this at production traffic. See `prd.md` Section 6.5 and Section 13 (Phase 1/2)
for what the real hosted relayer needs.
