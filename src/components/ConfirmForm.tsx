"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmAccount, resendConfirmCode } from "@/lib/actions";

export function ConfirmForm({ email, next }: { email: string; next: string }) {
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="tavern-title text-3xl">Confirm this mailbox</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        We sent a 6-digit hearth code to <span className="text-[var(--gold)]">{email}</span>. New patrons cannot take a
        roster slot or write on the board until that mailbox answers.
      </p>
      <form
        className="space-y-4"
        action={async (formData) => {
          setError("");
          setSent("");
          const result = await confirmAccount(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        }}
      >
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          Code
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            className="tavern-input tracking-[0.4em]"
          />
        </label>
        {error ? <p className="text-red-300">{error}</p> : null}
        {sent ? <p className="text-[var(--gold)]">{sent}</p> : null}
        <button type="submit" className="tavern-btn">
          Confirm mailbox
        </button>
      </form>
      <form
        className="mt-4"
        action={async () => {
          setError("");
          setSent("");
          const result = await resendConfirmCode();
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setSent("Another code is on the way.");
        }}
      >
        <button type="submit" className="tavern-btn-ghost">
          Send a new code
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Wrong address? <Link href="/account">Open your account</Link> and sign out, then register again.
      </p>
    </main>
  );
}
