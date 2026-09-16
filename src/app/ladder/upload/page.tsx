"use client";

import Link from "next/link";
import { useState } from "react";
import { uploadLadderJson } from "@/lib/actions";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";

function friendlyUploadError(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  if (/JSON|Unexpected|ARDU1/i.test(raw)) {
    return "That doesn't look like a duel log. In game, type /ard upload, copy everything it prints, and paste it here.";
  }
  return raw || "Couldn't send that log. Try again, or paste a fresh copy from /ard upload.";
}

export default function UploadPage() {
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Submit a duel log</h1>
      <p className="mt-2 text-[var(--muted)]">
        The addon keeps your rated duels in game, but it can&apos;t send them here on its own. Get the addon,
        then download the Windows uploader and leave it running while you play. After a session, type{" "}
        <code>/reload</code> or log out so your results get sent.
      </p>
      <p className="mt-2 text-[var(--muted)]">
        Prefer to paste? In game, type <code>/ard upload</code>, copy what it gives you, and drop it in the box
        below. A fight only hits the Arena Leaderboard when both players send it, or when the Arena Master
        reports it.
      </p>
      <div className="mt-4 mb-6">
        <LadderSetupLinks />
        <p className="mt-2 text-sm text-[var(--muted)]">
          Using the Windows uploader? <Link href="/account">Sign in</Link> and create a key on your account page
          so the app can send your duels.
        </p>
      </div>
      <form
        className="space-y-4"
        action={async () => {
          setError("");
          setMessage("");
          try {
            const result = await uploadLadderJson(jsonText);
            const fights =
              result.inserted === 1 ? "1 new fight" : `${result.inserted} new fights`;
            const already =
              result.merged === 0
                ? ""
                : result.merged === 1
                  ? " 1 was already on file."
                  : ` ${result.merged} were already on file.`;
            setMessage(
              `Got it from ${result.reporter}: ${fights}.${already} ${result.playerCount} players on the board.`,
            );
          } catch (err) {
            setError(friendlyUploadError(err));
          }
        }}
      >
        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          rows={16}
          className="tavern-input font-mono text-xs"
          placeholder="Paste your duel log here"
        />
        {error ? <p className="text-red-300">{error}</p> : null}
        {message ? <p className="text-emerald-300">{message}</p> : null}
        <button type="submit" className="tavern-btn">
          Submit log
        </button>
      </form>
    </main>
  );
}
