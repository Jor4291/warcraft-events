import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "WarcraftEvents <onboarding@resend.dev>";

function resendKey() {
  return process.env.RESEND_KEY || process.env.RESEND_API_KEY || "";
}

export async function sendConfirmCode(to: string, code: string) {
  const key = resendKey();
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] confirm code for ${to}: ${code}`);
      return { ok: true as const };
    }
    return { error: "Mail is not configured yet." };
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your WarcraftEvents hearth code",
    html: `<p>Your confirm code is <strong>${code}</strong>.</p><p>It lasts 20 minutes. If you did not open an account at WarcraftEvents, ignore this.</p>`,
    text: `Your confirm code is ${code}. It lasts 20 minutes.`,
  });

  if (error) {
    console.error("Resend failed", error);
    return { error: "Could not send the confirm mail. Try again in a minute." };
  }
  return { ok: true as const };
}
