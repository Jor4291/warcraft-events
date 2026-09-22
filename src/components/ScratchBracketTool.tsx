"use client";

import { useState, useSyncExternalStore } from "react";
import { TraditionalBracket } from "@/components/BracketBoard";
import { applyWinner, buildSingleElim } from "@/lib/brackets";
import type { BracketRound } from "@/lib/types";

const STORAGE_KEY = "we_scratch_bracket_v1";

type ScratchState = {
  title: string;
  teamsText: string;
  rounds: BracketRound[];
};

const EMPTY: ScratchState = { title: "", teamsText: "", rounds: [] };

const listeners = new Set<() => void>();
let loaded = false;
let current: ScratchState = EMPTY;

function parseNames(text: string) {
  return text
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseScratch(raw: string | null): ScratchState {
  if (!raw) {
    return EMPTY;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ScratchState>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      teamsText: typeof parsed.teamsText === "string" ? parsed.teamsText : "",
      rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [],
    };
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): ScratchState {
  if (!loaded) {
    loaded = true;
    try {
      current = parseScratch(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      current = EMPTY;
    }
  }
  return current;
}

function getServerSnapshot(): ScratchState {
  return EMPTY;
}

function publish(next: ScratchState) {
  loaded = true;
  current = next;
  for (const listener of listeners) {
    listener();
  }
}

function writeScratch(next: ScratchState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private windows refuse storage; the board still works until the tab closes.
  }
  publish(next);
}

function clearScratch() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
  publish(EMPTY);
}

export function ScratchBracketTool() {
  const scratch = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [error, setError] = useState("");

  function hangBoard() {
    const names = parseNames(scratch.teamsText);
    if (names.length < 2) {
      setError("Add at least two names.");
      return;
    }
    setError("");
    writeScratch({ ...scratch, rounds: buildSingleElim(names) });
  }

  function resetBoard() {
    setError("");
    clearScratch();
  }

  return (
    <div className="space-y-6">
      <form
        className="tavern-parchment space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          hangBoard();
        }}
      >
        <label className="block text-sm">
          Title
          <input
            value={scratch.title}
            onChange={(event) => writeScratch({ ...scratch, title: event.target.value })}
            placeholder="Thursday night 1v1s"
            className="tavern-input"
          />
        </label>
        <label className="block text-sm">
          Challengers (one per line)
          <textarea
            value={scratch.teamsText}
            onChange={(event) => writeScratch({ ...scratch, teamsText: event.target.value })}
            rows={8}
            required
            className="tavern-input"
            placeholder={"Sgtpepper\nStormwind Blade"}
          />
        </label>
        {error ? <p className="text-red-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="tavern-btn">
            {scratch.rounds.length ? "Rebuild board" : "Hang a scratch board"}
          </button>
          {scratch.rounds.length || scratch.teamsText || scratch.title ? (
            <button type="button" className="tavern-btn-ghost" onClick={resetBoard}>
              Clear this tab
            </button>
          ) : null}
        </div>
        <p className="text-sm text-[var(--muted)]">
          Click a name to send them through. This stays in this browser tab until you close it. It is not saved on
          WarcraftEvents and is not tied to a calendar night.
        </p>
      </form>
      {scratch.rounds.length > 0 ? (
        <TraditionalBracket
          heading={scratch.title.trim() || "Scratch bracket"}
          rounds={scratch.rounds}
          canEdit
          onPick={(matchId, winner) =>
            writeScratch({ ...scratch, rounds: applyWinner(scratch.rounds, matchId, winner) })
          }
        />
      ) : (
        <p className="text-[var(--muted)]">Add at least two names and hang the board.</p>
      )}
    </div>
  );
}
