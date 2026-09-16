"use client";

import { useState, useTransition } from "react";
import { saveWhiteboard, setMatchWinner } from "@/lib/actions";
import type { BracketMatch, BracketRound } from "@/lib/types";

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
          className="tavern-parchment p-5"
          action={() => {
            start(async () => {
              await saveWhiteboard(slug, editKey, notes, roster);
            });
          }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-lg">Innkeeper notes &amp; bracket</h3>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="mt-3 w-full border border-[#b8944e] bg-[#efe0b8] px-3 py-2 text-[#2b1a0c]"
            placeholder="Rules, stream link, round buy-ins..."
          />
          <label className="mt-3 block text-sm">
            Challengers (one per line). Seeds 1 and 2 sit on opposite sides of the board.
            <textarea
              value={roster}
              onChange={(event) => setRoster(event.target.value)}
              rows={8}
              className="mt-1 w-full border border-[#b8944e] bg-[#efe0b8] px-3 py-2 text-[#2b1a0c]"
            />
          </label>
          <button type="submit" disabled={pending} className="tavern-btn mt-3">
            {pending ? "Hanging the board..." : "Rebuild bracket"}
          </button>
        </form>
      ) : whiteboard ? (
        <div className="tavern-parchment whitespace-pre-wrap p-5">{whiteboard}</div>
      ) : null}

      {rounds.length === 0 ? (
        <p className="text-[var(--muted)]">No bracket yet. Add at least two names to hang a board.</p>
      ) : (
        <TraditionalBracket
          rounds={rounds}
          canEdit={canEdit}
          onPick={(matchId, winner) => {
            start(async () => {
              await setMatchWinner(slug, editKey, matchId, winner);
            });
          }}
        />
      )}
    </div>
  );
}

function TraditionalBracket({
  rounds,
  canEdit,
  onPick,
}: {
  rounds: BracketRound[];
  canEdit: boolean;
  onPick: (matchId: string, winner: string) => void;
}) {
  const finalRound = rounds[rounds.length - 1];
  const prelim = rounds.slice(0, -1);
  const leftRounds = prelim.map((round) => ({
    ...round,
    matches: leftHalf(round.matches),
  }));
  const rightRounds = prelim.map((round) => ({
    ...round,
    matches: rightHalf(round.matches),
  }));
  const firstCount = Math.max(leftRounds[0]?.matches.length ?? 1, 1);
  const rowCount = firstCount * 2;
  const columnCount = leftRounds.length + 1 + rightRounds.length;
  const headers = [
    ...leftRounds.map((round) => round.name),
    finalRound.name,
    ...[...rightRounds].reverse().map((round) => round.name),
  ];
  const columns = `repeat(${columnCount}, 11.25rem)`;

  return (
    <div className="tavern-frame overflow-x-auto p-5">
      <p className="mb-5 text-center text-xs uppercase tracking-[0.22em] text-[var(--gold)]">
        Opposite sides · winners march to the hearth
      </p>
      {prelim.length === 0 ? (
        <div className="flex justify-center">
          <div className="min-w-44">
            <h4 className="bracket-round-title">{finalRound.name}</h4>
            <MatchCard
              match={finalRound.matches[0]}
              canEdit={canEdit}
              onPick={onPick}
              emptyLabel="TBD"
              featured
            />
          </div>
        </div>
      ) : (
        <div className="bracket-shell">
          <div className="bracket-headers" style={{ gridTemplateColumns: columns }}>
            {headers.map((title, index) => (
              <h4 key={`${title}-${index}`} className="bracket-round-title">
                {title}
              </h4>
            ))}
          </div>
          <div
            className="bracket-grid"
            style={{
              gridTemplateColumns: columns,
              gridTemplateRows: `repeat(${rowCount}, minmax(2.55rem, 1fr))`,
            }}
          >
            {leftRounds.flatMap((round, roundIndex) =>
              placeMatches(round, roundIndex, roundIndex + 1, "left", canEdit, onPick),
            )}
            <div
              className="bracket-cell"
              style={{
                gridColumn: leftRounds.length + 1,
                gridRow: `1 / span ${rowCount}`,
              }}
            >
              <MatchCard
                match={finalRound.matches[0]}
                canEdit={canEdit}
                onPick={onPick}
                emptyLabel="TBD"
                featured
              />
            </div>
            {rightRounds.flatMap((round, roundIndex) =>
              placeMatches(round, roundIndex, columnCount - roundIndex, "right", canEdit, onPick),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function placeMatches(
  round: BracketRound,
  roundIndex: number,
  column: number,
  side: "left" | "right",
  canEdit: boolean,
  onPick: (matchId: string, winner: string) => void,
) {
  const span = 2 ** (roundIndex + 1);
  return round.matches.map((match, matchIndex) => (
    <div
      key={match.id}
      className={`bracket-cell bracket-cell-${side}`}
      style={{
        gridColumn: column,
        gridRow: `${matchIndex * span + 1} / span ${span}`,
      }}
    >
      <MatchCard
        match={match}
        canEdit={canEdit}
        onPick={onPick}
        emptyLabel={roundIndex === 0 ? "BYE" : "TBD"}
      />
    </div>
  ));
}

function leftHalf(matches: BracketMatch[]) {
  return matches.slice(0, Math.ceil(matches.length / 2));
}

function rightHalf(matches: BracketMatch[]) {
  return matches.slice(Math.ceil(matches.length / 2));
}

function MatchCard({
  match,
  canEdit,
  onPick,
  emptyLabel,
  featured = false,
}: {
  match?: BracketMatch;
  canEdit: boolean;
  onPick: (matchId: string, winner: string) => void;
  emptyLabel: string;
  featured?: boolean;
}) {
  if (!match) {
    return null;
  }
  return (
    <div className={`bracket-match ${featured ? "bracket-final-card" : ""}`}>
      <div className="overflow-hidden border border-[var(--gold-dim)]">
        <PlayerRow
          name={match.playerA}
          emptyLabel={emptyLabel}
          winner={match.winner}
          disabled={!canEdit || !match.playerA}
          onPick={() => onPick(match.id, match.playerA)}
        />
        <PlayerRow
          name={match.playerB}
          emptyLabel={emptyLabel}
          winner={match.winner}
          disabled={!canEdit || !match.playerB}
          onPick={() => onPick(match.id, match.playerB)}
        />
      </div>
    </div>
  );
}

function PlayerRow({
  name,
  emptyLabel,
  winner,
  disabled,
  onPick,
}: {
  name: string;
  emptyLabel: string;
  winner: string;
  disabled: boolean;
  onPick: () => void;
}) {
  const won = Boolean(name) && winner === name;
  return (
    <button type="button" disabled={disabled} onClick={onPick} className={`bracket-slot ${won ? "is-winner" : ""}`}>
      {name || emptyLabel}
    </button>
  );
}
