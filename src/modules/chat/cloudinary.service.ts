import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private readonly config: ConfigService) {
        const cloudinaryUrl = this.config.get<string>('CLOUDINARY_URL');
        if (cloudinaryUrl) {
            // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
            const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
            if (match) {
                cloudinary.config({
                    api_key: match[1],
                    api_secret: match[2],
                    cloud_name: match[3],
                });
            }
        }
    }

    async uploadBuffer(buffer: Buffer, folder = 'chat'): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary upload failed', error);
                        return reject(new Error(error.message));
                    }
                    resolve(result!.secure_url);
                },
            );

            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        });
    }
}
