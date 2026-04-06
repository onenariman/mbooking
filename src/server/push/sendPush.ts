import webpush from "web-push";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { supabaseAdmin } from "@/src/utils/supabase/admin";

export type PushNotificationPayload = {
  body: string;
  requireInteraction?: boolean;
  tag?: string;
  title: string;
  url?: string;
};

type PushSubscriptionRow = {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
};

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export const isPushConfigured = () =>
  Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

const getWebPush = () => {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error("VAPID env vars are not configured");
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  return webpush;
};

const deactivateInvalidSubscription = async (subscriptionId: string) => {
  await supabaseAdmin.from("push_subscriptions").delete().eq("id", subscriptionId);
};

export const sendOwnerPushNotification = async ({
  ownerUserId,
  payload,
}: {
  ownerUserId: string;
  payload: PushNotificationPayload;
}) => {
  if (!isPushConfigured()) {
    return {
      failed: 0,
      sent: 0,
      skipped: true,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("owner_user_id", ownerUserId)
    .eq("audience", "owner");

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  const subscriptions = (data ?? []) as PushSubscriptionRow[];
  if (subscriptions.length === 0) {
    return {
      failed: 0,
      sent: 0,
      skipped: false,
    };
  }

  const push = getWebPush();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await push.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (error) {
        failed += 1;

        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof (error as { statusCode?: number }).statusCode === "number"
            ? (error as { statusCode?: number }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await deactivateInvalidSubscription(subscription.id);
        }
      }
    }),
  );

  return {
    failed,
    sent,
    skipped: false,
  };
};
