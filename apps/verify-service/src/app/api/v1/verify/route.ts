import { verifyProof } from "@tawf/verify-core";
import type { ProofBundle } from "@tawf/verify-core";

/**
 * Fully real, and deliberately public + unauthenticated (prd.md Section 11.2: "verification
 * must never require an account"). Takes a submitted ProofBundle and recomputes its leaf and
 * Merkle path via @tawf/verify-core — never trusts anything the caller sent except the
 * record and the proof path itself, per Appendix B.
 */
export async function POST(request: Request): Promise<Response> {
  const bundle = (await request.json()) as ProofBundle;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
  const registry = bundle.anchor.registry;

  if (!rpcUrl) {
    const result = await verifyProof(bundle);
    return Response.json(result);
  }

  const { createViemChainReader } = await import("@tawf/verify-server");
  const result = await verifyProof(bundle, {
    chainReader: createViemChainReader({ rpcUrl, registry }),
  });
  return Response.json(result);
}
