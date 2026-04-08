import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { AppointmentArraySchema } from "@/src/schemas/books/bookSchema";
import { discountArraySchema } from "@/src/schemas/discounts/discountSchema";
import { supabaseAdmin } from "@/src/utils/supabase/admin";
import { createClient } from "@/src/utils/supabase/server";
import { normalizePhone } from "@/src/validators/normalizePhone";
import type { Database } from "@/types/database.types";

const clientPortalProfileSelect =
  "auth_user_id, phone, display_name, notifications_enabled, created_at, last_login_at";
const clientPortalLinkSelect =
  "id, owner_user_id, client_auth_user_id, client_id, client_phone, is_active, created_at, last_seen_at";
const clientPortalAppointmentSelect =
  "id, created_at, user_id, applied_discount_id, client_name, client_phone, service_id, service_name, category_name, appointment_at, appointment_end, status, amount, service_amount, extra_amount, discount_amount, notes";
const clientPortalDiscountSelect =
  "id, user_id, client_phone, appointment_id, feedback_token, discount_percent, is_used, used_at, created_at, source_type, note, expires_at, reserved_for_appointment_id, reserved_at, used_on_appointment_id, service_id, service_name_snapshot";

type ClientPortalProfile =
  Database["public"]["Tables"]["client_portal_profiles"]["Row"];
type ClientPortalLink = Database["public"]["Tables"]["client_portal_links"]["Row"];

export type ClientPortalContext = {
  authUserId: string;
  profile: ClientPortalProfile;
  links: ClientPortalLink[];
  activeLink: ClientPortalLink;
  clientPhone: string;
  ownerUserId: string;
  clientId: string | null;
};

export async function getClientPortalContextFromSession(): Promise<ClientPortalContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("client_portal_profiles")
    .select(clientPortalProfileSelect)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: links, error: linksError } = await supabase
    .from("client_portal_links")
    .select(clientPortalLinkSelect)
    .eq("client_auth_user_id", user.id)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (linksError || !links?.length) {
    return null;
  }

  const activeLink = links[0];
  const clientPhone =
    normalizePhone(activeLink.client_phone) || normalizePhone(profile.phone);

  if (!clientPhone) {
    return null;
  }

  return {
    authUserId: user.id,
    profile,
    links,
    activeLink,
    clientPhone,
    ownerUserId: activeLink.owner_user_id,
    clientId: activeLink.client_id,
  };
}

export async function getClientPortalAppointments(context: ClientPortalContext) {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(clientPortalAppointmentSelect)
    .eq("user_id", context.ownerUserId)
    .eq("client_phone", context.clientPhone)
    .order("appointment_at", { ascending: true });

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  const parsed = AppointmentArraySchema.safeParse(data ?? []);

  if (!parsed.success) {
    throw new Error("Данные записей клиента не прошли валидацию");
  }

  const now = Date.now();
  const upcoming = parsed.data.filter((appointment) => {
    if (appointment.status !== "booked" || !appointment.appointment_at) {
      return false;
    }

    return new Date(appointment.appointment_at).getTime() >= now;
  });

  const history = parsed.data
    .filter((appointment) => !upcoming.some((item) => item.id === appointment.id))
    .sort((left, right) => {
      const leftTime = new Date(left.appointment_at ?? left.created_at).getTime();
      const rightTime = new Date(right.appointment_at ?? right.created_at).getTime();
      return rightTime - leftTime;
    });

  return {
    upcoming,
    history: history.slice(0, 20),
  };
}

export async function getClientPortalDiscounts(context: ClientPortalContext) {
  const { data, error } = await supabaseAdmin
    .from("client_discounts")
    .select(clientPortalDiscountSelect)
    .eq("user_id", context.ownerUserId)
    .eq("client_phone", context.clientPhone)
    .order("is_used", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  const parsed = discountArraySchema.safeParse(data ?? []);

  if (!parsed.success) {
    throw new Error("Данные скидок клиента не прошли валидацию");
  }

  const now = Date.now();
  const active = parsed.data.filter((discount) => {
    if (discount.is_used) {
      return false;
    }

    if (!discount.expires_at) {
      return true;
    }

    return new Date(discount.expires_at).getTime() > now;
  });

  const archive = parsed.data.filter((discount) => {
    if (discount.is_used) {
      return true;
    }

    if (!discount.expires_at) {
      return false;
    }

    return new Date(discount.expires_at).getTime() <= now;
  });

  return {
    active,
    archive,
  };
}

export async function getClientPortalMe(context: ClientPortalContext) {
  return {
    auth_user_id: context.authUserId,
    phone: context.clientPhone,
    display_name: context.profile.display_name,
    notifications_enabled: context.profile.notifications_enabled,
    active_owner_user_id: context.ownerUserId,
    linked_businesses_count: context.links.length,
  };
}

export async function touchClientPortalSession(context: ClientPortalContext) {
  const now = new Date().toISOString();

  const [profileResult, linkResult] = await Promise.allSettled([
    supabaseAdmin
      .from("client_portal_profiles")
      .update({ last_login_at: now })
      .eq("auth_user_id", context.authUserId),
    supabaseAdmin
      .from("client_portal_links")
      .update({ last_seen_at: now })
      .eq("id", context.activeLink.id),
  ]);

  if (
    profileResult.status === "rejected" ||
    linkResult.status === "rejected"
  ) {
    return;
  }
}
