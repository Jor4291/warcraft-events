"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAccount, markNoticesRead } from "@/lib/actions";
import { noticeCopy, type PlayerInbox } from "@/lib/notices";
import type { PublicUser } from "@/lib/types";

function formatWhen(iso: string) {
  if (!iso) {
    return "TBA";
  }
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AccountMenu({
  user,
  inbox,
  rating,
  open,
  onToggle,
  onNavigate,
}: {
  user: PublicUser | null;
  inbox: PlayerInbox;
  rating: { name: string; points: number } | null;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const [unread, setUnread] = useState(inbox.unread);
  const nights = inbox.nights.filter((night) => !night.cancelled).slice(0, 5);

  useEffect(() => {
    setUnread(inbox.unread);
  }, [inbox.unread]);

  function handleToggle() {
    if (!open && unread > 0) {
      setUnread(0);
      void markNoticesRead();
    }
    onToggle();
  }

  const label = user
    ? unread > 0
      ? `${user.displayName}, ${unread} unread notices`
      : user.displayName
    : "Account";

  return (
    <div className="nav-menu nav-menu-end">
      <button
        type="button"
        className="nav-icon-button"
        aria-expanded={open}
        aria-label={label}
        onClick={handleToggle}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="8.2" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            d="M5.4 19.2c.8-3.1 3.3-5 6.6-5s5.8 1.9 6.6 5"
          />
        </svg>
        {unread > 0 ? <span className="notice-bell-count">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="nav-menu-panel nav-menu-panel-end">
          {user ? (
            <>
              <p className="nav-menu-kicker">{user.displayName}</p>
              {inbox.notices.length === 0 && nights.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No nights on the board yet.{" "}
                  <Link href="/events" onClick={onNavigate}>
                    Open the calendar
                  </Link>{" "}
                  to sign up.
                </p>
              ) : null}
              {inbox.notices.length > 0 ? (
                <ul className="space-y-2">
                  {inbox.notices.map((notice) => (
                    <li key={notice.id}>
                      <Link
                        href={`/events/${notice.eventSlug}`}
                        className={notice.readAt ? "" : "is-unread"}
                        onClick={onNavigate}
                      >
                        {noticeCopy(notice)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {nights.length > 0 ? (
                <div className={inbox.notices.length > 0 ? "mt-3 border-t border-[var(--gold-dim)] pt-3" : ""}>
                  <p className="nav-menu-kicker">Your nights</p>
                  <ul className="space-y-2">
                    {nights.map((night) => (
                      <li key={night.eventId}>
                        <Link href={`/events/${night.slug}`} onClick={onNavigate}>
                          {night.title}
                          <span className="mt-0.5 block text-xs text-[var(--muted)]">
                            {formatWhen(night.startsAt)}
                            {night.waitlisted ? " · Waitlist" : night.checkedIn ? " · Checked in" : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--gold-dim)] pt-3">
                <Link href="/account" onClick={onNavigate}>
                  Account
                </Link>
                {rating ? (
                  <Link href={`/ladder?player=${encodeURIComponent(rating.name)}`} onClick={onNavigate}>
                    Your rating · {rating.points}
                  </Link>
                ) : (
                  <Link href="/ladder" onClick={onNavigate}>
                    Arena leaderboard
                  </Link>
                )}
                <form action={logoutAccount}>
                  <button type="submit" className="nav-menu-action">
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <p className="nav-menu-kicker">Account</p>
              <Link href="/account/login" onClick={onNavigate}>
                Sign in
              </Link>
              <Link href="/account/register" onClick={onNavigate}>
                Register
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
