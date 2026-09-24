import { BookEventForm } from "@/components/BookEventForm";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { hostBlock } from "@/lib/moderation";

export default async function BookEventPage() {
  const user = await getSessionUser();

  if (!user) {
    return <LoginForm next="/events/submit" intro="Sign in to book an event. You can edit or cancel it later, and choose open sign-up or invite-by-code." />;
  }

  const barred = hostBlock(user);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Book Event</h1>
      {barred ? (
        <p className="tavern-frame mt-6 p-4 text-[var(--muted)]">{barred}</p>
      ) : (
        <>
          <p className="mt-2 mb-8 text-[var(--muted)]">
            Hang a gathering on the calendar. Choose open sign-up, or keep the door behind an invite code.
            You can edit or cancel it later from this event or your account.
          </p>
          <BookEventForm />
        </>
      )}
    </main>
  );
}
