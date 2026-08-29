import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../assessments/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { Logger } from '@nestjs/common';
import { ReactionSenderType } from './entities/message-reaction.entity';

@WebSocketGateway({
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // map socketId -> user info
    private connectedClients = new Map<string, { userId: string; userType: 'patient' | 'staff' }>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly chatService: ChatService,
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            if (!token) {
                client.disconnect(true);
                return;
            }

            const payload = this.jwtService.verify(token);
            const userType: 'patient' | 'staff' = payload.type === 'patient' ? 'patient' : 'staff';
            const userId = payload.sub;

            this.connectedClients.set(client.id, { userId, userType });
            this.logger.log(`[connect] ${userType} ${userId} connected (socket: ${client.id})`);

            client.on('join:conversation', (data: { conversationId: string }) => {
                this.handleJoinConversation(client, data);
            });

            client.on('leave:conversation', (data: { conversationId: string }) => {
                this.handleLeaveConversation(client, data);
            });

            client.on('message:send', async (data: { conversationId: string; body: string; id: string; client_timestamp: number }, callback?: Function) => {
                await this.handleMessageSend(client, data, callback);
            });

            client.on('message:read', async (data: { conversationId: string }) => {
                await this.handleMessageRead(client, data);
            });

            client.on('typing:start', async (data: { conversationId: string }) => {
                await this.handleTypingStart(client, data);
            });

            client.on('typing:stop', async (data: { conversationId: string }) => {
                await this.handleTypingStop(client, data);
            });

            client.on('reaction:toggle', async (data: { messageId: string; conversationId: string; emoji: string }) => {
                await this.handleReactionToggle(client, data);
            });

            if (userType === 'patient') {
                const patient = await this.patientRepository.findOne({ where: { id: userId } });
                if (!patient) {
                    this.connectedClients.delete(client.id);
                    client.disconnect(true);
                    return;
                }
                const conversation = await this.chatService.getOrCreateConversation(userId);

                client.join(`conversation:${conversation.id}`);
                client.data.conversationId = conversation.id;
                this.logger.log(`[connect] patient ${userId} auto-joined room conversation:${conversation.id}`);

                client.to(`conversation:${conversation.id}`).emit('patient:status', { isOnline: true });

                this.server.to('staff_inbox').emit('patient:global_status', { patientId: userId, isOnline: true });

                const room = this.server.sockets.adapter.rooms.get(`conversation:${conversation.id}`);
                let isStaffInRoom = false;

                if (room) {
                    for (const socketId of room) {
                        const clientInfo = this.connectedClients.get(socketId);
                        if (clientInfo?.userType === 'staff') {
                            isStaffInRoom = true;
                            break;
                        }
                    }
                }

                client.emit('staff:status', { isOnline: isStaffInRoom });
            } else {
                client.join('staff_inbox');
                this.logger.log(`[connect] staff ${userId} joined staff_inbox`);

                const user = await this.userRepository.findOne({ where: { id: userId } });
                if (!user) {
                    this.connectedClients.delete(client.id);
                    client.disconnect(true);
                    return;
                }

                const onlinePatientIds = Array.from(this.connectedClients.values())
                    .filter(info => info.userType === 'patient')
                    .map(info => info.userId);

                client.emit('patient:global_initial', onlinePatientIds);
            }

        } catch (error) {
            this.logger.error(`[connect] auth failed: ${error.message}`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const userInfo = this.connectedClients.get(client.id);
        if (userInfo) {
            this.logger.log(`[disconnect] ${userInfo.userType} ${userInfo.userId} disconnected`);
            this.connectedClients.delete(client.id);

            const conversationId = client.data.conversationId;

            if (conversationId) {
                if (userInfo.userType === 'patient') {
                    this.server.to(`conversation:${conversationId}`).emit('patient:status', { isOnline: false });
                    this.server.to('staff_inbox').emit('patient:global_status', { patientId: userInfo.userId, isOnline: false });
                } else {
                    this.server.to(`conversation:${conversationId}`).emit('staff:status', { isOnline: false });
                }
            }
        }
    }

    private handleJoinConversation(client: Socket, data: { conversationId: string }) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) {
            this.logger.warn(`[join:conversation] unknown client ${client.id}`);
            return;
        }
        if (userInfo.userType === 'staff') {
            client.join(`conversation:${data.conversationId}`);
            client.data.conversationId = data.conversationId;
            this.logger.log(`[join:conversation] staff ${userInfo.userId} joined conversation:${data.conversationId}`);
            client.to(`conversation:${data.conversationId}`).emit('staff:status', { isOnline: true });

            const room = this.server.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
            let isPatientInRoom = false;

            if (room) {
                for (const socketId of room) {
                    const clientInfo = this.connectedClients.get(socketId);
                    if (clientInfo?.userType === 'patient') {
                        isPatientInRoom = true;
                        break;
                    }
                }
            }

            client.emit('patient:status', { isOnline: isPatientInRoom });
        }
    }

    private handleLeaveConversation(client: Socket, data: { conversationId: string }) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;
        if (userInfo.userType === 'staff') {
            client.leave(`conversation:${data.conversationId}`);
            client.data.conversationId = null;
            this.logger.log(`[leave:conversation] staff ${userInfo.userId} left conversation:${data.conversationId}`);
            client.to(`conversation:${data.conversationId}`).emit('staff:status', { isOnline: false });
        }
    }

    private async handleMessageSend(
        client: Socket,
        data: { conversationId: string; body?: string; id: string; client_timestamp: number; replyToMessageId?: string; imageUrl?: string },
        callback?: Function
    ) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;

        try {
            let message;
            let conversationId: string;
            if (userInfo.userType === 'patient') {
                message = await this.chatService.sendMessage(userInfo.userId, {
                    id: data.id,
                    client_timestamp: data.client_timestamp,
                    body: data.body,
                    replyToMessageId: data.replyToMessageId,
                    imageUrl: data.imageUrl,
                });

                conversationId = client.data.conversationId;
            } else {
                message = await this.chatService.sendStaffMessage(
                    data.conversationId,
                    userInfo.userId,
                    {
                        id: data.id,
                        client_timestamp: data.client_timestamp,
                        body: data.body,
                        replyToMessageId: data.replyToMessageId,
                        imageUrl: data.imageUrl,
                    },
                );

                conversationId = data.conversationId;
            }

            this.logger.log(`[message:send] ${userInfo.userType} ${userInfo.userId} -> conversation:${conversationId} (msg: ${message.id})`);

            const room = `conversation:${conversationId}`;
            this.logger.log(
                `Room ${room} sockets: ${Array.from(this.server.sockets.adapter.rooms.get(room) ?? [])
                }`
            );
            // Broadcast to everyone else in the conversation room
            client.to(`conversation:${conversationId}`).emit('message:receive', message);

            // Broadcast streak update to the whole conversation room (both sides)
            const freshConv = await this.chatService.getConversationById(conversationId);
            if (freshConv) {
                this.server.to(`conversation:${conversationId}`).emit('streak:update', {
                    conversationId,
                    streakCount: freshConv.streakCount,
                    streakActiveToday: freshConv.streakActiveToday,
                });
            }

            // Update inbox for all staff
            this.server.to('staff_inbox').emit('conversation:update', { conversationId: conversationId, lastMessage: message });

            // ACK back to sender with the saved message
            if (typeof callback === 'function') {
                callback(message);
            }
        } catch (error) {
            this.logger.error(`[message:send] error: ${error.message}`);
            if (typeof callback === 'function') {
                callback({ error: error.message });
            }
        }
    }

    private async handleMessageRead(client: Socket, data: { conversationId: string }) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;

        try {
            let conversationId: string;

            if (userInfo.userType === 'patient') {
                await this.chatService.markConversationAsReadByPatient(userInfo.userId);

                conversationId =
                    userInfo.userType === 'patient'
                        ? client.data.conversationId
                        : data.conversationId;

            } else {
                await this.chatService.markConversationAsReadByStaff(data.conversationId);

                conversationId = data.conversationId;
            }

            this.logger.log(
                `[message:read] ${userInfo.userType} ${userInfo.userId} read conversation:${conversationId}`
            );

            client.to(`conversation:${conversationId}`).emit("message:read", {
                conversationId,
                readBy: userInfo.userType,
            });
        } catch (error) {
            this.logger.error(`[message:read] error: ${error.message}`);
        }
    }

    private async handleTypingStart(client: Socket, data: { conversationId: string }) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;

        let conversationId: string;

        if (userInfo.userType === 'patient') {
            conversationId =
                userInfo.userType === 'patient'
                    ? client.data.conversationId
                    : data.conversationId;

        } else {
            conversationId = data.conversationId;
        }

        client.to(`conversation:${conversationId}`).emit('typing:start', {
            userType: userInfo.userType
        });
    }

    private async handleTypingStop(client: Socket, data: { conversationId: string }) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;

        let conversationId: string;

        if (userInfo.userType === 'patient') {
            conversationId =
                userInfo.userType === 'patient'
                    ? client.data.conversationId
                    : data.conversationId;
        } else {
            conversationId = data.conversationId;
        }

        client.to(`conversation:${conversationId}`).emit('typing:stop', {
            userType: userInfo.userType
        });
    }

    private async handleReactionToggle(
        client: Socket,
        data: { messageId: string; conversationId: string; emoji: string },
    ) {
        const userInfo = this.connectedClients.get(client.id);
        if (!userInfo) return;

        try {
            const senderType = userInfo.userType === 'patient'
                ? ReactionSenderType.PATIENT
                : ReactionSenderType.STAFF;

            const result = await this.chatService.toggleReaction(
                data.messageId,
                data.conversationId,
                userInfo.userId,
                senderType,
                data.emoji,
            );

            // Broadcast to entire room (including sender) so everyone sees the update
            this.server.to(`conversation:${result.conversationId}`).emit('reaction:update', result);

            this.logger.log(`[reaction:toggle] ${userInfo.userType} ${userInfo.userId} reacted ${data.emoji} on message ${data.messageId}`);
        } catch (error) {
            this.logger.error(`[reaction:toggle] error: ${error.message}`);
        }
    }
}
