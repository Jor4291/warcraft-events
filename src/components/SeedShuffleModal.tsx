"use client";

import { useEffect, useId, useRef, useState } from "react";
import { shuffleNames } from "@/lib/brackets";

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function spinCount(total: number, index: number) {
  const remaining = total - index;
  if (remaining <= 1) {
    return 0;
  }
  return Math.max(6, Math.min(14, 18 - index));
}

export function SeedShuffleModal({
  names,
  onDone,
  onCancel,
}: {
  names: string[];
  onDone: (order: string[]) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const [order] = useState(() => shuffleNames(names));
  const [locked, setLocked] = useState<string[]>([]);
  const [reel, setReel] = useState(names[0] || "");
  const [landed, setLanded] = useState(false);
  const [finished, setFinished] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const applied = useRef(false);
  const onDoneRef = useRef(onDone);
  const onCancelRef = useRef(onCancel);
  onDoneRef.current = onDone;
  onCancelRef.current = onCancel;

  function apply(next: string[]) {
    if (applied.current) {
      return;
    }
    applied.current = true;
    abortRef.current?.abort();
    onDoneRef.current(next);
  }

  function cancel() {
    if (applied.current) {
      return;
    }
    applied.current = true;
    abortRef.current?.abort();
    onCancelRef.current();
  }

  useEffect(() => {
    const abort = new AbortController();
    abortRef.current = abort;
    const { signal } = abort;
    setLocked([]);
    setFinished(false);

    async function draw() {
      for (let index = 0; index < order.length; index += 1) {
        const pick = order[index];
        const pool = order.slice(index);
        const spins = spinCount(order.length, index);
        setLanded(false);
        for (let spin = 0; spin < spins; spin += 1) {
          setReel(pool[spin % pool.length]);
          const late = spin >= spins - 3;
          await sleep(late ? 70 + (spin - (spins - 3)) * 55 : 38, signal);
        }
        setReel(pick);
        setLanded(true);
        setLocked(order.slice(0, index + 1));
        await sleep(index === order.length - 1 ? 520 : 220, signal);
      }
      setFinished(true);
      await sleep(700, signal);
      apply(order);
    }

    void draw().catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      throw error;
    });

    return () => abort.abort();
  }, [order]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancel();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const nextSeed = Math.min(locked.length + 1, order.length);

  return (
    <div className="seed-draw-overlay" role="presentation" onClick={cancel}>
      <div
        className="seed-draw-modal tavern-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">The hat</p>
        <h2 id={titleId} className="tavern-title mt-2 text-3xl text-[var(--gold-bright)]">
          {finished ? "The field is set" : `Drawing seed ${nextSeed}`}
        </h2>
        <div className="seed-draw-reel-slot">
          <p
            key={`${locked.length}-${reel}-${landed ? "lock" : "spin"}`}
            className={`seed-draw-reel tavern-title ${landed ? "is-locked" : "is-spinning"}`}
          >
            {reel}
          </p>
        </div>
        <ol className="seed-draw-roll">
          {order.map((name, index) => {
            const shown = locked[index];
            return (
              <li key={`${name}-${index}`} className={shown ? "is-in" : ""}>
                <span className="seed-draw-num">{index + 1}</span>
                <span>{shown || "—"}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="tavern-btn" onClick={() => apply(order)}>
            Skip to the board
          </button>
          <button type="button" className="tavern-btn-ghost" onClick={cancel}>
            Cancel
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">Winners on the current board will be cleared.</p>
      </div>
    </div>
  );
}
