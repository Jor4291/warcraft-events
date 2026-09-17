import { Cinzel, EB_Garamond } from "next/font/google";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUser } from "@/lib/auth";
import { emptyInbox, playerInbox } from "@/lib/notices";
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
    "Public Warcraft events calendar, tournament brackets, and the WoW:Forever Arena Ranked Duels ladder.",
};

async function loadInbox(userId: string) {
  const store = await getStore();
  const record = store.users.find((item) => item.id === userId);
  return record ? playerInbox(record, store.events) : emptyInbox();
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const inbox = user ? await loadInbox(user.id) : emptyInbox();

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
            <SiteNav user={user} inbox={inbox} />
          </div>
        </header>
        <div className="tavern-main flex-1">{children}</div>
        <footer className="tavern-footer px-6 py-6 text-center text-sm text-[var(--muted)]">
          WarcraftEvents.com · a notice board for Azeroth and WoW:Forever
          <span className="mx-2">·</span>
          <Link href="/admin">Innkeeper</Link>
          <span className="mx-2">·</span>
          <Link href="/ladder/setup">How to send duels</Link>
          <span className="mx-2">·</span>
          <Link href="/ladder/upload">Paste a duel log</Link>
        </footer>
      </body>
    </html>
  );
}
