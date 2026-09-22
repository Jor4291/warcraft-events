"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { saveWhiteboard, setMatchWinner } from "@/lib/actions";
import type { BracketMatch, BracketRound } from "@/lib/types";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;
const SCALE_STEP = 0.12;

export function BracketBoard({
  slug,
  editKey,
  canEdit,
  whiteboard,
  teams,
  rounds,
  title = "",
}: {
  slug: string;
  editKey: string;
  canEdit: boolean;
  whiteboard: string;
  teams: string[];
  rounds: BracketRound[];
  title?: string;
}) {
  const [notes, setNotes] = useState(whiteboard);
  const [roster, setRoster] = useState(teams.join("\n"));
  const [pending, start] = useTransition();
  const heading = title.trim() || "Tournament Bracket";

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
          heading={heading}
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

export function TraditionalBracket({
  heading,
  rounds,
  canEdit,
  onPick,
}: {
  heading: string;
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
  const columns = `repeat(${columnCount}, minmax(7.5rem, 1fr))`;

  const board =
    prelim.length === 0 ? (
      <div className="flex justify-center">
        <div className="min-w-44 max-w-xs flex-1">
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
          {headers.map((roundTitle, index) => (
            <h4 key={`${roundTitle}-${index}`} className="bracket-round-title">
              {roundTitle}
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
    );

  return (
    <div className="tavern-frame p-4 md:p-5">
      <BracketCanvas columnCount={columnCount} heading={heading}>
        {board}
      </BracketCanvas>
    </div>
  );
}

function BracketCanvas({
  children,
  columnCount,
  heading,
}: {
  children: ReactNode;
  columnCount: number;
  heading: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(0);
  const [boardH, setBoardH] = useState(0);
  const [mode, setMode] = useState<"fit" | "manual">("fit");
  const [manualScale, setManualScale] = useState(1);

  const minWidth = Math.max(columnCount, 1) * 120;
  const innerWidth = Math.max(frameW || minWidth, minWidth);
  const fitScale = frameW && innerWidth ? Math.min(1, frameW / innerWidth) : 1;
  const scale = mode === "fit" ? fitScale : manualScale;
  const zoomedIn = scale > fitScale + 0.01;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const sync = () => setFrameW(frame.clientWidth);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }
    const sync = () => setBoardH(board.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(board);
    return () => observer.disconnect();
  }, [columnCount, innerWidth]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  });

  function zoomBy(delta: number) {
    setMode("manual");
    setManualScale((current) => {
      const from = mode === "fit" ? fitScale : current;
      return Number(Math.min(MAX_SCALE, Math.max(MIN_SCALE, from + delta)).toFixed(3));
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className="hidden w-[9.5rem] sm:order-1 sm:block" />
        <h2 className="tavern-title m-0 min-w-0 text-center text-xl sm:order-2 md:text-3xl">{heading}</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:order-3 sm:justify-end">
          <button
            type="button"
            aria-label="Zoom out"
            className="tavern-btn-ghost px-3 py-1 text-sm"
            onClick={() => zoomBy(-SCALE_STEP)}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Fit bracket to width"
            className="tavern-btn-ghost px-3 py-1 text-sm"
            onClick={() => {
              setMode("fit");
              setManualScale(fitScale);
            }}
          >
            Fit
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            className="tavern-btn-ghost px-3 py-1 text-sm"
            onClick={() => zoomBy(SCALE_STEP)}
          >
            +
          </button>
          <span className="w-10 text-xs tabular-nums text-[var(--muted)]">{Math.round(scale * 100)}%</span>
        </div>
      </div>
      <div
        ref={frameRef}
        className={`max-h-[min(80vh,52rem)] ${zoomedIn ? "overflow-auto" : "overflow-hidden"}`}
      >
        <div style={{ width: innerWidth * scale || "100%", height: boardH * scale || undefined }}>
          <div
            ref={boardRef}
            style={{
              width: innerWidth || "100%",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
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
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      title={name || emptyLabel}
      className={`bracket-slot ${won ? "is-winner" : ""}`}
    >
      {name || emptyLabel}
    </button>
  );
}
