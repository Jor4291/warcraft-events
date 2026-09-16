"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAccount } from "@/lib/actions";

export function LoginForm({ next, intro }: { next: string; intro?: string }) {
  const [error, setError] = useState("");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="tavern-title text-3xl">Sign in</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        {intro || "A tavern account lets you book events and send rated duels to the board."}{" "}
        <Link href="/account/register">Register</Link>
      </p>
      <form
        className="space-y-4"
        action={async (formData) => {
          setError("");
          const result = await loginAccount(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        }}
      >
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="tavern-input" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required className="tavern-input" />
        </label>
        {error ? <p className="text-red-300">{error}</p> : null}
        <button type="submit" className="tavern-btn">
          Sign in
        </button>
      </form>
    </main>
  );
}
