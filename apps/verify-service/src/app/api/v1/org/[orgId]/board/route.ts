import type { TransparencyBoardData } from "@tawf/verify-react";

/**
 * STUB: canned shape matching prd.md Section 12.2. Public and unauthenticated, same as
 * /api/v1/verify - the transparency board is meant to be checkable by anyone, not just the
 * operator's own donors.
 */
export async function GET(
  _request: Request,
  { params }: { params: { orgId: string } },
): Promise<Response> {
  const data: TransparencyBoardData = {
    orgId: params.orgId,
    registryAddress: `0x${"00".repeat(20)}`,
    explorerUrl: "https://basescan.org",
    totalRecordsAnchored: 0,
    currentSequence: 0,
    anchorHistory: [],
  };
  return Response.json(data);
}
