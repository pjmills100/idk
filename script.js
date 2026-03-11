/* ============================================================
   RETRO TERMINAL — script.js
   Password auth + shared utilities
   ============================================================ */

// ── Password dictionary ──────────────────────────────────────
const passwords = {
  "summer2023": "FriendA",
  "fall2023":   "FriendB",
  "spring2024": "FriendC"
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
      showMsg(msgEl, "success", `✓ ACCESS GRANTED — WELCOME, ${user.toUpperCase()}`);

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

  // Populate username display
  const nameEl = document.getElementById("display-name");
  if (nameEl) nameEl.textContent = user.toUpperCase();

  // Live clock
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

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "login") initLogin();
  if (document.body.dataset.page === "index") initIndex();
});
