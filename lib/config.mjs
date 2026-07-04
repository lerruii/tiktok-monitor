import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = loadEnvFile(path.join(ROOT, ".env"));

function get(name, fallback) {
  return process.env[name] ?? fileEnv[name] ?? fallback;
}

export const ROOT_DIR = ROOT;
export const DATA_DIR = path.join(ROOT, "data");
export const PUBLIC_DIR = path.join(ROOT, "public");
export const LOGS_DIR = path.join(ROOT, "logs");

export const config = {
  clientKey: get("TIKTOK_CLIENT_KEY", ""),
  clientSecret: get("TIKTOK_CLIENT_SECRET", ""),
  redirectUri: get("TIKTOK_REDIRECT_URI", "http://localhost:8787/callback"),
  authServerPort: Number(get("AUTH_SERVER_PORT", "8787")),
  scope: "user.info.basic,video.list",
};

export function assertConfigured() {
  const missing = [];
  if (!config.clientKey) missing.push("TIKTOK_CLIENT_KEY");
  if (!config.clientSecret) missing.push("TIKTOK_CLIENT_SECRET");
  if (missing.length) {
    throw new Error(
      `Falta configurar ${missing.join(", ")} en el archivo .env (copia .env.example a .env y rellena los valores).`
    );
  }
}
