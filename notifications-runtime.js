(function setupTrankuiNotifications() {
  const VERSION = "20260710-notifications-bridge-1";
  const STORAGE_KEY = "trankui-notification-preferences";
  const config = window.TRANKUI_CONFIG || {};
  const client = window.supabase?.createClient
    ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey || config.supabaseAnonKey)
    : null;

  const defaults = {
    channels: { push: false, sound: true, email: false },
    topics: { messages: true, requests: true, matches: true, reviews: true, availability: true },
  };

  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const readLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaults;
    } catch {
      return defaults;
    }
  };
  let preferences = {
    channels: { ...defaults.channels, ...(readLocal().channels || {}) },
    topics: { ...defaults.topics, ...(readLocal().topics || {}) },
  };

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }

  function toast(message) {
    const target = document.querySelector("#toast");
    if (!target) return;
    target.textContent = message;
    target.classList.add("visible");
    window.setTimeout(() => target.classList.remove("visible"), 2600);
  }

  function topicFor(type) {
    return ({
      message: "messages",
      request: "requests",
      application: "requests",
      match: "matches",
      completion: "matches",
      review: "reviews",
    })[type] || "messages";
  }

  function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
  }

  function canPush() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(config.vapidPublicKey);
  }

  async function currentUserId() {
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  }

  async function loadRemotePreferences() {
    if (!client) return;
    try {
      const profileId = await currentUserId();
      if (!profileId) return;
      const { data, error } = await client.from("notification_preferences").select("channels,topics").eq("profile_id", profileId).maybeSingle();
      if (error || !data) return;
      preferences = {
        channels: { ...defaults.channels, ...preferences.channels, ...(data.channels || {}) },
        topics: { ...defaults.topics, ...preferences.topics, ...(data.topics || {}) },
      };
      saveLocal();
      syncControls();
    } catch {
      // Preferences remain local until the Supabase notification tables are active.
    }
  }

  async function saveRemotePreferences() {
    saveLocal();
    if (!client) return;
    try {
      const profileId = await currentUserId();
      if (!profileId) return;
      await client.from("notification_preferences").upsert({
        profile_id: profileId,
        channels: preferences.channels,
        topics: preferences.topics,
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
    } catch {
      // Non-blocking: local preferences keep the interface usable.
    }
  }

  async function savePushSubscription(subscription) {
    if (!client) return;
    const profileId = await currentUserId();
    if (!profileId) throw new Error("Accedi per attivare le notifiche push.");
    const payload = subscription.toJSON();
    const { error } = await client.from("push_subscriptions").upsert({
      profile_id: profileId,
      endpoint: payload.endpoint,
      p256dh: payload.keys?.p256dh,
      auth: payload.keys?.auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: "profile_id,endpoint" });
    if (error) throw error;
  }

  async function removePushSubscription() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        if (client) await client.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
    } catch {
      // Best effort removal.
    }
  }

  async function enablePush() {
    if (!canPush()) throw new Error("Questo dispositivo non supporta ancora le notifiche push per Trankui.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Autorizzazione notifiche non concessa.");
    const registration = await navigator.serviceWorker.register(`./sw.js?v=${VERSION}`);
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
    });
    await savePushSubscription(subscription);
    preferences.channels.push = true;
    await saveRemotePreferences();
    syncControls();
    toast("Notifiche push attive su questo dispositivo");
  }

  async function disablePush() {
    preferences.channels.push = false;
    await removePushSubscription();
    await saveRemotePreferences();
    syncControls();
    toast("Notifiche push disattivate su questo dispositivo");
  }

  async function notifyEvent(payload) {
    const topic = topicFor(payload?.type);
    if (!preferences.topics[topic]) return;
    if (preferences.channels.sound) {
      window.dispatchEvent(new CustomEvent("trankui:notification-sound"));
    }
    if (!client) return;
    try {
      await client.functions.invoke("notify", { body: payload });
    } catch {
      // Server notifications are active once the Supabase Edge Function is deployed.
    }
  }

  function injectStyle() {
    if (document.querySelector("#trankuiNotificationStyle")) return;
    const style = document.createElement("style");
    style.id = "trankuiNotificationStyle";
    style.textContent = `
      .profile-notification-settings { margin-top: 28px; padding: 24px 0; border-top: 1px solid var(--line); }
      .notification-preferences-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .notification-channel-card { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
      .notification-channel-card > div { min-width: 0; display: grid; gap: 4px; color: var(--ink); }
      .notification-channel-card svg { width: 19px; height: 19px; color: var(--blue); }
      .notification-channel-card strong { font-size: 14px; }
      .notification-channel-card span { color: var(--muted); font-size: 12px; line-height: 1.35; }
      .notification-channel-card .compact-button { min-height: 38px; padding: 0 12px; white-space: nowrap; }
      .notification-topic-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
      .notification-topic-list label { display: flex; align-items: flex-start; gap: 10px; padding: 13px; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); text-transform: none; letter-spacing: 0; font-weight: 600; background: var(--surface-soft); }
      .notification-topic-list input { margin-top: 3px; accent-color: var(--blue); }
      .notification-topic-list span { display: grid; gap: 3px; }
      .notification-topic-list small { color: var(--muted); font-size: 12px; font-weight: 600; line-height: 1.35; }
      @media (max-width: 780px) {
        .notification-preferences-grid, .notification-topic-list { grid-template-columns: 1fr; }
        .notification-channel-card { align-items: flex-start; flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(style);
  }

  function notificationMarkup() {
    return `
      <section class="profile-notification-settings" id="profileNotificationSettings">
        <div class="section-head">
          <div>
            <h2>Notifiche</h2>
            <span>Scegli canali e aggiornamenti da ricevere per non perdere richieste, messaggi e feedback.</span>
          </div>
        </div>
        <div class="notification-preferences-grid">
          <article class="notification-channel-card">
            <div>${icon("smartphone")}<strong>Push mobile e browser</strong><span id="notificationPermissionState">Notifiche browser non ancora attive.</span></div>
            <label class="switch-line"><input id="pushNotifications" type="checkbox" data-notification-channel="push" /><span></span></label>
            <button class="secondary-button compact-button" type="button" id="enableNotifications">${icon("bell-ring")}Autorizza</button>
          </article>
          <article class="notification-channel-card">
            <div>${icon("volume-2")}<strong>Suono</strong><span>Un avviso leggero quando arriva qualcosa di nuovo.</span></div>
            <label class="switch-line"><input id="soundNotifications" type="checkbox" data-notification-channel="sound" /><span></span></label>
          </article>
          <article class="notification-channel-card">
            <div>${icon("mail")}<strong>Email</strong><span>Promemoria e aggiornamenti importanti via mail.</span></div>
            <label class="switch-line"><input id="emailNotifications" type="checkbox" data-notification-channel="email" /><span></span></label>
          </article>
        </div>
        <div class="notification-topic-list" aria-label="Tipi di notifica">
          <label><input type="checkbox" data-notification-topic="messages" /><span><strong>Messaggi in chat</strong><small>Risposte e nuove conversazioni.</small></span></label>
          <label><input type="checkbox" data-notification-topic="requests" /><span><strong>Richieste e candidature</strong><small>Nuove richieste dirette o risposte dalla bacheca.</small></span></label>
          <label><input type="checkbox" data-notification-topic="matches" /><span><strong>Aggiornamenti match</strong><small>Accettazioni, conferme e cambi di stato.</small></span></label>
          <label><input type="checkbox" data-notification-topic="reviews" /><span><strong>Recensioni e feedback</strong><small>Feedback ricevuti o da completare.</small></span></label>
          <label><input type="checkbox" data-notification-topic="availability" /><span><strong>Disponibilità</strong><small>Promemoria legati al calendario e alla visibilità in ricerca.</small></span></label>
        </div>
      </section>`;
  }

  function ensureNotificationPanel() {
    injectStyle();
    const profile = document.querySelector("#view-profile");
    if (!profile || document.querySelector("#profileNotificationSettings")) {
      syncControls();
      return;
    }
    const target = profile.querySelector(".account-danger-zone") || profile.lastElementChild;
    target?.insertAdjacentHTML("beforebegin", notificationMarkup());
    window.lucide?.createIcons();
    syncControls();
  }

  function syncControls() {
    const push = document.querySelector("#pushNotifications");
    const sound = document.querySelector("#soundNotifications");
    const email = document.querySelector("#emailNotifications");
    if (push) push.checked = Boolean(preferences.channels.push && "Notification" in window && Notification.permission === "granted");
    if (sound) sound.checked = Boolean(preferences.channels.sound);
    if (email) email.checked = Boolean(preferences.channels.email);
    document.querySelectorAll("[data-notification-topic]").forEach((input) => {
      input.checked = Boolean(preferences.topics[input.dataset.notificationTopic]);
    });
    const state = document.querySelector("#notificationPermissionState");
    if (state) {
      if (!canPush()) state.textContent = "Notifiche push non supportate da questo browser.";
      else if (Notification.permission === "granted") state.textContent = "Notifiche autorizzate su questo dispositivo.";
      else if (Notification.permission === "denied") state.textContent = "Notifiche bloccate nelle impostazioni del browser.";
      else state.textContent = "Autorizza questo dispositivo per ricevere avvisi immediati.";
    }
  }

  function bindControls() {
    document.addEventListener("click", async (event) => {
      if (!event.target.closest("#enableNotifications")) return;
      try {
        await enablePush();
      } catch (error) {
        toast(error?.message || "Non siamo riusciti ad attivare le notifiche push.");
      }
    });
    document.addEventListener("change", async (event) => {
      const channel = event.target.dataset?.notificationChannel;
      const topic = event.target.dataset?.notificationTopic;
      if (channel === "push") {
        try {
          if (event.target.checked) await enablePush();
          else await disablePush();
        } catch (error) {
          preferences.channels.push = false;
          syncControls();
          toast(error?.message || "Non siamo riusciti ad aggiornare le notifiche push.");
        }
        return;
      }
      if (channel) {
        preferences.channels[channel] = event.target.checked;
        await saveRemotePreferences();
        toast(channel === "email" ? "Preferenze email aggiornate" : "Preferenze notifiche aggiornate");
      }
      if (topic) {
        preferences.topics[topic] = event.target.checked;
        await saveRemotePreferences();
        toast("Tipi di notifica aggiornati");
      }
    });
  }

  function wrapBackend() {
    const backend = window.trankuiBackend;
    if (!backend || backend.__trankuiNotificationsWrapped) return false;
    backend.__trankuiNotificationsWrapped = true;
    const wrap = (name, buildPayload) => {
      const original = backend[name];
      if (typeof original !== "function") return;
      backend[name] = async function wrappedBackendAction(...args) {
        const result = await original.apply(this, args);
        const payload = buildPayload(result, args);
        if (payload) notifyEvent(payload);
        return result;
      };
    };
    wrap("sendMessage", (message, args) => ({ type: "message", collaboration_id: args[0], message_id: message?.id }));
    wrap("requestCollaboration", (collaboration) => ({ type: "request", collaboration_id: collaboration?.id }));
    wrap("transitionCollaboration", (collaboration) => ({ type: "match", collaboration_id: collaboration?.id }));
    wrap("confirmComplete", (collaboration) => ({ type: "completion", collaboration_id: collaboration?.id }));
    wrap("submitReview", (review) => ({ type: "review", review_id: review?.id }));
    wrap("applyToPost", (application) => ({ type: "application", application_id: application?.id }));
    wrap("selectApplicant", (collaboration) => ({ type: "match", collaboration_id: collaboration?.id }));
    return true;
  }

  function setupSound() {
    window.addEventListener("trankui:notification-sound", () => {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQ4AAAB/f39/f3+AgICAgICA");
        audio.volume = 0.22;
        audio.play().catch(() => {});
      } catch {
        // Ignore browsers that block programmatic audio.
      }
    });
  }

  function boot() {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = `./manifest.webmanifest?v=${VERSION}`;
    if (!document.querySelector("link[rel='manifest']")) document.head.appendChild(manifest);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`./sw.js?v=${VERSION}`).catch(() => {});
    bindControls();
    setupSound();
    loadRemotePreferences();
    const observer = new MutationObserver(ensureNotificationPanel);
    observer.observe(document.body, { childList: true, subtree: true });
    ensureNotificationPanel();
    const wrapTimer = window.setInterval(() => {
      if (wrapBackend()) window.clearInterval(wrapTimer);
    }, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
