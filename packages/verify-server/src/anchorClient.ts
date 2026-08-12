import { keccak256, stringToHex } from "viem";
import type { Hex } from "@tawf/verify-core";
import type { SubmittedAnchor, TawfVerifyConfig } from "./types.js";

export interface AnchorClient {
  submitBatch(params: {
    orgIdHash: Hex;
    root: Hex;
    leafCount: number;
    seqStart: number;
    uri: string;
  }): Promise<SubmittedAnchor>;
}

/**
 * MOCK: this does not sign anything or touch a chain. A real implementation constructs a
 * viem WalletClient from a private key or a hosted-mode remote signer, calls
 * `TawfVerifyRegistry.anchorBatch(orgIdHash, root, leafCount, seqStart, uri)`, waits for the
 * receipt, and returns the real chainId/registry/batchId/txHash/blockNumber/blockTimestamp
 * from that receipt instead of the deterministic placeholders below. Wire that in here -
 * nowhere else needs to change, since server.ts only depends on the AnchorClient interface.
 */
export function createMockAnchorClient(config: TawfVerifyConfig): AnchorClient {
  let batchCounter = 0;

  return {
    async submitBatch({ orgIdHash, root, uri }) {
      const batchId = batchCounter++;
      const fakeTxHash = keccak256(stringToHex(`mock-tx:${orgIdHash}:${root}:${batchId}:${uri}`));
      return {
        chainId: config.chainId ?? 8453,
        registry: config.registry ?? (("0x" + "00".repeat(20)) as Hex),
        batchId,
        txHash: fakeTxHash,
        blockNumber: 1_000_000 + batchId,
        blockTimestamp: new Date().toISOString(),
      };
    },
  };
}
