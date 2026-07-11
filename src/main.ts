import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  // Enable CORS for frontend applications
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Apply security headers
  app.use(helmet());

  // Apply gzip compression
  app.use(compression());

  // Enable global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('KRPS API')
    .setDescription('The Knee Rehab Program System API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`Swagger documentation is available at: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
