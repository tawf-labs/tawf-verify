import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

export interface InitResult {
  exitCode: 0 | 1;
  message: string;
}

/**
 * STUB. Real behavior per prd.md Section 15 ("Key handling"): generate an org salt, write a
 * loud backup warning, and never let init silently overwrite an existing salt (losing it
 * makes every existing proof unverifiable - this is explicitly the most sensitive value in
 * the system).
 */
export function runInit(args: { path?: string }): InitResult {
  const path = args.path ?? ".tawf-verify.json";
  if (existsSync(path)) {
    return {
      exitCode: 1,
      message: `${path} already exists - refusing to overwrite an existing org salt. Delete it manually if you mean to rotate (this requires re-anchoring, see prd.md Section 15).`,
    };
  }

  const orgSalt = `0x${randomBytes(32).toString("hex")}`;
  writeFileSync(path, JSON.stringify({ orgSalt }, null, 2) + "\n");

  return {
    exitCode: 0,
    message: [
      `Wrote ${path}.`,
      "",
      "*** BACK UP orgSalt NOW. ***",
      "Losing it makes every proof you anchor unverifiable, permanently. There is no recovery.",
      "This is a stub - a real init also prompts for orgId, chain, and registry address.",
    ].join("\n"),
  };
}
