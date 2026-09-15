"use client";

import { useState, useTransition } from "react";
import { saveWhiteboard, setMatchWinner } from "@/lib/actions";
import type { BracketRound } from "@/lib/types";

export function BracketBoard({
  slug,
  editKey,
  canEdit,
  whiteboard,
  teams,
  rounds,
}: {
  slug: string;
  editKey: string;
  canEdit: boolean;
  whiteboard: string;
  teams: string[];
  rounds: BracketRound[];
}) {
  const [notes, setNotes] = useState(whiteboard);
  const [roster, setRoster] = useState(teams.join("\n"));
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      {canEdit ? (
        <form
          className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5"
          action={() => {
            start(async () => {
              await saveWhiteboard(slug, editKey, notes, roster);
            });
          }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--gold)]">
            Whiteboard &amp; bracket
          </h3>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded border border-[var(--line)] bg-[#120e0b] px-3 py-2"
            placeholder="Rules, stream link, notes for players..."
          />
          <label className="mt-3 block text-sm text-[var(--muted)]">
            Teams / players (one per line)
            <textarea
              value={roster}
              onChange={(event) => setRoster(event.target.value)}
              rows={6}
              className="mt-1 w-full rounded border border-[var(--line)] bg-[#120e0b] px-3 py-2 text-[var(--foreground)]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-3 rounded bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#1a120c]"
          >
            {pending ? "Saving..." : "Rebuild bracket"}
          </button>
        </form>
      ) : whiteboard ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 whitespace-pre-wrap text-[var(--muted)]">
          {whiteboard}
        </div>
      ) : null}

      {rounds.length === 0 ? (
        <p className="text-[var(--muted)]">No bracket yet. Add at least two names to generate one.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {rounds.map((round) => (
            <div key={round.name} className="min-w-56 space-y-3">
              <h4 className="text-sm uppercase tracking-wide text-[var(--gold)]">{round.name}</h4>
              {round.matches.map((match) => (
                <div key={match.id} className="rounded border border-[var(--line)] bg-[#120e0b] p-3 text-sm">
                  <PlayerRow
                    name={match.playerA}
                    winner={match.winner}
                    disabled={!canEdit || !match.playerA}
                    onPick={() =>
                      start(async () => {
                        await setMatchWinner(slug, editKey, match.id, match.playerA);
                      })
                    }
                  />
                  <PlayerRow
                    name={match.playerB}
                    winner={match.winner}
                    disabled={!canEdit || !match.playerB}
                    onPick={() =>
                      start(async () => {
                        await setMatchWinner(slug, editKey, match.id, match.playerB);
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  name,
  winner,
  disabled,
  onPick,
}: {
  name: string;
  winner: string;
  disabled: boolean;
  onPick: () => void;
}) {
  const won = Boolean(name) && winner === name;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`mb-1 block w-full rounded px-2 py-1 text-left ${
        won ? "bg-[var(--gold)] text-[#1a120c]" : "text-[var(--foreground)]"
      } ${disabled ? "opacity-50" : "hover:bg-[#2a2018]"}`}
    >
      {name || "BYE"}
    </button>
  );
}
