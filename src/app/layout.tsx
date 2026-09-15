import { Cinzel, Source_Sans_3 } from "next/font/google";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const display = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WarcraftEvents",
    template: "%s · WarcraftEvents",
  },
  description:
    "Public Warcraft events calendar, tournament brackets, and the WoW:Forever Arena Ranked Duels ladder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--gold-dim)] bg-[#140e0a]/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--gold)]">
              WarcraftEvents
            </Link>
            <nav className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
              <Link href="/events">Calendar</Link>
              <Link href="/events/submit">Submit event</Link>
              <Link href="/ladder">Forever ladder</Link>
              <Link href="/ladder/upload">Upload log</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[var(--gold-dim)] px-6 py-6 text-center text-sm text-[var(--muted)]">
          WarcraftEvents.com · community calendar and WoW:Forever ranked duels
        </footer>
      </body>
    </html>
  );
}
