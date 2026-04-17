import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type ClientPortalMe,
  type PatchClientPortalSettingsBody,
  fetchClientPortalMe,
  fetchValidateClientInvite,
  patchClientPortalSettings,
} from "@/src/api/clientPortal.api";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

export const CLIENT_PORTAL_ME_QUERY_KEY = ["client-portal", "me"] as const;

export const clientInviteValidateQueryKey = (token: string) =>
  ["client-portal", "invite-validate", token] as const;

export function useClientPortalMe(initialData?: ClientPortalMe | null) {
  return useQuery({
    queryKey: CLIENT_PORTAL_ME_QUERY_KEY,
    queryFn: fetchClientPortalMe,
    ...(initialData != null
      ? {
          initialData,
        }
      : {}),
    ...QUERY_OPTIONS.clientPortal,
  });
}

export function usePatchClientPortalSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PatchClientPortalSettingsBody) =>
      patchClientPortalSettings(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CLIENT_PORTAL_ME_QUERY_KEY,
      });
    },
  });
}

export function useValidateClientInvite(token: string) {
  return useQuery({
    queryKey: clientInviteValidateQueryKey(token),
    queryFn: () => fetchValidateClientInvite(token),
    enabled: Boolean(token && token.length >= 16),
    ...QUERY_OPTIONS.clientPortal,
  });
}
