import { Cinzel, EB_Garamond } from "next/font/google";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SiteNav } from "@/components/SiteNav";
import { isInnkeeper } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import { requestTimeZone } from "@/lib/client-ip";
import { emptyInbox, playerInbox } from "@/lib/notices";
import { namesEqual } from "@/lib/player-name";
import { getStore } from "@/lib/store";
import "./globals.css";

const display = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sans = EB_Garamond({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "WarcraftEvents",
    template: "%s · WarcraftEvents",
  },
  description:
    "Public Warcraft events calendar, tavern corkboard, tournament brackets, and the WoW:Forever Arena Ranked Duels ladder.",
};

async function loadNav(userId: string, displayName: string) {
  const [store, timeZone] = await Promise.all([getStore(), requestTimeZone()]);
  const record = store.users.find((item) => item.id === userId);
  const player = store.players.find((item) => namesEqual(item.name, displayName));
  return {
    inbox: record ? playerInbox(record, store.events, timeZone) : emptyInbox(),
    rating: player ? { name: player.name, points: Math.round(player.points) } : null,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, innkeeper] = await Promise.all([getSessionUser(), isInnkeeper()]);
  const nav = user ? await loadNav(user.id, user.displayName) : { inbox: emptyInbox(), rating: null };

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <header className="tavern-header">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="no-underline">
              <span className="block text-center font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">
                The hearth is lit
              </span>
              <span className="tavern-title block text-2xl">WarcraftEvents</span>
            </Link>
            <SiteNav user={user} inbox={nav.inbox} rating={nav.rating} innkeeper={innkeeper} />
          </div>
        </header>
        <div className="tavern-main flex-1">{children}</div>
        <footer className="tavern-footer px-6 py-6 text-center text-sm text-[var(--muted)]">
          WarcraftEvents.com · a notice board for Azeroth and WoW:Forever
          <span className="mx-2">·</span>
          <Link href="/board">Forums</Link>
          {innkeeper ? (
            <>
              <span className="mx-2">·</span>
              <Link href="/admin">Innkeeper</Link>
            </>
          ) : null}
          <span className="mx-2">·</span>
          <Link href="/ladder/setup">How to send duels</Link>
          <span className="mx-2">·</span>
          <Link href="/ladder/upload">Paste a duel log</Link>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
