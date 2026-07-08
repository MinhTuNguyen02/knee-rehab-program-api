import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PatientAuthModule } from './patient-auth/patient-auth.module';
import { PatientDataModule } from './patient-data/patient-data.module';
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
        const port = parseInt(config.get<string>('SMTP_PORT') || '587', 10);
        const smtpUser = config.get<string>('SMTP_USER') || '';
        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: port,
            secure: port === 465,
            auth: {
              user: smtpUser,
              pass: config.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: `"KRPS Portal" <${smtpUser}>`,
          },
        };
      },
    }),
    AssessmentsModule,
    AuthModule,
    LeadsModule,
    DashboardModule,
    PatientAuthModule,
    PatientDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}