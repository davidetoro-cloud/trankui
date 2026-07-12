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
    window.setTimeout(() => updateDeleteAccountState(), 60);
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

(function setupDeleteAccountFeedback() {
  window.trankuiDeleteAccountRuntime = true;
  let deleteInProgress = false;

  function ensureDeleteStyles() {
    if (document.querySelector("#deleteAccountRuntimeStyles")) return;
    const style = document.createElement("style");
    style.id = "deleteAccountRuntimeStyles";
    style.textContent = `
      .delete-account-status {
        margin: 12px 0;
        padding: 12px 14px;
        border: 1px solid #dfe4ec;
        border-radius: 8px;
        background: #f8fafc;
        color: #5f6368;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
      }
      .delete-account-status[data-tone="ready"] {
        border-color: #b9d3ff;
        background: #eef5ff;
        color: #0058d8;
      }
      .delete-account-status[data-tone="loading"] {
        border-color: #dfe4ec;
        background: #f3f4f6;
        color: #2b2d31;
      }
      .delete-account-status[data-tone="error"] {
        border-color: #f3b4b8;
        background: #fff1f2;
        color: #b4232d;
      }
    `;
    document.head.appendChild(style);
  }

  function qs(selector) {
    return document.querySelector(selector);
  }

  function visibleDeleteModal() {
    const backdrop = qs("#deleteAccountBackdrop");
    return backdrop && !backdrop.classList.contains("hidden");
  }

  function deleteElements() {
    return {
      backdrop: qs("#deleteAccountBackdrop"),
      input: qs("#deleteAccountConfirmation"),
      button: qs("#confirmDeleteAccount"),
      app: qs("#appShell"),
      auth: qs("#authScreen"),
      status: ensureDeleteStatus(),
    };
  }

  function ensureDeleteStatus() {
    ensureDeleteStyles();
    let status = qs("#deleteAccountStatus");
    const button = qs("#confirmDeleteAccount");
    if (!status && button) {
      status = document.createElement("p");
      status.id = "deleteAccountStatus";
      status.className = "delete-account-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      button.insertAdjacentElement("beforebegin", status);
    }
    return status;
  }

  function setDeleteStatus(message, tone = "neutral") {
    const status = ensureDeleteStatus();
    if (!status) return;
    status.textContent = message || "";
    status.dataset.tone = tone;
  }

  function isConfirmed() {
    return (qs("#deleteAccountConfirmation")?.value || "").trim().toUpperCase() === "CANCELLA";
  }

  function restoreDeleteButton() {
    const button = qs("#confirmDeleteAccount");
    if (!button) return;
    button.innerHTML = `<i data-lucide="trash-2"></i>Cancella definitivamente`;
    window.lucide?.createIcons();
  }

  function updateDeleteAccountState() {
    if (!visibleDeleteModal()) return;
    const { button } = deleteElements();
    if (!button || deleteInProgress) return;
    const confirmed = isConfirmed();
    button.disabled = !confirmed;
    setDeleteStatus(
      confirmed
        ? "Conferma attiva. Clicca sul pulsante per cancellare definitivamente l'account."
        : "Per continuare scrivi esattamente CANCELLA.",
      confirmed ? "ready" : "neutral",
    );
  }

  function showAuthDeletionResult(result) {
    const { app, auth } = deleteElements();
    app?.classList.add("hidden");
    auth?.classList.remove("hidden");
    const status = qs("#authStatus");
    if (!status) return;
    if (result?.email_sent) {
      status.innerHTML = `<strong>Account cancellato</strong><span>Ti abbiamo inviato una conferma via email. Controlla anche spam o promozioni.</span>`;
    } else {
      status.innerHTML = `<strong>Account cancellato</strong><span>La cancellazione è stata completata. La mail automatica non risulta inviata: stiamo verificando la configurazione di welcome@trankui.com.</span>`;
    }
  }

  async function runDeleteAccount(event) {
    const target = event.target?.closest?.("#confirmDeleteAccount");
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (deleteInProgress) return;
    updateDeleteAccountState();
    if (!isConfirmed()) {
      setDeleteStatus("Scrivi esattamente CANCELLA per abilitare la cancellazione.", "error");
      return;
    }

    const { backdrop, button } = deleteElements();
    deleteInProgress = true;
    button.disabled = true;
    button.innerHTML = `<i data-lucide="loader-circle"></i>Cancellazione in corso...`;
    window.lucide?.createIcons();
    setDeleteStatus("Stiamo cancellando il profilo. Non chiudere questa pagina.", "loading");
    const slowTimer = window.setTimeout(() => {
      setDeleteStatus("Sta richiedendo qualche secondo in più. La procedura continua: stiamo rimuovendo i dati collegati.", "loading");
    }, 12000);
    const verySlowTimer = window.setTimeout(() => {
      setDeleteStatus("Stiamo ancora completando la cancellazione. Attendi la conferma finale prima di chiudere la pagina.", "loading");
    }, 26000);

    try {
      if (!window.trankuiBackend?.deleteAccount) throw new Error("Servizio di cancellazione non disponibile.");
      const result = await window.trankuiBackend.deleteAccount();
      backdrop?.classList.add("hidden");
      document.body.classList.remove("modal-open");
      showAuthDeletionResult(result);
    } catch (error) {
      const message = error?.message || "Non siamo riusciti a cancellare l'account. Riprova tra poco.";
      setDeleteStatus(message, "error");
      deleteInProgress = false;
      button.disabled = !isConfirmed();
      restoreDeleteButton();
    } finally {
      window.clearTimeout(slowTimer);
      window.clearTimeout(verySlowTimer);
    }
  }

  document.addEventListener("input", (event) => {
    if (event.target?.matches?.("#deleteAccountConfirmation")) updateDeleteAccountState();
  }, true);
  document.addEventListener("change", (event) => {
    if (event.target?.matches?.("#deleteAccountConfirmation")) updateDeleteAccountState();
  }, true);
  document.addEventListener("keyup", (event) => {
    if (event.target?.matches?.("#deleteAccountConfirmation")) updateDeleteAccountState();
  }, true);
  document.addEventListener("paste", (event) => {
    if (event.target?.matches?.("#deleteAccountConfirmation")) window.setTimeout(updateDeleteAccountState, 0);
  }, true);
  document.addEventListener("pointerup", runDeleteAccount, true);
  document.addEventListener("touchend", runDeleteAccount, { capture: true, passive: false });
  document.addEventListener("click", runDeleteAccount, true);
  window.setInterval(updateDeleteAccountState, 500);
})();

window.loadTrankuiNotificationsRuntime = function loadTrankuiNotificationsRuntime() {
  if (document.querySelector("script[data-trankui-notifications]")) return;
  const script = document.createElement("script");
  script.src = "./notifications-runtime.js?v=20260712-notification-settings-1";
  script.defer = true;
  script.dataset.trankuiNotifications = "true";
  document.body.appendChild(script);
};
