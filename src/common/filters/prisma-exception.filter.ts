import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { Request, Response } from 'express';
import { ErrorResponse } from '../types/ error-response.type';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolveError(exception);

    const error: ErrorResponse = {
      success: false,
      statusCode: status,
      error: HttpStatus[status],
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
    response.status(status).json(error);
  }

  private resolveError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint violation on: ${(exception.meta?.target as string[])?.join(', ')}`,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Related record not found for: ${exception.meta?.field_name}`,
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: (exception.meta?.cause as string) ?? 'Record not found',
        };
      default:
        this.logger.error(`Unhandled Prisma error: ${exception.code}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
    }
  }
}