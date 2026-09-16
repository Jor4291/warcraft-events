import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import test from "node:test";
import { discoverSavedVariables, flavorDirs } from "./wow.mjs";

test("scans every client folder that has WTF/Account, including _classic_beta_", () => {
  const root = path.join(os.tmpdir(), `ard-wow-${Date.now()}`);
  const retailSv = path.join(root, "_retail_", "WTF", "Account", "One", "SavedVariables");
  const betaSv = path.join(root, "_classic_beta_", "WTF", "Account", "Two", "SavedVariables");
  mkdirSync(retailSv, { recursive: true });
  mkdirSync(betaSv, { recursive: true });
  writeFileSync(path.join(retailSv, "Arena Ranked Duels.lua"), "-- retail");
  writeFileSync(path.join(betaSv, "Arena Ranked Duels.lua"), "-- beta");
  try {
    const flavors = flavorDirs(root).map((dir) => path.basename(dir)).sort();
    assert.deepEqual(flavors, ["_classic_beta_", "_retail_"]);
    const files = discoverSavedVariables(root);
    assert.equal(files.length, 2);
    assert.ok(files.some((file) => file.flavor === "_classic_beta_" && file.account === "Two"));
    assert.ok(files.some((file) => file.flavor === "_retail_" && file.account === "One"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
