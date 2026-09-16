import { UPLOADER_EXE_URL } from "@/lib/downloads";

export function UploaderDownloadLink({ className = "tavern-btn no-underline" }: { className?: string }) {
  return (
    <a className={className} href={UPLOADER_EXE_URL}>
      Download Windows uploader
    </a>
  );
}
