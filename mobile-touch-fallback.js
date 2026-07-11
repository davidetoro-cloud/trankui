(() => {
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
