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
    <div className="flex flex-wrap items-center gap-3">
      <AddonDownloadLink />
      <UploaderDownloadLink />
    </div>
  );
}
