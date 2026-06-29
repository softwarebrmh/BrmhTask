import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      if (Array.isArray(exceptionResponse.message)) {
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
        details = exceptionResponse.message.map((msg: string) => ({ message: msg }));
      } else {
        message = exceptionResponse.message ?? exception.message;
        code = exceptionResponse.error ?? this.statusToCode(statusCode);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'Record not found';
      } else {
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      }
    } else {
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
        ...(details ? { details } : {}),
      },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      422: 'VALIDATION_ERROR',
    };
    return map[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
