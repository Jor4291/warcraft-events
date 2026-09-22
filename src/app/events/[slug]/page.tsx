import { notFound } from "next/navigation";
import { BracketBoard } from "@/components/BracketBoard";
import { EventCopy } from "@/components/EventCopy";
import { EventLinks } from "@/components/EventLinks";
import { EventManage } from "@/components/EventManage";
import { PlayerSignupStatus } from "@/components/PlayerSignupStatus";
import { SignupPanel } from "@/components/SignupPanel";
import { StartDiscussionButton } from "@/components/StartDiscussionButton";
import { getSessionUser } from "@/lib/auth";
import { canManageEvent, eventForHostClient, isEventOwner } from "@/lib/event-access";
import { replyCount, threadForEvent, topicPath } from "@/lib/forum";
import { signupForUser, waitlistPlace } from "@/lib/notices";
import { confirmedSignups, eventIsFull, signupSpotsLabel } from "@/lib/signup-form";
import { getStore } from "@/lib/store";
import Link from "next/link";

function formatEventStart(iso: string) {
  if (!iso) {
    return "Time to be announced";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventEnd(startIso: string, endIso: string) {
  if (!startIso || !endIso) {
    return "";
  }
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return "";
  }
  const sameDay = start.toDateString() === end.toDateString();
  return end.toLocaleString(
    undefined,
    sameDay
      ? { hour: "numeric", minute: "2-digit" }
      : { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug && item.kind === "calendar");
  if (!event) {
    notFound();
  }
  const user = await getSessionUser();
  const canEdit = await canManageEvent(event);
  const isOwner = await isEventOwner(event);
  const canView = event.status === "published" || canEdit;
  if (!canView) {
    notFound();
  }
  const roster = confirmedSignups(event);
  const showRoster = event.rosterPublic || canEdit;
  const spots = signupSpotsLabel(event);
  const mySignup = user ? signupForUser(event, user.id) : undefined;
  const discussion = threadForEvent(store.threads, event);
  const discussionReplies = discussion ? replyCount(discussion) : 0;
  const endsAt = formatEventEnd(event.startsAt, event.endsAt);

  return (
    <main className="mx-auto w-full max-w-[100rem] space-y-8 px-4 py-12 md:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          {event.cancelledAt ? "cancelled" : event.status} · {event.game} · {event.region || "All regions"} ·{" "}
          {event.signupMode === "invite" ? "Invite only" : "Open sign-up"}
          {event.signupCap > 0 || roster.length > 0 ? ` · ${spots}` : ""}
        </p>
        <h1 className="tavern-title mt-2 text-4xl">{event.title}</h1>
        <p className="mt-3 text-xl text-[var(--gold-bright)] md:text-2xl">
          {formatEventStart(event.startsAt)}
          {endsAt ? <span className="text-[var(--gold)]"> to {endsAt}</span> : null}
        </p>
        {event.format || event.location ? (
          <p className="mt-1 text-lg text-[var(--gold)]">{[event.format, event.location].filter(Boolean).join(" · ")}</p>
        ) : null}
        <EventCopy source={event.description} className="mt-4 max-w-3xl" />
        <EventLinks links={event.links} className="mt-4" />
      </div>

      {event.cancelledAt ? (
        <p className="tavern-frame p-4 text-[var(--muted)]">This event was cancelled by the host.</p>
      ) : null}

      {event.status === "published" ? (
        <section className="tavern-frame p-5">
          <h2 className="tavern-title text-xl">Discussion</h2>
          {discussion && !discussion.hiddenAt ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              <Link href={topicPath(discussion.slug)}>Open the forum topic</Link>
              {` · ${discussionReplies} ${discussionReplies === 1 ? "reply" : "replies"}`}
            </p>
          ) : user ? (
            <div className="mt-3">
              <p className="mb-3 text-sm text-[var(--muted)]">No topic yet. Hang one on the Events board.</p>
              <StartDiscussionButton slug={event.slug} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              <Link href={`/account/login?next=${encodeURIComponent(`/events/${event.slug}`)}`}>Sign in</Link> to start a
              discussion.
            </p>
          )}
        </section>
      ) : null}

      {event.status === "published" && !event.cancelledAt && mySignup ? (
        <PlayerSignupStatus slug={event.slug} signup={mySignup} waitlistPlace={waitlistPlace(event, mySignup.id)} />
      ) : null}

      {event.status === "published" && !event.cancelledAt && !mySignup ? (
        <SignupPanel
          slug={event.slug}
          signupMode={event.signupMode}
          defaultName={user?.displayName || ""}
          fields={event.signupFields}
          spotsLabel={spots}
          isFull={eventIsFull(event)}
          waitlistEnabled={event.waitlistEnabled}
        />
      ) : null}

      {roster.length > 0 ? (
        <section className="tavern-frame p-5">
          <h2 className="tavern-title text-xl">On the list ({spots})</h2>
          {showRoster ? (
            <ul className="mt-3 columns-1 gap-8 sm:columns-2">
              {roster.map((signup) => (
                <li key={signup.id} className="mb-1 text-sm">
                  {signup.name}
                  {canEdit && signup.checkedIn ? <span className="ml-2 text-xs text-[var(--gold)]">in</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">The host is keeping the roster private.</p>
          )}
        </section>
      ) : null}

      {canEdit ? <EventManage event={eventForHostClient(event)} editKey="" isOwner={isOwner} /> : null}

      <div>
        <BracketBoard
          slug={event.slug}
          editKey=""
          canEdit={canEdit}
          whiteboard={event.whiteboard}
          teams={event.teams}
          rounds={event.rounds}
          title={event.title}
        />
      </div>
    </main>
  );
}
