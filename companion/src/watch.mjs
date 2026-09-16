import { createHash } from "crypto";
import { watch } from "fs";
import { readFile } from "fs/promises";
import { parseArdu1 } from "./parse.mjs";

export function payloadHash(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function readPayload(filePath) {
  const lua = await readFile(filePath, "utf8");
  return parseArdu1(lua);
}

export async function uploadPayload(siteUrl, token, payload) {
  const url = new URL("/api/ard/upload", siteUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Upload failed (${response.status})`);
  }
  return data;
}

export function watchFiles(paths, onChange) {
  const watchers = [];
  const timers = new Map();
  for (const filePath of paths) {
    try {
      const watcher = watch(filePath, { persistent: true }, () => {
        clearTimeout(timers.get(filePath));
        timers.set(
          filePath,
          setTimeout(() => {
            onChange(filePath).catch(() => undefined);
          }, 1500),
        );
      });
      watchers.push(watcher);
    } catch {
      // File may not exist yet; scan will retry.
    }
  }
  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
  };
}
