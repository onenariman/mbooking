import type { Client } from "@prisma/client";

export type ClientResponse = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  user_id: string;
};

export function toClientResponse(client: Client): ClientResponse {
  return {
    id: client.id,
    created_at: client.createdAt.toISOString(),
    name: client.name,
    phone: client.phone,
    user_id: client.userId,
  };
}
