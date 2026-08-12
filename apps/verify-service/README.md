# @tawf/verify-service

Stub hosted relayer + public verify page (`prd.md` Sections 6.5 and 12). Needs a real
datastore before production - this app inherits `@tawf/verify-server`'s in-memory outbox
(`src/lib/tawf.ts` holds one module-level `TawfVerify` singleton per Node process), so
anchored records do not survive a restart and do not work across multiple server instances.

| Route | prd.md Section 11.2 | Status |
|---|---|---|
| `POST /api/v1/records` | create a record | delegates to `@tawf/verify-server` (mocked chain submission) |
| `GET /api/v1/records/:id/proof` | proof once anchored | delegates to `@tawf/verify-server` |
| `POST /api/v1/batches/flush` | force an anchor now | delegates to `@tawf/verify-server` |
| `GET /api/v1/batches/:id` | batch metadata | stub, in-memory only |
| `POST /api/v1/verify` | stateless verification | **fully real** - calls `@tawf/verify-core`'s `verifyProof` directly on the submitted bundle, no server-side state needed |
| `GET /api/v1/org/:orgId/board` | public transparency board | stub, canned shape |

`/verify/[bundleId]` renders `@tawf/verify-react`'s `<VerifyPanel/>`.

Before deploying for real: replace the in-memory outbox with a durable store and wire a real
signer into `@tawf/verify-server`'s `anchorClient.ts` - see that package's README.
