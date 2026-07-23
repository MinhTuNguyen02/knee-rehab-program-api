import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { GetMessagesQueryDto, CreateMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('staff/chat')
@Controller('staff/chat')
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversations')
    @ApiOperation({ summary: 'Get all conversation threads for staff' })
    @ApiResponse({ status: 200, description: 'Returns all conversation threads.' })
    getConversations() {
        return this.chatService.getConversationsForStaff();
    }

    @Get('conversations/patient/:patientId')
    @ApiOperation({ summary: 'Get or create a conversation for a specific patient by ID' })
    @ApiResponse({ status: 200, description: 'Returns the conversation thread info.' })
    getOrCreateConversationForPatient(@Param('patientId') patientId: string) {
        return this.chatService.getOrCreateConversation(patientId);
    }

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get messages for a conversation with cursor pagination' })
    @ApiQuery({ name: 'after', required: false, description: 'Cursor to get newer messages' })
    @ApiQuery({ name: 'before', required: false, description: 'Cursor to get older messages' })
    @ApiQuery({ name: 'limit', required: false, description: 'Default is 20' })
    @ApiResponse({ status: 200, description: 'Returns list of messages.' })
    getMessages(@Param('id') conversationId: string, @Query() query: GetMessagesQueryDto) {
        return this.chatService.getMessagesForStaff(conversationId, query);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Send a reply message as staff' })
    @ApiResponse({ status: 201, description: 'Message sent successfully.' })
    sendMessage(@Req() req: any, @Param('id') conversationId: string, @Body() dto: CreateMessageDto) {
        return this.chatService.sendStaffMessage(conversationId, req.user.id, dto);
    }

    @Patch('conversations/:id/read')
    @ApiOperation({ summary: 'Mark all patient messages in a conversation as read' })
    @ApiResponse({ status: 200, description: 'Conversation marked as read.' })
    markAsRead(@Param('id') conversationId: string) {
        return this.chatService.markConversationAsReadByStaff(conversationId);
    }
}
