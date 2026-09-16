import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const companionRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(companionRoot, "public", "index.html"), "utf8");
const out = path.join(companionRoot, "src", "ui-html.mjs");
writeFileSync(out, `export const INDEX_HTML = ${JSON.stringify(html)};\n`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
