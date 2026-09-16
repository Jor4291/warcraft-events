export const CLASS_ORDER = [
  "WARRIOR",
  "PALADIN",
  "HUNTER",
  "ROGUE",
  "PRIEST",
  "SHAMAN",
  "MAGE",
  "WARLOCK",
  "DRUID",
  "DEATHKNIGHT",
  "MONK",
  "DEMONHUNTER",
  "EVOKER",
] as const;

const CLASS_COLORS: Record<string, string> = {
  WARRIOR: "#C79C6E",
  PALADIN: "#F58CBA",
  HUNTER: "#ABD473",
  ROGUE: "#FFF569",
  PRIEST: "#FFFFFF",
  DEATHKNIGHT: "#C41E3A",
  SHAMAN: "#0070DE",
  MAGE: "#69CCF0",
  WARLOCK: "#9482C9",
  MONK: "#00FF96",
  DRUID: "#FF7D0A",
  DEMONHUNTER: "#A330C9",
  EVOKER: "#33937F",
};

const CLASS_LABELS: Record<string, string> = {
  DEATHKNIGHT: "Death Knight",
  DEMONHUNTER: "Demon Hunter",
};

const TITLES = [
  { minGames: 0, rating: 0, key: "unranked", name: "Unranked", color: "#9e9e9e" },
  { minGames: 3, rating: 0, key: "combatant", name: "Combatant", color: "#33cc66" },
  { minGames: 3, rating: 1600, key: "challenger", name: "Challenger", color: "#59b3ff" },
  { minGames: 3, rating: 1750, key: "rival", name: "Rival", color: "#b873ff" },
  { minGames: 3, rating: 1900, key: "duelist", name: "Duelist", color: "#ffd133" },
  { minGames: 3, rating: 2100, key: "gladiator", name: "Gladiator", color: "#ff801a" },
  { minGames: 3, rating: 2300, key: "legend", name: "Legend", color: "#ff3333" },
] as const;

export function classToken(value: string) {
  return value.trim().toUpperCase().replace(/[\s_-]+/g, "");
}

export function formatClassName(value: string) {
  const token = classToken(value);
  if (!token) {
    return "";
  }
  if (CLASS_LABELS[token]) {
    return CLASS_LABELS[token];
  }
  const trimmed = value.trim();
  return trimmed
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function classColor(value: string) {
  return CLASS_COLORS[classToken(value)] || "var(--foreground)";
}

export function getArenaTitle(rating: number, games: number, minRatedGames = 3) {
  let found = TITLES[0];
  for (const title of TITLES) {
    const needGames = title.key === "unranked" ? title.minGames : Math.max(title.minGames, minRatedGames);
    if (games >= needGames && rating >= title.rating) {
      found = title;
    }
  }
  return found;
}
