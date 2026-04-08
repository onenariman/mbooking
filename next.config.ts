import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.8.0.12"],
  env: {
    /** Публичный URL Nest для клиентских fetch (feedback, приглашения). В dev — localhost:4000, если не задано. */
    NEXT_PUBLIC_NEST_API_URL:
      process.env.NEXT_PUBLIC_NEST_API_URL ||
      process.env.NEST_API_INTERNAL_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:4000" : ""),
  },
};

export default nextConfig;
