import { ADDON_CURSEFORGE_URL, UPLOADER_EXE_URL } from "@/lib/downloads";

export function UploaderDownloadLink({ className = "tavern-btn no-underline" }: { className?: string }) {
  return (
    <a className={className} href={UPLOADER_EXE_URL}>
      Download Windows uploader
    </a>
  );
}

export function AddonDownloadLink({ className = "tavern-btn-ghost no-underline" }: { className?: string }) {
  return (
    <a className={className} href={ADDON_CURSEFORGE_URL} target="_blank" rel="noreferrer">
      Get the addon on CurseForge
    </a>
  );
}

export function LadderSetupLinks() {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <AddonDownloadLink className="tavern-btn-ghost no-underline h-11" />
      <div className="flex w-fit flex-col items-start gap-1">
        <UploaderDownloadLink className="tavern-btn no-underline h-11" />
        <p className="max-w-[16rem] text-xs leading-snug text-[var(--muted)]">
          Windows may say Unknown publisher. That&apos;s us — this beta isn&apos;t code-signed yet. Choose More
          info, then Run anyway.
        </p>
      </div>
    </div>
  );
}

