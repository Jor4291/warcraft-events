import { exec } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
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

function isPackaged() {
  const exec = path.basename(process.execPath).toLowerCase();
  return exec !== "node" && exec !== "node.exe" && exec !== "bun" && exec !== "bun.exe";
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
  lastHash: "",
  log: [],
  stopWatch: () => undefined,
};

function log(message, extra = {}) {
  state.log.unshift({ at: new Date().toISOString(), message, ...extra });
  state.log = state.log.slice(0, 40);
  console.log(`[uploader] ${message}`);
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
    throw new Error("No ARDU1 uploadJson in that SavedVariables file yet. /reload or log out after a rated duel.");
  }
  const hash = payloadHash(payload);
  if (hash === state.lastHash) {
    log("Skipped — same log already sent.");
    return { skipped: true };
  }
  const result = await uploadPayload(state.config.siteUrl, state.config.token, payload);
  state.lastHash = hash;
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
    log("Uploader already running — opening it.");
    openBrowser(href);
    process.exit(0);
    return;
  }
  throw error;
});
refreshFiles();
startWatching();
server.listen(PORT, "127.0.0.1", () => {
  log(`Uploader listening on ${href}`);
  openBrowser(href);
});
