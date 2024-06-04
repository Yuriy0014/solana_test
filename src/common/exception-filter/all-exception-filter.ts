import type { ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { LoggerService } from '../services/logger/logger.service';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  constructor(
    { httpAdapter }: HttpAdapterHost,
    private readonly loggerService: LoggerService,
  ) {
    super(httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    // Логирование ошибки
    this.loggerService.error(exception);
    console.log(JSON.stringify(exception, null, '\t')); // Для детального логирования в консоль

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'string' ? response : (response as any).message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Отправка ответа клиенту
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
