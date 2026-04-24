import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    if (status >= 500) {
      this.logger.error(exception);
    }

    const errorMessage = typeof message === 'string' ? message : (message as any).message ?? message;

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error && {
        error: exception.message,
        stack: exception.stack,
      }),
      timestamp: new Date().toISOString(),
    });
  }
}
