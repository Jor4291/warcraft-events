import Link from "next/link";
import type { PublicUser } from "@/lib/types";

export function SiteNav({ user }: { user: PublicUser | null }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
      <details className="nav-menu">
        <summary className="nav-menu-button">Events &amp; Tools</summary>
        <div className="nav-menu-panel">
          <Link href="/events/submit">Book Event</Link>
          <Link href="/events">Calendar</Link>
          <Link href="/bracket">Bracket</Link>
        </div>
      </details>
      <Link href="/ladder">Arena Leaderboard</Link>
      <Link href="/ladder/setup">How to send duels</Link>
      {user ? <Link href="/account">{user.displayName}</Link> : <Link href="/account/login">Sign in</Link>}
    </nav>
  );
}
