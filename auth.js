(() => {
  const STORAGE_KEY = "ryby2026_auth_v1";
  const USERNAME = "ryby";
  const PASSWORD = "ryby";

  function safeGet() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function safeSet(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeRemove() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function isAuthenticated() {
    return safeGet() === "ok";
  }

  function setAuthState(locked) {
    const html = document.documentElement;
    html.classList.toggle("auth-locked", locked);
    html.classList.toggle("auth-ready", !locked);
  }

  function createGate() {
    if (document.getElementById("auth-gate")) return document.getElementById("auth-gate");

    const gate = document.createElement("div");
    gate.id = "auth-gate";
    gate.className = "auth-gate";
    gate.innerHTML = `
      <div class="auth-card">
        <div class="auth-badge">🔒 Strona prywatna</div>
        <h2>Ryby 2026</h2>
        <p>Tylko dla Patryka i Maćka. Zaloguj się raz, a strona będzie pamiętać dostęp.</p>

        <form id="auth-form" class="auth-form" autocomplete="on">
          <label for="auth-username">Użytkownik</label>
          <input id="auth-username" name="username" type="text" autocomplete="username" required />

          <label for="auth-password">Hasło</label>
          <input id="auth-password" name="password" type="password" autocomplete="current-password" required />

          <div id="auth-message" class="auth-message"></div>

          <button type="submit" class="auth-submit-btn">Zaloguj</button>
        </form>
      </div>
    `;
    document.body.appendChild(gate);

    const form = gate.querySelector("#auth-form");
    const userInput = gate.querySelector("#auth-username");
    const passInput = gate.querySelector("#auth-password");
    const message = gate.querySelector("#auth-message");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const user = String(userInput.value || "").trim();
      const pass = String(passInput.value || "").trim();

      if (user === USERNAME && pass === PASSWORD) {
        safeSet("ok");
        setAuthState(false);
        gate.remove();
        injectLogoutButton();
        document.dispatchEvent(new CustomEvent("ryby:auth-success"));
        return;
      }

      message.textContent = "Nieprawidłowy login albo hasło.";
      passInput.value = "";
      passInput.focus();
    });

    setTimeout(() => userInput.focus(), 60);
    return gate;
  }

  function injectLogoutButton() {
    if (document.getElementById("auth-logout-btn")) return;

    const nav = document.querySelector(".main-nav");
    if (!nav) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "auth-logout-btn";
    button.className = "auth-logout-btn";
    button.textContent = "Wyloguj";

    button.addEventListener("click", () => {
      safeRemove();
      setAuthState(true);
      window.location.reload();
    });

    nav.appendChild(button);
  }

  function initAuth() {
    if (isAuthenticated()) {
      setAuthState(false);
      injectLogoutButton();
      return;
    }

    setAuthState(true);
    createGate();
  }

  window.RybyAuth = {
    isAuthenticated,
    logout() {
      safeRemove();
      setAuthState(true);
      window.location.reload();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth);
  } else {
    initAuth();
  }
})();
