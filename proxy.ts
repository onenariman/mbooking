import { type NextRequest } from "next/server";
import { updateSession } from "@/src/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run auth proxy only for application routes.
     * Skip Next internals and static assets to avoid auth calls on HMR/chunks in dev.
     */
    "/((?!_next/|favicon.ico|.*\\..*).*)",
  ],
};
