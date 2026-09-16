import { exec } from "child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import http from "http";
import { homedir } from "os";
import path from "path";
import { INDEX_HTML } from "./ui-html.mjs";
import { discoverSavedVariables } from "./wow.mjs";
import { payloadHash, readPayload, uploadPayload, watchFiles } from "./watch.mjs";

const PORT = Number(process.env.UPLOADER_PORT || 4782);
const PRODUCTION_SITE = "https://warcraftevents.com";
const configDir = path.join(process.env.APPDATA || path.join(homedir(), ".config"), "WarcraftEventsUploader");
const configPath = path.join(configDir, "config.json");
const logPath = path.join(configDir, "uploader.log");

function isPackaged() {
  const exe = path.basename(process.execPath).toLowerCase();
  return exe !== "node" && exe !== "node.exe" && exe !== "bun" && exe !== "bun.exe";
}

const defaultConfig = () => ({
  siteUrl: process.env.WE_SITE_URL || (isPackaged() ? PRODUCTION_SITE : "http://localhost:3000"),
  token: "",
  wowPath: "",
  autoUpload: true,
});

function loadConfig() {
  try {
    return { ...defaultConfig(), ...JSON.parse(readFileSync(configPath, "utf8")) };
  } catch {
    return defaultConfig();
  }
}

function saveConfig(next) {
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(next, null, 2), "utf8");
}

const state = {
  config: loadConfig(),
  files: [],
  watching: [],
  last: null,
  hashes: {},
  mtimes: {},
  emptyWarned: {},
  uploading: false,
  log: [],
  stopWatch: () => undefined,
};

function writeLogFile(message) {
  try {
    mkdirSync(configDir, { recursive: true });
    if (existsSync(logPath) && statSync(logPath).size > 256 * 1024) {
      writeFileSync(`${logPath}.old`, readFileSync(logPath));
      writeFileSync(logPath, "");
    }
    appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging must never take down the uploader.
  }
}

function log(message, extra = {}) {
  state.log.unshift({ at: new Date().toISOString(), message, ...extra });
  state.log = state.log.slice(0, 40);
  console.log(`[uploader] ${message}`);
  writeLogFile(message);
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function snapshot() {
  return {
    config: {
      siteUrl: state.config.siteUrl,
      token: state.config.token,
      wowPath: state.config.wowPath,
      autoUpload: state.config.autoUpload,
      hasToken: Boolean(state.config.token),
    },
    files: state.files,
    last: state.last,
    log: state.log,
  };
}

function refreshFiles() {
  state.files = discoverSavedVariables(state.config.wowPath);
  return state.files;
}

async function uploadFile(filePath, reason) {
  if (!state.config.token) {
    throw new Error("Add an uploader token first.");
  }
  const payload = await readPayload(filePath);
  if (!payload) {
    if (!state.emptyWarned[filePath]) {
      state.emptyWarned[filePath] = true;
      log("No ARDU1 in that SavedVariables file yet. /reload or log out after a rated duel.");
    }
    return { skipped: true };
  }
  const hash = payloadHash(payload);
  if (hash === state.hashes[filePath]) {
    if (reason === "manual") {
      log("Skipped — same log already sent.");
    }
    return { skipped: true };
  }
  const result = await uploadPayload(state.config.siteUrl, state.config.token, payload);
  state.hashes[filePath] = hash;
  state.last = {
    at: new Date().toISOString(),
    reason,
    file: filePath,
    reporter: result.reporter,
    inserted: result.inserted,
    merged: result.merged,
    hub: result.hub,
    playerCount: result.playerCount,
  };
  log(
    `Uploaded ${result.inserted} new / ${result.merged} merged for ${result.reporter}${result.hub ? " (hub)" : ""}.`,
    { file: filePath },
  );
  return result;
}

function openBrowser(href) {
  if (process.platform === "win32") {
    exec(`cmd /c start "" "${href}"`);
  }
}

function startWatching() {
  state.stopWatch();
  const paths = state.files.map((file) => file.path);
  state.watching = paths;
  state.stopWatch = watchFiles(paths, async (filePath) => {
    if (!state.config.autoUpload) {
      log(`SavedVariables changed (${path.basename(filePath)}) — auto-upload is off.`);
      return;
    }
    try {
      await uploadFile(filePath, "watch");
    } catch (error) {
      log(error instanceof Error ? error.message : String(error));
    }
  });
}

async function pollSavedVariables() {
  if (state.uploading) {
    return;
  }
  state.uploading = true;
  try {
    const before = state.files.map((file) => file.path).join("\n");
    refreshFiles();
    const after = state.files.map((file) => file.path).join("\n");
    if (before !== after) {
      startWatching();
      log(
        state.files.length
          ? `Found ${state.files.length} SavedVariables file${state.files.length === 1 ? "" : "s"}.`
          : "SavedVariables list changed; none found.",
      );
    } else {
      startWatching();
    }
    if (!state.config.autoUpload || !state.config.token) {
      return;
    }
    for (const file of state.files) {
      let mtime = 0;
      try {
        mtime = statSync(file.path).mtimeMs;
      } catch {
        continue;
      }
      if (state.mtimes[file.path] === mtime) {
        continue;
      }
      state.mtimes[file.path] = mtime;
      try {
        await uploadFile(file.path, "poll");
      } catch (error) {
        log(error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    state.uploading = false;
  }
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/state") {
    json(response, 200, snapshot());
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/config") {
    const body = await readBody(request);
    state.config = {
      ...state.config,
      siteUrl: String(body.siteUrl || state.config.siteUrl).replace(/\/$/, ""),
      token: body.token === undefined ? state.config.token : String(body.token).trim(),
      wowPath: body.wowPath === undefined ? state.config.wowPath : String(body.wowPath).trim(),
      autoUpload: body.autoUpload === undefined ? state.config.autoUpload : Boolean(body.autoUpload),
    };
    saveConfig(state.config);
    refreshFiles();
    startWatching();
    json(response, 200, snapshot());
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/scan") {
    refreshFiles();
    startWatching();
    json(response, 200, snapshot());
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/upload") {
    const body = await readBody(request);
    const target = body.path || state.files[0]?.path;
    if (!target) {
      json(response, 400, { error: "No Arena Ranked Duels.lua found. Set your WoW folder." });
      return;
    }
    try {
      const result = await uploadFile(target, "manual");
      json(response, 200, { ...snapshot(), result });
    } catch (error) {
      json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  json(response, 404, { error: "Not found" });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${PORT}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(INDEX_HTML);
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  } catch (error) {
    json(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

const href = `http://127.0.0.1:${PORT}`;
server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    log(`Already running at ${href}. Opened that window — leave the first one open.`);
    openBrowser(href);
    setTimeout(() => process.exit(0), 8000);
    return;
  }
  log(error instanceof Error ? error.message : String(error));
  setTimeout(() => process.exit(1), 8000);
});
refreshFiles();
if (state.files.length) {
  log(
    `Watching ${state.files.length} SavedVariables file${state.files.length === 1 ? "" : "s"}: ${state.files
      .map((file) => `${file.flavor}/${file.account}`)
      .join(", ")}.`,
  );
} else {
  log("No Arena Ranked Duels.lua found yet. Install the addon on that client, then /reload.");
}
startWatching();
setInterval(() => {
  void pollSavedVariables();
}, 8000);
server.listen(PORT, "127.0.0.1", () => {
  log(`Uploader listening on ${href} — keep this window open.`);
  openBrowser(href);
  void pollSavedVariables();
});
