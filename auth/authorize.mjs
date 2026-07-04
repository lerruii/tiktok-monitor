import http from "node:http";
import crypto from "node:crypto";
import { config, assertConfigured } from "../lib/config.mjs";
import { exchangeCodeForTokens } from "../lib/tokens.mjs";

assertConfigured();

const state = crypto.randomBytes(16).toString("hex");
const codeVerifier = crypto.randomBytes(32).toString("base64url");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

function authorizeUrl() {
  const params = new URLSearchParams({
    client_key: config.clientKey,
    response_type: "code",
    scope: config.scope,
    redirect_uri: config.redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${config.authServerPort}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Conectar TikTok</title></head>
<body style="font-family: system-ui; max-width: 560px; margin: 80px auto; text-align:center;">
  <h1>Conectar cuenta de TikTok</h1>
  <p>Vas a autorizar a este agente a leer las vistas de tus videos (scopes: <code>${config.scope}</code>).</p>
  <p><a href="${authorizeUrl()}" style="display:inline-block;padding:14px 28px;background:#000;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">Conectar con TikTok</a></p>
</body></html>`);
    return;
  }

  if (url.pathname === "/callback") {
    const returnedState = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Error de TikTok</h1><p>${error}: ${errorDescription ?? ""}</p>`);
      return;
    }
    if (returnedState !== state) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>state invalido</h1><p>Posible CSRF, intenta de nuevo desde /.</p>");
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code, codeVerifier);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html lang="es"><body style="font-family: system-ui; max-width: 560px; margin: 80px auto; text-align:center;">
  <h1>Conectado ✅</h1>
  <p>Cuenta TikTok (open_id ${tokens.open_id}) autorizada correctamente.</p>
  <p>Ya puedes cerrar esta ventana y ejecutar <code>npm run check</code>, o instalar la tarea programada diaria.</p>
</body></html>`);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Error intercambiando el codigo</h1><pre>${String(err.message ?? err)}</pre>`);
    } finally {
      setTimeout(() => server.close(), 500);
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(config.authServerPort, () => {
  console.log(`Abre http://localhost:${config.authServerPort} en tu navegador y haz click en "Conectar con TikTok".`);
});
