import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/account" } = await searchParams;
  return <RegisterForm next={next.startsWith("/") ? next : "/account"} />;
}
