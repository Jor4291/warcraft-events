"use client";

import { useState } from "react";
import { uploadLadderJson } from "@/lib/actions";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";

export default function UploadPage() {
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Submit a duel log</h1>
      <p className="mt-2 text-[var(--muted)]">
        Lua cannot talk to the website, so a desktop uploader watches SavedVariables and POSTs for you. Paste
        remains the fallback: run <code>/ard upload</code>, copy the JSON, and submit it here. Anyone may paste
        a log — only confirmed fights (two reporters, or a hub token) change the Arena Leaderboard.
      </p>
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">
        <LadderSetupLinks />
        <span className="text-sm text-[var(--muted)]">Then create a token on your account page.</span>
      </div>
      <form
        className="space-y-4"
        action={async () => {
          setError("");
          setMessage("");
          try {
            const result = await uploadLadderJson(jsonText);
            setMessage(
              `Reporter ${result.reporter}: ${result.inserted} new, ${result.merged} merged, ${result.playerCount} players on the board.`,
            );
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          }
        }}
      >
        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          rows={16}
          className="tavern-input font-mono text-xs"
          placeholder='{"format":"ARDU1", ...}'
        />
        {error ? <p className="text-red-300">{error}</p> : null}
        {message ? <p className="text-emerald-300">{message}</p> : null}
        <button type="submit" className="tavern-btn">
          Ingest log
        </button>
      </form>
    </main>
  );
}
