import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestArdu1 } from "@/lib/ard";
import { getUserByUploadToken, isHubAccount } from "@/lib/auth";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = bearerToken(request);
    const user = token ? await getUserByUploadToken(token) : null;
    if (token && !user) {
      return NextResponse.json({ ok: false, error: "Invalid uploader token." }, { status: 401 });
    }
    const trustedHub = user ? isHubAccount(user.displayName, user.isHub) : false;
    const result = await ingestArdu1(body, { trustedHub });
    revalidatePath("/ladder");
    revalidatePath("/");
    return NextResponse.json({
      ...result,
      account: user ? user.displayName : null,
      hub: trustedHub,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
