import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

export type BrowserPushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type OwnerPushSettings = {
  allowed_offsets_minutes: number[];
  max_selected: number;
  reminder_offsets_minutes: number[];
};

export const isPushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator
  );
};

export const registerServiceWorker = async () => {
  if (!isPushSupported()) {
    throw new Error("Ваш браузер не поддерживает push-уведомления");
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
};

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const toBrowserPushSubscription = (
  subscription: PushSubscription,
): BrowserPushSubscription => {
  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) {
    throw new Error("Не удалось получить данные push-подписки");
  }

  return {
    endpoint: json.endpoint,
    keys: {
      auth: json.keys.auth,
      p256dh: json.keys.p256dh,
    },
  };
};

export const savePushSubscription = async (subscription: PushSubscription) => {
  const response = await nestOwnerFetch("push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      subscription: toBrowserPushSubscription(subscription),
    }),
  });

  const payload = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(
      payload.message || (await nestErrorMessage(response)),
    );
  }
};

export const removePushSubscription = async (endpoint: string) => {
  const response = await nestOwnerFetch("push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });

  const payload = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(
      payload.message || (await nestErrorMessage(response)),
    );
  }
};

export const sendTestPush = async () => {
  const response = await nestOwnerFetch("push/test", {
    method: "POST",
  });

  const payload = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(
      payload.message || (await nestErrorMessage(response)),
    );
  }
};

export const fetchPushSettings = async (): Promise<OwnerPushSettings> => {
  const response = await nestOwnerFetch("push/settings", {
    method: "GET",
  });

  const payload = (await response.json()) as {
    data?: OwnerPushSettings;
    message?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.message || (await nestErrorMessage(response)),
    );
  }

  return payload.data;
};

export const savePushSettings = async (
  reminderOffsetsMinutes: number[],
): Promise<OwnerPushSettings> => {
  const response = await nestOwnerFetch("push/settings", {
    method: "PATCH",
    body: JSON.stringify({
      reminder_offsets_minutes: reminderOffsetsMinutes,
    }),
  });

  const payload = (await response.json()) as {
    data?: OwnerPushSettings;
    message?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.message || (await nestErrorMessage(response)),
    );
  }

  return payload.data;
};
