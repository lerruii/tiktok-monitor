# TikTok Monitor

Dashboard que monitorea **historias**: un video largo de YouTube (Reddit
story) que luego publicas en TikTok en partes (Parte 1, Parte 2, ...). Por
cada historia guardas el título + fecha de YouTube, y agregas el link de
TikTok de cada parte; el agente trae vistas/likes/comentarios de cada parte
automáticamente y grafica el histórico. **No usa la API oficial de TikTok**
— un agente lee la página pública de cada video que agregues. **Todo corre
en GitHub**: no hay que dejar tu PC prendida ni instalar nada localmente.

## Cómo funciona

```
public/                → el dashboard (GitHub Pages lo publica tal cual)
data/stories.json       → tus historias + los links de TikTok de cada parte (lo editas desde el dashboard)
data/latest.json        → snapshot más reciente, lo genera el agente
data/history.json       → histórico diario de vistas por parte, lo genera el agente
scripts/agente.mjs      → el agente: abre cada link de TikTok, extrae stats
.github/workflows/agente.yml       → corre el agente todos los días + cuando agregas una historia/parte
.github/workflows/deploy-pages.yml → publica public/ en GitHub Pages
```

Flujo completo: agregas una historia (o una parte nueva) en el dashboard →
tu navegador lo guarda directo en `data/stories.json` vía la API de GitHub →
eso dispara el workflow del agente → el agente trae las estadísticas de cada
link de TikTok y las commitea → eso dispara el deploy de Pages → el
dashboard se actualiza solo. Nunca corres nada en tu computadora.

## 1. Hacer el repo público

GitHub Pages gratis solo publica repos públicos (repos privados requieren
GitHub Pro). Si este repo está privado: **Settings → General → Danger Zone →
Change repository visibility → Public.**

> Esto significa que cualquiera con el link puede ver el dashboard, y que los
> archivos `data/*.json` son visibles para cualquiera en GitHub. Si eso te
> incomoda más adelante, la alternativa es pagar GitHub Pro o mover el hosting
> a Cloudflare Pages/Vercel manteniendo el repo privado.

## 2. Activar GitHub Pages

**Settings → Pages → Build and deployment → Source → "GitHub Actions"**
(no "Deploy from a branch"). El workflow `deploy-pages.yml` se encarga del
resto la próxima vez que hagas push a `main`.

## 3. (Opcional pero recomendado) Agregar el secret de Claude

El agente primero intenta extraer los datos con una regex simple. Si TikTok
cambia el formato de la página y eso falla, usa Claude como respaldo para
leer el HTML y sacar los números igual. Sin este secret, esos casos quedan
como error (puedes agregar las vistas a mano si hace falta).

**Settings → Secrets and variables → Actions → New repository secret**
- Name: `ANTHROPIC_API_KEY`
- Value: tu API key de https://console.anthropic.com/settings/keys

## 4. Subir este código

```powershell
git add -A
git commit -m "Modelo de historias (YouTube + partes de TikTok)"
git push
```

## 5. Generar tu token para poder agregar historias desde el dashboard

El dashboard necesita permiso para escribir en el repo cuando agregas una
historia o una parte nueva. Crea un **fine-grained personal access token**:

1. https://github.com/settings/personal-access-tokens/new
2. **Repository access** → Only select repositories → `tiktok-monitor`
3. **Permissions → Repository permissions → Contents** → `Read and write`
4. Genera el token y cópialo (empieza con `github_pat_...`) — solo lo verás una vez.

## 6. Configurar el dashboard

1. Abre tu Pages URL: `https://<tu-usuario>.github.io/tiktok-monitor/`
2. Click en el ícono de engranaje (⚙) arriba a la derecha.
3. Repositorio: `<tu-usuario>/tiktok-monitor`. Token: el que generaste. Guardar.

Esto se guarda solo en el navegador (localStorage) — nunca se sube a ningún
lado ni lo ve nadie más.

## 7. Agregar tu primera historia

Click en **"Agregar historia"**: título, fecha de subida en YouTube, y el
link de TikTok de la Parte 1. Guardar. En 1-2 minutos el agente corre
automáticamente y verás las vistas aparecer al recargar la página (el
workflow tarda un poco en completar; puedes ver el progreso en la pestaña
**Actions** del repo).

Cuando publiques la Parte 2 (o 3, 4...) de esa misma historia, entra a su
tarjeta en el dashboard y click en **"+ Agregar Parte N"** dentro de la
tarjeta — solo pide el link, no hace falta repetir título ni fecha.

## Limitaciones y notas

- **No hay API oficial de por medio**: el agente lee la página pública del
  video igual que lo haría un navegador. TikTok podría bloquear o cambiar el
  formato en cualquier momento; si un link empieza a fallar (columna `errors`
  en `data/latest.json`, o revisando el log del workflow en **Actions**), es
  normal — vuelve a intentar más tarde o reporta el problema.
- El agente corre una vez al día (09:00 hora Colombia/Perú/Ecuador) y también
  cada vez que agregas una historia o una parte nueva. Puedes forzarlo
  manualmente desde **Actions → Agente TikTok → Run workflow**.
- Links acortados (`vm.tiktok.com/...`) también funcionan: el agente sigue el
  redirect antes de leer la página.
- La fecha de YouTube es un dato manual (no se trackean vistas de YouTube por
  ahora, solo se guarda como referencia junto al título de la historia).
