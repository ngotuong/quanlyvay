import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function authorized(request: NextRequest) {
  const expected = Buffer.from(process.env.SYNC_SECRET?.trim() ?? "");
  const provided = Buffer.from(request.headers.get("x-sync-secret")?.trim() ?? "");
  return expected.length > 0 && expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_google_sync_snapshot");
  if (error || !data) {
    console.error("Google Sync export query failed", { code: error?.code ?? "missing_snapshot" });
    return NextResponse.json({ error: "Export query failed" }, { status: 500 });
  }
  const snapshot = data as { schemaVersion: number; sourceVersion: string; tables: Record<string, unknown> };
  const payload = request.nextUrl.searchParams.get("cursor") === snapshot.sourceVersion
    ? { schemaVersion: snapshot.schemaVersion, sourceVersion: snapshot.sourceVersion, unchanged: true }
    : snapshot;
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
