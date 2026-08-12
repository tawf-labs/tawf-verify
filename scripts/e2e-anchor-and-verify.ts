/**
 * Orchestrates the strongest end-to-end check described in the scaffold plan: register an
 * org, anchor a real batch, and read it back, all against a real (local) chain rather than
 * mocks - proving the full verify-core -> chainReader -> contract.verify() path actually
 * works, not just each piece in isolation.
 *
 * Not meant to run standalone: invoked by scripts/e2e-demo.sh, which starts anvil and deploys
 * the contract first. See that script for the full walkthrough.
 */
import { writeFileSync } from "node:fs";
import { buildAnchorTree, buildProofBundle, prepareLeaves } from "@tawf/verify-core";
import type { AnchorInfo, CanonicalRecord, Hex } from "@tawf/verify-core";
import { createPublicClient, createWalletClient, http, keccak256, stringToHex } from "viem";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const REGISTRY_ADDRESS = process.argv[2] as Hex;
const PROOF_OUT = process.argv[3];
const TAMPERED_OUT = process.argv[4];

// Read straight from the anvil instance e2e-demo.sh already started, rather than hardcoding
// "well-known" dev keys by hand - a single mistyped hex character is otherwise a silent,
// easy-to-make mistake (this script's first draft had exactly that bug).
function requireKey(name: string): Hex {
  const value = process.env[name];
  if (!value) throw new Error(`missing required env var ${name}`);
  return value as Hex;
}
const ADMIN_KEY = requireKey("ADMIN_PRIVATE_KEY");
const SIGNER_KEY = requireKey("SIGNER_PRIVATE_KEY");

const REGISTRY_ABI = [
  {
    type: "function",
    name: "registerOrg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orgIdHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setSigner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orgIdHash", type: "bytes32" },
      { name: "signer", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "anchorBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orgIdHash", type: "bytes32" },
      { name: "root", type: "bytes32" },
      { name: "leafCount", type: "uint64" },
      { name: "seqStart", type: "uint64" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "batchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "leaf", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const orgSalt: Hex = ("0x" + "5e".repeat(32)) as Hex;
const orgId = "laz-demo-e2e";

function record(recordId: string, value: string): CanonicalRecord {
  return {
    schema: "tawf.verify.record.v1",
    type: "donation",
    orgId,
    recordId,
    occurredAt: new Date().toISOString(),
    amount: { value, currency: "IDR", scale: 2 },
    instrument: "zakat_mal",
    channel: "qris",
    campaignId: "e2e-demo",
  };
}

async function main() {
  const publicClient = createPublicClient({ chain: foundry, transport: http() });
  const adminWallet = createWalletClient({ account: privateKeyToAccount(ADMIN_KEY), chain: foundry, transport: http() });
  const signerAccount = privateKeyToAccount(SIGNER_KEY);
  const signerWallet = createWalletClient({ account: signerAccount, chain: foundry, transport: http() });

  const orgIdHash = keccak256(stringToHex(orgId));
  console.log(`[1/6] orgId="${orgId}" -> orgIdHash=${orgIdHash}`);

  const registerTx = await adminWallet.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "registerOrg",
    args: [orgIdHash, "https://example.org/e2e-demo-metadata.json"],
  });
  await publicClient.waitForTransactionReceipt({ hash: registerTx });
  console.log(`[2/6] registerOrg() confirmed: ${registerTx}`);

  const setSignerTx = await adminWallet.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "setSigner",
    args: [orgIdHash, signerAccount.address, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: setSignerTx });
  console.log(`[3/6] setSigner(${signerAccount.address}, true) confirmed: ${setSignerTx}`);

  const records = [record("TRX-E2E-1", "100000"), record("TRX-E2E-2", "200000"), record("TRX-E2E-3", "300000")];
  const leaves = prepareLeaves(records, orgSalt);
  const tree = buildAnchorTree(leaves);
  console.log(`[4/6] built a real ${leaves.length}-leaf tree with @tawf/verify-core, root=${tree.root}`);

  const anchorTx = await signerWallet.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "anchorBatch",
    args: [orgIdHash, tree.root, BigInt(leaves.length), 0n, "ipfs://e2e-demo-batch-0"],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: anchorTx });
  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
  console.log(`[5/6] anchorBatch() confirmed on chain: tx=${anchorTx} block=${receipt.blockNumber}`);

  const anchor: AnchorInfo = {
    chainId: foundry.id,
    registry: REGISTRY_ADDRESS,
    batchId: 0,
    txHash: anchorTx,
    blockNumber: Number(receipt.blockNumber),
    blockTimestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
  };

  const leafIndex = 1;
  const bundle = buildProofBundle(tree, leaves, leafIndex, anchor);

  // Independently confirm the contract's own on-chain verify() agrees, calling it exactly as
  // a donor's phone would (a free eth_call, no gas, no transaction) - this is a live proof
  // against real freshly-computed data, not the pre-baked golden vectors already covered by
  // the Foundry test suite.
  const onChainVerified = await publicClient.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "verify",
    args: [0n, bundle.leaf, bundle.proof],
  });
  console.log(`[6/6] on-chain registry.verify(0, leaf, proof) -> ${onChainVerified} (via eth_call, zero gas)`);
  if (!onChainVerified) {
    throw new Error("on-chain verify() returned false for a genuine freshly-anchored proof - this should never happen");
  }

  if (PROOF_OUT) writeFileSync(PROOF_OUT, JSON.stringify(bundle, null, 2));
  if (TAMPERED_OUT) {
    const tampered = { ...bundle, record: { ...bundle.record, amount: { ...bundle.record.amount, value: "999999999" } } };
    writeFileSync(TAMPERED_OUT, JSON.stringify(tampered, null, 2));
  }

  console.log(`\nrecord under test: "${records[leafIndex].recordId}", leaf=${bundle.leaf}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
