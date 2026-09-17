"use client";

import { useMemo, useState } from "react";
import type { SignupField, SignupFieldType } from "@/lib/types";

type DraftField = {
  key: string;
  id: string;
  label: string;
  type: SignupFieldType;
  required: boolean;
  optionsText: string;
};

export function SignupFormBuilder({
  initialFields,
  inputName = "signupFieldsJson",
}: {
  initialFields: SignupField[];
  inputName?: string;
}) {
  const [fields, setFields] = useState<DraftField[]>(() => initialFields.map(toDraft));
  const payload = useMemo(
    () =>
      JSON.stringify(
        fields.map((field) => ({
          id: field.id,
          label: field.label.trim(),
          type: field.type,
          required: field.required,
          options:
            field.type === "choice"
              ? field.optionsText
                  .split(/\r?\n|,/)
                  .map((option) => option.trim())
                  .filter(Boolean)
              : [],
        })),
      ),
    [fields],
  );

  function update(key: string, patch: Partial<DraftField>) {
    setFields((current) => current.map((field) => (field.key === key ? { ...field, ...patch } : field)));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={payload} />
      {fields.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No extra questions yet. Add a short answer, paragraph, or multiple choice if you need class, realm, role, or
          anything else.
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.key} className="border border-[var(--line)] bg-[#140c08]/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Question {index + 1}</p>
                <button
                  type="button"
                  className="text-sm text-[var(--muted)] hover:text-[var(--gold)]"
                  onClick={() => setFields((current) => current.filter((item) => item.key !== field.key))}
                >
                  Remove
                </button>
              </div>
              <label className="mt-2 block text-sm">
                Label
                <input
                  value={field.label}
                  onChange={(event) => update(field.key, { label: event.target.value })}
                  className="tavern-input"
                  placeholder="Class, realm, preferred role..."
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  Type
                  <select
                    value={field.type}
                    onChange={(event) => update(field.key, { type: event.target.value as SignupFieldType })}
                    className="tavern-input mt-0 w-auto"
                  >
                    <option value="short">Short answer</option>
                    <option value="long">Paragraph</option>
                    <option value="choice">Multiple choice</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => update(field.key, { required: event.target.checked })}
                  />
                  Required
                </label>
              </div>
              {field.type === "choice" ? (
                <label className="mt-2 block text-sm">
                  Choices (one per line)
                  <textarea
                    rows={3}
                    value={field.optionsText}
                    onChange={(event) => update(field.key, { optionsText: event.target.value })}
                    className="tavern-input"
                    placeholder={"Tank\nHealer\nDPS"}
                  />
                  <span className="mt-1 block text-xs text-[var(--muted)]">Needs at least two choices to appear on the form.</span>
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <AddButton
          label="Short answer"
          disabled={fields.length >= 12}
          onClick={() => setFields((current) => (current.length >= 12 ? current : [...current, blankField("short")]))}
        />
        <AddButton
          label="Paragraph"
          disabled={fields.length >= 12}
          onClick={() => setFields((current) => (current.length >= 12 ? current : [...current, blankField("long")]))}
        />
        <AddButton
          label="Multiple choice"
          disabled={fields.length >= 12}
          onClick={() => setFields((current) => (current.length >= 12 ? current : [...current, blankField("choice")]))}
        />
      </div>
    </div>
  );
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="tavern-btn-ghost px-3 py-1 text-sm" onClick={onClick} disabled={disabled}>
      + {label}
    </button>
  );
}

function blankField(type: SignupFieldType): DraftField {
  return {
    key: newId(),
    id: newId(),
    label: "",
    type,
    required: false,
    optionsText: type === "choice" ? "" : "",
  };
}

function toDraft(field: SignupField): DraftField {
  return {
    key: field.id || newId(),
    id: field.id || newId(),
    label: field.label,
    type: field.type,
    required: field.required,
    optionsText: field.options.join("\n"),
  };
}

function newId() {
  return crypto.randomUUID().slice(0, 12);
}
