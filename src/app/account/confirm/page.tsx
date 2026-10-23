import { redirect } from "next/navigation";
import { ConfirmForm } from "@/components/ConfirmForm";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Confirm mailbox" };

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mailError?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/account/login?next=/account/confirm");
  }
  const { next = "/account", mailError = "" } = await searchParams;
  const dest = next.startsWith("/") ? next : "/account";
  if (user.emailVerified) {
    redirect(dest);
  }
  return <ConfirmForm email={user.email} next={dest} mailError={mailError} />;
}
