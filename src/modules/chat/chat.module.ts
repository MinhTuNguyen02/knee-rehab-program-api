import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { StaffChatController } from "./staff-chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { Conversation } from "./entities/conversations.entity";
import { Message } from "./entities/messages.entity";
import { Patient } from "../assessments/entities/patient.entity";
import { User } from "../auth/entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PatientNotificationsModule } from '../patient-notifications/patient-notifications.module'
import { StaffNotificationsModule } from "../StaffNotificationsModule/staff-notifications.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, Patient, User]),
        PatientNotificationsModule,
        StaffNotificationsModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                return {
                    secret,
                };
            },
        }),
    ],
    controllers: [ChatController, StaffChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule { }
