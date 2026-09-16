"use client";

import { useState } from "react";
import { rsvpEvent } from "@/lib/actions";
import type { SignupMode } from "@/lib/types";

export function SignupPanel({
  slug,
  signupMode,
  defaultName,
}: {
  slug: string;
  signupMode: SignupMode;
  defaultName: string;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="tavern-frame p-5">
      <h2 className="tavern-title text-xl">Sign up</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        {signupMode === "invite"
          ? "This gathering is invite-only. Ask the host for the door code."
          : "Open sign-up — add your character name to the list."}
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
