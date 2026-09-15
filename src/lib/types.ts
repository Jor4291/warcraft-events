export type EventStatus = "pending" | "published" | "rejected";

export type BracketMatch = {
  id: string;
  playerA: string;
  playerB: string;
  winner: string;
};

export type BracketRound = {
  name: string;
  matches: BracketMatch[];
};

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  game: string;
  format: string;
  startsAt: string;
  endsAt: string;
  region: string;
  location: string;
  description: string;
  contact: string;
  status: EventStatus;
  editKey: string;
  whiteboard: string;
  teams: string[];
  rounds: BracketRound[];
  createdAt: string;
};

export type MatchReport = {
  reporter: string;
  hub: boolean;
  exportedAt: number;
};

export type LadderMatch = {
  matchId: string;
  timestamp: number;
  winner: string;
  loser: string;
  winnerClass: string;
  winnerSpec: string;
  loserClass: string;
  loserSpec: string;
  bracket: string;
  seasonId: number;
  winnerDelta: number;
  loserDelta: number;
  expectedWinner: number;
  confirmed: boolean;
  reports: MatchReport[];
};

export type LadderPlayer = {
  name: string;
  className: string;
  spec: string;
  race: string;
  guild: string;
  points: number;
  peak: number;
  wins: number;
  losses: number;
  games: number;
};

export type StoreData = {
  events: EventRecord[];
  matches: LadderMatch[];
  players: LadderPlayer[];
};
