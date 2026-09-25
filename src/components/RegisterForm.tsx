"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAccount } from "@/lib/actions";

export function RegisterForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const loginHref = next && next !== "/account" ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login";

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="tavern-title text-3xl">Register</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        A light tavern account is enough to book events, talk on the corkboard, and send rated duels.{" "}
        <Link href={loginHref}>Already have a stool?</Link>
      </p>
      <form
        className="space-y-4"
        action={async (formData) => {
          setError("");
          const result = await registerAccount(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        }}
      >
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          Display name
          <input name="displayName" required className="tavern-input" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="tavern-input" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required minLength={6} className="tavern-input" />
        </label>
        {error ? <p className="text-red-300">{error}</p> : null}
        <button type="submit" className="tavern-btn">
          Create account
        </button>
      </form>
    </main>
  );
}
