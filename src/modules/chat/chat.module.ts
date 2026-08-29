import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ChatController } from "./chat.controller";
import { StaffChatController, ChatDebugController } from "./staff-chat.controller";
import { ChatUploadController, StaffChatUploadController } from "./chat-upload.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { CloudinaryService } from "./cloudinary.service";
import { Conversation } from "./entities/conversations.entity";
import { Message } from "./entities/messages.entity";
import { MessageReaction } from "./entities/message-reaction.entity";
import { Patient } from "../assessments/entities/patient.entity";
import { User } from "../auth/entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PatientNotificationsModule } from '../patient-notifications/patient-notifications.module'
import { StaffNotificationsModule } from "../staff-notifications/staff-notifications.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, MessageReaction, Patient, User]),
        MulterModule.register({ storage: memoryStorage() }),
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
    controllers: [ChatController, StaffChatController, ChatDebugController, ChatUploadController, StaffChatUploadController],
    providers: [ChatService, ChatGateway, CloudinaryService],
    exports: [ChatService],
})
export class ChatModule { }
