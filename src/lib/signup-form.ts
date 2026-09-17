import type { EventRecord, EventSignup, SignupField, SignupFieldType } from "./types";

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
  };
}

export function eventIsFull(event: Pick<EventRecord, "signupCap" | "signups">): boolean {
  return event.signupCap > 0 && event.signups.length >= event.signupCap;
}

export function signupSpotsLabel(count: number, cap: number) {
  if (cap <= 0) {
    return count === 1 ? "1 signed up" : `${count} signed up`;
  }
  if (count >= cap) {
    return `Full · ${cap}/${cap}`;
  }
  return `${count}/${cap} signed up`;
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
    if (raw) {
      answers[field.id] = raw;
    }
  }
  return { answers };
}

export function rosterExport(event: EventRecord) {
  const headers = ["Name", ...event.signupFields.map((field) => field.label)];
  const rows = event.signups.map((signup) => [
    signup.name,
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
