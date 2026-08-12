import { useState } from "react";
import { useVerify } from "./useVerify.js";
import type { UseVerifyOptions } from "./types.js";

/** prd.md Section 12.1 - copy must be blunt, not reassuring, especially for "mismatch". This
 * is the exact wording from that section, not a paraphrase. */
function verdictCopy(status: string, anchoredAt?: string, expectedAnchorMinutes?: number): string {
  switch (status) {
    case "verified":
      return `Recorded on chain at ${anchoredAt ?? "an unknown time"}. The details below have not changed since.`;
    case "pending":
      return `Recorded, anchoring within ${expectedAnchorMinutes ?? 15} minutes. Check back shortly.`;
    case "mismatch":
      return "These details do not match what was recorded on chain. Contact the operator and report it here.";
    case "error":
      return "Could not reach the chain to verify this record. Try again shortly.";
    default:
      return "Checking…";
  }
}

export interface VerifyPanelProps extends UseVerifyOptions {
  receiptId: string;
}

export function VerifyPanel({ receiptId, ...opts }: VerifyPanelProps) {
  const { status, data, error, refetch } = useVerify(receiptId, opts);
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div data-tawf-verify-status={status}>
      <p>{verdictCopy(status, data?.anchoredAt, data?.expectedAnchorMinutes)}</p>

      {status === "mismatch" && (
        <button
          type="button"
          onClick={() => window.open(`mailto:?subject=Verification mismatch: ${receiptId}`)}
        >
          Report this mismatch
        </button>
      )}

      {status === "error" && (
        <button type="button" onClick={refetch}>
          Retry
        </button>
      )}

      {data && (data.batchId !== undefined || data.txHash) && (
        <details
          open={showTechnical}
          onToggle={(e) => setShowTechnical((e.target as HTMLDetailsElement).open)}
        >
          <summary>Technical detail</summary>
          <dl>
            {data.batchId !== undefined && (
              <>
                <dt>Batch ID</dt>
                <dd>{data.batchId}</dd>
              </>
            )}
            {data.txHash && (
              <>
                <dt>Transaction</dt>
                <dd>
                  {data.explorerUrl ? (
                    <a
                      href={`${data.explorerUrl}/tx/${data.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.txHash}
                    </a>
                  ) : (
                    data.txHash
                  )}
                </dd>
              </>
            )}
          </dl>
        </details>
      )}

      {error && <p role="alert">{error.message}</p>}
    </div>
  );
}
