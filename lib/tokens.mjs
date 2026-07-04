import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, config } from "./config.mjs";

const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
const REFRESH_BUFFER_SECONDS = 300;

export function readTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return null;
  return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
}

function writeTokens(tokens) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export function saveTokenResponse(body) {
  const now = Math.floor(Date.now() / 1000);
  const tokens = {
    open_id: body.open_id,
    scope: body.scope,
    access_token: body.access_token,
    access_expires_at: now + Number(body.expires_in ?? 0),
    refresh_token: body.refresh_token,
    refresh_expires_at: now + Number(body.refresh_expires_in ?? 0),
    token_type: body.token_type,
    updated_at: now,
  };
  writeTokens(tokens);
  return tokens;
}

async function requestToken(params) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(
      `TikTok oauth/token error (${res.status}): ${JSON.stringify(body)}`
    );
  }
  return body;
}

export async function exchangeCodeForTokens(code, codeVerifier) {
  const body = await requestToken({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });
  return saveTokenResponse(body);
}

async function refreshTokens(refreshToken) {
  const body = await requestToken({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return saveTokenResponse(body);
}

export async function getValidAccessToken() {
  let tokens = readTokens();
  if (!tokens) {
    throw new Error(
      "No hay tokens guardados todavia. Ejecuta primero: npm run authorize"
    );
  }
  const now = Math.floor(Date.now() / 1000);
  if (now >= tokens.refresh_expires_at) {
    throw new Error(
      "El refresh_token expiro (llevaba mas de un ano sin usarse). Ejecuta de nuevo: npm run authorize"
    );
  }
  if (now >= tokens.access_expires_at - REFRESH_BUFFER_SECONDS) {
    tokens = await refreshTokens(tokens.refresh_token);
  }
  return tokens.access_token;
}
