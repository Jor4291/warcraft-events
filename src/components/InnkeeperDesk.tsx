import Link from "next/link";
import { InnkeeperDoors } from "@/components/InnkeeperDoors";
import { InnkeeperPeople, type DeskPerson } from "@/components/InnkeeperPeople";
import { ipBanActive } from "@/lib/ip-ban-model";
import type { EventRecord, IpBanRecord, LadderMatch } from "@/lib/types";
import { adminLogout, moderateEvent, moderateLadderMatch } from "@/lib/actions";
import { classColor, formatClassName } from "@/lib/display";
import { stripEventCopy } from "@/lib/event-copy";
import { confirmedSignups, signupSpotsLabel, waitlistedSignups } from "@/lib/signup-form";

export type InnkeeperDeskId = "arena" | "events" | "people";

function formatEventWhen(iso: string) {
  if (!iso) {
    return "No time set";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuelWhen(timestamp: number) {
  if (!timestamp) {
    return "";
  }
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventKindLabel(event: EventRecord) {
  if (event.kind === "bracket") {
    return "Pickup bracket";
  }
  if (event.cancelledAt) {
    return "Cancelled";
  }
  return "Calendar night";
}

export function InnkeeperDesk({
  desk,
  passwordSession,
  pendingDuels,
  deniedDuels,
  pendingEvents,
  liveEvents,
  cancelledEvents,
  rejectedEvents,
  people,
  focusPersonId,
  ipBans = [],
}: {
  desk: InnkeeperDeskId;
  passwordSession: boolean;
  pendingDuels: LadderMatch[];
  deniedDuels: LadderMatch[];
  pendingEvents: EventRecord[];
  liveEvents: EventRecord[];
  cancelledEvents: EventRecord[];
  rejectedEvents: EventRecord[];
  people: DeskPerson[];
  focusPersonId: string;
  ipBans?: IpBanRecord[];
}) {
  const restrictedCount = people.filter((person) => person.restriction).length;
  const closedDoors = ipBans.filter(ipBanActive).length;
  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">The desk</p>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Confirm single duel reports for the official ladder, hang nights on the calendar, or deal with anyone
            causing trouble.
          </p>
        </div>
        {passwordSession ? (
          <form action={adminLogout}>
            <button className="tavern-btn-ghost px-3 py-1 text-sm" type="submit">
              Log out
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">Signed in as innkeeper</p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <DeskTab href="/admin?desk=arena" active={desk === "arena"} count={pendingDuels.length}>
          Arena
        </DeskTab>
        <DeskTab href="/admin?desk=events" active={desk === "events"} count={pendingEvents.length}>
          Events
        </DeskTab>
        <DeskTab href="/admin?desk=people" active={desk === "people"} count={restrictedCount + closedDoors}>
          People
        </DeskTab>
      </div>

      {desk === "arena" ? (
        <div className="space-y-10">
          <section>
            <SectionHead
              title="Waiting on you"
              count={pendingDuels.length}
              hint="One player sent these. Confirm them to count on the ladder, or deny if they look wrong. A second unique report still counts on its own."
            />
            {pendingDuels.length === 0 ? (
              <EmptyCopy>No single reports waiting.</EmptyCopy>
            ) : (
              <ul className="space-y-4">
                {pendingDuels.map((match) => (
                  <DuelCard key={match.matchId} match={match} canDeny />
                ))}
              </ul>
            )}
          </section>
          <section>
            <SectionHead
              title="Denied"
              count={deniedDuels.length}
              hint="These stay off the ladder unless you confirm them, or a second player sends the same fight."
            />
            {deniedDuels.length === 0 ? (
              <EmptyCopy>Nothing denied right now.</EmptyCopy>
            ) : (
              <ul className="space-y-4">
                {deniedDuels.map((match) => (
                  <DuelCard key={match.matchId} match={match} />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : desk === "people" ? (
        <div className="space-y-12">
          {focusPersonId ? null : <InnkeeperDoors rows={ipBans} />}
          <InnkeeperPeople people={people} focusId={focusPersonId} />
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <SectionHead
              title="Waiting to hang"
              count={pendingEvents.length}
              hint="New bookings. Publish them to the calendar, or reject if they do not belong."
            />
            {pendingEvents.length === 0 ? (
              <EmptyCopy>Queue is clear.</EmptyCopy>
            ) : (
              <ul className="space-y-4">
                {pendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} pending />
                ))}
              </ul>
            )}
          </section>
          <section>
            <SectionHead title="On the board" count={liveEvents.length} hint="Published nights and pickup brackets." />
            {liveEvents.length === 0 ? (
              <EmptyCopy>No live listings.</EmptyCopy>
            ) : (
              <ul className="space-y-3">
                {liveEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </ul>
            )}
          </section>
          {cancelledEvents.length > 0 ? (
            <section>
              <SectionHead title="Taken down" count={cancelledEvents.length} hint="Hosts cancelled these. They stay off the calendar." />
              <ul className="space-y-3">
                {cancelledEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </ul>
            </section>
          ) : null}
          {rejectedEvents.length > 0 ? (
            <section>
              <SectionHead title="Rejected" count={rejectedEvents.length} hint="These never made the board." />
              <ul className="space-y-3">
                {rejectedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DeskTab({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: string;
}) {
  return (
    <Link href={href} scroll={false} className={`ladder-chip no-underline ${active ? "is-active" : ""}`}>
      {children}
      <span className={`ml-2 tabular-nums ${count > 0 ? "text-[var(--gold-bright)]" : "text-[var(--muted)]"}`}>
        {count}
      </span>
    </Link>
  );
}

function SectionHead({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div className="mb-4">
      <h2 className="tavern-title text-xl text-[var(--gold)]">
        {title}
        <span className="ml-2 text-base font-normal tabular-nums text-[var(--muted)]">{count}</span>
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{hint}</p>
    </div>
  );
}

function EmptyCopy({ children }: { children: string }) {
  return <p className="tavern-frame px-4 py-5 text-sm text-[var(--muted)]">{children}</p>;
}

function DuelCard({ match, canDeny = false }: { match: LadderMatch; canDeny?: boolean }) {
  return (
    <li className="tavern-frame p-4 md:p-5">
      <p className="text-lg">
        <span style={{ color: classColor(match.winnerClass) }}>{match.winner}</span>
        <span className="text-[var(--muted)]"> defeated </span>
        <span style={{ color: classColor(match.loserClass) }}>{match.loser}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {formatClassName(match.winnerClass) || "Unknown"} vs {formatClassName(match.loserClass) || "Unknown"}
        {match.timestamp ? ` · ${formatDuelWhen(match.timestamp)}` : ""}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Reported by {match.reports.map((report) => report.reporter).join(", ") || "unknown"}
        {match.deniedAt ? " · denied" : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <form action={moderateLadderMatch.bind(null, match.matchId, "approved")}>
          <button className="tavern-btn text-sm" type="submit">
            Confirm
          </button>
        </form>
        {canDeny ? (
          <form action={moderateLadderMatch.bind(null, match.matchId, "denied")}>
            <button className="tavern-btn-ghost text-sm" type="submit">
              Deny
            </button>
          </form>
        ) : null}
      </div>
    </li>
  );
}

function EventCard({ event, pending = false }: { event: EventRecord; pending?: boolean }) {
  const signups = confirmedSignups(event).length;
  const waiting = waitlistedSignups(event).length;
  const meta = [
    eventKindLabel(event),
    event.game,
    formatEventWhen(event.startsAt),
    event.region || "All regions",
    event.contact,
    signups > 0 || waiting > 0 || event.signupCap > 0 ? signupSpotsLabel(event) : "",
  ].filter(Boolean);

  return (
    <li className="tavern-frame p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {pending ? (
            <p className="text-lg">{event.title}</p>
          ) : (
            <Link href={event.kind === "bracket" ? `/bracket/${event.slug}` : `/events/${event.slug}`} className="text-lg">
              {event.title}
            </Link>
          )}
          <p className="mt-1 text-sm text-[var(--muted)]">{meta.join(" · ")}</p>
        </div>
      </div>
      {pending && event.description ? (
        <p className="mt-3 text-sm">{stripEventCopy(event.description)}</p>
      ) : null}
      {pending ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={moderateEvent.bind(null, event.id, "published")}>
            <button className="tavern-btn text-sm" type="submit">
              Publish
            </button>
          </form>
          <form action={moderateEvent.bind(null, event.id, "rejected")}>
            <button className="tavern-btn-ghost text-sm" type="submit">
              Reject
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
