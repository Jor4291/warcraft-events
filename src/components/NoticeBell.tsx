"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { markNoticesRead } from "@/lib/actions";
import { noticeCopy, type PlayerInbox } from "@/lib/notices";

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

export function NoticeBell({ inbox }: { inbox: PlayerInbox }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(inbox.unread);
  const root = useRef<HTMLDivElement>(null);
  const nights = inbox.nights.filter((night) => !night.cancelled).slice(0, 5);

  useEffect(() => {
    setUnread(inbox.unread);
  }, [inbox.unread]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      await markNoticesRead();
    }
  }

  return (
    <div className="notice-bell" ref={root}>
      <button
        type="button"
        className="notice-bell-button"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notices, ${unread} unread` : "Notices"}
        onClick={() => void toggle()}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
            d="M6.2 9.6c0-3.1 2.5-5.6 5.8-5.6s5.8 2.5 5.8 5.6v3.2l1.5 2.6H4.7l1.5-2.6V9.6zM9.4 18.2c.6 1 1.5 1.5 2.6 1.5s2-.5 2.6-1.5"
          />
        </svg>
        {unread > 0 ? <span className="notice-bell-count">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notice-bell-panel">
          {inbox.notices.length === 0 && nights.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No nights on the board yet. <Link href="/events">Open the calendar</Link> to sign up.
            </p>
          ) : null}
          {inbox.notices.length > 0 ? (
            <ul className="space-y-2">
              {inbox.notices.map((notice) => (
                <li key={notice.id}>
                  <Link href={`/events/${notice.eventSlug}`} className={notice.readAt ? "" : "is-unread"} onClick={() => setOpen(false)}>
                    {noticeCopy(notice)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {nights.length > 0 ? (
            <div className={inbox.notices.length > 0 ? "mt-3 border-t border-[var(--gold-dim)] pt-3" : ""}>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Your nights</p>
              <ul className="space-y-2">
                {nights.map((night) => (
                  <li key={night.eventId}>
                    <Link href={`/events/${night.slug}`} onClick={() => setOpen(false)}>
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
        </div>
      ) : null}
    </div>
  );
}
