#!/usr/bin/env node
import type { Hex } from "@tawf/verify-core";
import { runAudit } from "./commands/audit.js";
import { runCheck } from "./commands/check.js";
import { runInit } from "./commands/init.js";
import { runProve } from "./commands/prove.js";
import { runRecord } from "./commands/record.js";

function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "init": {
      const result = runInit({ path: flag(rest, "--path") });
      console.log(result.message);
      process.exitCode = result.exitCode;
      return;
    }
    case "record": {
      const file = flag(rest, "--file");
      const orgId = flag(rest, "--org") ?? process.env.TAWF_ORG_ID;
      const orgSalt = (flag(rest, "--salt") ?? process.env.TAWF_ORG_SALT) as Hex | undefined;
      if (!file || !orgId || !orgSalt) {
        console.error(
          "Usage: tawf-verify record --file <batch.csv> --org <orgId> --salt <orgSalt>",
        );
        process.exitCode = 1;
        return;
      }
      const result = await runRecord({ file, orgId, orgSalt });
      console.log(result.message);
      process.exitCode = result.exitCode;
      return;
    }
    case "prove": {
      const recordId = rest[0];
      if (!recordId) {
        console.error("Usage: tawf-verify prove <recordId> [--out proof.json]");
        process.exitCode = 1;
        return;
      }
      const result = runProve({ recordId, out: flag(rest, "--out") });
      console.log(result.message);
      process.exitCode = result.exitCode;
      return;
    }
    case "check": {
      const file = rest[0];
      if (!file) {
        console.error("Usage: tawf-verify check <proof.json> [--rpc <url>]");
        process.exitCode = 1;
        return;
      }
      const result = await runCheck({ file, rpc: flag(rest, "--rpc") });
      console.log(result.message);
      process.exitCode = result.exitCode;
      return;
    }
    case "audit": {
      const file = rest[0];
      const org = flag(rest, "--org");
      if (!file || !org) {
        console.error("Usage: tawf-verify audit <ledger.csv> --org <orgId>");
        process.exitCode = 1;
        return;
      }
      const result = runAudit({ file, org });
      console.log(result.message);
      process.exitCode = result.exitCode;
      return;
    }
    default: {
      console.log("Usage: tawf-verify <init|record|prove|check|audit> ...");
      process.exitCode = command ? 1 : 0;
    }
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
