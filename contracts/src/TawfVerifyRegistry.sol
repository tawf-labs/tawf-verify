// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title TawfVerifyRegistry — an append-only notary, not a custodian
/// @notice Anchors Merkle roots of off-chain ZISWAF transaction batches so that any single
///         record can later be proven to have existed, unmodified, at a given block and
///         timestamp — without this contract ever seeing the record itself, and without it
///         ever holding a rupiah. See prd.md Sections 2 and 10.
///
/// ## What this contract does NOT do
///
/// It does not hold funds: no `payable` function exists anywhere below, there is no
/// `receive()` or `fallback()`, and there is therefore nothing to `withdraw` (invariant I4).
/// It does not store personal data or amounts: `root` is a keccak256 fingerprint, `orgIdHash`
/// is a hash of the operator's id, nothing else is on chain. It does not trust a single global
/// operator: authority is scoped per `orgIdHash` via `orgAdmin`/`isSigner`, so compromising one
/// organization's signer key can only append garbage to that organization's own sequence — it
/// cannot touch any other org's batches, and it cannot alter or delete anything that already
/// exists (invariant I1). There is no proxy and no admin override in v1: for a notary,
/// immutability of already-anchored data is the feature, not a gap to patch later. If the
/// off-chain schema changes, the migration path is deploying a v2 registry and letting both
/// run — old proofs keep verifying against this contract forever.
///
/// ## The one thing it does do
///
/// `anchorBatch` appends one `Batch` per call, gated by `isSigner` (I2) and by a strictly
/// sequential `seqStart == nextSeq[orgIdHash]` check (I3) — so if an operator ever tries to
/// anchor a partial ledger and market it as full transparency, the gap in sequence numbers is
/// permanently visible on chain, forever, to anyone who looks. `verify` recomputes a Merkle
/// inclusion proof on chain and is `view` (I5): checking a proof costs nothing and requires no
/// permission, by design — the whole point of a public notary is that nobody needs to ask it
/// for anything to check its word.
contract TawfVerifyRegistry {
    struct Batch {
        bytes32 root;
        bytes32 orgIdHash;
        uint64 leafCount;
        uint64 seqStart;
        uint64 timestamp;
        address signer;
    }

    /// @dev Domain-separation prefixes matching packages/verify-core/src/merkle.ts exactly —
    /// this byte-for-byte agreement is the single highest-risk cross-language parity point in
    /// the whole system (see contracts/test/TawfVerifyRegistry.t.sol's parity test).
    bytes1 private constant LEAF_PREFIX = 0x00;
    bytes1 private constant NODE_PREFIX = 0x01;

    mapping(uint256 => Batch) public batches;
    /// @dev orgIdHash => next expected sequence number. What makes gaps detectable (I3).
    mapping(bytes32 => uint64) public nextSeq;
    mapping(bytes32 => mapping(address => bool)) public isSigner;
    mapping(bytes32 => address) public orgAdmin;

    uint256 public batchCount;

    event OrgRegistered(bytes32 indexed orgIdHash, address indexed admin, string metadataURI);
    event SignerSet(bytes32 indexed orgIdHash, address indexed signer, bool allowed);
    event BatchAnchored(
        uint256 indexed batchId,
        bytes32 indexed orgIdHash,
        bytes32 root,
        uint64 leafCount,
        uint64 seqStart,
        string uri
    );

    error OrgAlreadyRegistered(bytes32 orgIdHash);
    error NotOrgAdmin(address caller);
    error NotSigner(address caller);
    error ZeroCount();
    error ZeroRoot();
    error SeqGap(uint64 expected, uint64 actual);

    /// @notice Registers an organization and makes the caller its admin. One-time; the admin
    /// role cannot be transferred in v1 — re-registration with a new admin would let a
    /// compromised or departing admin quietly reassign authority, which is exactly the kind of
    /// silent takeover a notary must not permit.
    function registerOrg(bytes32 orgIdHash, string calldata metadataURI) external {
        if (orgAdmin[orgIdHash] != address(0)) revert OrgAlreadyRegistered(orgIdHash);
        orgAdmin[orgIdHash] = msg.sender;
        emit OrgRegistered(orgIdHash, msg.sender, metadataURI);
    }

    /// @notice Grants or revokes anchoring authority for `signer` within `orgIdHash`. Only that
    /// org's admin may call this — authority is scoped per org by construction, never global.
    function setSigner(bytes32 orgIdHash, address signer, bool allowed) external {
        if (msg.sender != orgAdmin[orgIdHash]) revert NotOrgAdmin(msg.sender);
        isSigner[orgIdHash][signer] = allowed;
        emit SignerSet(orgIdHash, signer, allowed);
    }

    /// @notice Appends one immutable batch. Reverts unless the caller is a signer for
    /// `orgIdHash` (I2) and `seqStart` exactly continues that org's sequence (I3) — a signer
    /// cannot skip ahead to hide a gap, and cannot rewrite anything already anchored (I1).
    function anchorBatch(bytes32 orgIdHash, bytes32 root, uint64 leafCount, uint64 seqStart, string calldata uri)
        external
        returns (uint256 batchId)
    {
        if (!isSigner[orgIdHash][msg.sender]) revert NotSigner(msg.sender);
        if (leafCount == 0) revert ZeroCount();
        if (root == bytes32(0)) revert ZeroRoot();

        uint64 expected = nextSeq[orgIdHash];
        if (seqStart != expected) revert SeqGap(expected, seqStart);

        batchId = batchCount++;
        batches[batchId] = Batch({
            root: root,
            orgIdHash: orgIdHash,
            leafCount: leafCount,
            seqStart: seqStart,
            timestamp: uint64(block.timestamp),
            signer: msg.sender
        });
        nextSeq[orgIdHash] = seqStart + leafCount;

        emit BatchAnchored(batchId, orgIdHash, root, leafCount, seqStart, uri);
    }

    /// @notice Walks a Merkle inclusion proof from `leaf` up to `batches[batchId].root` and
    /// reports whether it matches. `view`, unauthenticated, zero gas cost off-chain (I5) — a
    /// donor's phone calls this via `eth_call`, never a transaction. `leaf` is expected to
    /// already be the record hash produced by verify-core's `computeLeafRecordHash` (i.e. the
    /// abi.encode'd 5-tuple hash, *not yet* wrapped with LEAF_PREFIX — that wrapping happens
    /// here, once, matching merkle.ts's `hashLeafNode`).
    function verify(uint256 batchId, bytes32 leaf, bytes32[] calldata proof) external view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(LEAF_PREFIX, leaf));

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            node = uint256(node) <= uint256(sibling)
                ? keccak256(abi.encodePacked(NODE_PREFIX, node, sibling))
                : keccak256(abi.encodePacked(NODE_PREFIX, sibling, node));
        }

        return node == batches[batchId].root;
    }
}
