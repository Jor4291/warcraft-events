"use client";

import { useState } from "react";
import { leaveEvent } from "@/lib/actions";
import type { EventSignup } from "@/lib/types";

export function PlayerSignupStatus({
  slug,
  signup,
  waitlistPlace,
}: {
  slug: string;
  signup: EventSignup;
  waitlistPlace: number;
}) {
  const [error, setError] = useState("");

  return (
    <section className="tavern-frame p-5">
      <h2 className="tavern-title text-xl">{signup.waitlisted ? "Waitlist" : "You're in"}</h2>
      <p className="mt-2 text-[var(--muted)]">
        {signup.waitlisted
          ? `You're #${waitlistPlace} on the waitlist as ${signup.name}.`
          : `You're on the roster as ${signup.name}.`}
        {signup.checkedIn ? " The host has checked you in." : ""}
      </p>
      <form
        className="mt-4"
        action={async (formData) => {
          if (!window.confirm("Leave this event?")) {
            return;
          }
          setError("");
          const result = await leaveEvent(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="signupId" value={signup.id} />
        {error ? <p className="mb-2 text-sm text-red-300">{error}</p> : null}
        <button type="submit" className="tavern-btn-ghost">
          Leave this event
        </button>
      </form>
    </section>
  );
}
