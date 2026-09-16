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
        Leave the desktop uploader running while you play. After a session, <code>/reload</code> or log out so
        SavedVariables flush, and it will POST your ARDU1 log. Paste still works if you do not want the app.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Hub confirmation is never taken from the addon JSON. A token on {displayName}
        {hub ? " can confirm as hub" : " uploads as a normal reporter"}.
      </p>
      <div className="mt-4">
        <LadderSetupLinks />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Windows may warn that the file is unsigned. Choose More info, then Run anyway. Site URL in the app should
        be <code>https://warcraftevents.com</code>.
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
        <li>Install Arena Ranked Duels from CurseForge.</li>
        <li>Download and run the Windows uploader.</li>
        <li>Create a token below, paste it in the app, and scan for <code>ArenaRankedDuels.lua</code>.</li>
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
          {hasToken || token ? "Replace uploader token" : "Create uploader token"}
        </button>
      </form>
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
      {token ? (
        <p className="mt-3 break-all rounded border border-[var(--gold-dim)] bg-[#140c08] px-3 py-2 font-mono text-xs text-[var(--gold)]">
          {token}
        </p>
      ) : hasToken ? (
        <p className="mt-3 text-sm text-[var(--muted)]">A token is already saved. Creating a new one invalidates the old one.</p>
      ) : null}
    </section>
  );
}
