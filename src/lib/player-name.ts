/** WoW character names cannot contain "-"; anything after the first hyphen is the realm. */
export function characterName(name: string) {
  const trimmed = name.trim();
  const dash = trimmed.indexOf("-");
  if (dash <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, dash).trim();
}

export function canonicalPlayerName(name: string) {
  return characterName(name).toLowerCase();
}

export function namesEqual(a: string, b: string) {
  const left = canonicalPlayerName(a);
  return left !== "" && left === canonicalPlayerName(b);
}

export function canonicalizeMatchId(matchId: string) {
  const parts = matchId.split("|");
  if (parts.length < 4) {
    return matchId;
  }
  const [rawA, rawB, mode, ...rest] = parts;
  const a = canonicalPlayerName(rawA) || rawA.trim().toLowerCase();
  const b = canonicalPlayerName(rawB) || rawB.trim().toLowerCase();
  const [left, right] = a <= b ? [a, b] : [b, a];
  return [left, right, mode, ...rest].join("|");
}
