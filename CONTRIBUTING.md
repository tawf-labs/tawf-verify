# Contributing to tawf-verify

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

Contracts live outside the pnpm workspace (Foundry, not npm-managed):

```bash
cd contracts
forge install
forge test -vvv
```

## The one rule that matters most

`packages/verify-core` is the piece this whole product's trust claim rests on: it must
outlive Tawf Labs and must produce byte-identical output across implementations forever.
Any change to `canonicalize.ts`, `hash.ts`, or `merkle.ts` is a determinism-breaking change
until proven otherwise:

- Every change must keep the golden vectors in `packages/verify-core/test/vectors/` passing
  unmodified. If a vector must change, that's a schema version bump (`schemaId`), not a patch.
- `hash.ts` and `merkle.ts` are held to 100% branch coverage in CI. This is a release
  blocker, not a suggestion - see `prd.md` Section 15.
- If you touch the Merkle pairing/domain-separation rule, you must also update
  `contracts/src/TawfVerifyRegistry.sol`'s `verify()` function and its parity test. The two
  implementations must treat identical input identically, in perpetuity.

## Commit style

Small, reviewable commits. Explain *why* in the body when the change isn't self-evident from
the diff - especially for anything in `verify-core` or the contract.
