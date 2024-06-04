import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/exception-filter/all-exception-filter';
import { LoggerService } from './common/services/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const httpAdapterHost = app.get(HttpAdapterHost);
  const loggerService = app.get(LoggerService);

  app.useGlobalFilters(new AllExceptionFilter(httpAdapterHost, loggerService));

  app.useLogger(loggerService);

  await app.listen(3000);
}
void bootstrap();
