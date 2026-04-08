import type { Service } from "@prisma/client";

export type ServiceResponse = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  category_id: string | null;
  price: number | null;
};

export function toServiceResponse(service: Service): ServiceResponse {
  return {
    id: service.id,
    created_at: service.createdAt.toISOString(),
    user_id: service.userId,
    name: service.name,
    category_id: service.categoryId,
    price: service.price === null ? null : Number(service.price),
  };
}
