import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/account" } = await searchParams;
  return <LoginForm next={next.startsWith("/") ? next : "/account"} />;
}
