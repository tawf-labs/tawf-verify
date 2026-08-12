import { getTawf } from "@/lib/tawf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    const proof = await getTawf().getProof(params.id);
    return Response.json(proof);
  } catch (err) {
    // Compare by `.name` rather than `instanceof`: Next.js bundles this route and
    // @/lib/tawf's transitive import of @tawf/verify-server as separate webpack chunks,
    // which can load two distinct module instances of the same package — instanceof would
    // then fail even though the error is exactly the one we're checking for.
    const name = err instanceof Error ? err.name : undefined;
    if (name === "NotAnchoredYetError") {
      return Response.json({ status: "pending" }, { status: 202 });
    }
    if (name === "RecordNotFoundError") {
      return Response.json({ error: (err as Error).message }, { status: 404 });
    }
    throw err;
  }
}
