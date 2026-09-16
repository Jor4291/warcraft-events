import { existsSync, readdirSync, statSync } from "fs";
import path from "path";

const FLAVORS = ["_retail_", "_classic_", "_classic_era_", "_classic_ptr_", "_ptr_", "_beta_"];
const SAVED_FILE = "ArenaRankedDuels.lua";

function candidateRoots() {
  const roots = [
    process.env["ProgramFiles(x86)"],
    process.env.ProgramFiles,
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

function flavorDirs(installRoot) {
  if (!existsSync(installRoot)) {
    return [];
  }
  const found = FLAVORS.map((flavor) => path.join(installRoot, flavor)).filter((dir) => existsSync(dir));
  if (existsSync(path.join(installRoot, "WTF"))) {
    found.unshift(installRoot);
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
    const file = path.join(accountRoot, account, "SavedVariables", SAVED_FILE);
    if (existsSync(file)) {
      files.push({
        account,
        flavor: path.basename(flavorDir),
        path: file,
        mtime: statSync(file).mtimeMs,
      });
    }
  }
  return files;
}

export function discoverSavedVariables(customRoot = "") {
  const roots = customRoot ? [customRoot, ...candidateRoots()] : candidateRoots();
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
