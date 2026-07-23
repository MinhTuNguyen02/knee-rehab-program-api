import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { GetMessagesQueryDto, CreateMessageDto } from './dto/chat.dto';
import { PatientJwtAuthGuard } from '../patient-auth/guards/patient-jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(PatientJwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversation')
    @ApiOperation({ summary: 'Get or create conversation for the current patient' })
    @ApiResponse({ status: 200, description: 'Returns the conversation thread info.' })
    getConversation(@Req() req: any) {
        return this.chatService.getOrCreateConversation(req.user.id);
    }

    @Get('messages')
    @ApiOperation({ summary: 'Get chat messages with cursor-based pagination' })
    @ApiQuery({ name: 'after', required: false, description: 'Cursor to get newer messages' })
    @ApiQuery({ name: 'before', required: false, description: 'Cursor to get older messages' })
    @ApiQuery({ name: 'limit', required: false, description: 'Default is 20' })
    @ApiResponse({ status: 200, description: 'Returns list of messages and pagination meta.' })
    getMessages(@Req() req: any, @Query() query: GetMessagesQueryDto) {
        return this.chatService.getMessages(req.user.id, query);
    }

    @Post('messages')
    @ApiOperation({ summary: 'Send a new message' })
    @ApiResponse({ status: 201, description: 'The message has been successfully sent.' })
    sendMessage(@Req() req: any, @Body() dto: CreateMessageDto) {
        return this.chatService.sendMessage(req.user.id, dto);
    }

    @Patch('conversation/read')
    @ApiOperation({ summary: 'Mark all messages in the conversation as read by the patient' })
    @ApiResponse({ status: 200, description: 'Conversation marked as read.' })
    markConversationAsRead(@Req() req: any) {
        return this.chatService.markConversationAsReadByPatient(req.user.id);
    }
}