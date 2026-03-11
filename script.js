/* ============================================================
   RETRO TERMINAL — script.js
   Auth + Save/Load + Dashboard + Dev tools
   ============================================================ */

// ── Password dictionary ──────────────────────────────────────
const passwords = {
  "summer2023": "FriendA",
  "fall2023":   "FriendB",
  "spring2024": "FriendC",
  "dev123":     "Dev"        // Developer / admin access
};

// ── Session & save-data helpers ──────────────────────────────
const AUTH_KEY     = "retro_arcade_user";
const SAVE_KEY     = "retro_arcade_save";

function saveSession(username) { sessionStorage.setItem(AUTH_KEY, username); }
function getSession()          { return sessionStorage.getItem(AUTH_KEY); }
function clearSession()        { sessionStorage.removeItem(AUTH_KEY); }

function getSaveData() {
  try { return JSON.parse(sessionStorage.getItem(SAVE_KEY)) || defaultSave(); }
  catch { return defaultSave(); }
}
function setSaveData(data) {
  sessionStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function defaultSave() {
  return {
    userId: generateId(),
    password: "",
    settings: { theme: "default" },
    gameProgress: {
      pong:      { highScore: 0 },
      snake:     { highScore: 0 },
      memory:    { bestTime: null },
      breakout:  { highScore: 0 },
      tictactoe: { wins: 0 }
    }
  };
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Theme helpers ────────────────────────────────────────────
function applyTheme(name) {
  document.body.classList.remove("theme-darkgrey");
  if (name === "darkgrey") document.body.classList.add("theme-darkgrey");
}

function restoreTheme() {
  const save = getSaveData();
  applyTheme(save.settings.theme || "default");
}

// ══════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ══════════════════════════════════════════════════════════════
function initLogin() {
  if (getSession()) { window.location.replace("index.html"); return; }
  restoreTheme();

  const form      = document.getElementById("login-form");
  const input     = document.getElementById("password-input");
  const msgEl     = document.getElementById("login-msg");
  const submitBtn = document.getElementById("login-btn");
  const fileInput = document.getElementById("save-file-input");
  const dropZone  = document.getElementById("file-drop-zone");
  const dropText  = document.getElementById("file-drop-text");
  const fileStatus = document.getElementById("file-status");

  if (!form) return;

  let loadedSave = null; // holds parsed save file if uploaded

  typePrompt("sys-prompt", "ENTER ACCESS CODE TO CONTINUE...", 40);

  // ── File drop zone ────────────────────────────────────────
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) handleSaveFile(file);
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) handleSaveFile(fileInput.files[0]);
    });
  }

  function handleSaveFile(file) {
    if (!file.name.endsWith(".json")) {
      showMsg(fileStatus, "error", "✗ INVALID FILE TYPE. USE .json SAVE FILE.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.password) throw new Error("No password field");
        loadedSave = data;
        if (dropText) dropText.textContent = "✓ " + file.name.toUpperCase() + " LOADED";
        dropZone.classList.add("file-loaded");
        showMsg(fileStatus, "success", "✓ SAVE FILE PARSED. PASSWORD AUTO-FILLED.");
        // Auto-fill the password from the save file
        input.value = data.password;
        input.dispatchEvent(new Event("input"));
      } catch {
        loadedSave = null;
        showMsg(fileStatus, "error", "✗ INVALID SAVE FILE FORMAT.");
      }
    };
    reader.readAsText(file);
  }

  // ── Clear error on typing ────────────────────────────────
  input.addEventListener("input", () => {
    msgEl.textContent = "";
    msgEl.className = "msg hidden";
    input.style.borderColor = "";
  });

  // ── Submit ───────────────────────────────────────────────
  form.addEventListener("submit", e => {
    e.preventDefault();
    const val = input.value.trim();

    if (!val) {
      showMsg(msgEl, "error", "! NO INPUT DETECTED. TRY AGAIN.");
      shakePulse(input); return;
    }

    if (passwords.hasOwnProperty(val)) {
      const user = passwords[val];
      saveSession(user);

      // Merge loaded save data into session, or create fresh save
      const save = loadedSave || defaultSave();
      save.password = val;
      // Apply any settings from save file
      if (save.settings && save.settings.theme) {
        applyTheme(save.settings.theme);
      }
      setSaveData(save);

      submitBtn.disabled = true;
      submitBtn.querySelector("span").textContent = "AUTHENTICATING...";
      // Hidden for all users — don't expose alias
      showMsg(msgEl, "success", "✓ ACCESS GRANTED — REDIRECTING...");

      setTimeout(() => { window.location.href = "index.html"; }, 900);
    } else {
      showMsg(msgEl, "error", "✗ INVALID CREDENTIALS. ACCESS DENIED.");
      shakePulse(input);
      input.select();
      input.style.borderColor = "var(--error)";
      setTimeout(() => { input.style.borderColor = ""; }, 1200);
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  SHARED INDEX-PAGE INIT (runs on all post-login pages)
// ══════════════════════════════════════════════════════════════
function initIndex() {
  const user = getSession();
  if (!user) { window.location.replace("login.html"); return; }

  restoreTheme();

  // Hidden for all users — display-name is commented out in HTML
  // const nameEl = document.getElementById("display-name");
  // if (nameEl) nameEl.textContent = user.toUpperCase();

  // Live clock header
  updateClock();
  setInterval(updateClock, 1000);

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "login.html";
    });
  }

  // Dev-only: Settings button
  if (user === "Dev") {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) settingsBtn.style.display = "inline-block";
    initSettingsPanel();
  }

  // Game cards (games.html / old index usage)
  document.querySelectorAll(".game-card[data-wip='true']").forEach(card => {
    card.addEventListener("click", e => {
      e.preventDefault();
      const title = card.querySelector(".game-title").textContent;
      flashBanner(`[ ${title} ] — COMING SOON. MODULE NOT YET LOADED.`, "error");
    });
  });

  // Dashboard home card links (non-wip)
  document.querySelectorAll(".dash-card[href]").forEach(card => {
    // these are real links — let them navigate normally
  });

  // Page-specific inits
  const page = document.body.dataset.subpage;
  if (page === "downloads") initDownloads();
  if (page === "uploads")   initUploads();
  if (page === "unblocker") initUnblocker();
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS PANEL (Dev only)
// ══════════════════════════════════════════════════════════════
function initSettingsPanel() {
  const panel   = document.getElementById("settings-panel");
  const openBtn = document.getElementById("settings-btn");
  const closeBtn = document.getElementById("settings-close");
  const clockEl = document.getElementById("settings-clock");
  const radios  = document.querySelectorAll('input[name="theme"]');
  if (!panel) return;

  openBtn.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
  closeBtn.addEventListener("click", () => { panel.style.display = "none"; });

  // HH:MM clock
  function tick() {
    if (!clockEl) return;
    const n = new Date();
    clockEl.textContent =
      String(n.getHours()).padStart(2,"0") + ":" + String(n.getMinutes()).padStart(2,"0");
  }
  tick(); setInterval(tick, 5000);

  // Restore saved theme
  const save = getSaveData();
  const savedTheme = save.settings.theme || "default";
  applyTheme(savedTheme);
  radios.forEach(r => { if (r.value === savedTheme) r.checked = true; });

  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      applyTheme(radio.value);
      const s = getSaveData();
      s.settings.theme = radio.value;
      setSaveData(s);
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  DOWNLOADS PAGE
// ══════════════════════════════════════════════════════════════
function initDownloads() {
  const previewEl    = document.getElementById("save-preview");
  const dlSaveBtn    = document.getElementById("dl-save-btn");
  const dlTplBtn     = document.getElementById("dl-template-btn");
  const dlTplDarkBtn = document.getElementById("dl-template-dark-btn");

  const save = getSaveData();

  // Show preview
  if (previewEl) {
    previewEl.textContent = JSON.stringify(save, null, 2);
  }

  if (dlSaveBtn) {
    dlSaveBtn.addEventListener("click", () => {
      downloadJSON(save, "retro_arcade_save.json");
      flashBanner("✓ SAVE FILE DOWNLOADED.", "success");
    });
  }

  if (dlTplBtn) {
    dlTplBtn.addEventListener("click", () => {
      downloadJSON(defaultSave(), "save_template_blank.json");
    });
  }

  if (dlTplDarkBtn) {
    dlTplDarkBtn.addEventListener("click", () => {
      const tpl = defaultSave();
      tpl.settings.theme = "darkgrey";
      downloadJSON(tpl, "save_template_darkgrey.json");
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  UPLOADS PAGE
// ══════════════════════════════════════════════════════════════
function initUploads() {
  const dropZone     = document.getElementById("upload-drop-zone");
  const fileInput    = document.getElementById("upload-file-input");
  const statusEl     = document.getElementById("upload-status");
  const previewWrap  = document.getElementById("upload-preview-wrap");
  const previewEl    = document.getElementById("upload-preview");
  const applyBtn     = document.getElementById("upload-apply-btn");
  const sessionPrev  = document.getElementById("session-preview");
  const clearBtn     = document.getElementById("clear-progress-btn");

  // Show current session
  if (sessionPrev) {
    sessionPrev.textContent = JSON.stringify(getSaveData(), null, 2);
  }

  let pendingSave = null;

  function handleFile(file) {
    if (!file.name.endsWith(".json")) {
      showMsg(statusEl, "error", "✗ INVALID FILE TYPE. MUST BE .json");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.password) throw new Error("No password field");
        pendingSave = data;
        if (previewEl) previewEl.textContent = JSON.stringify(data, null, 2);
        if (previewWrap) previewWrap.style.display = "block";
        showMsg(statusEl, "success", "✓ FILE PARSED SUCCESSFULLY. REVIEW BELOW THEN APPLY.");
        dropZone.classList.add("file-loaded");
      } catch {
        showMsg(statusEl, "error", "✗ INVALID SAVE FILE. CHECK FORMAT.");
        if (previewWrap) previewWrap.style.display = "none";
      }
    };
    reader.readAsText(file);
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault(); dropZone.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      if (!pendingSave) return;
      setSaveData(pendingSave);
      if (pendingSave.settings && pendingSave.settings.theme) {
        applyTheme(pendingSave.settings.theme);
      }
      if (sessionPrev) sessionPrev.textContent = JSON.stringify(pendingSave, null, 2);
      flashBanner("✓ SAVE FILE APPLIED TO CURRENT SESSION.", "success");
      showMsg(statusEl, "success", "✓ DATA RESTORED. SESSION UPDATED.");
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const s = getSaveData();
      s.gameProgress = defaultSave().gameProgress;
      setSaveData(s);
      if (sessionPrev) sessionPrev.textContent = JSON.stringify(s, null, 2);
      flashBanner("GAME PROGRESS CLEARED.", "error");
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  UNBLOCKER PAGE
// ══════════════════════════════════════════════════════════════
function initUnblocker() {
  const instanceSel   = document.getElementById("proxy-instance");
  const customGroup   = document.getElementById("custom-instance-group");
  const customInput   = document.getElementById("custom-instance-input");
  const urlInput      = document.getElementById("proxy-url-input");
  const goBtn         = document.getElementById("proxy-go-btn");
  const msgEl         = document.getElementById("proxy-msg");
  const frameWrap     = document.getElementById("proxy-frame-wrap");
  const iframe        = document.getElementById("proxy-iframe");
  const frameUrlEl    = document.getElementById("proxy-frame-url");
  const closeBtn      = document.getElementById("proxy-close-btn");

  if (!instanceSel) return;

  instanceSel.addEventListener("change", () => {
    customGroup.style.display = instanceSel.value === "custom" ? "block" : "none";
  });

  function getInstanceUrl() {
    return instanceSel.value === "custom"
      ? (customInput.value.trim().replace(/\/$/, "") || null)
      : instanceSel.value;
  }

  function buildProxyUrl(instance, target) {
    // Rammerhead takes URLs via its own session routing.
    // For public instances, navigate to the instance and let it handle routing.
    // We open in the iframe directly pointing to the instance's main page
    // with the target URL as a query param (common Rammerhead convention).
    let url = target.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return `${instance}?url=${encodeURIComponent(url)}`;
  }

  if (goBtn) {
    goBtn.addEventListener("click", () => {
      const target = urlInput.value.trim();
      if (!target) {
        showMsg(msgEl, "error", "✗ NO URL ENTERED."); return;
      }
      const instance = getInstanceUrl();
      if (!instance) {
        showMsg(msgEl, "error", "✗ ENTER A CUSTOM INSTANCE URL."); return;
      }
      const proxyUrl = buildProxyUrl(instance, target);
      if (frameWrap) frameWrap.style.display = "block";
      if (iframe)    iframe.src = proxyUrl;
      if (frameUrlEl) frameUrlEl.textContent = proxyUrl;
      showMsg(msgEl, "success", "✓ PROXY REQUEST SENT. LOADING...");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (frameWrap) frameWrap.style.display = "none";
      if (iframe) iframe.src = "";
      showMsg(msgEl, "hidden", "");
    });
  }

  // Allow pressing Enter in URL field
  if (urlInput) {
    urlInput.addEventListener("keydown", e => {
      if (e.key === "Enter") goBtn.click();
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  SHARED UTILITIES
// ══════════════════════════════════════════════════════════════
function showMsg(el, type, text) {
  if (!el) return;
  el.textContent = text;
  el.className = type === "hidden" ? "msg hidden" : `msg ${type}`;
}

function shakePulse(el) {
  el.animate([
    { transform: "translateX(0)" },
    { transform: "translateX(-6px)" },
    { transform: "translateX(6px)" },
    { transform: "translateX(-4px)" },
    { transform: "translateX(4px)" },
    { transform: "translateX(0)" }
  ], { duration: 320, easing: "ease-out" });
}

function typePrompt(id, text, speed) {
  const el = document.getElementById(id);
  if (!el) return;
  let i = 0; el.textContent = "";
  const t = setInterval(() => {
    if (i < text.length) { el.textContent += text[i++]; }
    else clearInterval(t);
  }, speed);
}

function updateClock() {
  const el = document.getElementById("live-clock");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString("en-US", { hour12: false });
}

function flashBanner(msg, type = "success") {
  let b = document.getElementById("flash-banner");
  if (!b) {
    b = document.createElement("div");
    b.id = "flash-banner";
    Object.assign(b.style, {
      position: "fixed", top: "1.2rem", left: "50%",
      transform: "translateX(-50%)",
      background: "var(--bg-panel)", border: "2px solid var(--accent)",
      color: "var(--accent)", fontFamily: "var(--font-mono)",
      fontSize: "0.75rem", letterSpacing: "2px",
      padding: "0.6rem 1.4rem", zIndex: "10000",
      boxShadow: "0 0 20px rgba(79,195,247,0.3)",
      transition: "opacity 0.4s", textTransform: "uppercase",
      whiteSpace: "nowrap", maxWidth: "90vw"
    });
    document.body.appendChild(b);
  }
  const isErr = type === "error";
  b.style.borderColor = isErr ? "var(--error)" : "var(--accent)";
  b.style.color       = isErr ? "var(--error)" : "var(--accent)";
  b.style.boxShadow   = isErr ? "0 0 20px rgba(255,71,87,0.3)" : "0 0 20px rgba(79,195,247,0.3)";
  b.textContent = msg;
  b.style.opacity = "1";
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.style.opacity = "0"; }, 2800);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const sub  = document.body.dataset.subpage;
  if (page === "login") { initLogin(); return; }
  if (page === "index") { initIndex(); }
  // Sub-page specific (set via data-subpage on body)
  if (sub === "downloads") initDownloads();
  if (sub === "uploads")   initUploads();
  if (sub === "unblocker") initUnblocker();
});
