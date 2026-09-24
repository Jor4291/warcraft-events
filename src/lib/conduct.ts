export const CONDUCT_MESSAGE = "That wording is not welcome in the tavern. Change it and try again.";
export const HIDDEN_NAME = "Hidden name";

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

/** Long enough to match inside a mashed character name. */
const LONG_TERMS = [
  "nigger",
  "niggers",
  "nigga",
  "niggaz",
  "faggot",
  "faggots",
  "retard",
  "retards",
  "retarded",
  "tranny",
  "trannies",
  "wetback",
  "raghead",
];

/** Short slurs — only as their own token, so "spicy", "raccoon", and "therapist" stay clean. */
const SHORT_TERMS = ["kike", "spic", "fag", "coon", "gook", "kyke", "chink", "troon", "rapist"];

function fold(value: string) {
  const lowered = value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  let out = "";
  for (const ch of lowered) {
    if (LEET[ch]) {
      out += LEET[ch];
    } else if (ch >= "a" && ch <= "z") {
      out += ch;
    }
  }
  return out;
}

function tokens(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .map(fold)
    .filter(Boolean);
}

export function isBlocked(value: string) {
  if (!value) {
    return false;
  }
  const collapsed = fold(value);
  const parts = tokens(value);
  if (!collapsed) {
    return false;
  }
  for (const term of LONG_TERMS) {
    if (collapsed.includes(term) || parts.some((part) => part.includes(term))) {
      return true;
    }
  }
  for (const term of SHORT_TERMS) {
    if (collapsed === term || parts.includes(term)) {
      return true;
    }
  }
  return false;
}

export function conductBlock(...parts: string[]) {
  return parts.some((part) => isBlocked(part)) ? CONDUCT_MESSAGE : "";
}

function termPattern(term: string) {
  const chars = term.split("");
  return new RegExp(
    chars.map((ch, index) => (index === chars.length - 1 ? ch : `${ch}[\\W_]*`)).join(""),
    "gi",
  );
}

export function maskBlocked(value: string) {
  if (!value || !isBlocked(value)) {
    return value;
  }
  let next = value;
  for (const term of [...LONG_TERMS, ...SHORT_TERMS]) {
    next = next.replace(termPattern(term), "****");
  }
  return next === value ? HIDDEN_NAME : next;
}

export function publicName(value: string, innkeeper = false) {
  if (innkeeper || !isBlocked(value)) {
    return value;
  }
  return HIDDEN_NAME;
}

export function publicText(value: string, innkeeper = false) {
  if (innkeeper || !value) {
    return value;
  }
  return maskBlocked(value);
}

export function publicBracketRounds<T extends { name: string; matches: { playerA: string; playerB: string; winner: string }[] }>(
  rounds: T[],
  innkeeper = false,
) {
  if (innkeeper) {
    return rounds;
  }
  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({
      ...match,
      playerA: publicName(match.playerA),
      playerB: publicName(match.playerB),
      winner: publicName(match.winner),
    })),
  }));
}
