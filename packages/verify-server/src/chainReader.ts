import { createPublicClient, http } from "viem";
import type { ChainReader, Hex, OnChainBatch } from "@tawf/verify-core";

/** ABI fragment for the one view function verify-server needs — see contracts/src/TawfVerifyRegistry.sol. */
const BATCHES_ABI = [
  {
    type: "function",
    name: "batches",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      { name: "root", type: "bytes32" },
      { name: "orgIdHash", type: "bytes32" },
      { name: "leafCount", type: "uint64" },
      { name: "seqStart", type: "uint64" },
      { name: "timestamp", type: "uint64" },
      { name: "signer", type: "address" },
    ],
  },
] as const;

/**
 * The one genuinely real, end-to-end piece in this package: a viem-backed ChainReader that
 * `@tawf/verify-core`'s `verifyProof` can call to confirm a root was actually published
 * on-chain. This is what satisfies prd.md Section 11.1's `verifyProof(proof, { rpcUrl })`
 * usage pattern without verify-core itself depending on viem (see verify-core's verify.ts).
 */
export function createViemChainReader(params: { rpcUrl: string; registry: Hex }): ChainReader {
  const client = createPublicClient({ transport: http(params.rpcUrl) });

  return async (batchId: number): Promise<OnChainBatch> => {
    const [root, orgIdHash, , , timestamp] = await client.readContract({
      address: params.registry,
      abi: BATCHES_ABI,
      functionName: "batches",
      args: [BigInt(batchId)],
    });
    return { root, orgIdHash, timestamp: Number(timestamp) };
  };
}
