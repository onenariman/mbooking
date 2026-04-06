declare module "web-push" {
  type WebPushSubscription = {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };

  interface WebPushModule {
    sendNotification(
      subscription: WebPushSubscription,
      payload?: string,
    ): Promise<unknown>;
    setVapidDetails(
      subject: string,
      publicKey: string,
      privateKey: string,
    ): void;
  }

  const webpush: WebPushModule;
  export default webpush;
}
