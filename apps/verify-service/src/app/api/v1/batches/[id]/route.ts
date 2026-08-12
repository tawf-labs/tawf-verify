/**
 * STUB: prd.md Section 11.2 wants batch metadata (record count, timestamp, tx hash) by
 * batchId. @tawf/verify-server currently only tracks proofs per recordId, not a queryable
 * index of batches — that index is the piece a real durable outbox needs to add. Returning
 * 501 here rather than fabricating a plausible-looking response, consistent with how
 * @tawf/verify-cli's `prove`/`audit` stubs are honest about the same gap.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  return Response.json(
    {
      error: `Batch metadata lookup by id is not implemented in this stub (requested batchId=${params.id}).`,
    },
    { status: 501 },
  );
}
