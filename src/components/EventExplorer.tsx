"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { calendarDay, compareByNextStart, formatEventWhen } from "@/lib/event-when";
import { formatSignupSpots } from "@/lib/signup-form";

export type CalendarEvent = {
  slug: string;
  title: string;
  game: string;
  format: string;
  startsAt: string;
  region: string;
  location: string;
  description: string;
  signupCount: number;
  waitlistCount: number;
  signupCap: number;
};

type View = "month" | "list" | "grid";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

function sameDay(iso: string, year: number, month: number, day: number) {
  if (!iso) {
    return false;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return calendarDay(iso) === `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatWhen(iso: string) {
  return formatEventWhen(iso, { weekday: "short" });
}

export function EventExplorer({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const ordered = useMemo(() => [...events].sort(compareByNextStart), [events]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const start = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const slots: { day: number | null; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < start; i += 1) {
      slots.push({ day: null, events: [] });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      slots.push({
        day,
        events: ordered.filter((event) => sameDay(event.startsAt, cursor.year, cursor.month, day)),
      });
    }
    while (slots.length % 7 !== 0) {
      slots.push({ day: null, events: [] });
    }
    return slots;
  }, [cursor.month, cursor.year, ordered]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <ViewButton active={view === "month"} onClick={() => setView("month")}>
            Calendar
          </ViewButton>
          <ViewButton active={view === "list"} onClick={() => setView("list")}>
            List
          </ViewButton>
          <ViewButton active={view === "grid"} onClick={() => setView("grid")}>
            Grid
          </ViewButton>
        </div>
        {view === "month" ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="tavern-btn-ghost"
              onClick={() =>
                setCursor((current) => {
                  const month = current.month - 1;
                  return month < 0 ? { year: current.year - 1, month: 11 } : { ...current, month };
                })
              }
            >
              Prev
            </button>
            <p className="tavern-title min-w-44 text-center text-lg">{monthLabel(cursor.year, cursor.month)}</p>
            <button
              type="button"
              className="tavern-btn-ghost"
              onClick={() =>
                setCursor((current) => {
                  const month = current.month + 1;
                  return month > 11 ? { year: current.year + 1, month: 0 } : { ...current, month };
                })
              }
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {view === "month" ? <MonthView cells={cells} /> : null}
      {view === "list" ? <ListView events={ordered} /> : null}
      {view === "grid" ? <GridView events={ordered} /> : null}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`tavern-btn-ghost ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function MonthView({ cells }: { cells: { day: number | null; events: CalendarEvent[] }[] }) {
  return (
    <div className="tavern-parchment overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#b8944e] bg-[#d7bc80] text-center text-xs font-bold uppercase tracking-wide">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => (
          <div
            key={`${cell.day ?? "e"}-${index}`}
            className="min-h-28 border-t border-r border-[#c9ae72] p-1.5 last:border-r-0"
          >
            {cell.day ? (
              <>
                <p className="text-xs font-bold text-[#6a3b0c]">{cell.day}</p>
                <div className="mt-1 space-y-1">
                  {cell.events.map((event) => (
                    <Link key={event.slug} href={`/events/${event.slug}`} className="calendar-chip">
                      {event.title}
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListView({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-[var(--muted)]">The notice board is empty.</p>;
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link
          key={event.slug}
          href={`/events/${event.slug}`}
          className="tavern-frame block p-5 no-underline hover:border-[var(--gold)]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">{formatWhen(event.startsAt)}</p>
          <h2 className="tavern-title mt-1 text-xl">{event.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {event.game} · {event.format || "Open format"} · {event.region || "All regions"} · {event.location}
            {event.signupCap > 0 || event.waitlistCount > 0 ? ` · ${formatSignupSpots(event.signupCount, event.signupCap, event.waitlistCount)}` : ""}
          </p>
          <p className="mt-2 text-[var(--foreground)]">{event.description}</p>
        </Link>
      ))}
    </div>
  );
}

function GridView({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-[var(--muted)]">The notice board is empty.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Link
          key={event.slug}
          href={`/events/${event.slug}`}
          className="tavern-frame flex flex-col p-5 no-underline hover:border-[var(--gold)]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">{event.region || "All regions"}</p>
          <h2 className="tavern-title mt-2 text-xl">{event.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{formatWhen(event.startsAt)}</p>
          <p className="mt-2 flex-1 text-sm">{event.description}</p>
          <p className="mt-4 text-xs text-[var(--gold)]">
            {event.game} · {event.format || "Open format"}
            {event.signupCap > 0 || event.waitlistCount > 0 ? ` · ${formatSignupSpots(event.signupCount, event.signupCap, event.waitlistCount)}` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
