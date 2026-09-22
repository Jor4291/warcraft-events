"use client";

import { useMemo, useState } from "react";
import { MAX_EVENT_LINKS, eventLinkUrl, suggestLinkLabel } from "@/lib/event-links";
import type { EventLink } from "@/lib/types";

type DraftLink = {
  key: string;
  label: string;
  url: string;
};

export function EventLinksBuilder({
  initialLinks = [],
  inputName = "linksJson",
}: {
  initialLinks?: EventLink[];
  inputName?: string;
}) {
  const [links, setLinks] = useState<DraftLink[]>(() => initialLinks.map(toDraft));
  const payload = useMemo(
    () => JSON.stringify(links.map((link) => ({ label: link.label.trim(), url: link.url.trim() }))),
    [links],
  );

  function update(key: string, patch: Partial<DraftLink>) {
    setLinks((current) => current.map((link) => (link.key === key ? { ...link, ...patch } : link)));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={payload} />
      {links.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No links yet. Add your Discord for voice comms, a stream, or a rules doc.
        </p>
      ) : (
        <ul className="space-y-3">
          {links.map((link, index) => {
            const href = eventLinkUrl(link.url);
            const badUrl = link.url.trim().length > 0 && !href;
            return (
              <li key={link.key} className="border border-[var(--line)] bg-[#140c08]/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Link {index + 1}</p>
                  <button
                    type="button"
                    className="text-sm text-[var(--muted)] hover:text-[var(--gold)]"
                    onClick={() => setLinks((current) => current.filter((item) => item.key !== link.key))}
                  >
                    Remove
                  </button>
                </div>
                <label className="mt-2 block text-sm">
                  Address
                  <input
                    value={link.url}
                    onChange={(event) => update(link.key, { url: event.target.value })}
                    className="tavern-input"
                    placeholder="https://discord.gg/your-invite"
                    inputMode="url"
                  />
                </label>
                {badUrl ? (
                  <p className="mt-1 text-xs text-red-300">Use a web address, like discord.gg/your-invite.</p>
                ) : null}
                <label className="mt-2 block text-sm">
                  Button text
                  <input
                    value={link.label}
                    onChange={(event) => update(link.key, { label: event.target.value })}
                    className="tavern-input"
                    placeholder={suggestLinkLabel(link.url) || "Discord"}
                  />
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    Leave this blank and the button uses the site name.
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="tavern-btn-ghost px-3 py-1 text-sm"
        disabled={links.length >= MAX_EVENT_LINKS}
        onClick={() =>
          setLinks((current) =>
            current.length >= MAX_EVENT_LINKS ? current : [...current, { key: newKey(), label: "", url: "" }],
          )
        }
      >
        + Link
      </button>
      <p className="text-xs text-[var(--muted)]">
        Up to {MAX_EVENT_LINKS} links. Attendees see them as buttons under the write-up.
      </p>
    </div>
  );
}

function toDraft(link: EventLink): DraftLink {
  return { key: newKey(), label: link.label, url: link.url };
}

function newKey() {
  return crypto.randomUUID().slice(0, 12);
}
