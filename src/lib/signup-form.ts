import { conductBlock } from "./conduct";
import type { EventCoHost, EventRecord, EventSignup, SignupField, SignupFieldType } from "./types";

const FIELD_TYPES: SignupFieldType[] = ["short", "long", "choice"];
const MAX_FIELDS = 12;
const MAX_OPTIONS = 12;
const MAX_LABEL = 80;
const MAX_SHORT = 200;
const MAX_LONG = 1000;

export function normalizeSignupFields(raw: unknown): SignupField[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const fields: SignupField[] = [];
  for (const item of raw.slice(0, MAX_FIELDS)) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Partial<SignupField>;
    const type: SignupFieldType = FIELD_TYPES.includes(row.type as SignupFieldType)
      ? (row.type as SignupFieldType)
      : "short";
    const label = String(row.label || "")
      .trim()
      .slice(0, MAX_LABEL);
    if (!label) {
      continue;
    }
    const options =
      type === "choice"
        ? uniqueOptions(Array.isArray(row.options) ? row.options : [])
        : [];
    if (type === "choice" && options.length < 2) {
      continue;
    }
    fields.push({
      id: String(row.id || "").trim() || `field-${fields.length + 1}`,
      label,
      type,
      required: Boolean(row.required),
      options,
    });
  }
  return fields;
}

export function parseSignupFieldsJson(value: FormDataEntryValue | null): SignupField[] {
  try {
    return normalizeSignupFields(JSON.parse(String(value || "[]")));
  } catch {
    return [];
  }
}

export function parseSignupCap(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return 0;
  }
  const next = Number.parseInt(raw, 10);
  if (!Number.isFinite(next) || next < 0) {
    return 0;
  }
  return Math.min(next, 1000);
}

export function normalizeSignupAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      answers[key] = value.trim();
    }
  }
  return answers;
}

export function normalizeEventSignup(signup: EventSignup): EventSignup {
  return {
    ...signup,
    answers: normalizeSignupAnswers(signup.answers),
    waitlisted: Boolean(signup.waitlisted),
    checkedIn: Boolean(signup.checkedIn),
  };
}

export function normalizeCoHosts(raw: unknown): EventCoHost[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const hosts: EventCoHost[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Partial<EventCoHost>;
    const userId = String(row.userId || "").trim();
    if (!userId || hosts.some((host) => host.userId === userId)) {
      continue;
    }
    hosts.push({
      userId,
      email: String(row.email || "").trim(),
      displayName: String(row.displayName || "").trim() || "Co-host",
    });
  }
  return hosts;
}

export function confirmedSignups(event: Pick<EventRecord, "signups">) {
  return (event.signups ?? []).filter((signup) => !signup.waitlisted);
}

export function waitlistedSignups(event: Pick<EventRecord, "signups">) {
  return (event.signups ?? []).filter((signup) => signup.waitlisted);
}

export function eventIsFull(event: Pick<EventRecord, "signupCap" | "signups">): boolean {
  return event.signupCap > 0 && confirmedSignups(event).length >= event.signupCap;
}

export function formatSignupSpots(confirmed: number, cap: number, waiting = 0) {
  let label = "";
  if (cap <= 0) {
    label = confirmed === 1 ? "1 signed up" : `${confirmed} signed up`;
  } else if (confirmed >= cap) {
    label = `Full · ${cap}/${cap}`;
  } else {
    label = `${confirmed}/${cap} signed up`;
  }
  if (waiting > 0) {
    label += ` · ${waiting} waitlist`;
  }
  return label;
}

export function signupSpotsLabel(event: Pick<EventRecord, "signupCap" | "signups">) {
  return formatSignupSpots(confirmedSignups(event).length, event.signupCap, waitlistedSignups(event).length);
}

export function collectSignupAnswers(
  fields: SignupField[],
  formData: FormData,
): { answers: Record<string, string>; error?: string } {
  const answers: Record<string, string> = {};
  for (const field of fields) {
    const raw = String(formData.get(`answer-${field.id}`) || "").trim();
    if (field.required && !raw) {
      return { answers, error: `Please fill in: ${field.label}` };
    }
    if (field.type === "choice" && raw && !field.options.includes(raw)) {
      return { answers, error: `Pick a listed option for ${field.label}.` };
    }
    const max = field.type === "long" ? MAX_LONG : MAX_SHORT;
    if (raw.length > max) {
      return { answers, error: `${field.label} is too long.` };
    }
    const blocked = conductBlock(raw);
    if (blocked) {
      return { answers: { ...answers, [field.id]: raw }, error: blocked };
    }
    if (raw) {
      answers[field.id] = raw;
    }
  }
  return { answers };
}

export function rosterExport(event: EventRecord) {
  const headers = ["Name", "Status", "Checked in", ...event.signupFields.map((field) => field.label)];
  const rows = event.signups.map((signup) => [
    signup.name,
    signup.waitlisted ? "Waitlist" : "Roster",
    signup.checkedIn ? "Yes" : "",
    ...event.signupFields.map((field) => signup.answers[field.id] || ""),
  ]);
  return [headers, ...rows].map((row) => row.join("\t")).join("\n");
}

function uniqueOptions(values: unknown[]) {
  const options: string[] = [];
  for (const value of values) {
    const option = String(value || "")
      .trim()
      .slice(0, MAX_LABEL);
    if (option && !options.includes(option)) {
      options.push(option);
    }
    if (options.length >= MAX_OPTIONS) {
      break;
    }
  }
  return options;
}
