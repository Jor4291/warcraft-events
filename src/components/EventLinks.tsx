import { publicText } from "@/lib/conduct";
import { eventLinkUrl, suggestLinkLabel } from "@/lib/event-links";
import type { EventLink } from "@/lib/types";

export function EventLinks({ links, className = "" }: { links: EventLink[]; className?: string }) {
  const usable = links
    .map((link) => ({ label: link.label.trim(), href: eventLinkUrl(link.url) }))
    .filter((link) => link.href);
  if (usable.length === 0) {
    return null;
  }
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {usable.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer nofollow"
          className="tavern-btn-ghost px-3 py-1 text-sm no-underline"
        >
          {publicText(link.label || suggestLinkLabel(link.href))}
        </a>
      ))}
    </div>
  );
}
