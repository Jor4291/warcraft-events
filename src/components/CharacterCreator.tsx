"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CLASS_ICONS,
  CLASS_ORDER,
  CLASSES,
  RACES,
  buildSummary,
  classNote,
  raceById,
  raceInitials,
  raceLabel,
  rollName,
  validateCharacterName,
  type ClassId,
  type Faction,
  type Race,
  type Racial,
} from "@/lib/forever-creator";

type ModalId = "summary" | "matrix";

function ClassIcon({ id, size }: { id: ClassId; size?: "sm" | "md" }) {
  return (
    <span
      className={size ? `cc-cicon cc-cicon-${size}` : "cc-cicon"}
      style={{ background: CLASSES[id].color }}
      dangerouslySetInnerHTML={{ __html: CLASS_ICONS[id] }}
    />
  );
}

function FactionCrest({ faction }: { faction: Faction }) {
  if (faction === "alliance") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="ccAlliance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d74d6" />
            <stop offset="1" stopColor="#12264d" />
          </linearGradient>
        </defs>
        <path
          d="M24 3 L41 8.5 V22 C41 33.5 33.5 40.5 24 45 C14.5 40.5 7 33.5 7 22 V8.5 Z"
          fill="url(#ccAlliance)"
          stroke="#e6c36a"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M24 9.5 L35 13 V22 C35 30 30 35 24 38.5 C18 35 13 30 13 22 V13 Z"
          fill="none"
          stroke="#e6c36a"
          strokeWidth="1"
          opacity=".55"
        />
        <path d="M24 13 L26.6 21.4 L35 24 L26.6 26.6 L24 35 L21.4 26.6 L13 24 L21.4 21.4 Z" fill="#e6c36a" />
        <circle cx="24" cy="24" r="2.2" fill="#12264d" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="ccHorde" cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#c8321f" />
          <stop offset="1" stopColor="#4a0e09" />
        </radialGradient>
      </defs>
      <path
        d="M24 2 L28 7 L35 4.5 L36 11.5 L43 13 L40 19.5 L45.5 24 L40 28.5 L43 35 L36 36.5 L35 43.5 L28 41 L24 46 L20 41 L13 43.5 L12 36.5 L5 35 L8 28.5 L2.5 24 L8 19.5 L5 13 L12 11.5 L13 4.5 L20 7 Z"
        fill="#2a0805"
        stroke="#e6c36a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="14.5" fill="url(#ccHorde)" stroke="#e6c36a" strokeWidth="1.6" />
      <path d="M24 13 V36" stroke="#e6c36a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 15 C16 13 13.5 18.5 14.5 25 C17.5 22.5 20.5 22 23 23.5 Z" fill="#e6c36a" />
      <path d="M25 15 C32 13 34.5 18.5 33.5 25 C30.5 22.5 27.5 22 25 23.5 Z" fill="#e6c36a" />
    </svg>
  );
}

function RacialCard({ racial, classId }: { racial: Racial; classId: ClassId }) {
  const note = classNote(racial, classId);
  return (
    <article className={racial.change ? "cc-racial is-changed" : "cc-racial"}>
      <div className="cc-racial-head">
        <span className="cc-racial-title">{racial.name}</span>
        <span>
          {racial.change ? <span className="cc-badge cc-badge-changed">Changed</span> : null}{" "}
          <span className={racial.type === "active" ? "cc-badge cc-badge-active" : "cc-badge cc-badge-passive"}>
            {racial.type}
          </span>
        </span>
      </div>
      <div className="cc-cd">{racial.cd ?? "Passive"}</div>
      <p className="cc-desc">{racial.text}</p>
      {racial.change ? <p className="cc-note cc-note-change">{racial.change}</p> : null}
      {note ? (
        <p className={typeof note === "object" ? "cc-note cc-note-class is-muted" : "cc-note cc-note-class"}>
          {typeof note === "object" ? note.text : note}
        </p>
      ) : null}
    </article>
  );
}

export function CharacterCreator() {
  const [faction, setFaction] = useState<Faction>("alliance");
  const [raceId, setRaceId] = useState("human");
  const [classId, setClassId] = useState<ClassId>("warrior");
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [modal, setModal] = useState<ModalId | null>(null);
  const [summary, setSummary] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy to Clipboard");
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const summaryTitleId = useId();
  const matrixTitleId = useId();

  const race = raceById(raceId);
  const wowClass = CLASSES[classId];
  const factionRaces = RACES.filter((item) => item.faction === faction);
  const comboIsNew = race.newClasses.includes(classId);

  useEffect(() => {
    return () => window.clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    if (!modal) {
      return;
    }
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModal(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  function chooseFaction(next: Faction) {
    if (next === faction) {
      return;
    }
    const races = RACES.filter((item) => item.faction === next);
    const keep = races.find((item) => item.classes.includes(classId)) ?? races[0];
    if (!keep) {
      return;
    }
    setFaction(next);
    setRaceId(keep.id);
    if (!keep.classes.includes(classId)) {
      setClassId(keep.classes[0]);
    }
  }

  function chooseRace(next: Race) {
    setFaction(next.faction);
    setRaceId(next.id);
    if (!next.classes.includes(classId)) {
      setClassId(next.classes[0]);
    }
  }

  function randomize() {
    const next = RACES[Math.floor(Math.random() * RACES.length)];
    if (!next) {
      return;
    }
    const nextClass = next.classes[Math.floor(Math.random() * next.classes.length)];
    if (!nextClass) {
      return;
    }
    setFaction(next.faction);
    setRaceId(next.id);
    setClassId(nextClass);
    setName(rollName(next.faction));
    setNameMsg("");
  }

  function rollCurrentName() {
    setName(rollName(faction));
    setNameMsg("");
  }

  function onNameChange(value: string) {
    setName(value);
    setNameMsg(validateCharacterName(value).message);
  }

  function createCharacter() {
    const result = validateCharacterName(name);
    setNameMsg(result.message);
    if (!result.ok) {
      nameRef.current?.focus();
      return;
    }
    setSummary(buildSummary(race, classId, name));
    setCopyLabel("Copy to Clipboard");
    setModal("summary");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyLabel("Copy to Clipboard"), 1500);
  }

  const activeRacials = race.racials.filter((item) => item.type === "active");
  const passiveRacials = race.racials.filter((item) => item.type === "passive");
  const sameFactionClasses = RACES.filter((item) => item.faction === faction && item.classes.includes(classId)).map(
    raceLabel,
  );

  const dialog =
    modal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="cc-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setModal(null);
              }
            }}
          >
            <div
              ref={dialogRef}
              className="tavern-frame cc-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={modal === "summary" ? summaryTitleId : matrixTitleId}
              tabIndex={-1}
            >
              {modal === "summary" ? (
                <>
                  <h2 id={summaryTitleId} className="tavern-title cc-modal-title">
                    Character Ready
                  </h2>
                  <pre className="cc-summary">{summary}</pre>
                  <div className="cc-modal-actions">
                    <button type="button" className="tavern-btn-ghost" onClick={copySummary}>
                      {copyLabel}
                    </button>
                    <button type="button" className="tavern-btn" onClick={() => setModal(null)}>
                      Back
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 id={matrixTitleId} className="tavern-title cc-modal-title">
                    Race / Class Combinations
                  </h2>
                  <div className="cc-matrix-wrap">
                    <table className="cc-matrix">
                      <thead>
                        <tr>
                          <th />
                          {CLASS_ORDER.map((id) => (
                            <th key={id} style={{ color: CLASSES[id].color }}>
                              {CLASSES[id].name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(["alliance", "horde"] as const).map((side) => (
                          <FactionRows
                            key={side}
                            faction={side}
                            currentRaceId={raceId}
                            onPick={(next) => {
                              chooseRace(next);
                              setModal(null);
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="cc-matrix-key">
                    ✓ available since Classic · <span className="cc-new-mark">NEW</span> new in Forever · click a row to
                    select that race
                  </p>
                  <div className="cc-modal-actions">
                    <button type="button" className="tavern-btn" onClick={() => setModal(null)}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={faction === "horde" ? "character-creator is-horde" : "character-creator"}>
      <div className="cc-factions" role="tablist" aria-label="Faction">
        {(["alliance", "horde"] as const).map((side) => (
          <button
            key={side}
            type="button"
            className="cc-faction-btn"
            data-faction={side}
            role="tab"
            aria-selected={faction === side}
            onClick={() => chooseFaction(side)}
          >
            <span className="cc-crest">
              <FactionCrest faction={side} />
            </span>
            <span className="cc-faction-label">{side === "alliance" ? "Alliance" : "Horde"}</span>
          </button>
        ))}
      </div>

      <div className="cc-layout">
        <section className="tavern-frame cc-panel" aria-label="Race">
          <h2 className="cc-panel-title">Race</h2>
          <div className="cc-race-list">
            {factionRaces.map((item) => {
              const canPlay = item.classes.includes(classId);
              const active = item.id === raceId;
              const raceClass = ["cc-race-btn", active ? "is-active" : "", canPlay ? "" : "is-illegal"]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={item.id}
                  type="button"
                  className={raceClass}
                  title={canPlay ? raceLabel(item) : `${raceLabel(item)} cannot be a ${wowClass.name}`}
                  onClick={() => chooseRace(item)}
                >
                  <span className="cc-monogram">{raceInitials(item)}</span>
                  <span>
                    <span className="cc-race-name">{item.name}</span>
                    {item.newRace ? <span className="cc-badge cc-badge-new">New</span> : null}
                    <br />
                    <span className="cc-race-sub">
                      {item.sub ? `${item.sub} · ` : ""}
                      {item.classes.length} classes
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="tavern-frame cc-panel cc-info" aria-live="polite">
          <div className="cc-info-head">
            <span className="cc-monogram cc-monogram-lg">{raceInitials(race)}</span>
            <div>
              <h2 className="cc-race-heading">
                {race.name}
                {race.sub ? <span className="cc-race-subname">{race.sub}</span> : null}
              </h2>
              <p className="cc-meta">
                {race.faction === "alliance" ? "Alliance" : "Horde"} · Homeland: {race.home}
                {race.newRace ? (
                  <>
                    {" "}
                    · <span className="cc-badge cc-badge-new">New race</span>
                  </>
                ) : null}
                {race.pack ? (
                  <>
                    {" "}
                    <span className="cc-badge cc-badge-pack" title="Skyborne access requires the Heroic pack or higher">
                      Upgrade pack
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <p className="cc-lore">{race.lore}</p>
          <div className="cc-combo">
            <span className="cc-combo-race">{raceLabel(race)}</span>
            <ClassIcon id={classId} size="sm" />
            <span style={{ color: wowClass.color }}>{wowClass.name}</span>
            {comboIsNew ? <span className="cc-badge cc-badge-new">New in Forever</span> : null}
          </div>
          <h3 className="cc-section-label">Racial abilities</h3>
          <div className="cc-racials">
            {activeRacials.map((item) => (
              <RacialCard key={item.name} racial={item} classId={classId} />
            ))}
          </div>
          <h3 className="cc-section-label">Racial traits</h3>
          <div className="cc-racials">
            {passiveRacials.map((item) => (
              <RacialCard key={item.name} racial={item} classId={classId} />
            ))}
          </div>
        </section>

        <section className="tavern-frame cc-panel" aria-label="Class">
          <h2 className="cc-panel-title">Class</h2>
          <div className="cc-class-grid">
            {CLASS_ORDER.map((id) => {
              const item = CLASSES[id];
              const ok = race.classes.includes(id);
              const isNew = race.newClasses.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={id === classId ? "cc-class-btn is-active" : "cc-class-btn"}
                  disabled={!ok}
                  title={ok ? (isNew ? `${item.name} (new combination in Forever)` : item.name) : `${raceLabel(race)} cannot be a ${item.name}`}
                  onClick={() => setClassId(id)}
                >
                  {ok && isNew ? <span className="cc-badge cc-badge-new">New</span> : null}
                  <ClassIcon id={id} />
                  <span className="cc-class-name" style={{ color: ok ? item.color : undefined }}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cc-class-info">
            <h3 style={{ color: wowClass.color }}>
              <ClassIcon id={classId} size="md" />
              {wowClass.name}
            </h3>
            <div className="cc-chips">
              {wowClass.roles.map((role) => (
                <span key={role} className="cc-chip">
                  {role}
                </span>
              ))}
              <span className="cc-chip">{wowClass.resource}</span>
            </div>
            <p>{wowClass.blurb}</p>
            <p className="cc-avail">
              {faction === "alliance" ? "Alliance" : "Horde"} races: <b>{sameFactionClasses.join(", ")}</b>
            </p>
          </div>
        </section>
      </div>

      <div className="cc-bottom">
        <div className="cc-bottom-group">
          <button type="button" className="tavern-btn-ghost" onClick={randomize}>
            Randomize
          </button>
          <button type="button" className="tavern-btn-ghost" onClick={() => setModal("matrix")}>
            View all race / class combinations
          </button>
        </div>
        <div className="cc-bottom-group">
          <div className="cc-name">
            <input
              ref={nameRef}
              className="tavern-input cc-name-input"
              maxLength={12}
              placeholder="Name"
              autoComplete="off"
              spellCheck={false}
              value={name}
              aria-label="Character name"
              onChange={(event) => onNameChange(event.target.value)}
            />
            <div className="cc-name-msg" aria-live="polite">
              {nameMsg}
            </div>
          </div>
          <button type="button" className="tavern-btn-ghost" title="Random name" onClick={rollCurrentName}>
            Roll name
          </button>
          <button type="button" className="tavern-btn cc-create" onClick={createCharacter}>
            Create Character
          </button>
        </div>
      </div>

      <p className="cc-credits">
        Sources:{" "}
        <a
          href="https://www.wowhead.com/blue-tracker/topic/us/wow-forever-beta-development-notes-updated-october-26-2360696"
          target="_blank"
          rel="noopener noreferrer"
        >
          Blizzard dev notes (Oct 26)
        </a>
        {" · "}
        <a href="https://wowf.io/en/races" target="_blank" rel="noopener noreferrer">
          wowf.io race data
        </a>
        . Beta data, subject to change at launch (Nov 4). Unofficial fan tool.
      </p>
      {dialog}
    </div>
  );
}

function FactionRows({
  faction,
  currentRaceId,
  onPick,
}: {
  faction: Faction;
  currentRaceId: string;
  onPick: (race: Race) => void;
}) {
  const races = RACES.filter((item) => item.faction === faction);
  return (
    <>
      <tr className="cc-matrix-faction">
        <td colSpan={CLASS_ORDER.length + 1}>{faction === "alliance" ? "Alliance" : "Horde"}</td>
      </tr>
      {races.map((item) => (
        <tr
          key={item.id}
          className={item.id === currentRaceId ? "is-current" : undefined}
          tabIndex={0}
          onClick={() => onPick(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onPick(item);
            }
          }}
        >
          <td className="cc-matrix-race">{raceLabel(item)}</td>
          {CLASS_ORDER.map((id) => {
            if (!item.classes.includes(id)) {
              return (
                <td key={id} className="is-no">
                  ·
                </td>
              );
            }
            if (item.newClasses.includes(id)) {
              return (
                <td key={id} className="is-new">
                  NEW
                </td>
              );
            }
            return (
              <td key={id} className="is-yes">
                ✓
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
