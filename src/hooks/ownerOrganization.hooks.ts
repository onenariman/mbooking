import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOwnerOrganization,
  patchOwnerOrganization,
  type OwnerOrganization,
  type PatchOwnerOrganizationBody,
} from "@/src/api/ownerOrganization.api";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

export const OWNER_ORGANIZATION_QUERY_KEY = ["owner", "organization"] as const;

export function useOwnerOrganization(initialData?: OwnerOrganization | null) {
  return useQuery({
    queryKey: OWNER_ORGANIZATION_QUERY_KEY,
    queryFn: fetchOwnerOrganization,
    ...(initialData != null
      ? {
          initialData,
        }
      : {}),
    ...QUERY_OPTIONS.live,
  });
}

export function usePatchOwnerOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PatchOwnerOrganizationBody) => patchOwnerOrganization(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: OWNER_ORGANIZATION_QUERY_KEY,
      });
    },
  });
}

