import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = config.get<number>('SMTP_PORT');
        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: port,
            secure: port === 465,
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
          },
          defaults: {
            from: '"KRPS Portal" <noreply@krps.com>',
          },
        };
      },
    }),
    AssessmentsModule,
    AuthModule,
    LeadsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}