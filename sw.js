self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: "Trankui", body: event.data?.text() || "Hai un nuovo aggiornamento." };
  }
  const isMessageNotification = typeof payload.tag === "string" && (payload.tag === "message" || payload.tag.startsWith("message:"));
  const title = isMessageNotification ? "Nuovo messaggio su Trankui" : payload.title || "Trankui";
  const options = {
    body: isMessageNotification ? "Hai ricevuto un nuovo messaggio. Accedi a Trankui per leggerlo." : payload.body || "Hai un nuovo aggiornamento.",
    icon: payload.icon || "/clipboard.png?v=20260706-official-logo",
    badge: payload.badge || "/clipboard.png?v=20260706-official-logo",
    data: { url: payload.url || "/" },
    tag: payload.tag || "trankui-update",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: "trankui-notification-open", url: targetUrl });
      return;
    }
    await clients.openWindow(targetUrl);
  })());
});
