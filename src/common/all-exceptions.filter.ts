import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

type ErrorBody = { error: string; fieldErrors?: Record<string, string> };

// Estandariza TODAS las respuestas de error como JSON { error, fieldErrors? }.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions");

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { error: "Error interno del servidor." };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === "string") {
        body = { error: r };
      } else if (r && typeof r === "object") {
        const obj = r as Record<string, unknown>;
        if (obj.fieldErrors) {
          body = {
            error: (obj.error as string) ?? "Revisa los campos marcados.",
            fieldErrors: obj.fieldErrors as Record<string, string>,
          };
        } else {
          const msg = Array.isArray(obj.message)
            ? (obj.message[0] as string)
            : ((obj.message as string) ?? (obj.error as string));
          body = { error: typeof msg === "string" ? msg : "Error" };
        }
      }
    } else {
      this.logger.error(exception);
    }

    res.status(status).json(body);
  }
}
