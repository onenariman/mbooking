import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === "production";

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = this.buildHttpExceptionBody(
        status,
        raw,
        request.url,
      );
      response.status(status).json(body);
      return;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(err.message, err.stack);

    const body: ErrorBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: isProd ? "Internal server error" : err.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }

  private buildHttpExceptionBody(
    status: number,
    raw: string | object,
    path: string,
  ): ErrorBody {
    if (typeof raw === "string") {
      return {
        statusCode: status,
        error: HttpStatus[status] ?? "Error",
        message: raw,
        path,
        timestamp: new Date().toISOString(),
      };
    }

    const obj = raw as Record<string, unknown>;
    const message = obj.message;
    const resolvedMessage: string | string[] = Array.isArray(message)
      ? (message as string[])
      : typeof message === "string"
        ? message
        : "Error";

    const errorLabel =
      typeof obj.error === "string"
        ? obj.error
        : HttpStatus[status] ?? "Error";

    return {
      statusCode: status,
      error: errorLabel,
      message: resolvedMessage,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
