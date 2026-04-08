import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

export type CompleteAppointmentPayload = {
  id: string;
  amount?: number | null;
  extra_amount?: number | null;
  ignore_discount?: boolean;
  service_amount?: number | null;
};

export type CompleteAppointmentResult = {
  feedback_token: string;
  feedback_url: string;
};

export const completeAppointment = async ({
  id,
  amount,
  extra_amount,
  ignore_discount,
  service_amount,
}: CompleteAppointmentPayload): Promise<CompleteAppointmentResult> => {
  const requestBody = {
    ...(amount === undefined ? {} : { amount }),
    ...(extra_amount === undefined ? {} : { extra_amount }),
    ...(ignore_discount === undefined ? {} : { ignore_discount }),
    ...(service_amount === undefined ? {} : { service_amount }),
  };

  const response = await nestOwnerFetch(`appointments/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  const payload = (await response.json()) as {
    data?: CompleteAppointmentResult;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }

  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  return payload.data;
};
