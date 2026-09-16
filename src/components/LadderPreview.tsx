import Link from "next/link";
import { classColor, formatClassName, getArenaTitle } from "@/lib/display";
import type { LadderPlayer } from "@/lib/types";

const TOP_N = 8;

function rankTone(place: number) {
  if (place === 1) {
    return "text-[var(--gold-bright)]";
  }
  if (place === 2) {
    return "text-[#d5dee8]";
  }
  if (place === 3) {
    return "text-[#d08a3c]";
  }
  return "text-[var(--muted)]";
}

export function LadderPreview({
  players,
  confirmedMatches,
}: {
  players: LadderPlayer[];
  confirmedMatches: number;
}) {
  const top = players.slice(0, TOP_N);

  return (
    <section className="tavern-frame p-6">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="tavern-title text-xl">Arena Leaderboard</h2>
        <Link href="/ladder" className="shrink-0 text-sm">
          Full board
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="mt-3 text-[var(--muted)]">
          No confirmed rated matches yet. Submit a duel log from the leaderboard.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Forever rated duels · {confirmedMatches} confirmed {confirmedMatches === 1 ? "match" : "matches"} ·{" "}
            {players.length} {players.length === 1 ? "player" : "players"}
          </p>
          <ol className="m-0 list-none p-0">
            {top.map((player, index) => {
              const place = index + 1;
              const title = getArenaTitle(player.points, player.games);
              const classLabel = formatClassName(player.className) || "Unknown";
              return (
                <li
                  key={player.name}
                  className={`grid grid-cols-[1.65rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-[var(--line)] py-2.5 last:border-b-0 ${
                    place === 1 ? "bg-[rgba(230,195,106,0.06)]" : ""
                  }`}
                >
                  <span
                    className={`font-[family-name:var(--font-display)] text-sm tabular-nums ${rankTone(place)}`}
                  >
                    {place}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href="/ladder"
                      className="block truncate no-underline"
                      style={{ color: classColor(player.className) }}
                    >
                      {player.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs">
                      <span style={{ color: title.color }}>{title.name}</span>
                      <span className="text-[var(--muted)]">
                        {" "}
                        · {classLabel} · {player.wins}-{player.losses}
                      </span>
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-display)] text-sm tabular-nums text-[var(--gold)]">
                    {player.points.toFixed(0)}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
