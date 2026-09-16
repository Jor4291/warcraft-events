"use client";

import { useState } from "react";
import { submitEvent } from "@/lib/actions";

export function BookEventForm() {
  const [result, setResult] = useState<{
    slug: string;
    editKey: string;
    inviteCode: string;
    signupMode: string;
  } | null>(null);
  const [error, setError] = useState("");

  if (result) {
    return (
      <div className="tavern-parchment p-6">
        <p>The board is hung. Bookmark this page so you can manage the list and bracket.</p>
        <p className="mt-3">
          <a href={`/events/${result.slug}`}>Open your event</a>
        </p>
        {result.signupMode === "invite" ? (
          <p className="mt-3 text-sm">
            Invite code: <strong>{result.inviteCode}</strong>
          </p>
        ) : (
          <p className="mt-3 text-sm">Visitors who open the calendar listing can sign up themselves.</p>
        )}
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setError("");
        const next = await submitEvent(formData);
        if ("error" in next && next.error) {
          setError(next.error);
          return;
        }
        if ("slug" in next && next.slug) {
          setResult(next);
        }
      }}
    >
      <Field label="Title" name="title" required />
      <Field label="Game" name="game" defaultValue="WoW:Forever" />
      <Field label="Format" name="format" placeholder="1v1, 2v2, raid night..." />
      <Field label="Starts" name="startsAt" type="datetime-local" />
      <Field label="Ends" name="endsAt" type="datetime-local" />
      <Field label="Region" name="region" placeholder="NA / EU / All" />
      <Field label="Location" name="location" placeholder="Discord, in-game, etc." />
      <Field label="Contact" name="contact" />
      <label className="block text-sm">
        Description
        <textarea name="description" rows={5} className="tavern-input" />
      </label>
      <fieldset>
        <legend className="text-sm text-[var(--muted)]">Who can sign up</legend>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="radio" name="signupMode" value="open" defaultChecked />
            <span>
              <strong>Open sign-up</strong> — anyone who finds the calendar listing can join.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="signupMode" value="invite" />
            <span>
              <strong>Invite by code</strong> — only people with your door code can join.
            </span>
          </label>
        </div>
      </fieldset>
      {error ? <p className="text-red-300">{error}</p> : null}
      <button type="submit" className="tavern-btn">
        Book Event
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="tavern-input"
      />
    </label>
  );
}
