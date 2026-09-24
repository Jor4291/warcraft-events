"use client";

import { useState } from "react";
import { renameAccount } from "@/lib/actions";

export function RenameAccountForm({ userId, currentName }: { userId: string; currentName: string }) {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className="mt-4 border-t border-[var(--line)] pt-4"
      action={async (formData) => {
        setError("");
        setNote("");
        const result = await renameAccount(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        setNote("Name changed.");
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <label className="block text-sm">
        New display name
        <input name="displayName" required defaultValue="" placeholder={currentName} className="tavern-input" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="scrubRoster" />
        Also replace this name on their event sign-ups
      </label>
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-[var(--gold)]">{note}</p> : null}
      <button className="tavern-btn-ghost mt-3 text-sm" type="submit">
        Rename
      </button>
    </form>
  );
}
