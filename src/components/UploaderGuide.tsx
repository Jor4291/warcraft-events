import Link from "next/link";
import type { ReactNode } from "react";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";

export function UploaderGuide({ signedIn }: { signedIn: boolean }) {
  return (
    <ol className="m-0 list-none space-y-5 p-0">
      <GuideStep n={1} title="Install the addon">
        <p>
          Get <strong>Arena Ranked Duels</strong> from CurseForge and install it into the World of Warcraft
          you actually play. Forever and Retail are different folders, so CurseForge has to be set to that
          version of the game.
        </p>
      </GuideStep>
      <GuideStep n={2} title="Make a tavern account">
        <p>
          Sign in on WarcraftEvents.com so the app knows which character is sending fights. Display name should
          match the name you duel on.
        </p>
        {signedIn ? (
          <p className="mt-2 text-sm text-[var(--gold)]">You&apos;re signed in. Skip ahead to the key.</p>
        ) : (
          <p className="mt-3">
            <Link href="/account/register" className="tavern-btn no-underline">
              Create account
            </Link>
            <Link href="/account/login?next=/ladder/setup" className="tavern-btn-ghost ml-3 no-underline">
              Sign in
            </Link>
          </p>
        )}
      </GuideStep>
      <GuideStep n={3} title="Download the Windows app">
        <p>
          Download the uploader and run it. Windows may say Unknown publisher — that&apos;s us. Choose{" "}
          <strong>More info</strong>, then <strong>Run anyway</strong>.
        </p>
        <div className="mt-4">
          <LadderSetupLinks />
        </div>
      </GuideStep>
      <GuideStep n={4} title="Leave the black window open">
        <p>
          A small console window stays open while the app works. That is normal. If you open it a second time
          and the window flickers shut, the first copy is already running — leave that one alone.
        </p>
        <p className="mt-2">
          Site URL should read <code>https://warcraftevents.com</code>.
        </p>
      </GuideStep>
      <GuideStep n={5} title="Paste your uploader key">
        <p>
          On your account page, create an uploader key, copy it, paste it into the app, and hit Save. Then
          click <strong>Scan for addon data</strong>. You should see your account name listed.
        </p>
        <p className="mt-3">
          <Link href={signedIn ? "/account" : "/account/login?next=/account"} className="tavern-btn no-underline">
            {signedIn ? "Create your key" : "Sign in to create a key"}
          </Link>
        </p>
      </GuideStep>
      <GuideStep n={6} title="Play, then reload">
        <p>
          Rated duels only leave the game after <code>/reload</code> or a logout. Keep the app open while you
          play, then reload when you&apos;re done. A fight hits the board when both players send it, or when
          the Arena Master reports it.
        </p>
      </GuideStep>
      <GuideStep n={7} title="Missing a fight?">
        <p>
          In game, type <code>/ard upload</code>, copy what it gives you, and paste it on the submit page.
          That backup does not need the Windows app.
        </p>
        <p className="mt-3">
          <Link href="/ladder/upload" className="tavern-btn-ghost no-underline">
            Paste a duel log
          </Link>
        </p>
      </GuideStep>
    </ol>
  );
}

function GuideStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="tavern-frame p-5 md:p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">Step {n}</p>
      <h2 className="tavern-title mt-1 text-xl">{title}</h2>
      <div className="mt-3 text-[var(--muted)]">{children}</div>
    </li>
  );
}
