"use client";

import { useState } from "react";
import { sanctionUser } from "@/lib/actions";
import { SANCTION_LENGTHS, SANCTION_REASON_MAX, SANCTIONS } from "@/lib/moderation";
import type { SanctionKind } from "@/lib/types";

export function SanctionForm({ userId, replacing }: { userId: string; replacing: boolean }) {
  const [kind, setKind] = useState<SanctionKind>("mute");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const chosen = SANCTIONS.find((sanction) => sanction.kind === kind) ?? SANCTIONS[0];

  return (
    <form
      className="mt-4 border-t border-[var(--line)] pt-4"
      action={async (formData) => {
        setError("");
        setNote("");
        const result = await sanctionUser(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        const hidden = ("hidden" in result ? result.hidden : 0) ?? 0;
        setNote(hidden > 0 ? `Done, and ${hidden === 1 ? "1 post is" : `${hidden} posts are`} now hidden.` : "Done.");
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Action
          <select
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as SanctionKind)}
            className="tavern-input"
          >
            {SANCTIONS.map((sanction) => (
              <option key={sanction.kind} value={sanction.kind}>
                {sanction.name}
              </option>
            ))}
          </select>
        </label>
        {kind === "ban" ? null : (
          <label className="text-sm">
            Length
            <select name="length" defaultValue="1d" className="tavern-input">
              {SANCTION_LENGTHS.map((length) => (
                <option key={length.id} value={length.id}>
                  {length.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="min-w-48 flex-1 text-sm">
          Reason
          <input name="reason" maxLength={SANCTION_REASON_MAX} placeholder="What they did" className="tavern-input" />
        </label>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{chosen.blurb}</p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="purgePosts" />
        Hide everything they have posted
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" name="closeDoors" key={kind} defaultChecked={kind === "ban"} />
        Close their doors — ban every IP we have seen on this account
      </label>
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-[var(--gold)]">{note}</p> : null}
      <button className="tavern-btn mt-4 text-sm" type="submit">
        {replacing ? "Replace restriction" : `Apply ${chosen.name.toLowerCase()}`}
      </button>
    </form>
  );
}
