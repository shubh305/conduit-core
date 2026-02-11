import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from "@nestjs/common";
import { Request, Response } from "express";

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as string | HttpExceptionResponse;

    this.logger.error(`HTTP ${status} Error: ${JSON.stringify(exceptionResponse)}`, exception.stack);

    const message =
      typeof exceptionResponse === "object"
        ? (exceptionResponse as HttpExceptionResponse).message || exception.message
        : exceptionResponse || exception.message;

    const error =
      typeof exceptionResponse === "object"
        ? (exceptionResponse as HttpExceptionResponse).error || exception.name
        : exception.name;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
    });
  }
}
