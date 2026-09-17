"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { ADDON_CURSEFORGE_URL } from "@/lib/downloads";
import type { PlayerInbox } from "@/lib/notices";
import type { PublicUser } from "@/lib/types";

type MenuId = "events" | "arena" | "account";

export function SiteNav({
  user,
  inbox,
  rating,
}: {
  user: PublicUser | null;
  inbox: PlayerInbox;
  rating: { name: string; points: number } | null;
}) {
  const [open, setOpen] = useState<MenuId | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(id: MenuId) {
    setOpen((current) => (current === id ? null : id));
  }

  return (
    <nav ref={root} className="site-nav text-sm text-[var(--muted)]">
      <div className="nav-menu">
        <button
          type="button"
          className="nav-menu-button"
          aria-expanded={open === "events"}
          onClick={() => toggle("events")}
        >
          Events &amp; Tools
        </button>
        {open === "events" ? (
          <div className="nav-menu-panel">
            <Link href="/events" onClick={() => setOpen(null)}>
              Calendar
            </Link>
            <Link href="/events/submit" onClick={() => setOpen(null)}>
              Book Event
            </Link>
            <Link href="/bracket" onClick={() => setOpen(null)}>
              Hang a bracket
            </Link>
          </div>
        ) : null}
      </div>
      <div className="nav-menu">
        <button
          type="button"
          className="nav-menu-button"
          aria-expanded={open === "arena"}
          onClick={() => toggle("arena")}
        >
          Arena Ranked Duels
        </button>
        {open === "arena" ? (
          <div className="nav-menu-panel">
            <Link href="/ladder" onClick={() => setOpen(null)}>
              Leaderboard
            </Link>
            {rating ? (
              <Link href={`/ladder?player=${encodeURIComponent(rating.name)}`} onClick={() => setOpen(null)}>
                Your rating · {rating.points}
              </Link>
            ) : null}
            <Link href="/ladder/setup" onClick={() => setOpen(null)}>
              How to send duels
            </Link>
            <Link href="/ladder/upload" onClick={() => setOpen(null)}>
              Paste a duel log
            </Link>
            <a href={ADDON_CURSEFORGE_URL} target="_blank" rel="noreferrer">
              Get the addon
            </a>
          </div>
        ) : null}
      </div>
      <AccountMenu
        user={user}
        inbox={inbox}
        rating={rating}
        open={open === "account"}
        onToggle={() => toggle("account")}
        onNavigate={() => setOpen(null)}
      />
    </nav>
  );
}
