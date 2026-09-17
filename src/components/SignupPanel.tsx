"use client";

import { useEffect, useState } from "react";
import { rsvpEvent } from "@/lib/actions";
import { signupSpotsLabel } from "@/lib/signup-form";
import type { SignupField, SignupMode } from "@/lib/types";

export function SignupPanel({
  slug,
  signupMode,
  defaultName,
  fields,
  signupCap,
  signupCount,
}: {
  slug: string;
  signupMode: SignupMode;
  defaultName: string;
  fields: SignupField[];
  signupCap: number;
  signupCount: number;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isFull = signupCap > 0 && signupCount >= signupCap;

  useEffect(() => {
    setError("");
    setMessage("");
  }, [signupCount, isFull]);

  if (isFull) {
    return (
      <section className="tavern-frame p-5">
        <h2 className="tavern-title text-xl">Sign up</h2>
        <p className="mt-2 text-[var(--muted)]">The event sign-ups are filled.</p>
        <p className="mt-1 text-sm text-[var(--gold)]">{signupSpotsLabel(signupCount, signupCap)}</p>
      </section>
    );
  }

  return (
    <section className="tavern-frame p-5">
      <h2 className="tavern-title text-xl">Sign up</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        {signupMode === "invite"
          ? "This gathering is invite-only. Ask the host for the door code."
          : "Open sign-up — add your character name to the list."}
        {signupCap > 0 ? ` ${signupSpotsLabel(signupCount, signupCap)}.` : ""}
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2"
        action={async (formData) => {
          setError("");
          setMessage("");
          const result = await rsvpEvent(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setMessage("You are on the list.");
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <label className="block text-sm">
          Character name
          <input name="name" required defaultValue={defaultName} className="tavern-input" />
        </label>
        {signupMode === "invite" ? (
          <label className="block text-sm">
            Invite code
            <input name="inviteCode" required className="tavern-input uppercase" />
          </label>
        ) : null}
        {fields.map((field) => (
          <label key={field.id} className={`block text-sm ${field.type === "long" ? "sm:col-span-2" : ""}`}>
            {field.label}
            {field.required ? <span className="text-[var(--gold)]"> *</span> : null}
            {field.type === "long" ? (
              <textarea name={`answer-${field.id}`} rows={3} required={field.required} className="tavern-input" />
            ) : field.type === "choice" ? (
              <select name={`answer-${field.id}`} required={field.required} className="tavern-input" defaultValue="">
                <option value="">{field.required ? "Choose one" : "Optional"}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input name={`answer-${field.id}`} required={field.required} className="tavern-input" />
            )}
          </label>
        ))}
        {error ? <p className="text-red-300 sm:col-span-2">{error}</p> : null}
        {message ? <p className="text-emerald-300 sm:col-span-2">{message}</p> : null}
        <div className="sm:col-span-2">
          <button type="submit" className="tavern-btn">
            Join this event
          </button>
        </div>
      </form>
    </section>
  );
}
