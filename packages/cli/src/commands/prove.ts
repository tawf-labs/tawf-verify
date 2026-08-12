export interface ProveResult {
  exitCode: 0 | 1;
  message: string;
}

/**
 * STUB. A real `prove` reads a record back out of a persisted outbox/store by recordId and
 * writes its ProofBundle to --out, once it has been anchored. Since this CLI's outbox is
 * in-memory and scoped to a single process invocation (see record.ts), there is nothing to
 * look up across separate `tawf-verify record` and `tawf-verify prove` calls yet - a real
 * deployment needs the durable outbox described in @tawf/verify-server's README first.
 */
export function runProve(_args: { recordId: string; out?: string }): ProveResult {
  return {
    exitCode: 1,
    message:
      "Not implemented in this stub: prove requires a persisted outbox shared across CLI invocations. See @tawf/verify-server's README.",
  };
}
