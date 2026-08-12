# @tawf/verify-react

Stub package matching `prd.md` Section 6.3's three components. Component structure and
rendering are real; `useVerify`'s data fetch is a **stub** returning a canned fixture rather
than hitting a live `verify.tawf.app` deployment — see the `// STUB:` comment in
`useVerify.ts` for exactly where a real `fetch("/v1/verify")` call (Section 11.2) needs to go.

| Component | Purpose (prd.md Section 6.3 / 12) |
|---|---|
| `<VerifyBadge receiptId />` | Small inline verdict, for a donor receipt page |
| `<VerifyPanel receiptId />` | Full verification result: leaf, root, batch, tx hash, verdict copy |
| `<TransparencyBoard orgId />` | Operator's public `/transparansi` page (Section 12.2) |
