import { NextResponse } from "next/server";
import { ingestArdu1 } from "@/lib/ard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await ingestArdu1(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
