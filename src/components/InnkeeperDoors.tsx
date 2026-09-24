"use client";

import { useState } from "react";
import { banIp, liftIpBan, sweepBlockedSignups } from "@/lib/actions";
import { ipBanActive } from "@/lib/ip-ban";
import type { IpBanRecord } from "@/lib/types";

function formatWhen(iso: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function InnkeeperDoors({ rows }: { rows: IpBanRecord[] }) {
  const banned = rows.filter(ipBanActive);
  const watching = rows.filter((row) => !ipBanActive(row) && row.strikes > 0);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="tavern-title text-xl text-[var(--gold)]">
          Blocked doors
          <span className="ml-2 text-base font-normal tabular-nums text-[var(--muted)]">{banned.length}</span>
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          A second blocked name or post from the same place closes the door. Guests cannot sign up or post from it
          until you lift it.
        </p>
        {banned.length === 0 ? (
          <p className="tavern-frame mt-4 px-4 py-5 text-sm text-[var(--muted)]">No doors are closed right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {banned.map((row) => (
              <li key={row.ip} className="tavern-frame flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-[family-name:var(--font-display)]">{row.ip}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {row.reason || "Blocked wording"}
                    {row.by ? ` · ${row.by}` : ""}
                    {row.lastAt ? ` · ${formatWhen(row.lastAt)}` : ""}
                    {` · ${row.strikes} ${row.strikes === 1 ? "strike" : "strikes"}`}
                  </p>
                </div>
                <form action={liftIpBan.bind(null, row.ip)}>
                  <button className="tavern-btn-ghost text-sm" type="submit">
                    Lift
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      {watching.length > 0 ? (
        <section>
          <h2 className="tavern-title text-xl text-[var(--gold)]">
            One strike
            <span className="ml-2 text-base font-normal tabular-nums text-[var(--muted)]">{watching.length}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            They already tried blocked wording once. Another try from the same place bans the door.
          </p>
          <ul className="mt-4 space-y-3">
            {watching.map((row) => (
              <li key={row.ip} className="tavern-frame p-4 text-sm">
                <p>{row.ip}</p>
                <p className="mt-1 text-[var(--muted)]">{row.lastAt ? formatWhen(row.lastAt) : "Recently"}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <BanIpForm />
      <SweepBlockedForm />
    </div>
  );
}

function BanIpForm() {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className="tavern-frame space-y-3 p-4"
      action={async (formData) => {
        setError("");
        setNote("");
        const result = await banIp(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        setNote("Door closed.");
      }}
    >
      <h3 className="tavern-title text-lg">Close a door by hand</h3>
      <label className="block text-sm">
        IP address
        <input name="ip" required placeholder="203.0.113.12" className="tavern-input" />
      </label>
      <label className="block text-sm">
        Reason
        <input name="reason" maxLength={120} placeholder="What they did" className="tavern-input" />
      </label>
      {error ? <p className="text-red-300">{error}</p> : null}
      {note ? <p className="text-sm text-[var(--gold)]">{note}</p> : null}
      <button className="tavern-btn text-sm" type="submit">
        Ban this IP
      </button>
    </form>
  );
}

function SweepBlockedForm() {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className="tavern-frame space-y-3 p-4"
      action={async () => {
        setError("");
        setNote("");
        const result = await sweepBlockedSignups();
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        const removed = "removed" in result ? result.removed : 0;
        setNote(
          removed === 0
            ? "No illicit names were on a roster."
            : `Pulled ${removed === 1 ? "1 name" : `${removed} names`} off the lists.`,
        );
      }}
    >
      <h3 className="tavern-title text-lg">Sweep illicit names</h3>
      <p className="text-sm text-[var(--muted)]">
        Remove every blocked character name from event rosters. The public already sees Hidden name; this takes them
        off the list.
      </p>
      {error ? <p className="text-red-300">{error}</p> : null}
      {note ? <p className="text-sm text-[var(--gold)]">{note}</p> : null}
      <button className="tavern-btn-ghost text-sm" type="submit">
        Sweep rosters
      </button>
    </form>
  );
}
