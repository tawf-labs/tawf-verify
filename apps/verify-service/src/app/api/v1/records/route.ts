import { getTawf } from "@/lib/tawf";
import type { RecordInput } from "@tawf/verify-server";

/** prd.md Section 11.2 — auth via API key in a real deployment; unenforced in this stub. */
export async function POST(request: Request): Promise<Response> {
  const input = (await request.json()) as RecordInput;
  const result = await getTawf().record(input);
  return Response.json(result);
}
