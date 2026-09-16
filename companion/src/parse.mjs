export function unescapeLuaString(body) {
  let out = "";
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = body[i + 1];
    if (next === "n") {
      out += "\n";
      i += 1;
    } else if (next === "r") {
      out += "\r";
      i += 1;
    } else if (next === "t") {
      out += "\t";
      i += 1;
    } else if (next === "\\") {
      out += "\\";
      i += 1;
    } else if (next === '"') {
      out += '"';
      i += 1;
    } else if (next === "'") {
      out += "'";
      i += 1;
    } else {
      out += next || "";
      i += 1;
    }
  }
  return out;
}

export function extractUploadJson(luaText) {
  const patterns = ['["uploadJson"]', "['uploadJson']", "uploadJson"];
  let start = -1;
  for (const pattern of patterns) {
    const idx = luaText.indexOf(pattern);
    if (idx !== -1) {
      start = idx + pattern.length;
      break;
    }
  }
  if (start === -1) {
    return "";
  }
  const eq = luaText.indexOf("=", start);
  if (eq === -1) {
    return "";
  }
  let i = eq + 1;
  while (i < luaText.length && /\s/.test(luaText[i])) {
    i += 1;
  }
  if (luaText.startsWith("[[", i)) {
    const end = luaText.indexOf("]]", i + 2);
    return end === -1 ? "" : luaText.slice(i + 2, end);
  }
  if (luaText[i] !== '"') {
    return "";
  }
  i += 1;
  let body = "";
  while (i < luaText.length) {
    const ch = luaText[i];
    if (ch === "\\" && i + 1 < luaText.length) {
      body += ch + luaText[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') {
      break;
    }
    body += ch;
    i += 1;
  }
  return unescapeLuaString(body);
}

export function parseArdu1(luaText) {
  const raw = extractUploadJson(luaText).trim();
  if (!raw) {
    return null;
  }
  const payload = JSON.parse(raw);
  if (payload.format !== "ARDU1" || !Array.isArray(payload.matches)) {
    throw new Error("SavedVariables JSON is not ARDU1.");
  }
  return payload;
}
