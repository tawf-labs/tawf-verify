# @tawf/verify-cli

```
tawf-verify init
tawf-verify record --file batch.csv
tawf-verify prove <recordId> --out proof.json
tawf-verify check <proof.json> --rpc <url>
tawf-verify audit <ledger.csv> --org <orgId>
```

`check` is the one command that is **fully real**: it loads a `ProofBundle` JSON file, builds
a real viem chain reader if `--rpc` is given, and calls `@tawf/verify-core`'s real
`verifyProof` — no API key, no Tawf infrastructure required. This is the concrete
implementation of `prd.md` Section 11.3's requirement: *"`tawf-verify check` must run with no
API key and no Tawf infrastructure, against a public RPC only. This is the concrete
implementation of goal G3."*

`init`, `record`, `prove`, and `audit` are stubs that delegate to `@tawf/verify-server`'s
mocked in-memory outbox — see that package's README for the real/mocked boundary.
