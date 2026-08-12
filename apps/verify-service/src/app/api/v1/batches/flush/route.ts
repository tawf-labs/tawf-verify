import { getTawf } from "@/lib/tawf";

export async function POST(): Promise<Response> {
  const result = await getTawf().flushBatch();
  return Response.json(result);
}
