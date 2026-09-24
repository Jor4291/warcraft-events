import Link from "next/link";
import { RenameAccountForm } from "@/components/RenameAccountForm";
import { SanctionForm } from "@/components/SanctionForm";
import { liftSanction } from "@/lib/actions";
import { describeRestriction, formatSanctionUntil, sanctionName } from "@/lib/moderation";
import type { UserSanction } from "@/lib/types";

export type DeskPerson = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  innkeeper: boolean;
  restriction: UserSanction | null;
  needsRename?: boolean;
  history: UserSanction[];
  topics: number;
  posts: number;
  hiddenPosts: number;
  events: number;
  lastPostAt: string;
};

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

export function InnkeeperPeople({ people, focusId }: { people: DeskPerson[]; focusId: string }) {
  const focused = people.find((person) => person.id === focusId);
  const restricted = people.filter((person) => person.restriction);
  const needsName = people.filter((person) => person.needsRename && !person.restriction);
  const flagged = people.filter((person) => !person.restriction && !person.needsRename && person.hiddenPosts > 0);
  const others = people.filter((person) => !person.restriction && !person.needsRename && person.hiddenPosts === 0);

  if (focused) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="tavern-title text-xl text-[var(--gold)]">Picked from the board</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            You followed a post here. <Link href="/admin?desk=people">Back to everyone</Link>.
          </p>
        </div>
        <ul>
          <PersonCard person={focused} />
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHead
          title="Under restriction"
          count={restricted.length}
          hint="Mutes and timeouts lift themselves when they run out. A ban stays until you lift it."
        />
        {restricted.length === 0 ? (
          <EmptyCopy>Nobody is restricted right now.</EmptyCopy>
        ) : (
          <ul className="space-y-3">
            {restricted.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <SectionHead
          title="Needs a new name"
          count={needsName.length}
          hint="The public already sees Hidden name. Give them something that can hang on the board, or mute them."
        />
        {needsName.length === 0 ? (
          <EmptyCopy>No illicit display names right now.</EmptyCopy>
        ) : (
          <ul className="space-y-3">
            {needsName.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <SectionHead
          title="Worth a look"
          count={flagged.length}
          hint="Accounts with posts you have hidden but no restriction on the account itself."
        />
        {flagged.length === 0 ? (
          <EmptyCopy>Nothing hidden that is not already handled.</EmptyCopy>
        ) : (
          <ul className="space-y-3">
            {flagged.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <SectionHead title="Everyone at the tavern" count={others.length} hint="Newest talkers first." />
        {others.length === 0 ? (
          <EmptyCopy>No other accounts.</EmptyCopy>
        ) : (
          <ul className="space-y-3">
            {others.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </section>
    </div>
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
    <li className="tavern-frame p-4 md:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-lg">{person.displayName}</p>
        {person.innkeeper ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Innkeeper</span>
        ) : null}
        {person.needsRename ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[#e07a7a]">Needs a new name</span>
        ) : null}
        {restriction ? (
          <span className="text-sm uppercase tracking-[0.2em] text-[#e07a7a]">
            {describeRestriction(restriction)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{meta.join(" · ")}</p>
      {restriction ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#e07a7a] pl-3">
          <p className="text-sm">
            {sanctionName(restriction.kind)} by {restriction.by || "the innkeeper"} on {formatDay(restriction.createdAt)}
            {restriction.expiresAt ? ` · runs out ${formatSanctionUntil(restriction.expiresAt)}` : " · no end date"}
            {restriction.reason ? (
              <span className="block text-[var(--muted)]">{restriction.reason}</span>
            ) : null}
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
          <summary className="cursor-pointer">
            Past record ({person.history.length})
          </summary>
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
    </li>
  );
}
