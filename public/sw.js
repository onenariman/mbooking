self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "MBooking",
    body: "Новое уведомление",
    url: "/receptions",
    tag: "mbooking-notification",
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = {
        ...payload,
        ...data,
      };
    }
  } catch {
    // Ignore malformed payloads and show fallback notification.
  }

  const options = {
    body: payload.body,
    badge: "/pwa-icon.svg",
    data: {
      url: payload.url || "/receptions",
    },
    icon: "/pwa-icon.svg",
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    tag: payload.tag || "mbooking-notification",
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/receptions";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
