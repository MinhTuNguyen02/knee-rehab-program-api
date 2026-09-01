import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StickerPack } from './entities/sticker-pack.entity';
import { Sticker } from './entities/sticker.entity';

@Injectable()
export class StickersService implements OnModuleInit {
    private readonly logger = new Logger(StickersService.name);

    constructor(
        @InjectRepository(StickerPack)
        private packRepository: Repository<StickerPack>,
        @InjectRepository(Sticker)
        private stickerRepository: Repository<Sticker>,
    ) { }

    async onModuleInit() {
        await this.seedStickerPacksIfEmpty();
    }

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

    private async seedStickerPacksIfEmpty() {
        const count = await this.packRepository.count();
        if (count > 0) return;

        this.logger.log('Seeding initial Zalo-style sticker packs...');

        const packsData = [
            {
                id: 'pack_tho_bay_mau',
                name: 'Thỏ Bảy Màu',
                thumbnailUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png',
                sortOrder: 1,
                isActive: true,
                stickers: [
                    { id: 'stk_tho_01', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Waving%20Hand.png', altText: 'Waving Hi', sortOrder: 1 },
                    { id: 'stk_tho_02', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png', altText: 'Heart', sortOrder: 2 },
                    { id: 'stk_tho_03', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face%20with%20Big%20Eyes.png', altText: 'Happy', sortOrder: 3 },
                    { id: 'stk_tho_04', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png', altText: 'Cry', sortOrder: 4 },
                    { id: 'stk_tho_05', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Clapping%20Hands.png', altText: 'Bravo', sortOrder: 5 },
                    { id: 'stk_tho_06', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Thumbs%20Up.png', altText: 'Like', sortOrder: 6 },
                ],
            },
            {
                id: 'pack_sugar_cubs',
                name: 'Sugar Cubs',
                thumbnailUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Animals/Bear.png',
                sortOrder: 2,
                isActive: true,
                stickers: [
                    { id: 'stk_bear_01', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Hugging%20Face.png', altText: 'Hug', sortOrder: 1 },
                    { id: 'stk_bear_02', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Blowing%20a%20Kiss.png', altText: 'Kiss', sortOrder: 2 },
                    { id: 'stk_bear_03', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Sleeping%20Face.png', altText: 'Sleep', sortOrder: 3 },
                    { id: 'stk_bear_04', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png', altText: 'Wow', sortOrder: 4 },
                    { id: 'stk_bear_05', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png', altText: 'Lol', sortOrder: 5 },
                    { id: 'stk_bear_06', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png', altText: 'Think', sortOrder: 6 },
                ],
            },
            {
                id: 'pack_pepe',
                name: 'Pepe & Friends',
                thumbnailUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Animals/Frog.png',
                sortOrder: 3,
                isActive: true,
                stickers: [
                    { id: 'stk_pepe_01', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png', altText: 'Cool', sortOrder: 1 },
                    { id: 'stk_pepe_02', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Party%20Popper.png', altText: 'Party', sortOrder: 2 },
                    { id: 'stk_pepe_03', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Flexed%20Biceps.png', altText: 'Strong', sortOrder: 3 },
                    { id: 'stk_pepe_04', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Sparkles.png', altText: 'Magic', sortOrder: 4 },
                    { id: 'stk_pepe_05', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Folded%20Hands.png', altText: 'Thanks', sortOrder: 5 },
                    { id: 'stk_pepe_06', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Ankan/Animated-Fluent-Emojis/master/Emojis/Smilies/Fire.png', altText: 'Fire', sortOrder: 6 },
                ],
            },
        ];

        for (const p of packsData) {
            const packEntity = this.packRepository.create({
                id: p.id,
                name: p.name,
                thumbnailUrl: p.thumbnailUrl,
                sortOrder: p.sortOrder,
                isActive: p.isActive,
            });
            await this.packRepository.save(packEntity);

            const stickerEntities = p.stickers.map((s) =>
                this.stickerRepository.create({
                    id: s.id,
                    packId: p.id,
                    url: s.url,
                    altText: s.altText,
                    sortOrder: s.sortOrder,
                }),
            );
            await this.stickerRepository.save(stickerEntities);
        }

        this.logger.log('Seeded sticker packs successfully.');
    }
}
