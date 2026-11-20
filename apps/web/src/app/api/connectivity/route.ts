// Public transport check only: no identity, database, secrets or financial data.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-QLV-Connectivity": "1",
    },
  });
}
