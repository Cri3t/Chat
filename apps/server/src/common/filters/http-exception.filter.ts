import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationError,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse } from "../interfaces/api-response.interface";

type ExceptionBody = {
  code?: number;
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as string | ExceptionBody | ValidationError[];

      const { code, message } = this.normalizeHttpException(status, body);
      response.status(status).json({
        code,
        data: null,
        message,
      } satisfies ApiResponse<null>);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 50000,
      data: null,
      message: "internal server error",
    } satisfies ApiResponse<null>);
  }

  private normalizeHttpException(status: number, body: string | ExceptionBody | ValidationError[]) {
    if (status === HttpStatus.UNAUTHORIZED) {
      return {
        code: -1,
        message: "unauthorized",
      };
    }

    if (typeof body === "string") {
      return {
        code: this.defaultCodeByStatus(status),
        message: body,
      };
    }

    if (Array.isArray(body)) {
      return {
        code: 40001,
        message: "validation failed",
      };
    }

    const code = typeof body.code === "number" ? body.code : this.defaultCodeByStatus(status);
    const messageRaw = body.message;
    const message = Array.isArray(messageRaw)
      ? messageRaw.join("; ")
      : (messageRaw ?? "request failed");

    return {
      code,
      message,
    };
  }

  private defaultCodeByStatus(status: number) {
    if (status === HttpStatus.BAD_REQUEST) {
      return 40001;
    }
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return -1;
    }
    if (status === HttpStatus.NOT_FOUND) {
      return 40400;
    }
    return 50000;
  }
}
