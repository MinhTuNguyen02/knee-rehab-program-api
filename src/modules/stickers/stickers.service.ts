import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StickerPack } from './entities/sticker-pack.entity';
import { Sticker } from './entities/sticker.entity';

@Injectable()
export class StickersService {
    constructor(
        @InjectRepository(StickerPack)
        private packRepository: Repository<StickerPack>,
        @InjectRepository(Sticker)
        private stickerRepository: Repository<Sticker>,
    ) { }

    async getActivePacks(): Promise<StickerPack[]> {
        return this.packRepository.find({
            where: { isActive: true },
            relations: ['stickers'],
            order: {
                sortOrder: 'ASC',
                stickers: {
                    sortOrder: 'ASC',
                },
            },
        });
    }
}
