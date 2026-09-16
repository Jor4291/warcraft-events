"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CLASS_ORDER, classColor, formatClassName, getArenaTitle } from "@/lib/display";
import {
  buildBoardRows,
  classesOnBoard,
  formatDelta,
  formatMatchTime,
  formatWinRate,
  matchesForPlayer,
  namesEqual,
  playerForm,
  playerStreak,
  recentMatches,
  type BoardMatch,
  type BoardRow,
  type GroupBy,
  type SortKey,
} from "@/lib/ladder-board";
import type { LadderPlayer } from "@/lib/types";

type Tab = "board" | "recent";

export function LadderBoard({
  players,
  matches,
  storedMatches,
  pending,
}: {
  players: LadderPlayer[];
  matches: BoardMatch[];
  storedMatches: number;
  pending: number;
}) {
  const [tab, setTab] = useState<Tab>("board");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("overall");
  const [sort, setSort] = useState<SortKey>("rating");
  const [selectedName, setSelectedName] = useState("");
  const [expandedMatch, setExpandedMatch] = useState("");

  const classChips = useMemo(() => {
    const order = new Map(CLASS_ORDER.map((token, index) => [token, index]));
    return classesOnBoard(players).sort((a, b) => {
      const ia = order.get(a.token as (typeof CLASS_ORDER)[number]);
      const ib = order.get(b.token as (typeof CLASS_ORDER)[number]);
      return (ia ?? 99) - (ib ?? 99) || a.token.localeCompare(b.token);
    });
  }, [players]);

  const hasRace = players.some((player) => player.race.trim());
  const hasGuild = players.some((player) => player.guild.trim());
  const rows = useMemo(
    () => buildBoardRows(players, { search, classFilter, groupBy, sort }),
    [players, search, classFilter, groupBy, sort],
  );
  const selected = players.find((player) => namesEqual(player.name, selectedName));
  const selectedMatches = selected ? matchesForPlayer(matches, selected.name).slice(0, 8) : [];
  const recents = useMemo(() => recentMatches(matches, 20), [matches]);

  function toggleClass(token: string) {
    setClassFilter((current) => (current === token ? "" : token));
    setGroupBy("overall");
  }

  function openPlayer(name: string) {
    setSelectedName(name);
    setTab("board");
    setGroupBy("overall");
  }

  function handleRow(row: BoardRow) {
    if (row.kind === "player") {
      setSelectedName(row.name);
      return;
    }
    if (groupBy === "class") {
      setClassFilter(row.className);
      setGroupBy("overall");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={tab === "board"} onClick={() => setTab("board")}>
          Leaderboard
        </Chip>
        <Chip active={tab === "recent"} onClick={() => setTab("recent")}>
          Recent matches
        </Chip>
      </div>

      {tab === "board" ? (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="min-w-[12rem] flex-1 text-xs uppercase tracking-[0.16em] text-[var(--gold)]">
              Search
              <input
                className="tavern-input mt-1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, class, race, guild"
                maxLength={40}
              />
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Group by</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Chip active={groupBy === "overall"} onClick={() => setGroupBy("overall")}>
                  Overall
                </Chip>
                <Chip active={groupBy === "class"} onClick={() => setGroupBy("class")}>
                  Class
                </Chip>
                {hasRace ? (
                  <Chip active={groupBy === "race"} onClick={() => setGroupBy("race")}>
                    Race
                  </Chip>
                ) : null}
                {hasGuild ? (
                  <Chip active={groupBy === "guild"} onClick={() => setGroupBy("guild")}>
                    Guild
                  </Chip>
                ) : null}
              </div>
            </div>
          </div>

          {classChips.length > 0 && groupBy === "overall" ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={!classFilter} onClick={() => setClassFilter("")}>
                All
              </Chip>
              {classChips.map((chip) => (
                <Chip key={chip.token} active={classFilter === chip.token} onClick={() => toggleClass(chip.token)}>
                  <span style={{ color: classColor(chip.token) }}>{formatClassName(chip.token)}</span>
                </Chip>
              ))}
            </div>
          ) : null}

          <p className="mb-4 text-sm text-[var(--muted)]">
            {storedMatches} stored matches · {pending} pending confirmation · {players.length} players
            {rows.length !== players.length && groupBy === "overall" ? ` · showing ${rows.length}` : ""}
          </p>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="tavern-frame overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#1b140f] text-[var(--gold)]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">
                      <SortButton active={sort === "name"} onClick={() => setSort("name")}>
                        {groupBy === "overall" ? "Name" : "Group"}
                      </SortButton>
                    </th>
                    {groupBy === "overall" ? <th className="px-4 py-3">Rank</th> : null}
                    {groupBy === "overall" ? <th className="px-4 py-3">Class</th> : null}
                    {groupBy === "overall" && hasRace ? <th className="px-4 py-3">Race</th> : null}
                    {groupBy === "overall" && hasGuild ? <th className="px-4 py-3">Guild</th> : null}
                    {groupBy !== "overall" ? <th className="px-4 py-3">Players</th> : null}
                    <th className="px-4 py-3">Record</th>
                    <th className="px-4 py-3">
                      <SortButton active={sort === "winRate"} onClick={() => setSort("winRate")}>
                        Win%
                      </SortButton>
                    </th>
                    {groupBy === "overall" ? (
                      <th className="px-4 py-3">
                        <SortButton active={sort === "peak"} onClick={() => setSort("peak")}>
                          Peak
                        </SortButton>
                      </th>
                    ) : null}
                    <th className="px-4 py-3">
                      <SortButton active={sort === "rating"} onClick={() => setSort("rating")}>
                        Rating
                      </SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[var(--muted)]" colSpan={9}>
                        {players.length === 0 ? "No confirmed matches yet." : "No players match those filters."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => {
                      const title = getArenaTitle(row.points, row.games);
                      const active = row.kind === "player" && namesEqual(row.name, selectedName);
                      return (
                        <tr
                          key={row.key}
                          className={`border-t border-[var(--line)] ${active ? "bg-[rgba(80,50,16,0.35)]" : ""}`}
                        >
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="ladder-name"
                              onClick={() => handleRow(row)}
                              style={row.className ? { color: classColor(row.className) } : undefined}
                            >
                              {row.name}
                            </button>
                          </td>
                          {groupBy === "overall" ? (
                            <td className="px-4 py-2" style={{ color: title.color }}>
                              {title.name}
                            </td>
                          ) : null}
                          {groupBy === "overall" ? (
                            <td className="px-4 py-2 text-[var(--muted)]">
                              {formatClassName(row.className) || "—"}
                            </td>
                          ) : null}
                          {groupBy === "overall" && hasRace ? (
                            <td className="px-4 py-2 text-[var(--muted)]">{row.race || "—"}</td>
                          ) : null}
                          {groupBy === "overall" && hasGuild ? (
                            <td className="px-4 py-2 text-[var(--muted)]">{row.guild || "—"}</td>
                          ) : null}
                          {groupBy !== "overall" ? (
                            <td className="px-4 py-2 text-[var(--muted)]">{row.memberCount}</td>
                          ) : null}
                          <td className="px-4 py-2">
                            {row.wins}-{row.losses}
                          </td>
                          <td className="px-4 py-2 text-[var(--muted)]">{formatWinRate(row.winRate, row.games)}</td>
                          {groupBy === "overall" ? (
                            <td className="px-4 py-2 text-[var(--muted)]">{row.peak.toFixed(0)}</td>
                          ) : null}
                          <td className="px-4 py-2 text-[var(--gold)]">{row.points.toFixed(0)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PlayerCard
              player={selected}
              matches={selectedMatches}
              form={selected ? playerForm(matches, selected.name) : "—"}
              streak={selected ? playerStreak(matches, selected.name) : "—"}
              standing={
                selected ? rows.findIndex((row) => row.kind === "player" && namesEqual(row.name, selected.name)) + 1 : 0
              }
              onClose={() => setSelectedName("")}
            />
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Latest confirmed rated duels. Click a name for that player&apos;s card.
          </p>
          <div className="tavern-frame divide-y divide-[var(--line)]">
            {recents.length === 0 ? (
              <p className="px-4 py-6 text-[var(--muted)]">No confirmed matches yet.</p>
            ) : (
              recents.map((match) => {
                const open = expandedMatch === match.matchId;
                return (
                  <div key={match.matchId}>
                    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                      <button
                        type="button"
                        className="ladder-name w-28 text-[var(--muted)]"
                        onClick={() => setExpandedMatch(open ? "" : match.matchId)}
                      >
                        {open ? "▾ " : "▸ "}
                        {formatMatchTime(match.timestamp) || "—"}
                      </button>
                      <span>
                        <button
                          type="button"
                          className="ladder-name"
                          style={{ color: classColor(match.winnerClass) }}
                          onClick={() => openPlayer(match.winner)}
                        >
                          {match.winner}
                        </button>
                        <span className="text-[var(--muted)]"> defeated </span>
                        <button
                          type="button"
                          className="ladder-name"
                          style={{ color: classColor(match.loserClass) }}
                          onClick={() => openPlayer(match.loser)}
                        >
                          {match.loser}
                        </button>
                      </span>
                      <span className="ml-auto text-[var(--gold)]">{formatDelta(match.winnerDelta)}</span>
                    </div>
                    {open ? (
                      <div className="space-y-1 px-4 pb-3 text-sm text-[var(--muted)]">
                        <p>
                          Win {match.winner}{" "}
                          <span className="text-[#7dcea0]">{formatDelta(match.winnerDelta)}</span>
                        </p>
                        <p>
                          Loss {match.loser}{" "}
                          <span className="text-[#e07a7a]">{formatDelta(match.loserDelta)}</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  matches,
  form,
  streak,
  standing,
  onClose,
}: {
  player?: LadderPlayer;
  matches: BoardMatch[];
  form: string;
  streak: string;
  standing: number;
  onClose: () => void;
}) {
  if (!player) {
    return (
      <aside className="tavern-frame hidden p-5 text-sm text-[var(--muted)] lg:block">
        Click a name to open that player&apos;s card — rating, recent, streak, and last duels.
      </aside>
    );
  }
  const title = getArenaTitle(player.points, player.games);
  return (
    <aside className="tavern-frame p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="tavern-title text-xl" style={{ color: classColor(player.className) }}>
            {player.name}
          </h2>
          <p className="mt-1 text-sm" style={{ color: title.color }}>
            {title.name}
            {standing > 0 ? ` · #${standing}` : ""}
          </p>
        </div>
        <button type="button" className="tavern-btn-ghost px-2 py-1 text-xs" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="text-sm text-[var(--muted)]">
        {[formatClassName(player.className), player.race, player.guild].filter(Boolean).join(" · ") || "—"}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Rating" value={player.points.toFixed(0)} />
        <Stat label="Peak" value={player.peak.toFixed(0)} />
        <Stat label="Record" value={`${player.wins}-${player.losses}`} />
        <Stat label="Win%" value={formatWinRate(player.wins / Math.max(player.games, 1), player.games)} />
        <Stat label="Recent" value={form} />
        <Stat label="Streak" value={streak} />
      </dl>
      <h3 className="mt-5 text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Recent duels</h3>
      {matches.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">No confirmed matches yet.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {matches.map((match) => {
            const won = namesEqual(match.winner, player.name);
            const opponent = won ? match.loser : match.winner;
            const opponentClass = won ? match.loserClass : match.winnerClass;
            const delta = won ? match.winnerDelta : match.loserDelta;
            return (
              <li key={match.matchId} className="flex justify-between gap-3">
                <span>
                  <span className={won ? "text-[#7dcea0]" : "text-[#e07a7a]"}>{won ? "W" : "L"}</span>{" "}
                  <span style={{ color: classColor(opponentClass) }}>{opponent}</span>
                </span>
                <span className="text-[var(--muted)]">{formatDelta(delta)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`ladder-chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`ladder-sort ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
      {active ? " ▾" : ""}
    </button>
  );
}
