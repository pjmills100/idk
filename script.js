/* ============================================================
   RETRO TERMINAL — script.js
   Password auth + shared utilities
   ============================================================ */

// ── Password dictionary ──────────────────────────────────────
const passwords = {
  "summer2023": "FriendA",
  "fall2023":   "FriendB",
  "spring2024": "FriendC",
  "dev123":     "Dev"       // Developer / admin access
};

// ── Storage helpers ──────────────────────────────────────────
const AUTH_KEY = "retro_arcade_user";

function saveSession(username) {
  sessionStorage.setItem(AUTH_KEY, username);
}
function getSession() {
  return sessionStorage.getItem(AUTH_KEY);
}
function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
}

// ── Login page logic ─────────────────────────────────────────
function initLogin() {
  // If already authenticated, go straight to the game hub
  if (getSession()) {
    window.location.replace("index.html");
    return;
  }

  const form    = document.getElementById("login-form");
  const input   = document.getElementById("password-input");
  const msgEl   = document.getElementById("login-msg");
  const submitBtn = document.getElementById("login-btn");

  if (!form) return; // not on login page

  // Live clear error on typing
  input.addEventListener("input", () => {
    msgEl.textContent = "";
    msgEl.className = "msg hidden";
    input.style.borderColor = "";
  });

  // Typewriter effect for the prompt
  typePrompt("sys-prompt", "ENTER ACCESS CODE TO CONTINUE...", 40);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const val = input.value.trim();

    if (!val) {
      showMsg(msgEl, "error", "! NO INPUT DETECTED. TRY AGAIN.");
      shakePulse(input);
      return;
    }

    if (passwords.hasOwnProperty(val)) {
      const user = passwords[val];
      saveSession(user);

      submitBtn.disabled = true;
      submitBtn.querySelector("span").textContent = "AUTHENTICATING...";
      // Hidden for all users — don't show the alias name in the message
      showMsg(msgEl, "success", `✓ ACCESS GRANTED — REDIRECTING...`);

      // brief delay for dramatic effect, then redirect
      setTimeout(() => {
        window.location.href = "index.html";
      }, 900);
    } else {
      showMsg(msgEl, "error", "✗ INVALID CREDENTIALS. ACCESS DENIED.");
      shakePulse(input);
      input.select();

      // Briefly flash red border
      input.style.borderColor = "var(--error)";
      setTimeout(() => { input.style.borderColor = ""; }, 1200);
    }
  });
}

// ── Index page logic ─────────────────────────────────────────
function initIndex() {
  const user = getSession();
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // Hidden for all users — display-name element is commented out in HTML
  // const nameEl = document.getElementById("display-name");
  // if (nameEl) nameEl.textContent = user.toUpperCase();

  // Live clock (header)
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

  // ── Dev-only: Settings button ──────────────────────────────
  if (user === "Dev") {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) settingsBtn.style.display = "inline-block";
    initSettingsPanel();
  }

  // Game cards — stub alert for unbuilt games
  document.querySelectorAll(".game-card[data-wip='true']").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const title = card.querySelector(".game-title").textContent;
      flashBanner(`[ ${title} ] — COMING SOON. MODULE NOT YET LOADED.`, "error");
    });
  });
}

// ── Utilities ────────────────────────────────────────────────
function showMsg(el, type, text) {
  el.textContent = text;
  el.className = `msg ${type}`;
}

function shakePulse(el) {
  el.animate([
    { transform: "translateX(0)"  },
    { transform: "translateX(-6px)" },
    { transform: "translateX(6px)" },
    { transform: "translateX(-4px)" },
    { transform: "translateX(4px)" },
    { transform: "translateX(0)"  }
  ], { duration: 320, easing: "ease-out" });
}

function typePrompt(id, text, speed) {
  const el = document.getElementById(id);
  if (!el) return;
  let i = 0;
  el.textContent = "";
  const timer = setInterval(() => {
    if (i < text.length) {
      el.textContent += text[i++];
    } else {
      clearInterval(timer);
    }
  }, speed);
}

function updateClock() {
  const el = document.getElementById("live-clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString("en-US", { hour12: false });
}

function flashBanner(msg, type = "success") {
  let banner = document.getElementById("flash-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "flash-banner";
    Object.assign(banner.style, {
      position: "fixed",
      top: "1.2rem",
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--bg-panel)",
      border: "2px solid var(--accent)",
      color: "var(--accent)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.75rem",
      letterSpacing: "2px",
      padding: "0.6rem 1.4rem",
      zIndex: "10000",
      boxShadow: "0 0 20px rgba(79,195,247,0.3)",
      transition: "opacity 0.4s",
      textTransform: "uppercase"
    });
    document.body.appendChild(banner);
  }
  if (type === "error") {
    banner.style.borderColor = "var(--error)";
    banner.style.color = "var(--error)";
    banner.style.boxShadow = "0 0 20px rgba(255,71,87,0.3)";
  } else {
    banner.style.borderColor = "var(--accent)";
    banner.style.color = "var(--accent)";
    banner.style.boxShadow = "0 0 20px rgba(79,195,247,0.3)";
  }
  banner.textContent = msg;
  banner.style.opacity = "1";
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => { banner.style.opacity = "0"; }, 2800);
}

// ── Settings Panel (Dev only) ────────────────────────────────
function initSettingsPanel() {
  const panel      = document.getElementById("settings-panel");
  const openBtn    = document.getElementById("settings-btn");
  const closeBtn   = document.getElementById("settings-close");
  const clockEl    = document.getElementById("settings-clock");
  const radios     = document.querySelectorAll('input[name="theme"]');

  if (!panel) return;

  // Open / close
  openBtn.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // Settings clock (HH:MM only)
  function tickSettingsClock() {
    if (!clockEl) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${hh}:${mm}`;
  }
  tickSettingsClock();
  setInterval(tickSettingsClock, 5000);

  // Restore saved theme
  const savedTheme = sessionStorage.getItem("retro_theme") || "default";
  applyTheme(savedTheme);
  radios.forEach(r => { if (r.value === savedTheme) r.checked = true; });

  // Theme switch
  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      applyTheme(radio.value);
      sessionStorage.setItem("retro_theme", radio.value);
    });
  });
}

function applyTheme(name) {
  document.body.classList.remove("theme-darkgrey");
  if (name === "darkgrey") document.body.classList.add("theme-darkgrey");
}

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "login") initLogin();
  if (document.body.dataset.page === "index") initIndex();
});
