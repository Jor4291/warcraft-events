"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { generateUploadToken } from "@/lib/actions";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="12" height="14" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

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
  const [copied, setCopied] = useState(false);
  const keyRef = useRef<HTMLParagraphElement>(null);

  function markCopied() {
    setError("");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function selectKey() {
    const node = keyRef.current;
    if (!node) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  async function copyKey() {
    selectKey();
    if (document.execCommand("copy")) {
      markCopied();
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      markCopied();
    } catch {
      setError("Key selected. Press Ctrl+C to copy.");
    }
  }

  return (
    <section className="tavern-frame p-5">
      <h2 className="tavern-title text-xl">Arena uploader</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Leave the Windows app running while you play, then <code>/reload</code> or log out.{" "}
        <Link href="/ladder/setup">How to install it</Link>.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        A fight is confirmed on this site, not in game. A key on {displayName}
        {hub ? " can confirm fights as Arena Master" : " sends duels as a normal player"}.
      </p>
      <div className="mt-4">
        <LadderSetupLinks />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        In the app, Site URL should be <code>https://warcraftevents.com</code>. Paste the key below, Save, then
        Scan for addon data.
      </p>
      <form
        className="mt-4"
        action={async () => {
          setError("");
          setCopied(false);
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
        <div className="mt-3 flex items-stretch gap-2">
          <p
            ref={keyRef}
            className="min-w-0 flex-1 break-all rounded border border-[var(--gold-dim)] bg-[#140c08] px-3 py-2 font-mono text-xs text-[var(--gold)]"
          >
            {token}
          </p>
          <button
            type="button"
            className="tavern-btn-ghost shrink-0 self-stretch px-2.5"
            onClick={copyKey}
            aria-label={copied ? "Uploader key copied" : "Copy uploader key"}
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? "Copied" : ""}
          </span>
        </div>
      ) : hasToken ? (
        <p className="mt-3 text-sm text-[var(--muted)]">A key is already saved. Creating a new one turns the old one off.</p>
      ) : null}
    </section>
  );
}
