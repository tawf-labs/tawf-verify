import { readFileSync } from "node:fs";
import { TawfVerify } from "@tawf/verify-server";
import type { Hex } from "@tawf/verify-core";

export interface RecordCliResult {
  exitCode: 0 | 1;
  message: string;
}

/**
 * STUB: parses a minimal CSV (recordId,amountValue,currency,occurredAt) and records each row
 * against an in-memory @tawf/verify-server instance that exists only for this process
 * invocation - nothing persists between CLI runs. A real implementation persists the outbox
 * (see @tawf/verify-server's README) and talks to a real or hosted relayer.
 */
export async function runRecord(args: {
  file: string;
  orgId: string;
  orgSalt: Hex;
}): Promise<RecordCliResult> {
  const lines = readFileSync(args.file, "utf-8").trim().split("\n").filter(Boolean);
  const tawf = new TawfVerify({ orgId: args.orgId, orgSalt: args.orgSalt, mode: "self" });

  let count = 0;
  for (const line of lines) {
    const [recordId, value, currency = "IDR", occurredAt = new Date().toISOString()] =
      line.split(",");
    if (!recordId || !value) continue;
    await tawf.record({
      type: "donation",
      recordId,
      occurredAt,
      amount: { value, currency, scale: 2 },
    });
    count++;
  }

  return {
    exitCode: 0,
    message: `Recorded ${count} row(s) from ${args.file} into this process's in-memory outbox (not persisted).`,
  };
}
