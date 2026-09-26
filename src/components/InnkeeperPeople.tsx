"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RenameAccountForm } from "@/components/RenameAccountForm";
import { SanctionForm } from "@/components/SanctionForm";
import { closeAccountDoors, liftSanction } from "@/lib/actions";
import { describeRestriction, formatSanctionUntil, sanctionName } from "@/lib/moderation";
import type { UserIpSighting, UserSanction } from "@/lib/types";

export type DeskPerson = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  innkeeper: boolean;
  restriction: UserSanction | null;
  needsRename?: boolean;
  unconfirmed?: boolean;
  ips: UserIpSighting[];
  history: UserSanction[];
  topics: number;
  posts: number;
  hiddenPosts: number;
  events: number;
  lastPostAt: string;
};

type PeopleFilter = "attention" | "restricted" | "rename" | "flagged" | "all";
type PeopleSort = "recent" | "name" | "joined" | "posts";

function formatDay(iso: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function lastActivity(person: DeskPerson) {
  const ipLast = person.ips.reduce((latest, sight) => (sight.lastAt > latest ? sight.lastAt : latest), "");
  return [person.lastPostAt, ipLast, person.createdAt].reduce((latest, value) => (value > latest ? value : latest), "");
}

function needsAttention(person: DeskPerson) {
  return Boolean(person.restriction || person.needsRename || person.hiddenPosts > 0 || person.unconfirmed);
}

function matchesQuery(person: DeskPerson, query: string) {
  if (!query) {
    return true;
  }
  const hay = [person.displayName, person.email, ...person.ips.map((sight) => sight.ip)].join(" ").toLowerCase();
  return hay.includes(query);
}

export function InnkeeperPeople({ people, focusId }: { people: DeskPerson[]; focusId: string }) {
  const attention = people.filter(needsAttention);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>(attention.length > 0 ? "attention" : "all");
  const [sort, setSort] = useState<PeopleSort>("recent");
  const [pickedId, setPickedId] = useState(focusId);
  const [seenFocus, setSeenFocus] = useState(focusId);

  if (focusId !== seenFocus) {
    setSeenFocus(focusId);
    setPickedId(focusId);
  }

  const counts = {
    attention: attention.length,
    restricted: people.filter((person) => person.restriction).length,
    rename: people.filter((person) => person.needsRename).length,
    flagged: people.filter((person) => person.hiddenPosts > 0).length,
    all: people.length,
  };

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = people.filter((person) => {
      if (!matchesQuery(person, needle)) {
        return false;
      }
      if (filter === "attention") {
        return needsAttention(person);
      }
      if (filter === "restricted") {
        return Boolean(person.restriction);
      }
      if (filter === "rename") {
        return Boolean(person.needsRename);
      }
      if (filter === "flagged") {
        return person.hiddenPosts > 0;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "name") {
        return a.displayName.localeCompare(b.displayName);
      }
      if (sort === "joined") {
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
      if (sort === "posts") {
        return b.posts - a.posts || a.displayName.localeCompare(b.displayName);
      }
      return lastActivity(b).localeCompare(lastActivity(a)) || a.displayName.localeCompare(b.displayName);
    });
  }, [people, query, filter, sort]);

  const picked = people.find((person) => person.id === pickedId) ?? null;
  const fromBoard = Boolean(focusId && picked && picked.id === focusId);

  return (
    <div>
      <div className="mb-4">
        <h2 className="tavern-title text-xl text-[var(--gold)]">
          People
          <span className="ml-2 text-base font-normal tabular-nums text-[var(--muted)]">{people.length}</span>
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Scan the roll, then open one stool. Search by name, email, or IP.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-sm">
          Find
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or IP"
            className="tavern-input"
          />
        </label>
        <label className="text-sm">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as PeopleSort)}
            className="tavern-input"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name</option>
            <option value="joined">Newest join</option>
            <option value="posts">Most posts</option>
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip id="attention" current={filter} count={counts.attention} onPick={setFilter}>
          Needs a look
        </FilterChip>
        <FilterChip id="restricted" current={filter} count={counts.restricted} onPick={setFilter}>
          Restricted
        </FilterChip>
        <FilterChip id="rename" current={filter} count={counts.rename} onPick={setFilter}>
          Bad names
        </FilterChip>
        <FilterChip id="flagged" current={filter} count={counts.flagged} onPick={setFilter}>
          Hidden posts
        </FilterChip>
        <FilterChip id="all" current={filter} count={counts.all} onPick={setFilter}>
          Everyone
        </FilterChip>
      </div>

      {fromBoard ? (
        <p className="mb-3 text-sm text-[var(--muted)]">
          You followed a post here.{" "}
          <Link href="/admin?desk=people" onClick={() => setPickedId("")}>
            Clear the pick
          </Link>
          .
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <div className={`tavern-frame overflow-hidden ${picked ? "hidden lg:block" : ""}`}>
          <div className="border-b border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]">
            {rows.length} {rows.length === 1 ? "account" : "accounts"}
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--muted)]">Nobody matches that.</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-[var(--line)] overflow-y-auto">
              {rows.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  active={person.id === picked?.id}
                  onPick={() => setPickedId(person.id === pickedId ? "" : person.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className={picked ? "lg:sticky lg:top-24" : "hidden lg:block"}>
          {picked ? (
            <div>
              <button
                type="button"
                className="tavern-btn-ghost mb-3 px-3 py-1 text-sm lg:hidden"
                onClick={() => setPickedId("")}
              >
                Back to the roll
              </button>
              <PersonCard person={picked} />
            </div>
          ) : (
            <p className="tavern-frame px-4 py-6 text-sm text-[var(--muted)]">
              Pick a name on the left to rename them, mute them, or close their doors.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  id,
  current,
  count,
  onPick,
  children,
}: {
  id: PeopleFilter;
  current: PeopleFilter;
  count: number;
  onPick: (id: PeopleFilter) => void;
  children: string;
}) {
  return (
    <button type="button" className={`ladder-chip ${current === id ? "is-active" : ""}`} onClick={() => onPick(id)}>
      {children}
      <span className={`ml-2 tabular-nums ${count > 0 ? "text-[var(--gold-bright)]" : "text-[var(--muted)]"}`}>
        {count}
      </span>
    </button>
  );
}

function PersonRow({ person, active, onPick }: { person: DeskPerson; active: boolean; onPick: () => void }) {
  const restriction = person.restriction;
  const bits = [
    person.createdAt ? `joined ${formatDay(person.createdAt)}` : "",
    `${person.posts} ${person.posts === 1 ? "post" : "posts"}`,
    person.ips.length > 0 ? `${person.ips.length} ${person.ips.length === 1 ? "IP" : "IPs"}` : "",
    person.hiddenPosts > 0 ? `${person.hiddenPosts} hidden` : "",
  ].filter(Boolean);

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left ${
          active ? "bg-[rgba(80,50,16,0.45)]" : "hover:bg-[rgba(80,50,16,0.22)]"
        }`}
      >
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base">{person.displayName}</span>
          {person.innkeeper ? (
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Innkeeper</span>
          ) : null}
          {person.needsRename ? (
            <span className="text-xs uppercase tracking-[0.18em] text-[#e07a7a]">Bad name</span>
          ) : null}
          {person.unconfirmed ? (
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Unconfirmed</span>
          ) : null}
          {restriction ? (
            <span className="text-xs uppercase tracking-[0.18em] text-[#e07a7a]">
              {describeRestriction(restriction)}
            </span>
          ) : null}
        </span>
        <span className="text-sm text-[var(--muted)]">{person.email}</span>
        <span className="text-xs text-[var(--muted)]">{bits.join(" · ")}</span>
      </button>
    </li>
  );
}

function PersonCard({ person }: { person: DeskPerson }) {
  const restriction = person.restriction;
  const meta = [
    person.email,
    person.createdAt ? `joined ${formatDay(person.createdAt)}` : "",
    `${person.posts} ${person.posts === 1 ? "post" : "posts"}`,
    person.hiddenPosts > 0 ? `${person.hiddenPosts} hidden` : "",
    person.topics > 0 ? `${person.topics} ${person.topics === 1 ? "topic" : "topics"}` : "",
    person.events > 0 ? `${person.events} ${person.events === 1 ? "board" : "boards"}` : "",
    person.lastPostAt ? `last posted ${formatDay(person.lastPostAt)}` : "",
  ].filter(Boolean);

  return (
    <article className="tavern-frame p-4 md:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-lg">{person.displayName}</p>
        {person.innkeeper ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Innkeeper</span>
        ) : null}
        {person.needsRename ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[#e07a7a]">Needs a new name</span>
        ) : null}
        {person.unconfirmed ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Mailbox unconfirmed</span>
        ) : null}
        {restriction ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[#e07a7a]">
            {describeRestriction(restriction)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{meta.join(" · ")}</p>
      {person.ips.length > 0 ? (
        <div className="mt-3 text-sm">
          <p className="text-[var(--muted)]">Seen from</p>
          <ul className="mt-1 space-y-1">
            {person.ips.map((sight) => (
              <li key={sight.ip} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[var(--gold)]">{sight.ip}</span>
                <span className="text-[var(--muted)]">
                  {sight.seen} {sight.seen === 1 ? "time" : "times"}
                  {sight.lastAt ? ` · last ${formatDay(sight.lastAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {person.innkeeper ? null : (
            <form action={closeAccountDoors.bind(null, person.id)} className="mt-2">
              <button className="tavern-btn-ghost text-sm" type="submit">
                Close their doors
              </button>
            </form>
          )}
        </div>
      ) : person.innkeeper ? null : (
        <p className="mt-3 text-sm text-[var(--muted)]">
          No IP on file. These burners were likely made before we started keeping doors, and a ban
          stops them from signing in so we cannot stamp one now. If they try the password again, or
          still have an old session, the address will land here.
        </p>
      )}
      {restriction ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#e07a7a] pl-3">
          <p className="text-sm">
            {sanctionName(restriction.kind)} by {restriction.by || "the innkeeper"} on {formatDay(restriction.createdAt)}
            {restriction.expiresAt ? ` · runs out ${formatSanctionUntil(restriction.expiresAt)}` : " · no end date"}
            {restriction.reason ? <span className="block text-[var(--muted)]">{restriction.reason}</span> : null}
          </p>
          <form action={liftSanction.bind(null, person.id)}>
            <button className="tavern-btn-ghost text-sm" type="submit">
              Lift
            </button>
          </form>
        </div>
      ) : null}
      {person.history.length > 0 ? (
        <details className="mt-3 text-sm text-[var(--muted)]">
          <summary className="cursor-pointer">Past record ({person.history.length})</summary>
          <ul className="mt-2 space-y-1">
            {person.history.map((entry) => (
              <li key={entry.id}>
                {sanctionName(entry.kind)} on {formatDay(entry.createdAt)} by {entry.by || "the innkeeper"}
                {entry.liftedAt ? ` · lifted ${formatDay(entry.liftedAt)}` : " · ran out"}
                {entry.reason ? ` · ${entry.reason}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {person.innkeeper ? (
        <p className="mt-4 border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
          Innkeepers keep the keys. This account cannot be restricted.
        </p>
      ) : (
        <>
          <RenameAccountForm userId={person.id} currentName={person.displayName} />
          <SanctionForm userId={person.id} replacing={Boolean(restriction)} />
        </>
      )}
    </article>
  );
}
