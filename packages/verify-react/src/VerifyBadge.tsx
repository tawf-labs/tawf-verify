import { useVerify } from "./useVerify.js";
import type { UseVerifyOptions } from "./types.js";

/** prd.md Section 12.1 - the copy per verdict must stay blunt, not reassuring. This badge is
 * deliberately terse (for a receipt page); `<VerifyPanel/>` is the full version. */
const LABELS: Record<string, string> = {
  loading: "Checking…",
  verified: "Verified on chain",
  pending: "Anchoring…",
  mismatch: "Does not match chain",
  error: "Could not verify",
};

export interface VerifyBadgeProps extends UseVerifyOptions {
  receiptId: string;
  className?: string;
}

export function VerifyBadge({ receiptId, className, ...opts }: VerifyBadgeProps) {
  const { status } = useVerify(receiptId, opts);
  return (
    <span data-tawf-verify-status={status} className={className}>
      {LABELS[status]}
    </span>
  );
}
