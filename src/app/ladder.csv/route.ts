import { NextResponse } from "next/server";
import { officialLeaderboardCsv } from "@/lib/ladder-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  const csv = officialLeaderboardCsv(store.players);
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="forever-arena-ladder-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
