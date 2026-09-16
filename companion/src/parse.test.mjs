import assert from "node:assert/strict";
import test from "node:test";
import { extractUploadJson, parseArdu1 } from "./parse.mjs";

const sample = `
ArenaRankedDuelsDB = {
	["uploadJson"] = "{\\"format\\":\\"ARDU1\\",\\"reporter\\":\\"Sgtpepper\\",\\"matches\\":[{\\"matchId\\":\\"a|b|rated|1\\",\\"winner\\":\\"Sgtpepper\\",\\"loser\\":\\"Blade\\"}]}",
}
`;

test("extracts ARDU1 from SavedVariables lua", () => {
  const json = extractUploadJson(sample);
  const payload = JSON.parse(json);
  assert.equal(payload.format, "ARDU1");
  assert.equal(payload.reporter, "Sgtpepper");
  assert.equal(payload.matches.length, 1);
});

test("parseArdu1 returns the payload object", () => {
  const payload = parseArdu1(sample);
  assert.equal(payload.matches[0].winner, "Sgtpepper");
});
