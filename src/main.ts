import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend applications
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://knee-rehab-program-assess.onrender.com',
      'https://knee-rehab-program-portal.onrender.com'
    ],
    credentials: true,
  });

  // Enable global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

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
