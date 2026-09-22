"use client";

import { useState } from "react";
import Link from "next/link";
import { createStandaloneBracket } from "@/lib/actions";

export function CreateBracketForm() {
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  if (result) {
    return (
      <div className="tavern-parchment p-6">
        <p>Lasting board is hung on this account. Open it to pick winners later.</p>
        <p className="mt-3 break-all text-sm">
          <a href={`/bracket/${result.slug}`}>/bracket/{result.slug}</a>
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setError("");
        const next = await createStandaloneBracket(formData);
        if ("error" in next && next.error) {
          setError(next.error);
          return;
        }
        if (next.slug) {
          setResult(next);
        }
      }}
    >
      <label className="block text-sm">
        Title
        <input name="title" placeholder="Thursday night 1v1s" className="tavern-input" />
      </label>
      <label className="block text-sm">
        Challengers (one per line)
        <textarea name="teams" rows={10} required className="tavern-input" placeholder={"Sgtpepper\nStormwind Blade"} />
      </label>
      {error ? <p className="text-red-300">{error}</p> : null}
      <button type="submit" className="tavern-btn">
        Hang a lasting board
      </button>
      <p className="text-sm text-[var(--muted)]">
        Need a date, sign-ups, and a listing? <Link href="/events/submit">Book an event</Link> instead. For a
        throwaway night, use the scratch board above.
      </p>
    </form>
  );
}
