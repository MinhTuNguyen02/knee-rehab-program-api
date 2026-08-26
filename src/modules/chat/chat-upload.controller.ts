import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PatientJwtAuthGuard } from '../patient-auth/guards/patient-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CloudinaryService } from './cloudinary.service';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const uploadOptions = {
    storage: memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new BadRequestException('Only JPEG, PNG, WEBP and GIF images are allowed'), false);
        }
        cb(null, true);
    },
};

// ─── Patient upload ───────────────────────────────────────────
@ApiTags('chat')
@Controller('chat')
@UseGuards(PatientJwtAuthGuard)
@ApiBearerAuth()
export class ChatUploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @Post('upload-image')
    @ApiOperation({ summary: 'Upload an image for patient chat' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @UseInterceptors(FileInterceptor('file', uploadOptions))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided');
        const url = await this.cloudinaryService.uploadBuffer(file.buffer, 'chat');
        return { url };
    }
}

// ─── Staff upload ─────────────────────────────────────────────
@ApiTags('staff/chat')
@Controller('staff/chat')
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffChatUploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @Post('upload-image')
    @ApiOperation({ summary: 'Upload an image for staff chat' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @UseInterceptors(FileInterceptor('file', uploadOptions))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided');
        const url = await this.cloudinaryService.uploadBuffer(file.buffer, 'chat');
        return { url };
    }
}
