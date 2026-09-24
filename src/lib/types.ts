export type EventStatus = "pending" | "published" | "rejected";
export type EventKind = "calendar" | "bracket";
export type SignupMode = "open" | "invite";

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

export type SignupFieldType = "short" | "long" | "choice";

export type SignupField = {
  id: string;
  label: string;
  type: SignupFieldType;
  required: boolean;
  options: string[];
};

export type EventSignup = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  answers: Record<string, string>;
  waitlisted: boolean;
  checkedIn: boolean;
};

export type EventCoHost = {
  userId: string;
  email: string;
  displayName: string;
};

export type EventLink = {
  label: string;
  url: string;
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
  links: EventLink[];
  contact: string;
  status: EventStatus;
  kind: EventKind;
  ownerId: string;
  signupMode: SignupMode;
  inviteCode: string;
  signupCap: number;
  signupFields: SignupField[];
  waitlistEnabled: boolean;
  rosterPublic: boolean;
  coHosts: EventCoHost[];
  signups: EventSignup[];
  cancelledAt: string;
  editKey: string;
  whiteboard: string;
  teams: string[];
  rounds: BracketRound[];
  threadSlug: string;
  createdAt: string;
};

export type PlayerNoticeKind = "signup" | "waitlist" | "promoted" | "cancelled" | "removed" | "starts_soon";

export type PlayerNotice = {
  id: string;
  kind: PlayerNoticeKind;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  createdAt: string;
  readAt: string;
};

export type SanctionKind = "mute" | "timeout" | "ban";

export type UserSanction = {
  id: string;
  kind: SanctionKind;
  reason: string;
  by: string;
  createdAt: string;
  expiresAt: string;
  liftedAt: string;
};

export type UserRestriction = {
  kind: SanctionKind;
  reason: string;
  expiresAt: string;
};

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  uploadTokenHash: string;
  isHub: boolean;
  notifications: PlayerNotice[];
  seenSoonIds: string[];
  sanctions: UserSanction[];
  createdAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  isHub: boolean;
  isInnkeeper: boolean;
  hasUploadToken: boolean;
  restriction: UserRestriction | null;
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
  deniedAt: string;
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

export type ForumPost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  hiddenAt: string;
};

export type ForumThread = {
  id: string;
  slug: string;
  forumId: string;
  eventSlug: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  lockedAt: string;
  hiddenAt: string;
  posts: ForumPost[];
};

export type StoreData = {
  events: EventRecord[];
  matches: LadderMatch[];
  players: LadderPlayer[];
  users: UserRecord[];
  threads: ForumThread[];
};
