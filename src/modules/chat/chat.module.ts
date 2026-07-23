import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { StaffChatController } from "./staff-chat.controller";
import { ChatService } from "./chat.service";
import { Conversation } from "./entities/conversations.entity";
import { Message } from "./entities/messages.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, Message])],
    controllers: [ChatController, StaffChatController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule { }
