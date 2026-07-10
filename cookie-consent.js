(function setupCookieConsent() {
  let banner = document.querySelector("#cookieBanner");
  if (!banner) {
    banner = document.createElement("aside");
    banner.id = "cookieBanner";
    banner.className = "cookie-banner hidden";
    banner.setAttribute("aria-label", "Preferenze cookie");
    banner.innerHTML = `<div><i data-lucide="cookie" aria-hidden="true"></i><p><strong>La tua privacy conta.</strong><span>Trankui usa cookie tecnici necessari per accesso e sicurezza. Gli eventuali cookie facoltativi saranno attivati solo con il tuo consenso.</span></p></div><div class="cookie-actions"><a href="./privacy.html">Scopri di piu</a><button class="secondary-button" type="button" id="essentialCookies">Solo necessari</button><button class="primary-button" type="button" id="acceptCookies">Accetta</button></div>`;
    document.body.appendChild(banner);
  }

  const saveChoice = (choice) => {
    localStorage.setItem("trankui-cookie-choice", choice);
    banner.classList.add("hidden");
  };

  banner.querySelector("#essentialCookies")?.addEventListener("click", () => saveChoice("essential"));
  banner.querySelector("#acceptCookies")?.addEventListener("click", () => saveChoice("accepted"));
  if (!localStorage.getItem("trankui-cookie-choice")) banner.classList.remove("hidden");
  window.requestAnimationFrame?.(() => window.lucide?.createIcons());
})();

window.loadTrankuiNotificationsRuntime = function loadTrankuiNotificationsRuntime() {
  if (document.querySelector("script[data-trankui-notifications]")) return;
  const script = document.createElement("script");
  script.src = "./notifications-runtime.js?v=20260710-freeze-guard-1";
  script.defer = true;
  script.dataset.trankuiNotifications = "true";
  document.body.appendChild(script);
};
