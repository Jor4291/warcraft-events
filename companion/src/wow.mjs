import { existsSync, readdirSync, statSync } from "fs";
import path from "path";

const SAVED_FILES = ["Arena Ranked Duels.lua", "ArenaRankedDuels.lua"];

function candidateRoots() {
  const roots = [
    process.env["ProgramFiles(x86)"],
    process.env.ProgramFiles,
    "C:\\Program Files (x86)",
    "C:\\Program Files",
    "C:\\",
    "D:\\",
    "E:\\",
  ]
    .filter(Boolean)
    .flatMap((root) => [
      path.join(root, "World of Warcraft"),
      path.join(root, "Games", "World of Warcraft"),
      path.join(root, "WoW"),
    ]);
  return [...new Set(roots)];
}

function hasAccountFolder(dir) {
  return existsSync(path.join(dir, "WTF", "Account"));
}

function locateRoot(input) {
  if (!input) {
    return "";
  }
  let dir = input;
  try {
    if (existsSync(dir) && statSync(dir).isFile()) {
      dir = path.dirname(dir);
    }
  } catch {
    return input;
  }
  let current = dir;
  for (let i = 0; i < 8; i += 1) {
    if (hasAccountFolder(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return dir;
}

export function flavorDirs(installRoot) {
  const root = locateRoot(installRoot);
  if (!root || !existsSync(root)) {
    return [];
  }
  const found = [];
  if (hasAccountFolder(root)) {
    found.push(root);
  }
  let entries = [];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    const dir = path.join(root, entry.name);
    if (hasAccountFolder(dir)) {
      found.push(dir);
    }
  }
  return found;
}

function accountFiles(flavorDir) {
  const accountRoot = path.join(flavorDir, "WTF", "Account");
  if (!existsSync(accountRoot)) {
    return [];
  }
  const files = [];
  for (const account of readdirSync(accountRoot)) {
    if (account === "SavedVariables" || account.startsWith(".")) {
      continue;
    }
    for (const savedFile of SAVED_FILES) {
      const file = path.join(accountRoot, account, "SavedVariables", savedFile);
      if (existsSync(file)) {
        files.push({
          account,
          flavor: path.basename(flavorDir),
          path: file,
          mtime: statSync(file).mtimeMs,
        });
      }
    }
  }
  return files;
}

export function discoverSavedVariables(customRoot = "") {
  const roots = customRoot && existsSync(customRoot) ? [customRoot] : candidateRoots();
  const files = [];
  const seen = new Set();
  for (const root of roots) {
    for (const flavor of flavorDirs(root)) {
      for (const file of accountFiles(flavor)) {
        if (seen.has(file.path)) {
          continue;
        }
        seen.add(file.path);
        files.push(file);
      }
    }
  }
  return files.sort((a, b) => b.mtime - a.mtime);
}
