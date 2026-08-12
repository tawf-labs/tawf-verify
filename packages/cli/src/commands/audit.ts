export interface AuditCliResult {
  exitCode: 0 | 1;
  message: string;
}

/**
 * STUB, for the same reason as prove.ts: a real audit compares an exported ledger against a
 * persisted outbox / on-chain data, and this CLI has neither across separate invocations yet.
 */
export function runAudit(_args: { file: string; org: string }): AuditCliResult {
  return {
    exitCode: 1,
    message:
      "Not implemented in this stub: audit requires a persisted outbox or a chain-side scan. See @tawf/verify-server's README.",
  };
}
