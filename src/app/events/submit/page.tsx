"use client";

import { useState } from "react";
import { submitEvent } from "@/lib/actions";

export default function SubmitEventPage() {
  const [result, setResult] = useState<{ slug: string; editKey: string } | null>(null);
  const [error, setError] = useState("");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--gold)]">Submit an event</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        Anyone can submit. It stays pending until an admin publishes it. You will get an edit key for the
        bracket board.
      </p>
      {result ? (
        <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--panel)] p-6">
          <p className="text-[var(--gold)]">Submitted. Save this edit link — it is shown once.</p>
          <p className="mt-3 break-all text-sm">
            <a href={`/events/${result.slug}?key=${result.editKey}`}>
              /events/{result.slug}?key={result.editKey}
            </a>
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          action={async (formData) => {
            setError("");
            const next = await submitEvent(formData);
            if ("error" in next && next.error) {
              setError(next.error);
              return;
            }
            if (next.slug && next.editKey) {
              setResult({ slug: next.slug, editKey: next.editKey });
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
            <textarea
              name="description"
              rows={5}
              className="mt-1 w-full rounded border border-[var(--line)] bg-[#120e0b] px-3 py-2"
            />
          </label>
          {error ? <p className="text-red-300">{error}</p> : null}
          <button
            type="submit"
            className="rounded bg-[var(--gold)] px-4 py-2 font-semibold text-[#1a120c]"
          >
            Submit for review
          </button>
        </form>
      )}
    </main>
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
        className="mt-1 w-full rounded border border-[var(--line)] bg-[#120e0b] px-3 py-2"
      />
    </label>
  );
}
