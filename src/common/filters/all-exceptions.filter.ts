import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Determine error code based on status
    let code = 'INTERNAL_SERVER_ERROR';
    if (status === HttpStatus.BAD_REQUEST) code = 'BAD_REQUEST';
    else if (status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHORIZED';
    else if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
    else if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
    else if (status === HttpStatus.CONFLICT) code = 'CONFLICT';
    else if (status === HttpStatus.TOO_MANY_REQUESTS) code = 'RATE_LIMIT_EXCEEDED';

    const errorMessage = typeof message === 'string' ? message : (message as any).message || message;

    response.status(status).json({
      error: {
        code,
        message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      }
    });
  }
}
