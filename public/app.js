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
    plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="1.6"/><path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor"/></svg>',
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

  function fmtDateOnly(isoDate) {
    if (!isoDate) return "—";
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
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

  function historyForPart(history, storyId, part) {
    const key = `${storyId}:${part}`;
    return history
      .map((snap) => ({ date: snap.date, views: snap.parts?.[key]?.view_count }))
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

  function partBlock(part, storyId, history, colorIndex) {
    const colors = ["#6366f1", "#25f4ee", "#fe2c55", "#f59e0b"];
    const color = colors[colorIndex % colors.length];
    const block = el("div", "part-block");
    block.innerHTML = `
      <div class="part-label">Parte ${part.part}</div>
      <div class="part-views nums">${fmtNumber(part.view_count)} <span style="font-weight:500;color:var(--fg-muted);font-size:11px;">vistas</span></div>
      <div class="part-meta nums">
        <span>${ICONS.heart}${fmtNumber(part.like_count)}</span>
        <span>${ICONS.comment}${fmtNumber(part.comment_count)}</span>
        <span>${ICONS.share}${fmtNumber(part.share_count)}</span>
      </div>
      <div class="sparkline"><canvas></canvas></div>
      <a class="card-link" href="${part.share_url ?? part.url ?? "#"}" target="_blank" rel="noopener">${ICONS.link}Ver en TikTok</a>
    `;
    const points = historyForPart(history, storyId, part.part);
    const canvas = block.querySelector("canvas");
    requestAnimationFrame(() => renderSparkline(canvas, points, color));
    return block;
  }

  function addPartTile(storyId, nextPart) {
    const tile = el(
      "button",
      "part-block part-block-add",
      `${ICONS.plus}<span>Agregar Parte ${nextPart}</span>`
    );
    tile.type = "button";
    tile.dataset.storyId = storyId;
    return tile;
  }

  function renderStoryCard(story, history) {
    const card = el("div", "series-card");
    const hasPart2 = story.parts.length >= 2;
    card.innerHTML = `
      <div class="series-card-head">
        <div class="series-thumb series-thumb-youtube">${ICONS.youtube}</div>
        <div class="series-info">
          <div class="series-title">${story.title}</div>
          <div class="series-date">YouTube: ${fmtDateOnly(story.youtubeDate)}</div>
          ${
            hasPart2
              ? `<span class="badge badge-success" style="margin-top:8px;">${ICONS.check}Parte 2 disponible</span>`
              : `<span class="badge badge-warning" style="margin-top:8px;">${ICONS.clock}Esperando Parte 2</span>`
          }
        </div>
      </div>
      <div class="part-row"></div>
    `;
    const row = card.querySelector(".part-row");
    story.parts.forEach((part, i) => row.appendChild(partBlock(part, story.id, history, i)));
    row.appendChild(addPartTile(story.id, story.parts.length + 1));
    return card;
  }

  function renderKpis(latest) {
    const grid = document.getElementById("kpi-grid");
    const allParts = latest.stories.flatMap((s) => s.parts);
    const totalViews = allParts.reduce((sum, p) => sum + (p.view_count ?? 0), 0);
    const withPart2 = latest.stories.filter((s) => s.parts.length >= 2).length;
    const kpis = [
      { label: "Vistas totales", icon: ICONS.eye, value: fmtNumber(totalViews) },
      { label: "Historias", icon: ICONS.layers, value: latest.stories.length },
      { label: "Con parte 2 disponible", icon: ICONS.check, value: withPart2 },
      { label: "Partes en TikTok", icon: ICONS.film, value: allParts.length },
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
    const totals = history.map((h) => Object.values(h.parts ?? {}).reduce((s, m) => s + (m.view_count ?? 0), 0));
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

  function renderTable(stories) {
    const tbody = document.getElementById("videos-tbody");
    const rows = stories.flatMap((story) =>
      story.parts.map((part) => ({
        story_title: story.title,
        part: part.part,
        create_time: part.create_time,
        view_count: part.view_count,
        like_count: part.like_count,
        comment_count: part.comment_count,
        share_count: part.share_count,
        url: part.share_url ?? part.url,
      }))
    );
    document.getElementById("videos-hint").textContent = `${rows.length} partes`;

    let sortKey = "view_count";
    let sortDir = -1;

    function draw() {
      const sorted = [...rows].sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        if (typeof av === "string") return sortDir * av.localeCompare(bv);
        return sortDir * (av - bv);
      });
      tbody.innerHTML = sorted
        .map(
          (r) => `
        <tr>
          <td class="td-title" title="${(r.story_title ?? "").replace(/"/g, "&quot;")}">${r.story_title ?? "(sin título)"}</td>
          <td class="nums">Parte ${r.part}</td>
          <td class="nums">${fmtDate(r.create_time)}</td>
          <td class="nums">${fmtNumber(r.view_count)}</td>
          <td class="nums">${fmtNumber(r.like_count)}</td>
          <td class="nums">${fmtNumber(r.comment_count)}</td>
          <td class="nums">${fmtNumber(r.share_count)}</td>
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
    document.getElementById("trend-section").style.display = "none";
    document.getElementById("last-updated").textContent = "Sin historias todavía";
    const container = document.getElementById("series-container");
    container.innerHTML = "";
    container.appendChild(
      el(
        "div",
        "empty-state",
        `${ICONS.empty}<h3>Todavía no hay historias</h3><p>Usa el botón <strong>"Agregar historia"</strong> arriba: título, fecha de YouTube y el link de la Parte 1 en TikTok. El agente traerá las vistas automáticamente en 1-2 minutos.</p>`
      )
    );
    document.getElementById("videos-hint").textContent = "0 partes";
  }

  function main() {
    const data = window.__TIKTOK_DATA__;
    if (!data || !data.latest || !data.latest.stories || data.latest.stories.length === 0) {
      renderEmptyState();
      return;
    }

    const { latest, history } = data;
    document.getElementById("last-updated").textContent = fmtDateTime(latest.generatedAt);
    document.getElementById("trend-hint").textContent = `${history.length} días de histórico`;

    renderKpis(latest);
    renderTrendChart(history);

    const seriesContainer = document.getElementById("series-container");
    seriesContainer.innerHTML = "";
    const grid = el("div", "series-grid");
    latest.stories
      .slice()
      .sort((a, b) => Number(a.parts.length >= 2) - Number(b.parts.length >= 2))
      .forEach((s) => grid.appendChild(renderStoryCard(s, history)));
    seriesContainer.appendChild(grid);

    renderTable(latest.stories);
  }

  // ---- GitHub-backed "agregar historia/parte" + configuración ----

  const GH_API = "https://api.github.com";
  const STORIES_PATH = "data/stories.json";
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
    const firstInput = modal.querySelector("input:not([type=hidden])");
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

  async function getStoriesFile() {
    try {
      const data = await githubRequest(`contents/${STORIES_PATH}`, { method: "GET" });
      const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      return { content: Array.isArray(content) ? content : [], sha: data.sha };
    } catch (err) {
      if (String(err.message).includes("404")) return { content: [], sha: undefined };
      throw err;
    }
  }

  async function putStoriesFile(stories, sha, message) {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(stories, null, 2) + "\n")));
    return githubRequest(`contents/${STORIES_PATH}`, {
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

  function makeStoryId() {
    return `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function initGithubUI() {
    const btnOpenAddStory = document.getElementById("btn-open-add-story");
    const btnOpenSettings = document.getElementById("btn-open-settings");
    const modalAddStory = document.getElementById("modal-add-story");
    const modalAddPart = document.getElementById("modal-add-part");
    const modalSettings = document.getElementById("modal-settings");
    const formAddStory = document.getElementById("form-add-story");
    const formAddPart = document.getElementById("form-add-part");
    const formSettings = document.getElementById("form-settings");
    const inputOwner = document.getElementById("input-owner");
    const inputToken = document.getElementById("input-token");

    if (!btnOpenAddStory || !modalAddStory) return; // dashboard sin UI de edición

    const allModals = [modalAddStory, modalAddPart, modalSettings];

    const { ownerRepo, token } = getSettings();
    if (inputOwner) inputOwner.value = ownerRepo;
    if (inputToken && token) inputToken.placeholder = "•••••••••••••• (guardado)";

    function requireConfigOrPrompt() {
      const { ownerRepo, token } = getSettings();
      if (!ownerRepo || !token) {
        showToast("Primero configura el repositorio y el token.", "error");
        openModal("modal-settings");
        return false;
      }
      return true;
    }

    btnOpenAddStory.addEventListener("click", () => {
      if (!requireConfigOrPrompt()) return;
      openModal("modal-add-story");
    });

    btnOpenSettings.addEventListener("click", () => openModal("modal-settings"));

    // Delegación: los botones "+ Agregar Parte N" se crean dinámicamente por tarjeta.
    document.getElementById("series-container").addEventListener("click", (e) => {
      const tile = e.target.closest(".part-block-add");
      if (!tile) return;
      if (!requireConfigOrPrompt()) return;
      document.getElementById("input-part-story-id").value = tile.dataset.storyId;
      const title = tile.closest(".series-card")?.querySelector(".series-title")?.textContent ?? "";
      document.getElementById("add-part-story-label").textContent = `Historia: ${title}`;
      openModal("modal-add-part");
    });

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.closest(".modal-backdrop")));
    });

    allModals.forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      allModals.forEach((modal) => {
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

    formAddStory.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFieldError("add-story-error", "");
      const title = document.getElementById("input-story-title").value.trim();
      const youtubeDate = document.getElementById("input-story-youtube-date").value;
      const url = document.getElementById("input-story-link").value.trim();
      if (!title) {
        setFieldError("add-story-error", "Escribe un título.");
        return;
      }
      if (!youtubeDate) {
        setFieldError("add-story-error", "Selecciona la fecha de YouTube.");
        return;
      }
      if (!isValidTikTokUrl(url)) {
        setFieldError("add-story-error", "Pega un link válido de tiktok.com.");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-add-story");
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
      try {
        const { content, sha } = await getStoriesFile();
        const now = new Date().toISOString();
        content.push({
          id: makeStoryId(),
          title,
          youtubeDate,
          addedAt: now,
          tiktokLinks: [{ part: 1, url, addedAt: now }],
        });
        await putStoriesFile(content, sha, `feat: agregar historia "${title}"`);
        formAddStory.reset();
        closeModal(modalAddStory);
        showToast("Historia agregada. El agente la procesará en ~1-2 min.", "success");
      } catch (err) {
        setFieldError("add-story-error", err.message || "No se pudo guardar. Revisa el token y los permisos.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar";
      }
    });

    formAddPart.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFieldError("add-part-error", "");
      const storyId = document.getElementById("input-part-story-id").value;
      const url = document.getElementById("input-part-link").value.trim();
      if (!isValidTikTokUrl(url)) {
        setFieldError("add-part-error", "Pega un link válido de tiktok.com.");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-add-part");
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
      try {
        const { content, sha } = await getStoriesFile();
        const story = content.find((s) => s.id === storyId);
        if (!story) {
          setFieldError("add-part-error", "No se encontró la historia (¿alguien más la editó? recarga la página).");
          return;
        }
        story.tiktokLinks = story.tiktokLinks ?? [];
        if (story.tiktokLinks.some((l) => l.url === url)) {
          setFieldError("add-part-error", "Ese link ya está agregado a esta historia.");
          return;
        }
        const nextPart = story.tiktokLinks.length + 1;
        story.tiktokLinks.push({ part: nextPart, url, addedAt: new Date().toISOString() });
        await putStoriesFile(content, sha, `feat: agregar parte ${nextPart} a "${story.title}"`);
        formAddPart.reset();
        closeModal(modalAddPart);
        showToast(`Parte ${nextPart} agregada. El agente la procesará en ~1-2 min.`, "success");
      } catch (err) {
        setFieldError("add-part-error", err.message || "No se pudo guardar. Revisa el token y los permisos.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", main);
  document.addEventListener("DOMContentLoaded", initGithubUI);
})();
