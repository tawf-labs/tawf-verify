import { readFileSync } from "node:fs";
import { verifyProof } from "@tawf/verify-core";
import type { ProofBundle } from "@tawf/verify-core";
import { createViemChainReader } from "@tawf/verify-server";

export interface CheckResult {
  exitCode: 0 | 1;
  message: string;
}

/**
 * The one fully real command in this CLI. prd.md Section 11.3: "`tawf-verify check` must run
 * with no API key and no Tawf infrastructure, against a public RPC only. This is the concrete
 * implementation of goal G3." No network call happens at all unless `--rpc` is supplied; even
 * then, the only network call is a public `eth_call` against the registry's `batches()`.
 */
export async function runCheck(args: { file: string; rpc?: string }): Promise<CheckResult> {
  const bundle = JSON.parse(readFileSync(args.file, "utf-8")) as ProofBundle;

  const chainReader = args.rpc
    ? createViemChainReader({ rpcUrl: args.rpc, registry: bundle.anchor.registry })
    : undefined;
  const result = await verifyProof(bundle, { chainReader });

  switch (result.status) {
    case "valid":
      return {
        exitCode: 0,
        message: `VERIFIED - anchored on chain at ${result.anchoredAt.toISOString()}`,
      };
    case "structurally_valid_unconfirmed":
      return {
        exitCode: 0,
        message:
          "STRUCTURALLY VALID (unconfirmed) - leaf and Merkle path check out; pass --rpc to confirm the root on chain",
      };
    case "invalid":
      return { exitCode: 1, message: `MISMATCH - ${result.reasons.join(", ")}` };
  }
}
