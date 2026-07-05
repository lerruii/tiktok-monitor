(function () {
  const ICONS = {
    eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2-.3 3.7.7 5 2.4C11.8 4.7 13.5 3.7 15.5 4c3.5.5 5 4 3.5 7.2C16.5 15.9 12 20.5 12 20.5Z" stroke="currentColor" stroke-width="1.6"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5 9.5 17 19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 2 9 5-9 5-9-5 9-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 17 9 11 13 15 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 4v16M16 4v16M3 9h5M16 9h5M3 15h5M16 15h5" stroke="currentColor" stroke-width="1.6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 14a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  function fmtNumber(n) {
    if (n === undefined || n === null) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function fmtDate(unixSeconds) {
    if (!unixSeconds) return "—";
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
  }

  function fmtDateTime(iso) {
    if (!iso) return "Sin datos todavía";
    const d = new Date(iso);
    return "Actualizado " + d.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function historyForVideo(history, videoId) {
    return history
      .map((snap) => ({ date: snap.date, views: snap.videos?.[videoId]?.view_count }))
      .filter((p) => p.views !== undefined);
  }

  function renderSparkline(canvas, points, color) {
    if (!points.length) return;
    new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map((p) => p.date),
        datasets: [
          {
            data: points.map((p) => p.views),
            borderColor: color,
            backgroundColor: color + "26",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        elements: { line: { capBezierPoints: true } },
      },
    });
  }

  function partBlock(entry, history, isPrimary) {
    if (!entry) {
      return el(
        "div",
        "part-block empty",
        `${ICONS.clock}<span>Esperando Parte 2</span>`
      );
    }
    const v = entry.video;
    const block = el("div", "part-block");
    block.innerHTML = `
      <div class="part-label">Parte ${entry.part}</div>
      <div class="part-views nums">${fmtNumber(v.view_count)} <span style="font-weight:500;color:var(--fg-muted);font-size:11px;">vistas</span></div>
      <div class="part-meta nums">
        <span>${ICONS.heart}${fmtNumber(v.like_count)}</span>
        <span>${ICONS.comment}${fmtNumber(v.comment_count)}</span>
        <span>${ICONS.share}${fmtNumber(v.share_count)}</span>
      </div>
      <div class="sparkline"><canvas></canvas></div>
      <a class="card-link" href="${v.share_url ?? "#"}" target="_blank" rel="noopener">${ICONS.link}Ver en TikTok</a>
    `;
    const points = historyForVideo(history, v.id);
    const canvas = block.querySelector("canvas");
    requestAnimationFrame(() => renderSparkline(canvas, points, isPrimary ? "#6366f1" : "#25f4ee"));
    return block;
  }

  function renderSeriesCard(series, history) {
    const part1 = series.parts.find((p) => p.part === 1) ?? series.parts[0];
    const part2 = series.parts.find((p) => p.part === 2);
    const cover = part1?.video?.cover_image_url;

    const card = el("div", "series-card");
    card.innerHTML = `
      <div class="series-card-head">
        ${cover ? `<img class="series-thumb" src="${cover}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<div class="series-thumb"></div>`}
        <div class="series-info">
          <div class="series-title">${series.title}</div>
          <div class="series-date">Publicado ${fmtDate(part1?.video?.create_time)}</div>
          ${
            series.hasPart2
              ? `<span class="badge badge-success" style="margin-top:8px;">${ICONS.check}Parte 2 disponible</span>`
              : `<span class="badge badge-warning" style="margin-top:8px;">${ICONS.clock}Esperando Parte 2</span>`
          }
        </div>
      </div>
      <div class="part-row"></div>
    `;
    const row = card.querySelector(".part-row");
    row.appendChild(partBlock(part1, history, true));
    row.appendChild(partBlock(part2, history, false));
    return card;
  }

  function renderKpis(latest) {
    const grid = document.getElementById("kpi-grid");
    const totalViews = latest.videos.reduce((sum, v) => sum + (v.view_count ?? 0), 0);
    const withPart2 = latest.series.filter((s) => s.hasPart2).length;
    const kpis = [
      { label: "Vistas totales", icon: ICONS.eye, value: fmtNumber(totalViews) },
      { label: "Historias detectadas", icon: ICONS.layers, value: latest.series.length },
      { label: "Con parte 2 disponible", icon: ICONS.check, value: withPart2 },
      { label: "Videos monitoreados", icon: ICONS.film, value: latest.videos.length },
    ];
    grid.innerHTML = kpis
      .map(
        (k) => `
      <div class="kpi-card">
        <div class="kpi-label">${k.icon.replace("<svg", '<svg class="kpi-icon"')}${k.label}</div>
        <div class="kpi-value nums">${k.value}</div>
      </div>`
      )
      .join("");
  }

  function renderTrendChart(history) {
    const ctx = document.getElementById("trend-chart");
    const labels = history.map((h) => h.date);
    const totals = history.map((h) => Object.values(h.videos ?? {}).reduce((s, m) => s + (m.view_count ?? 0), 0));
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Vistas totales",
            data: totals,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.15)",
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: "#6366f1",
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#16161a",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#f4f4f6",
            bodyColor: "#c9c9cf",
            padding: 10,
            callbacks: { label: (c) => ` ${fmtNumber(c.parsed.y)} vistas` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#5c5f68", maxRotation: 0, autoSkip: true } },
          y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#5c5f68", callback: (v) => fmtNumber(v) } },
        },
      },
    });
  }

  function renderTable(videos) {
    const tbody = document.getElementById("videos-tbody");
    document.getElementById("videos-hint").textContent = `${videos.length} videos`;

    let sortKey = "view_count";
    let sortDir = -1;

    function draw() {
      const sorted = [...videos].sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        if (typeof av === "string") return sortDir * av.localeCompare(bv);
        return sortDir * (av - bv);
      });
      tbody.innerHTML = sorted
        .map(
          (v) => `
        <tr>
          <td class="td-title" title="${(v.title ?? "").replace(/"/g, "&quot;")}">${v.title ?? "(sin título)"}</td>
          <td class="nums">${fmtDate(v.create_time)}</td>
          <td class="nums">${fmtNumber(v.view_count)}</td>
          <td class="nums">${fmtNumber(v.like_count)}</td>
          <td class="nums">${fmtNumber(v.comment_count)}</td>
          <td class="nums">${fmtNumber(v.share_count)}</td>
        </tr>`
        )
        .join("");
    }

    document.querySelectorAll("#videos-table thead th").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        sortDir = key === sortKey ? -sortDir : -1;
        sortKey = key;
        draw();
      });
    });

    draw();
  }

  function renderEmptyState() {
    document.getElementById("kpi-grid").style.display = "none";
    document.querySelector(".trend-panel").parentElement.style.display = "none";
    document.getElementById("last-updated").textContent = "Sin conectar";
    const container = document.getElementById("series-container");
    container.innerHTML = "";
    container.appendChild(
      el(
        "div",
        "empty-state",
        `${ICONS.empty}<h3>Todavía no hay datos</h3><p>Conecta tu cuenta de TikTok ejecutando <code>npm run authorize</code> y luego <code>npm run check</code> (o espera a la tarea programada diaria) para ver aquí tus historias y vistas.</p>`
      )
    );
    document.getElementById("videos-hint").textContent = "0 videos";
  }

  function main() {
    const data = window.__TIKTOK_DATA__;
    if (!data || !data.latest || !data.latest.videos || data.latest.videos.length === 0) {
      renderEmptyState();
      return;
    }

    const { latest, history } = data;
    document.getElementById("last-updated").textContent = fmtDateTime(latest.generatedAt);
    document.getElementById("trend-hint").textContent = `${history.length} días de histórico`;

    renderKpis(latest);
    renderTrendChart(history);

    const seriesContainer = document.getElementById("series-container");
    if (latest.series.length === 0) {
      seriesContainer.appendChild(
        el(
          "div",
          "empty-state",
          `${ICONS.empty}<h3>Ninguna historia con formato "Parte 1/2" todavía</h3><p>Cuando publiques un video cuyo título incluya "PT1", "Parte 1", etc. aparecerá aquí automáticamente.</p>`
        )
      );
    } else {
      const grid = el("div", "series-grid");
      latest.series
        .slice()
        .sort((a, b) => Number(b.hasPart2) - Number(a.hasPart2))
        .forEach((s) => grid.appendChild(renderSeriesCard(s, history)));
      seriesContainer.appendChild(grid);
    }

    renderTable(latest.videos);
  }

  // ---- GitHub-backed "agregar video" + configuración ----

  const GH_API = "https://api.github.com";
  const LINKS_PATH = "data/links.json";
  const STORAGE_OWNER = "tiktokMonitor.ghRepo";
  const STORAGE_TOKEN = "tiktokMonitor.ghToken";

  function getSettings() {
    return {
      ownerRepo: localStorage.getItem(STORAGE_OWNER) || "",
      token: localStorage.getItem(STORAGE_TOKEN) || "",
    };
  }

  function saveSettings(ownerRepo, token) {
    localStorage.setItem(STORAGE_OWNER, ownerRepo);
    localStorage.setItem(STORAGE_TOKEN, token);
  }

  function clearToken() {
    localStorage.removeItem(STORAGE_TOKEN);
  }

  function showToast(message, type) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const toast = el("div", `toast toast-${type || "success"}`, message);
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    const firstInput = modal.querySelector("input");
    if (firstInput) firstInput.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  function setFieldError(id, message) {
    const box = document.getElementById(id);
    if (!box) return;
    if (!message) {
      box.hidden = true;
      box.textContent = "";
    } else {
      box.hidden = false;
      box.textContent = message;
    }
  }

  async function githubRequest(path, options) {
    const { ownerRepo, token } = getSettings();
    if (!ownerRepo || !token) {
      throw new Error("Falta configurar el repositorio y el token en Configuración.");
    }
    const res = await fetch(`${GH_API}/repos/${ownerRepo}/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Error de GitHub (HTTP ${res.status})`);
    }
    return res.json();
  }

  async function getLinksFile() {
    try {
      const data = await githubRequest(`contents/${LINKS_PATH}`, { method: "GET" });
      const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      return { content: Array.isArray(content) ? content : [], sha: data.sha };
    } catch (err) {
      if (String(err.message).includes("404")) return { content: [], sha: undefined };
      throw err;
    }
  }

  async function putLinksFile(links, sha, message) {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(links, null, 2) + "\n")));
    return githubRequest(`contents/${LINKS_PATH}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: encoded, sha }),
    });
  }

  function isValidTikTokUrl(value) {
    try {
      const u = new URL(value);
      return /tiktok\.com$/i.test(u.hostname.replace(/^www\./, "")) || /vm\.tiktok\.com$/i.test(u.hostname);
    } catch {
      return false;
    }
  }

  function initGithubUI() {
    const btnOpenAdd = document.getElementById("btn-open-add");
    const btnOpenSettings = document.getElementById("btn-open-settings");
    const modalAdd = document.getElementById("modal-add");
    const modalSettings = document.getElementById("modal-settings");
    const formAdd = document.getElementById("form-add");
    const formSettings = document.getElementById("form-settings");
    const inputOwner = document.getElementById("input-owner");
    const inputToken = document.getElementById("input-token");
    const inputLink = document.getElementById("input-link");

    if (!btnOpenAdd || !modalAdd) return; // dashboard sin UI de edición

    const { ownerRepo, token } = getSettings();
    if (inputOwner) inputOwner.value = ownerRepo;
    if (inputToken && token) inputToken.placeholder = "•••••••••••••• (guardado)";

    btnOpenAdd.addEventListener("click", () => {
      const { ownerRepo, token } = getSettings();
      if (!ownerRepo || !token) {
        showToast("Primero configura el repositorio y el token.", "error");
        openModal("modal-settings");
        return;
      }
      openModal("modal-add");
    });

    btnOpenSettings.addEventListener("click", () => openModal("modal-settings"));

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.closest(".modal-backdrop")));
    });

    [modalAdd, modalSettings].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      [modalAdd, modalSettings].forEach((modal) => {
        if (!modal.hidden) closeModal(modal);
      });
    });

    formSettings.addEventListener("submit", (e) => {
      e.preventDefault();
      setFieldError("settings-error", "");
      const owner = inputOwner.value.trim();
      const tok = inputToken.value.trim();
      if (!owner.includes("/")) {
        setFieldError("settings-error", "Usa el formato usuario/repo, ej. lerruii/tiktok-monitor.");
        return;
      }
      if (!tok) {
        setFieldError("settings-error", "Pega tu token de GitHub.");
        return;
      }
      saveSettings(owner, tok);
      inputToken.value = "";
      inputToken.placeholder = "•••••••••••••• (guardado)";
      closeModal(modalSettings);
      showToast("Configuración guardada en este navegador.", "success");
    });

    document.getElementById("btn-clear-token").addEventListener("click", () => {
      clearToken();
      inputToken.placeholder = "github_pat_...";
      showToast("Token borrado de este navegador.", "success");
    });

    formAdd.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFieldError("add-error", "");
      const url = inputLink.value.trim();
      if (!isValidTikTokUrl(url)) {
        setFieldError("add-error", "Pega un link válido de tiktok.com.");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-add");
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
      try {
        const { content, sha } = await getLinksFile();
        if (content.some((entry) => (typeof entry === "string" ? entry : entry.url) === url)) {
          setFieldError("add-error", "Ese link ya está en la lista.");
          return;
        }
        content.push({ url, addedAt: new Date().toISOString() });
        await putLinksFile(content, sha, `feat: agregar video ${url}`);
        inputLink.value = "";
        closeModal(modalAdd);
        showToast("Video agregado. El agente lo procesará en ~1-2 min.", "success");
      } catch (err) {
        setFieldError("add-error", err.message || "No se pudo guardar. Revisa el token y los permisos.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", main);
  document.addEventListener("DOMContentLoaded", initGithubUI);
})();
