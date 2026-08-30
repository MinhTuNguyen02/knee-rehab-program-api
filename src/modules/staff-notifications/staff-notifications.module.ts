import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffNotificationsController } from './staff-notifications.controller';
import { StaffNotificationsService } from './staff-notifications.service';
import { StaffNotification } from './entities/staff-notification.entity';
import { StaffDeviceToken } from './entities/staff-device-token.entity';
import { User } from '../auth/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([StaffNotification, StaffDeviceToken, User]),
    ],
    controllers: [StaffNotificationsController],
    providers: [StaffNotificationsService],
    exports: [StaffNotificationsService],
})
export class StaffNotificationsModule { }