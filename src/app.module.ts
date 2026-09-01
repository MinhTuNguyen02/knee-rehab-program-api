import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PatientAuthModule } from './modules/patient-auth/patient-auth.module';
import { PatientDataModule } from './modules/patient-data/patient-data.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MailerModule } from '@nestjs-modules/mailer';
import { PatientNotificationsModule } from './modules/patient-notifications/patient-notifications.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { ChatModule } from './modules/chat/chat.module';
import { StaffNotificationsModule } from './modules/staff-notifications/staff-notifications.module'
import { StickersModule } from './modules/stickers/stickers.module';
import { ScheduleModule } from '@nestjs/schedule';

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

        const fromEmail = config.get<string>('SMTP_FROM_EMAIL') || '';

        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: port,
            secure: port === 465,
            auth: {
              user: smtpUser,
              pass: config.get<string>('SMTP_PASS'),
            },
            family: 4,
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: `"KRPS Portal" <${fromEmail}>`,
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    AssessmentsModule,
    AuthModule,
    LeadsModule,
    DashboardModule,
    PatientAuthModule,
    PatientDataModule,
    FirebaseModule,
    PatientNotificationsModule,
    StaffNotificationsModule,
    StickersModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}