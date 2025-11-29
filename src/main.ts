import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './interceptors/response-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger(process.env.APP_NAME, {
      timestamp: true,
    }),
  });

  const logger = new Logger();
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME)
    .setDescription('Roommate Backend API Documentation')
    .setVersion('1.0')
    .addTag('roommate')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Roommate API Docs',
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);
  if (process.env.NODE_ENV === 'development') {
    // TODO env var
    logger.log(`application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
void bootstrap();
