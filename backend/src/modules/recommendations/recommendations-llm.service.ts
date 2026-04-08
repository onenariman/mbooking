import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type LlmResult = {
  modelName: string;
  responseText: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function mapLlmError(
  error: unknown,
  fallback = "Ошибка генерации рекомендаций",
): string {
  const message = getErrorMessage(error, fallback);
  const normalized = message.toLowerCase();

  if (normalized.includes("timeout")) {
    return "Модель не ответила вовремя";
  }
  if (normalized.includes("пустой ответ")) {
    return "Модель вернула пустой ответ";
  }
  if (normalized.includes("yandex")) {
    return "Ошибка Yandex AI";
  }

  return message;
}

type YandexCompletionResponse = {
  result?: {
    alternatives?: Array<{
      message?: {
        text?: string;
      };
    }>;
    usage?: {
      inputTextTokens?: string | number;
      completionTokens?: string | number;
    };
  };
};

function parseTokenCount(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

@Injectable()
export class RecommendationsLlmService {
  constructor(private readonly config: ConfigService) {}

  async runLlm(prompt: string): Promise<LlmResult> {
    const folderId = this.config.get<string>("app.ai.yandexFolderId");
    const configuredUri = this.config.get<string>("app.ai.yandexModelUri") ?? "";
    const modelUri =
      configuredUri.length > 0
        ? configuredUri
        : folderId
          ? `gpt://${folderId}/yandexgpt/latest`
          : "";
    const iamToken = this.config.get<string>("app.ai.yandexIamToken");
    const apiKey = this.config.get<string>("app.ai.yandexApiKey");

    if (!folderId) {
      throw new Error("YANDEX_FOLDER_ID не задан");
    }
    if (!iamToken && !apiKey) {
      throw new Error("Нужен YANDEX_IAM_TOKEN или YANDEX_API_KEY");
    }

    const authHeader = iamToken ? `Bearer ${iamToken}` : `Api-Key ${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    let yandexResponse: Response;
    try {
      yandexResponse = await fetch(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            "x-folder-id": folderId,
          },
          body: JSON.stringify({
            modelUri,
            completionOptions: {
              stream: false,
              temperature: 0.2,
              maxTokens: "800",
            },
            messages: [
              {
                role: "user",
                text: prompt,
              },
            ],
          }),
          cache: "no-store",
          signal: controller.signal,
        },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Yandex AI timeout: модель не ответила за 120 секунд");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!yandexResponse.ok) {
      const text = await yandexResponse.text();
      throw new Error(`Yandex AI error: ${text || yandexResponse.statusText}`);
    }

    const data = (await yandexResponse.json()) as YandexCompletionResponse;
    const responseText =
      data.result?.alternatives?.[0]?.message?.text?.trim() || "";
    if (!responseText) {
      throw new Error("Пустой ответ от Yandex AI");
    }

    return {
      modelName: modelUri,
      responseText,
      inputTokens: parseTokenCount(data.result?.usage?.inputTextTokens),
      outputTokens: parseTokenCount(data.result?.usage?.completionTokens),
    };
  }
}
