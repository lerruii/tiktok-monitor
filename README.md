# TikTok Monitor

Dashboard local que monitorea las historias de `@redditsincensura77` en TikTok:
detecta automáticamente cuándo un video tiene "Parte 2" y grafica el histórico
de vistas de cada uno. Los datos vienen de la **API oficial de TikTok for
Developers** (no hay scraping ni bots) y un agente corre una vez al día para
mantener todo actualizado.

## Cómo funciona

```
auth/authorize.mjs   → una sola vez: conecta tu cuenta de TikTok (OAuth)
agent/check-tiktok.mjs → corre a diario: trae tus videos + vistas, detecta Parte 1/2
public/index.html     → dashboard que lees en el navegador
scripts/install-task.ps1 → programa el paso anterior a diario en Windows
```

## 1. Crear la app en TikTok for Developers

1. Entra a https://developers.tiktok.com/apps y crea una cuenta de developer si no tienes una (con tu cuenta de TikTok, `@redditsincensura77`).
2. Crea una nueva App (cualquier nombre, ej. "Monitor Personal").
3. Dentro de la app, agrega el producto **Login Kit**.
4. En la configuración del Login Kit:
   - Agrega el **Redirect URI**: `http://localhost:8787/callback`
   - Activa los scopes: `user.info.basic` y `video.list`
5. En **Target Users / Testers** (mientras la app no esté auditada por TikTok), agrega la cuenta `@redditsincensura77` como probador — si no la agregas ahí, el login del paso 3 más abajo fallará con "user not eligible".
6. Copia el **Client Key** y **Client Secret** de la app.

> Nota: mientras la app esté en modo "unaudited" (sin revisión de TikTok), solo las cuentas que agregues como Target Users podrán autorizarla. Para uso personal esto es suficiente y no requiere esperar la aprobación de TikTok.

## 2. Configurar el proyecto

```powershell
cd "tiktok-monitor"
copy .env.example .env
```

Abre `.env` y pega tu `Client Key` y `Client Secret`:

```
TIKTOK_CLIENT_KEY=tu_client_key
TIKTOK_CLIENT_SECRET=tu_client_secret
TIKTOK_REDIRECT_URI=http://localhost:8787/callback
```

## 3. Conectar tu cuenta (una sola vez)

```powershell
npm run authorize
```

Abre `http://localhost:8787` en tu navegador, haz click en **"Conectar con TikTok"**,
inicia sesión como `@redditsincensura77` y aprueba los permisos. La ventana
confirmará "Conectado ✅" y guarda el token en `data/tokens.json` (no lo
compartas, es una credencial sensible).

El token de acceso dura 24h y el de refresco 1 año, pero **se renuevan solos**
cada vez que el agente diario corre — no tendrás que repetir este paso salvo
que dejes de correr el agente por más de un año.

## 4. Probar el agente manualmente

```powershell
npm run check
```

Esto trae tus videos reales, detecta series "Parte 1/2" por similitud de
título, y actualiza:
- `data/latest.json` — snapshot actual de todos tus videos
- `data/history.json` — histórico diario de vistas/likes/comentarios/shares
- `public/data.js` — lo que lee el dashboard

## 5. Ver el dashboard

Abre `public/index.html` directamente en el navegador, o sírvelo con cualquier
servidor estático, por ejemplo:

```powershell
npx serve public
```

## 6. Automatizar (tarea diaria)

Ya se instaló una tarea programada de Windows llamada **TikTokMonitorAgent**
que corre `scripts/run-agent.cmd` todos los días a las **09:00** mientras tu
usuario esté logueado en esta PC. El log queda en `logs/agent.log`.

Comandos útiles:

```powershell
# Reinstalar / cambiar de hora (ej. 20:30)
powershell -ExecutionPolicy Bypass -File .\scripts\install-task.ps1 -Time "20:30"

# Quitar la tarea
powershell -ExecutionPolicy Bypass -File .\scripts\uninstall-task.ps1

# Ver la tarea en el Programador de tareas de Windows
schtasks /Query /TN TikTokMonitorAgent /V /FO LIST
```

## Cómo se detecta "Parte 2"

El agente busca en el título de cada video un patrón `PT<numero>`, `Parte
<numero>` o `Part <numero>` (ej. "... PT1 #historias"). Agrupa como la misma
"serie" los videos cuyo texto previo a esa marca es muy similar (aunque no
sea idéntico palabra por palabra), y marca la serie como completa cuando
detecta tanto la Parte 1 como la Parte 2. Esto corre automáticamente sobre
**todos** tus videos — no hace falta agregar links a mano; en cuanto publiques
la Parte 2 de una historia, aparecerá emparejada en el próximo run del agente.

## Notas de seguridad

- `data/tokens.json` y `.env` contienen credenciales — no los subas a ningún
  repositorio ni los compartas.
- Todo corre localmente en tu PC; nada se envía a servidores de terceros.
