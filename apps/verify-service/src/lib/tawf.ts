import { TawfVerify } from "@tawf/verify-server";
import type { Hex } from "@tawf/verify-core";

declare global {
  // eslint-disable-next-line no-var
  var __tawfVerifyInstance: TawfVerify | undefined;
}

function config() {
  return {
    orgId: process.env.TAWF_ORG_ID ?? "dev-org",
    orgSalt: (process.env.TAWF_ORG_SALT ?? `0x${"00".repeat(32)}`) as Hex,
    mode: "self" as const,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL,
    registry: process.env.TAWF_REGISTRY_ADDRESS as Hex | undefined,
  };
}

/**
 * One in-memory TawfVerify instance per Node process. This is the concrete manifestation of
 * the in-memory-outbox limitation documented in this app's README and in
 * @tawf/verify-server's README — it does not survive a restart and does not work across
 * multiple server instances. Replace with a real datastore before production.
 */
export function getTawf(): TawfVerify {
  if (!globalThis.__tawfVerifyInstance) {
    globalThis.__tawfVerifyInstance = new TawfVerify(config());
  }
  return globalThis.__tawfVerifyInstance;
}
