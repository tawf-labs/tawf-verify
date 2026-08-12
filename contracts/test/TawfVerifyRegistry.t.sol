// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TawfVerifyRegistry} from "../src/TawfVerifyRegistry.sol";

contract TawfVerifyRegistryTest is Test {
    TawfVerifyRegistry registry;

    bytes32 constant ORG = keccak256("laz-almustaqim");
    address admin = address(0xA11CE);
    address signer = address(0x51A6E5);
    address stranger = address(0xBEEF);

    function setUp() public {
        registry = new TawfVerifyRegistry();
    }

    function _registerAndAuthorize() internal {
        vm.prank(admin);
        registry.registerOrg(ORG, "https://example.org/metadata.json");
        vm.prank(admin);
        registry.setSigner(ORG, signer, true);
    }

    // --- registerOrg / setSigner ---------------------------------------------------------

    function test_RegisterOrgSetsAdminAndEmits() public {
        vm.expectEmit(true, true, false, true);
        emit TawfVerifyRegistry.OrgRegistered(ORG, admin, "uri");
        vm.prank(admin);
        registry.registerOrg(ORG, "uri");
        assertEq(registry.orgAdmin(ORG), admin);
    }

    function test_RevertWhen_RegisterOrgCalledTwice() public {
        vm.prank(admin);
        registry.registerOrg(ORG, "uri");

        vm.expectRevert(abi.encodeWithSelector(TawfVerifyRegistry.OrgAlreadyRegistered.selector, ORG));
        vm.prank(stranger);
        registry.registerOrg(ORG, "uri-2");
    }

    function test_SetSignerOnlyByAdmin() public {
        vm.prank(admin);
        registry.registerOrg(ORG, "uri");

        vm.prank(admin);
        registry.setSigner(ORG, signer, true);
        assertTrue(registry.isSigner(ORG, signer));

        vm.prank(admin);
        registry.setSigner(ORG, signer, false);
        assertFalse(registry.isSigner(ORG, signer));
    }

    function test_RevertWhen_SetSignerCalledByNonAdmin() public {
        vm.prank(admin);
        registry.registerOrg(ORG, "uri");

        vm.expectRevert(abi.encodeWithSelector(TawfVerifyRegistry.NotOrgAdmin.selector, stranger));
        vm.prank(stranger);
        registry.setSigner(ORG, signer, true);
    }

    // --- anchorBatch: I2 (signer-gated), I3 (sequence gap detection) ---------------------

    function test_AnchorBatchStoresRootAndEmitsEvent() public {
        _registerAndAuthorize();
        bytes32 root = keccak256("root-1");

        vm.expectEmit(true, true, false, true);
        emit TawfVerifyRegistry.BatchAnchored(0, ORG, root, 10, 0, "ipfs://batch-0");

        vm.prank(signer);
        uint256 batchId = registry.anchorBatch(ORG, root, 10, 0, "ipfs://batch-0");

        assertEq(batchId, 0);
        (bytes32 storedRoot, bytes32 storedOrg, uint64 leafCount, uint64 seqStart, uint64 timestamp, address storedSigner) =
            registry.batches(0);
        assertEq(storedRoot, root);
        assertEq(storedOrg, ORG);
        assertEq(leafCount, 10);
        assertEq(seqStart, 0);
        assertEq(timestamp, uint64(block.timestamp));
        assertEq(storedSigner, signer);
    }

    function test_AnchorBatchAdvancesNextSeq() public {
        _registerAndAuthorize();
        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root-1"), 10, 0, "");
        assertEq(registry.nextSeq(ORG), 10);

        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root-2"), 5, 10, "");
        assertEq(registry.nextSeq(ORG), 15);
    }

    function test_RevertWhen_AnchorBatchCalledByNonSigner() public {
        _registerAndAuthorize();
        vm.expectRevert(abi.encodeWithSelector(TawfVerifyRegistry.NotSigner.selector, stranger));
        vm.prank(stranger);
        registry.anchorBatch(ORG, keccak256("root"), 1, 0, "");
    }

    function test_RevertWhen_SeqStartSkipsAhead() public {
        _registerAndAuthorize();
        // nextSeq[ORG] starts at 0; jumping to 5 leaves records [0,5) permanently unaccounted for.
        vm.expectRevert(abi.encodeWithSelector(TawfVerifyRegistry.SeqGap.selector, 0, 5));
        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root"), 10, 5, "");
    }

    function test_RevertWhen_ReplayingAnAlreadyAnchoredRange() public {
        _registerAndAuthorize();
        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root-1"), 10, 0, "");

        // nextSeq is now 10; resubmitting seqStart=0 must fail exactly like skipping ahead does.
        vm.expectRevert(abi.encodeWithSelector(TawfVerifyRegistry.SeqGap.selector, 10, 0));
        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root-1-retry"), 10, 0, "");
    }

    function test_RevertWhen_AnchorBatchWithZeroCount() public {
        _registerAndAuthorize();
        vm.expectRevert(TawfVerifyRegistry.ZeroCount.selector);
        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root"), 0, 0, "");
    }

    function test_RevertWhen_AnchorBatchWithZeroRoot() public {
        _registerAndAuthorize();
        vm.expectRevert(TawfVerifyRegistry.ZeroRoot.selector);
        vm.prank(signer);
        registry.anchorBatch(ORG, bytes32(0), 1, 0, "");
    }

    // --- I1: append-only, never mutated after the fact ------------------------------------

    function test_BatchRootNeverChangesAfterAnchoring() public {
        _registerAndAuthorize();
        bytes32 root1 = keccak256("root-1");
        vm.prank(signer);
        registry.anchorBatch(ORG, root1, 10, 0, "");

        vm.prank(signer);
        registry.anchorBatch(ORG, keccak256("root-2"), 5, 10, "");

        (bytes32 storedRoot,,,,,) = registry.batches(0);
        assertEq(storedRoot, root1, "batch 0's root must not change after later batches are anchored");
    }

    // --- I4: cannot hold funds --------------------------------------------------------------

    function test_RevertWhen_SendingETH() public {
        (bool ok,) = address(registry).call{value: 1 ether}("");
        assertFalse(ok, "the registry has no payable/receive/fallback function and must reject ETH");
    }

    // --- I5: verify() is view and callable by anyone, free ---------------------------------

    function test_VerifyIsViewAndCallableByAnyone() public {
        _registerAndAuthorize();
        // single-leaf golden vector cross-checked against packages/verify-core/test/vectors/single-leaf.json
        bytes32 leaf = 0x6afdb5cf8ac4039f729b48020ad1e603fb0507f1bd3c820c36ae320099d8bfcd;
        bytes32 root = 0xd49db86cf29e94c4a5f33b9a42160e42edcf26060c3dbf595f0be445f5bc956b;
        vm.prank(signer);
        uint256 batchId = registry.anchorBatch(ORG, root, 1, 0, "");

        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(stranger);
        bool result = registry.verify(batchId, leaf, emptyProof);
        assertTrue(result);
    }

    function test_VerifyReturnsFalseForNonexistentBatch() public view {
        bytes32[] memory emptyProof = new bytes32[](0);
        assertFalse(registry.verify(999, keccak256("anything"), emptyProof));
    }

    /// @notice Cross-language parity: this is the single leaf golden vector from
    /// packages/verify-core/test/vectors/single-leaf.json. If merkle.ts and this contract's
    /// verify() ever disagree on domain separation or sorted-pair ordering, this test catches
    /// it — that disagreement is the highest-risk failure mode in the whole system.
    function test_VerifyAcceptsValidProofAndRejectsCorruptedProof() public {
        _registerAndAuthorize();
        bytes32 leaf = 0x6afdb5cf8ac4039f729b48020ad1e603fb0507f1bd3c820c36ae320099d8bfcd;
        bytes32 root = 0xd49db86cf29e94c4a5f33b9a42160e42edcf26060c3dbf595f0be445f5bc956b;
        vm.prank(signer);
        uint256 batchId = registry.anchorBatch(ORG, root, 1, 0, "");

        bytes32[] memory emptyProof = new bytes32[](0);
        assertTrue(registry.verify(batchId, leaf, emptyProof));

        bytes32 corruptedLeaf = 0x6afdb5cf8ac4039f729b48020ad1e603fb0507f1bd3c820c36ae320099d8bfce;
        assertFalse(registry.verify(batchId, corruptedLeaf, emptyProof));
    }

    /// @notice Cross-language parity for a 3-leaf tree with odd-node promotion, matching
    /// packages/verify-core/test/vectors/odd-leaf-count.json exactly.
    function test_VerifyMultiLeafGoldenVectorParity() public {
        _registerAndAuthorize();
        bytes32 root = 0xfe15873ff505a57e1337fa2368f725feecd3f6654243aefa1d1ab6501a62bafa;
        vm.prank(signer);
        uint256 batchId = registry.anchorBatch(ORG, root, 3, 0, "");

        bytes32 leaf0 = 0x16d06868a075848ce6a2dea44a71dfb074fada582700844720c1ee1f697a9faa;
        bytes32[] memory proof0 = new bytes32[](2);
        proof0[0] = 0x6ced0d1441d9af8277b162e83bb248ac0a700c5dca3eb91459071dfb7192ed0f;
        proof0[1] = 0x10d8da071f352c9394aa19d7c073d783cc8f4a2faa805d0dd92c0442eb7ec8b8;
        assertTrue(registry.verify(batchId, leaf0, proof0));

        bytes32 leaf1 = 0xcdbc1d22f0c8ebfc3b3afedce1644731f23c954ea6574ecc2b24ff1ce3dfc09c;
        bytes32[] memory proof1 = new bytes32[](2);
        proof1[0] = 0xf16202eb50ade53e28cfee97810d2d75ce0c2d1c83f4a30467300924207973ea;
        proof1[1] = 0x10d8da071f352c9394aa19d7c073d783cc8f4a2faa805d0dd92c0442eb7ec8b8;
        assertTrue(registry.verify(batchId, leaf1, proof1));

        bytes32 leaf2 = 0xd8adfadc0a4ac869a3bf473652070ae88c07d9618870ee14623bffe388c5336b;
        bytes32[] memory proof2 = new bytes32[](1);
        proof2[0] = 0x664b6bcc104b76752d03e187c0411f97eed2aa5b4b2e9be85af73aa66db67d3c;
        assertTrue(registry.verify(batchId, leaf2, proof2));

        // a proof from the wrong leaf must not verify against another leaf
        assertFalse(registry.verify(batchId, leaf0, proof1));
    }

    // --- fuzz: independent orgs never collide ------------------------------------------------

    function testFuzz_SequentialBatchesAcrossOrgsNeverCollide(uint64 countA, uint64 countB) public {
        countA = uint64(bound(countA, 1, 1_000_000));
        countB = uint64(bound(countB, 1, 1_000_000));

        bytes32 orgA = keccak256("org-a");
        bytes32 orgB = keccak256("org-b");

        vm.prank(admin);
        registry.registerOrg(orgA, "");
        vm.prank(admin);
        registry.setSigner(orgA, signer, true);

        vm.prank(admin);
        registry.registerOrg(orgB, "");
        vm.prank(admin);
        registry.setSigner(orgB, signer, true);

        vm.prank(signer);
        registry.anchorBatch(orgA, keccak256("root-a"), countA, 0, "");
        vm.prank(signer);
        registry.anchorBatch(orgB, keccak256("root-b"), countB, 0, "");

        assertEq(registry.nextSeq(orgA), countA);
        assertEq(registry.nextSeq(orgB), countB);
    }
}
