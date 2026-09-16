"use client";

import { useState } from "react";
import { generateUploadToken } from "@/lib/actions";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";

export function UploaderTokenPanel({
  displayName,
  hasToken,
  isHub,
}: {
  displayName: string;
  hasToken: boolean;
  isHub: boolean;
}) {
  const [token, setToken] = useState("");
  const [hub, setHub] = useState(isHub);
  const [error, setError] = useState("");

  return (
    <section className="tavern-frame p-5">
      <h2 className="tavern-title text-xl">Arena uploader</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Leave the Windows uploader running while you play. After a session, type <code>/reload</code> or log
        out so your duels get sent. You can still paste a log by hand if you don&apos;t want the app.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        A fight is confirmed on this site, not by the addon. A key on {displayName}
        {hub ? " can confirm fights as Arena Master" : " sends duels as a normal player"}.
      </p>
      <div className="mt-4">
        <LadderSetupLinks />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Site URL in the app should be <code>https://warcraftevents.com</code>.
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
        <li>Install Arena Ranked Duels from CurseForge.</li>
        <li>Download and run the Windows uploader.</li>
        <li>Create a key below, paste it in the app, and let it find your addon data.</li>
      </ol>
      <form
        className="mt-4"
        action={async () => {
          setError("");
          const result = await generateUploadToken();
          if ("error" in result && result.error) {
            setError(result.error);
            return;
          }
          if ("token" in result && result.token) {
            setToken(result.token);
            setHub(Boolean(result.isHub));
          }
        }}
      >
        <button type="submit" className="tavern-btn">
          {hasToken || token ? "Replace uploader key" : "Create uploader key"}
        </button>
      </form>
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
      {token ? (
        <p className="mt-3 break-all rounded border border-[var(--gold-dim)] bg-[#140c08] px-3 py-2 font-mono text-xs text-[var(--gold)]">
          {token}
        </p>
      ) : hasToken ? (
        <p className="mt-3 text-sm text-[var(--muted)]">A key is already saved. Creating a new one turns the old one off.</p>
      ) : null}
    </section>
  );
}
