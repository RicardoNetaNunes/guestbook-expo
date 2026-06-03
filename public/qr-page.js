(function () {
  const target = document.querySelector("#qr-url");
  const config = window.GUESTBOOK_CONFIG || {};

  if (!target) {
    return;
  }

  const appUrl = String(config.APP_URL || "").trim();
  target.textContent = appUrl ? appUrl : "Define APP_URL em config.js";
})();
