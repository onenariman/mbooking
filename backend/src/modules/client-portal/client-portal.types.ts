import type {
  ClientPortalInvite,
  ClientPortalLink,
  ClientPortalProfile,
} from "@prisma/client";

export type ClientPortalContext = {
  authUserId: string;
  profile: ClientPortalProfile;
  links: ClientPortalLink[];
  activeLink: ClientPortalLink;
  clientPhone: string;
  ownerUserId: string;
  clientId: string | null;
};

export type ClientPortalInviteView = {
  client_phone: string;
  client_phone_display: string;
  client_name: string | null;
  purpose: string;
  expires_at: string;
};

export function toInviteView(invite: ClientPortalInvite): ClientPortalInviteView {
  return {
    client_phone: invite.clientPhone,
    client_phone_display: invite.clientPhone,
    client_name: null,
    purpose: invite.purpose,
    expires_at: invite.expiresAt.toISOString(),
  };
}
