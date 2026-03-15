import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const prefix = config.get<string>('app.prefix') ?? 'api/v1';
  const origins = config.get<string[]>('app.corsOrigins') ?? [];

  // logger
  app.useLogger(app.get(Logger));

  // cookie parser — must be before guards
  app.use(cookieParser());

  // global prefix — matches Spring's context-path
  app.setGlobalPrefix(prefix);

  // cors
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // global pipes, filters, interceptors
  app.useGlobalPipes(AppValidationPipe);
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(port);
}

void bootstrap();

