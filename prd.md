# PRD: tawf-verify SDK

**Product:** `tawf-verify` (SDK + anchoring contract + hosted verification page)
**Owner:** Tawf Labs
**First consumer:** ziswaf.tawf.app (zkt.app / ZISWAF platform)
**Status:** Draft v0.1
**Last updated:** 12 August 2026

---

## 1. Summary

`tawf-verify` lets any ZISWAF operator keep collecting donations the ordinary way (QRIS, bank transfer, virtual account, e-wallet, IDRX) while making every resulting transaction record independently verifiable on a public blockchain.

The operator's database stays the source of truth for the money. The chain stores only a cryptographic fingerprint of each record. A donor, an auditor, or a regulator can then take a receipt and prove two things without trusting the operator:

1. **Existence.** This transaction was recorded at or before block N, timestamp T.
2. **Integrity.** The amount, date, campaign, and recipient in this receipt are byte-for-byte what was recorded then. Nothing was edited afterwards.

No token is minted. No custody of donor funds moves on chain. The chain is used as a tamper-evident notary, which is the cheapest and most defensible use of it for a regulated charity flow in Indonesia.

---

## 2. Reference teardown: what we borrow and what we invert

The brief was to reverse `poc.bhremada.com`. That product is worth copying structurally and worth departing from architecturally.

| Dimension | Proof of Coffee | tawf-verify |
|---|---|---|
| What lives on chain | ERC-20 balance, real value | keccak256 fingerprint of an off-chain record, no value |
| Contract role | Custodian vault, mints, burns, transfers | Append-only registry, `anchorBatch()` only |
| Write frequency | One write per order | One write per batch (hundreds to millions of records) |
| Wallet model | Embedded wallet per user | No donor wallet required at all |
| User asset | Token balance to spend | Receipt file plus an inclusion proof |
| Failure blast radius | Contract bug can drain value | Contract bug can at worst stop new anchors, funds untouched |
| Regulatory posture | Issues a transferable asset, an OJK/Bappebti conversation | Publishes hashes, no asset issued, far lighter posture |
| Public artefact | `/blockchain` transparency page listing contracts | `/verify` page where you paste a receipt and get a verdict |

Three things from Proof of Coffee we keep deliberately:

- **The public transparency page as a first-class product surface**, not a footer link. It is the whole point.
- **EIP-712 typed signing** for operator authorization, so anchors are attributable to a named signer key.
- **A cheap L2 rather than Ethereum L1.** Their choice of Arbitrum One is sound reasoning. Ours differs only on ecosystem fit.

Three things we reject:

- **Per-transaction on-chain writes.** At Indonesian ZISWAF volume this is financially absurd. We batch with a Merkle tree.
- **Custody in a vault contract.** A charity anchoring receipts should never hold donor value in an unaudited contract.
- **Putting readable amounts and names on chain by default.** Indonesian PDP law and Islamic norms around discreet giving both push the other way.

---

## 3. Problem statement

Indonesian ZISWAF operators (BAZNAS, LAZ, yayasan, masjid) already publish reports. Nobody can check them. The typical trust chain is:

> donor pays via QRIS, operator writes a row in MySQL, operator publishes a PDF report quarterly, donor believes it

Every link after the first is unfalsifiable. An operator can edit a row, backdate a distribution, or reconcile a shortfall silently, and no external party can detect it. Audits catch aggregate fraud months later, not record-level edits.

This is the exact gap that shows up in user testing with BAZNAS officials: they do not distrust each other, they lack a mechanism to *demonstrate* trustworthiness to donors at record level. "Trust us" does not scale to a national donor base.

Meanwhile the obvious fix, moving donations fully on chain, is blocked by three hard constraints:

1. Donors pay in rupiah via QRIS. They will not open a wallet.
2. Full on-chain zakat exposes donor identity and amount, which conflicts with the norm of discreet giving and with PDP law.
3. Mainnet deployment of a value-holding contract requires an audit that is not funded yet.

`tawf-verify` sidesteps all three. It requires no donor wallet, publishes no personal data, and holds no funds, so it can ship to mainnet without a value-at-risk audit.

---

## 4. Goals and non-goals

### 4.1 Goals

- **G1.** Any donation, distribution, or expense record from a traditional rail can be anchored with a single SDK call, with under 30 minutes of integration work for a competent backend developer.
- **G2.** A donor with only a receipt PDF or a receipt ID can verify it in under 15 seconds, on a phone, without a wallet, without an account, and without trusting tawf.app.
- **G3.** Verification is possible even if Tawf Labs disappears. The proof material is portable and the verifier logic is open source.
- **G4.** No personal data and no unblinded amount reaches the chain unless the operator explicitly opts into public mode.
- **G5.** Marginal on-chain cost per anchored record stays under Rp 1 at 10,000 records per batch.
- **G6.** The SDK is usable from Node, and from PHP or Python via a documented REST fallback, because most Indonesian LAZ backends are Laravel or CodeIgniter.

### 4.2 Non-goals (v1)

- Not a payment gateway. It never touches funds and never initiates a transfer.
- Not an accounting system. It anchors what the operator's system already produced.
- Not a token, points, or rewards system.
- Not zero-knowledge proofs in v1. ZK is the v2 lane (Section 13), and salted commitments already deliver most of the privacy benefit at a fraction of the risk.
- Not a replacement for a statutory audit. It is evidence an auditor can use, not a substitute for one.
- No on-chain governance, DAO, or voting.

---

## 5. Users and jobs to be done

| Persona | Job | Success looks like |
|---|---|---|
| **Muzakki / donor (Rina, 29, Jakarta, pays via QRIS)** | "Confirm my Rp 500,000 actually got recorded and was not quietly altered" | Scans QR on receipt, sees a green verdict and a block timestamp, closes the tab |
| **LAZ operations staff (Pak Budi, finance, 200 to 2,000 tx/month)** | "Publish proof without changing how we work" | Installs SDK, existing flow unchanged, receipts now carry a verify link |
| **LAZ IT lead** | "Integrate without learning crypto" | No wallet, no gas, no private key handling on his side. One API key |
| **Internal or external auditor** | "Check that the ledger I was handed matches what was recorded live" | Exports the operator ledger, runs `tawf-verify audit ledger.csv`, gets a per-row pass or fail |
| **Regulator (Kemenag, BAZNAS supervisory, OJK for the fintech arm)** | "Confirm reported figures were not reconstructed after the fact" | Independent confirmation that anchors predate the report |
| **Tawf Labs** | "Ship something to mainnet that does not need a funded audit" | Live mainnet product, real users, real credibility for the Digdaya and IDBW narrative |

---

## 6. Product surfaces

`tawf-verify` ships as five artefacts.

### 6.1 `@tawf/verify-core`
Isomorphic TypeScript. Canonicalization, leaf hashing, Merkle tree construction, proof generation, proof verification. Zero network calls, zero chain dependency. This is the piece that must survive Tawf Labs. Published to npm under Apache-2.0.

### 6.2 `@tawf/verify-server`
Node/Bun server SDK. Record buffering, batch scheduling, anchor submission, signer management, retries, idempotency, webhooks. Talks to the chain via viem.

### 6.3 `@tawf/verify-react`
Drop-in UI. `<VerifyBadge receiptId="..."/>` for the donor receipt page, `<VerifyPanel/>` for a full verification result, `<TransparencyBoard/>` for the operator's public page (the direct analogue of the Proof of Coffee `/blockchain` route).

### 6.4 `TawfVerifyRegistry.sol`
The on-chain contract. Append-only, no upgradeability in v1, no funds.

### 6.5 Hosted service (`verify.tawf.app`)
Optional. A managed anchoring relayer plus a public verification page. Operators who do not want to run a signer or hold gas use this. Self-hosting stays fully supported and documented, because a trust product that can only be run by its vendor undermines its own claim.

---

## 7. Core architecture

### 7.1 Flow

```
[Donor pays via QRIS]
        |
        v
[Operator backend confirms payment]  <-- unchanged, source of truth
        |
        | tawf.record({...})          <-- one line added
        v
[Local buffer / outbox table]
        |
        | every N records or every T minutes
        v
[Merkle tree built over pending leaves]
        |
        | anchorBatch(root, count, uri) signed EIP-712
        v
[TawfVerifyRegistry on L2]  ---> event BatchAnchored(batchId, root, count, uri, timestamp)
        |
        v
[Proof bundle written back to each record]
        |
        v
[Receipt shows verify link + QR]
```

### 7.2 Why Merkle batching

One anchor transaction commits to an unbounded number of records. A donor still gets a record-level proof: the leaf, the sibling path, the root, and the transaction that published the root. Verification is `O(log n)` hashes done in the browser.

Cost model at Base mainnet, roughly 60,000 gas per `anchorBatch` call:

| Batch size | Gas per record | Approximate cost per record |
|---|---|---|
| 100 | 600 | negligible |
| 10,000 | 6 | far below Rp 1 |
| 1,000,000 | 0.06 | effectively zero |

The cost is essentially independent of volume, which is what makes this viable for an organization anchoring a million rows a year on a charity budget.

### 7.3 Trade-off: latency

Batching means a record is not provable the instant it is created. Default cadence is every 15 minutes or every 5,000 records, whichever comes first. Between creation and anchoring, the SDK returns status `pending` with an expected anchor time. Operators who need instant finality for a specific record can call `tawf.anchorNow(recordId)`, which costs one dedicated transaction. This should be documented as an expensive escape hatch, not a default.

---

## 8. Data model

### 8.1 Record types

| Type | Meaning | Typical source |
|---|---|---|
| `donation` | Funds received from a donor | QRIS callback, VA webhook, IDRX transfer |
| `disbursement` | Funds paid to a mustahik or program | Bank transfer batch |
| `allocation` | Internal earmarking to a campaign or asnaf | Ops action |
| `expense` | Operational cost taken under `amil` share | Accounting entry |
| `attestation` | Off-chain document, for example a distribution photo set or an auditor sign-off | File upload |

The set is deliberately small and closed in v1. `schemaId` carries the version so it can grow without breaking old proofs.

### 8.2 Canonical record (input to the SDK)

```jsonc
{
  "schema": "tawf.verify.record.v1",
  "type": "donation",
  "orgId": "laz-almustaqim",
  "recordId": "TRX-2026-08-000184213",   // operator's own primary key
  "occurredAt": "2026-08-12T04:31:07Z",   // RFC3339, UTC, second precision
  "amount": { "value": "500000", "currency": "IDR", "scale": 2 },
  "instrument": "zakat_mal",              // zakat_mal | zakat_fitrah | infaq | sedekah | wakaf | qurban
  "channel": "qris",                      // qris | va_bca | transfer | idrx | cash | other
  "campaignId": "ramadan-2026-yatim",
  "counterpartyRef": "sha256:9f2c...",    // ALWAYS pre-hashed by the SDK, never raw identity
  "externalRefs": {
    "gatewayTxId": "QR-88213-A",
    "bankRef": "TRF20260812004"
  },
  "attachments": [
    { "name": "kwitansi.pdf", "sha256": "e3b0c442..." }
  ],
  "meta": { "region": "Sumsel", "collector": "cabang-plg-2" }
}
```

Rules enforced by `@tawf/verify-core`:

- No field may contain a raw NIK, phone number, email, full name, or bank account number. The SDK runs a rejection lint on input and throws `PIIRejectedError` rather than hashing it silently. Silent acceptance would let an operator leak PII into a permanent public commitment, which is unrecoverable.
- `counterpartyRef` is derived as `sha256(orgSalt || donorInternalId)`. The org salt never leaves the operator's environment. Without it, the commitment is not linkable to a person even by brute force over the national ID space.
- Amounts are integer minor units as strings. No floats, ever.

### 8.3 Canonicalization

JSON Canonicalization Scheme (RFC 8785). Deterministic key ordering, no insignificant whitespace, defined number and string escaping. This is the single most important interoperability decision in the spec. If two implementations canonicalize differently, every proof breaks, so the test vector suite (Section 15) is a release blocker rather than a nice-to-have.

### 8.4 Leaf construction

```
payloadHash = keccak256( JCS(record) )

leaf = keccak256( abi.encode(
    bytes32  SCHEMA_ID,        // keccak256("tawf.verify.record.v1")
    bytes32  orgIdHash,        // keccak256(orgId)
    bytes32  recordIdHash,     // keccak256(orgSalt || recordId)
    bytes32  payloadHash,
    uint64   occurredAt        // unix seconds
) )
```

`abi.encode` rather than `abi.encodePacked`, because packed encoding of variable-length fields is a known collision surface.

### 8.5 Merkle tree

- Binary, keccak256, sorted pairs (`hash(min(a,b) || max(a,b))`), which removes the need to transmit path direction bits.
- Odd node promoted unchanged to the next level.
- Leaves domain-separated from internal nodes with a `0x00` / `0x01` prefix byte, to close second-preimage attacks where an internal node is replayed as a leaf.

### 8.6 Proof bundle (what the donor receives)

```jsonc
{
  "schema": "tawf.verify.proof.v1",
  "record": { /* full canonical record, or redacted variant */ },
  "leaf": "0x7d2a...",
  "proof": ["0x1f9c...", "0xa04e...", "0x33b1..."],
  "root": "0x8e11...",
  "anchor": {
    "chainId": 8453,
    "registry": "0x...",
    "batchId": 4471,
    "txHash": "0x...",
    "blockNumber": 24118903,
    "blockTimestamp": "2026-08-12T04:45:11Z"
  }
}
```

This bundle is roughly 1.5 KB. It embeds in a receipt PDF, encodes into a QR code when compressed, and is verifiable offline against a single chain read.

---

## 9. Privacy model

Three visibility modes, set per record, defaulting to `commitment`.

| Mode | On chain | In proof bundle | Use case |
|---|---|---|---|
| `commitment` (default) | leaf hash only | full record, held by donor and operator | Individual donations |
| `disclosed` | leaf hash only | full record, and operator publishes it to the public board | Distribution reports, program spending |
| `redacted` | leaf hash only | record with selected fields replaced by their per-field hash and salt withheld | Publish the amount and campaign, withhold the region |

The chain never holds anything but hashes in any mode. The difference is what the operator chooses to publish alongside.

Field-level redaction works by salting each field independently at record creation:

```
fieldCommit[k] = keccak256( fieldSalt[k] || JCS(value[k]) )
```

The record's `payloadHash` commits to the vector of field commitments. Revealing a field means revealing its salt. This gives selective disclosure without ZK circuits, which matters because the Circom work is currently unstable and should not be a dependency of a shipping product.

**Explicit limitation to document publicly.** A commitment proves a record existed at time T. It does not prove the operator anchored *every* record. An operator could keep a second, unanchored set of books. Mitigations in v1: monotonic per-org sequence numbers included in the leaf, so gaps are detectable, and a published `expectedCount` per period. Full solvency-style completeness proofs are v2 scope, and the docs must say so rather than overclaim. Overclaiming here would be worse than shipping nothing, because the entire product is a trust claim.

---

## 10. Smart contract specification

### 10.1 `TawfVerifyRegistry.sol`

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract TawfVerifyRegistry {
    struct Batch {
        bytes32 root;
        bytes32 orgIdHash;
        uint64  leafCount;
        uint64  seqStart;
        uint64  timestamp;
        address signer;
    }

    mapping(uint256 => Batch) public batches;
    mapping(bytes32 => uint64) public nextSeq;      // orgIdHash => next expected sequence
    mapping(bytes32 => mapping(address => bool)) public isSigner;
    mapping(bytes32 => address) public orgAdmin;

    uint256 public batchCount;

    event OrgRegistered(bytes32 indexed orgIdHash, address indexed admin, string metadataURI);
    event SignerSet(bytes32 indexed orgIdHash, address indexed signer, bool allowed);
    event BatchAnchored(
        uint256 indexed batchId,
        bytes32 indexed orgIdHash,
        bytes32 root,
        uint64  leafCount,
        uint64  seqStart,
        string  uri
    );

    function registerOrg(bytes32 orgIdHash, string calldata metadataURI) external;
    function setSigner(bytes32 orgIdHash, address signer, bool allowed) external;

    function anchorBatch(
        bytes32 orgIdHash,
        bytes32 root,
        uint64  leafCount,
        uint64  seqStart,
        string calldata uri
    ) external returns (uint256 batchId);

    function verify(
        uint256 batchId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool);
}
```

### 10.2 Invariants

- **I1.** A batch, once written, is never modifiable or deletable. No `setRoot`, no admin override, no proxy in v1.
- **I2.** `anchorBatch` reverts unless `isSigner[orgIdHash][msg.sender]`.
- **I3.** `seqStart` must equal `nextSeq[orgIdHash]`. This is what makes gaps detectable. A skipped range is permanently visible.
- **I4.** The contract holds no ETH and has no `receive` or `payable` function. `withdraw` does not exist because there is nothing to withdraw.
- **I5.** `verify` is `view` and free. Nobody pays gas to check a proof.

### 10.3 Deliberate absence of upgradeability

A proxy would let a future admin key rewrite the logic that donors are trusting. For a notary, immutability *is* the feature. Migration path if the schema changes: deploy `TawfVerifyRegistry` v2 and let both run. Old proofs keep verifying against the old contract forever. This is strictly better than an upgradeable contract for this use case, and it also removes the single largest audit surface.

### 10.4 Chain selection

| Candidate | For | Against |
|---|---|---|
| **Base** (recommended) | IDRX is already deployed there, low fees, strong Indonesian developer familiarity, Coinbase-operated sequencer reads well to a regulator | Centralized sequencer today |
| Arbitrum One | Cheapest, most battle-tested, the Proof of Coffee choice | Slightly weaker IDRX story locally |
| Lisk | Existing Tawf relationship from the Builder Challenge, SEA positioning | Thinner tooling and explorer ecosystem |
| Ethereum L1 | Maximum credibility | Cost cannot be justified for this volume |

**Recommendation: Base mainnet for production, Base Sepolia for staging.** The registry is chain-agnostic, so a second deployment on Lisk is a partnership decision rather than an engineering one. Deploying to more than one chain also gives a hedge if a single L2 has an extended sequencer outage.

---

## 11. SDK API surface

### 11.1 Server SDK

```ts
import { TawfVerify } from "@tawf/verify-server";

const tawf = new TawfVerify({
  orgId: "laz-almustaqim",
  orgSalt: process.env.TAWF_ORG_SALT,       // 32 bytes, never rotated without a migration
  mode: "hosted",                            // "hosted" | "self"
  apiKey: process.env.TAWF_API_KEY,          // hosted mode
  // self mode instead:
  // chain: base, signer: privateKeyToAccount(...), registry: "0x..."
  batch: { maxRecords: 5000, maxDelayMs: 900_000 }
});

// 1. Record. Called right after your payment webhook confirms.
const { recordId, leaf, status } = await tawf.record({
  type: "donation",
  recordId: order.id,
  occurredAt: order.paidAt,
  amount: { value: order.amountMinor, currency: "IDR", scale: 2 },
  instrument: "zakat_mal",
  channel: "qris",
  campaignId: order.campaignId,
  donorInternalId: order.userId,      // hashed with orgSalt inside the SDK, never transmitted raw
  externalRefs: { gatewayTxId: order.gatewayRef }
});
// status: "pending"

// 2. Retrieve a proof once anchored.
const proof = await tawf.getProof(order.id);
// throws NotAnchoredYetError while pending

// 3. Verify. Pure function, no key material, safe in the browser.
import { verifyProof } from "@tawf/verify-core";
const result = await verifyProof(proof, { rpcUrl });
// { valid: true, anchoredAt: Date, batchId: 4471, chainId: 8453 }

// 4. Audit an exported ledger against the chain.
const report = await tawf.audit(rows);
// { total: 18402, verified: 18400, missing: 2, mismatched: 0, gaps: [] }
```

### 11.2 REST fallback (for Laravel, CodeIgniter, Python)

```
POST   /v1/records            create a record, returns leaf + status
GET    /v1/records/:id/proof  proof bundle once anchored
POST   /v1/batches/flush      force an anchor now
GET    /v1/batches/:id        batch metadata + tx hash
POST   /v1/verify             stateless verification of a submitted bundle
GET    /v1/org/:orgId/board   public transparency board data
```

Auth via API key on write endpoints. `POST /v1/verify` and `GET /board` are public and unauthenticated, because verification must never require an account.

### 11.3 CLI

```
tawf-verify init
tawf-verify record --file batch.csv
tawf-verify prove TRX-2026-08-000184213 --out proof.json
tawf-verify check proof.json --rpc https://mainnet.base.org
tawf-verify audit ledger.csv --org laz-almustaqim
```

`tawf-verify check` must run with no API key and no Tawf infrastructure, against a public RPC only. This is the concrete implementation of goal G3.

---

## 12. Verification experience

### 12.1 Donor path

The receipt (PDF, email, or WhatsApp message) carries a short link and a QR:

```
https://verify.tawf.app/r/8Kq2nT
```

Landing state, before any interaction:

- A single verdict line: **Verified on chain**, plus the date and time it was anchored.
- One sentence in plain Indonesian explaining what that means: the record has not changed since that moment.
- A collapsed section for the technical detail: leaf, root, batch ID, transaction hash, link to Basescan.

Three possible verdicts, and the copy for each must be blunt rather than reassuring:

| Verdict | Copy direction |
|---|---|
| Verified | Recorded on chain at [time]. The details below have not changed since. |
| Pending | Recorded at [time], anchoring within [n] minutes. Check back shortly. |
| Mismatch | These details do not match what was recorded on chain. Contact the operator and report it here. |

The mismatch path must be loud and must include a reporting route. A verification product that soft-pedals failure is worse than no verification product.

### 12.2 Operator transparency board

The direct analogue of the Proof of Coffee `/blockchain` page, at `ziswaf.tawf.app/transparansi`:

- Contract address with explorer link.
- Total records anchored, last anchor time, current sequence number.
- Anchor history table: batch ID, record count, timestamp, transaction hash.
- Disclosed records feed, for records the operator published in `disclosed` mode.
- A one-paragraph honest statement of what this does and does not prove, linking to Section 9's stated limitation.

---

## 13. Phasing

### Phase 0: Spec and vectors (2 weeks)
Canonicalization spec frozen. Test vector suite published. `@tawf/verify-core` at 100 percent branch coverage on hashing and Merkle paths. No contract yet.

**Exit:** an independent implementation in a second language reproduces every vector.

### Phase 1: Testnet pilot (4 weeks)
Registry on Base Sepolia. Server SDK, hosted relayer, verify page. Integrated into ziswaf.tawf.app behind a flag.

**Exit:** 1,000 real records from the existing testnet flow anchored and verifiable end to end.

### Phase 2: Mainnet (3 weeks)
Base mainnet deployment. External review of the registry contract, which is roughly 150 lines, holds no funds, and is therefore reviewable for a fraction of the cost of a vault audit. Hosted relayer with funded gas and monitoring.

**Exit:** first real donation anchored on mainnet. This is the first Tawf artefact on mainnet, which is a meaningful milestone for the Digdaya and IDBW narrative independent of the technical result.

### Phase 3: Distribution (6 weeks)
React components, CLI, REST docs in Indonesian, Laravel example integration, self-hosting guide. Onboard two external LAZ operators.

**Exit:** an operator with no Tawf involvement integrates from public documentation alone.

### Phase 4: ZK selective disclosure (open-ended)
Replace salted field commitments with proofs of statements over the record, for example proving a donation fell within a bracket without revealing the amount, or proving a distribution total matches a claimed sum without revealing individual payments. This is where the existing ZK research direction lands, and it should only start once Phase 3 is stable. Circom circuit instability makes it unsuitable as a v1 dependency.

---

## 14. Success metrics

| Metric | Target (6 months post Phase 2) |
|---|---|
| Records anchored on mainnet | 50,000 |
| Operators integrated | 3, at least 1 with no Tawf involvement in the integration |
| Median integration time, measured from npm install to first anchor | under 45 minutes |
| Verification page load to verdict | under 2 seconds at p90 |
| Donor verification rate, verifications divided by receipts issued | above 4 percent. Low absolute numbers are expected and fine. The value is that verification is *possible*, the way most people never read a warranty but the warranty still constrains the seller |
| Anchor reliability | above 99.5 percent of records anchored within the stated SLA window |
| Marginal cost per record | under Rp 1 |

---

## 15. Non-functional requirements

- **Determinism.** Identical input produces an identical leaf on every platform and runtime version. Enforced by a golden vector suite in CI, treated as a release blocker.
- **Availability.** Recording must never block the payment flow. If the SDK cannot reach the relayer, it writes to a local outbox and returns success. A donation must never fail because anchoring failed.
- **Idempotency.** Calling `record()` twice with the same `recordId` returns the existing leaf rather than creating a duplicate.
- **Key handling.** The org salt is the most sensitive value in the system, since losing it makes existing proofs unverifiable. Documented backup procedure, and a loud warning on `init`. Rotation requires re-anchoring, so it is treated as a migration.
- **Signer security.** In hosted mode, Tawf holds an anchoring key per org. It can only append to that org's sequence. It cannot alter or delete anything, cannot move funds, and its compromise costs gas rather than integrity.
- **Offline verification.** `verify-core` runs with no network access given a cached block header, for auditors working in restricted environments.
- **Localization.** Indonesian and English at parity for all donor-facing copy from Phase 2 onwards.

---

## 16. Risks

| Risk | Severity | Response |
|---|---|---|
| Operator anchors a partial ledger and markets it as full transparency | High. It undermines the entire claim | Sequence gaps are on chain and visible. Publish the limitation prominently. Add completeness proofs in v2 |
| PII leaks into a permanent commitment | High and irreversible | SDK-level lint rejects suspicious fields. All identity fields salted and hashed before leaving the process |
| Org salt lost | High | Backup guidance at init, optional escrowed encrypted backup in hosted mode |
| Chosen L2 has a prolonged outage | Medium | Outbox absorbs it. Multi-chain deployment as hedge |
| Donors do not care | Medium | Accepted. The mechanism constrains operator behaviour whether or not donors exercise it. Do not inflate this metric in reporting |
| "Blockchain" framing triggers regulatory friction | Medium | No token, no custody, no asset issuance. Lead with "digital notarization" in regulatory conversations and keep the chain terminology for the technical audience |
| Canonicalization divergence between implementations | Medium | Frozen spec, published vectors, second-language reference implementation before mainnet |

---

## 17. Sharia and regulatory notes

- Anchoring hashes issues no asset and creates no `gharar` in the donation contract itself. The underlying `aqad` between muzakki and amil is unchanged, which keeps the sharia review narrow.
- Amanah, the obligation of the amil to handle entrusted funds faithfully, is the natural framing. Anchoring is a technical expression of accountability rather than a new financial structure.
- The norm favouring discreet giving is why `commitment` is the default mode rather than `disclosed`. A design that published donor amounts by default would be technically fine and culturally wrong.
- PDP law compliance rests on no personal data leaving the operator's environment. This should be stated in the operator's data processing agreement explicitly.
- No OJK licensing surface in v1, because no funds are held, transmitted, or tokenized. This is worth stating early in any regulator conversation, since "blockchain" tends to trigger an assumption of the opposite.

---

## 18. Open questions

1. **Is `verify.tawf.app` or `ziswaf.tawf.app/verify` the canonical verification domain?** A neutral domain reads as more independent, an operator-branded path reads as more trustworthy to that operator's own donors. Possibly both, with the operator path proxying.
2. **Hosted-only for the first two external operators, or self-host from day one?** Hosted is faster to onboard and lets us fix spec bugs centrally. Self-host supports the independence claim. Suggested answer: hosted first, self-host documented before any public independence claim is made.
3. **Does `tawf-verify` ship as a Tawf Labs commercial SDK or a Tawf Foundation public good?** The verification core arguably belongs in the foundation, given the whole value proposition is that it outlives the vendor. The hosted relayer is the commercial layer.
4. **Anchor cadence default.** 15 minutes balances cost and donor expectation, but a donor refreshing a receipt page and seeing "pending" may read it as failure. Worth testing whether 5 minutes is materially more expensive.
5. **Does this get folded into the ZKT module naming, or stay a standalone SDK brand?** Given the current unsettled naming question across the platform, a standalone infrastructure name may age better than tying it to the ZISWAF module.

---

## 19. Appendix A: minimal integration example

```ts
// app/api/webhooks/qris/route.ts
import { TawfVerify } from "@tawf/verify-server";

const tawf = new TawfVerify({
  orgId: process.env.TAWF_ORG_ID,
  orgSalt: process.env.TAWF_ORG_SALT,
  apiKey: process.env.TAWF_API_KEY
});

export async function POST(req: Request) {
  const event = await req.json();
  if (event.status !== "PAID") return Response.json({ ok: true });

  const donation = await db.donation.create({
    data: {
      amountMinor: event.amount,
      campaignId: event.campaignId,
      userId: event.userId,
      paidAt: new Date(event.paidAt)
    }
  });

  // the only added line
  await tawf.record({
    type: "donation",
    recordId: donation.id,
    occurredAt: donation.paidAt,
    amount: { value: String(donation.amountMinor), currency: "IDR", scale: 2 },
    instrument: "zakat_mal",
    channel: "qris",
    campaignId: donation.campaignId,
    donorInternalId: donation.userId,
    externalRefs: { gatewayTxId: event.transactionId }
  });

  return Response.json({ ok: true, verifyUrl: tawf.verifyUrl(donation.id) });
}
```

## 20. Appendix B: verification pseudocode

```
function verifyProof(bundle, rpc):
    # 1. recompute the leaf from the record, do not trust the supplied leaf
    payloadHash = keccak256(JCS(bundle.record))
    leaf = keccak256(abi.encode(SCHEMA_ID, keccak256(orgId),
                                recordIdHash, payloadHash, occurredAt))
    if leaf != bundle.leaf: return MISMATCH

    # 2. walk the Merkle path
    node = keccak256(0x00 || leaf)
    for sibling in bundle.proof:
        node = keccak256(0x01 || min(node, sibling) || max(node, sibling))
    if node != bundle.root: return MISMATCH

    # 3. confirm the root was actually published on chain
    onchain = rpc.call(registry.batches(bundle.anchor.batchId))
    if onchain.root != bundle.root: return MISMATCH
    if onchain.orgIdHash != keccak256(orgId): return MISMATCH

    return VERIFIED at onchain.timestamp
```

Step 1 is the step that is easy to skip and must not be skipped. Trusting the supplied leaf rather than recomputing it from the record turns the whole verifier into theatre, because an attacker could then present any record they liked alongside a genuine leaf.
