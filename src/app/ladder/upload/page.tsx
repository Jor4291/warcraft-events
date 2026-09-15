"use client";

import { useState } from "react";
import { uploadLadderJson } from "@/lib/actions";

export default function UploadPage() {
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--gold)]">Upload ARDU1 log</h1>
      <p className="mt-2 mb-6 text-[var(--muted)]">
        In WoW, run <code>/ard upload</code>, copy the JSON, and paste it here. The site upserts on{" "}
        <code>matchId</code> and only rates confirmed fights.
      </p>
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
          className="w-full rounded border border-[var(--line)] bg-[#120e0b] px-3 py-2 font-mono text-xs"
          placeholder='{"format":"ARDU1", ...}'
        />
        {error ? <p className="text-red-300">{error}</p> : null}
        {message ? <p className="text-emerald-300">{message}</p> : null}
        <button type="submit" className="rounded bg-[var(--gold)] px-4 py-2 font-semibold text-[#1a120c]">
          Ingest log
        </button>
      </form>
    </main>
  );
}
