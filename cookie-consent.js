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

(function setupMobileTouchFallback() {
  const qs = (selector) => document.querySelector(selector);
  const accountTriggerSelector = "#notificationButton, .avatar-notification-button, #sidebarAvatar";
  const deleteTriggerSelector = "#openDeleteAccount";
  let lastAccountToggleAt = 0;
  let lastDeleteOpenAt = 0;

  function isInsideAccountPanel(target) {
    return !!target?.closest?.("#notificationPanel");
  }

  function isAccountTrigger(target) {
    return !!target?.closest?.(accountTriggerSelector) && !isInsideAccountPanel(target);
  }

  function openAccountPanel(event) {
    if (!isAccountTrigger(event.target)) return;
    const now = Date.now();
    if (now - lastAccountToggleAt < 350) return;
    lastAccountToggleAt = now;
    event.preventDefault();
    event.stopPropagation();

    const panel = qs("#notificationPanel");
    const button = qs("#notificationButton");
    if (!panel || !button) return;
    panel.classList.toggle("hidden");
    button.setAttribute("aria-expanded", String(!panel.classList.contains("hidden")));
  }

  function openDeleteAccountModal(event) {
    if (!event.target?.closest?.(deleteTriggerSelector)) return;
    const now = Date.now();
    if (now - lastDeleteOpenAt < 350) return;
    lastDeleteOpenAt = now;
    event.preventDefault();
    event.stopPropagation();

    const confirmation = qs("#deleteAccountConfirmation");
    const confirmButton = qs("#confirmDeleteAccount");
    const backdrop = qs("#deleteAccountBackdrop");
    if (confirmation) confirmation.value = "";
    if (confirmButton) confirmButton.disabled = true;
    if (backdrop) backdrop.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function handleClick(event) {
    if (isAccountTrigger(event.target)) {
      if (Date.now() - lastAccountToggleAt < 700) return;
      openAccountPanel(event);
      return;
    }
    if (event.target?.closest?.(deleteTriggerSelector)) {
      if (Date.now() - lastDeleteOpenAt < 700) return;
      openDeleteAccountModal(event);
    }
  }

  document.addEventListener("pointerup", openAccountPanel, true);
  document.addEventListener("touchend", openAccountPanel, { capture: true, passive: false });
  document.addEventListener("pointerup", openDeleteAccountModal, true);
  document.addEventListener("touchend", openDeleteAccountModal, { capture: true, passive: false });
  document.addEventListener("click", handleClick, true);
})();

window.loadTrankuiNotificationsRuntime = function loadTrankuiNotificationsRuntime() {
  if (document.querySelector("script[data-trankui-notifications]")) return;
  const script = document.createElement("script");
  script.src = "./notifications-runtime.js?v=20260710-freeze-guard-1";
  script.defer = true;
  script.dataset.trankuiNotifications = "true";
  document.body.appendChild(script);
};
