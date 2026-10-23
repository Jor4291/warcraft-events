import assert from "node:assert/strict";
import { test } from "node:test";
import { applyWinner, buildSingleElim, repairRounds } from "./brackets";

function namesIn(rounds: ReturnType<typeof buildSingleElim>, roundIndex: number) {
  return rounds[roundIndex].matches.flatMap((match) => [match.playerA, match.playerB, match.winner]);
}

test("three players only auto-advance the first-round bye", () => {
  const rounds = buildSingleElim(["A", "B", "C"]);
  assert.equal(rounds.length, 2);
  const opener = rounds[0].matches.find((match) => match.playerA === "A" || match.playerB === "A");
  assert.ok(opener);
  assert.equal(opener.winner, "A");
  assert.equal(rounds[1].matches[0].playerA === "A" || rounds[1].matches[0].playerB === "A", true);
  assert.equal(rounds[1].matches[0].winner, "");
  assert.ok(rounds[1].matches[0].playerA === "" || rounds[1].matches[0].playerB === "");
});

test("five players leave later rounds empty until someone wins", () => {
  const rounds = buildSingleElim(["A", "B", "C", "D", "E"]);
  assert.equal(rounds.length, 3);
  assert.ok(rounds[0].matches.some((match) => match.winner));
  assert.ok(rounds[1].matches.every((match) => !match.winner || (match.playerA && match.playerB)));
  assert.equal(rounds[2].matches[0].winner, "");
});

test("clicking a name advances them one round only", () => {
  const built = buildSingleElim(["A", "B", "C", "D"]);
  const first = built[0].matches[0];
  const winner = first.playerA;
  const next = applyWinner(built, first.id, winner);
  assert.equal(next[0].matches[0].winner, winner);
  const parent = next[1].matches[0];
  assert.equal(parent.playerA === winner || parent.playerB === winner, true);
  assert.equal(parent.winner, "");
  assert.equal(next[2]?.matches[0]?.winner || "", "");
});

test("clicking the current winner clears them from later rounds", () => {
  const built = buildSingleElim(["A", "B", "C", "D"]);
  const first = built[0].matches[0];
  const winner = first.playerA;
  const advanced = applyWinner(built, first.id, winner);
  const cleared = applyWinner(advanced, first.id, winner);
  assert.equal(cleared[0].matches[0].winner, "");
  assert.equal(namesIn(cleared, 1).includes(winner), false);
});

test("changing a winner removes the old name downstream", () => {
  const built = buildSingleElim(["A", "B", "C", "D"]);
  const first = built[0].matches[0];
  const second = built[0].matches[1];
  let next = applyWinner(built, first.id, first.playerA);
  next = applyWinner(next, second.id, second.playerA);
  next = applyWinner(next, next[1].matches[0].id, first.playerA);
  next = applyWinner(next, first.id, first.playerB);
  assert.equal(next[0].matches[0].winner, first.playerB);
  assert.equal(next[1].matches[0].winner, "");
  assert.equal(next[1].matches[0].playerA === first.playerA || next[1].matches[0].playerB === first.playerA, false);
});

test("repair strips auto-crowned later rounds from old boards", () => {
  const broken = [
    {
      name: "Semifinals",
      matches: [
        { id: "r1-m1", playerA: "A", playerB: "", winner: "A" },
        { id: "r1-m2", playerA: "B", playerB: "C", winner: "" },
      ],
    },
    {
      name: "Grand Final",
      matches: [{ id: "r2-m1", playerA: "A", playerB: "", winner: "A" }],
    },
  ];
  const fixed = repairRounds(broken);
  assert.equal(fixed[1].matches[0].winner, "");
  assert.equal(fixed[1].matches[0].playerA, "A");
  assert.equal(fixed[1].matches[0].playerB, "");
  assert.equal(fixed[0].matches[0].winner, "A");
});
