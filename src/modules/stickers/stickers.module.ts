import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickerPack } from './entities/sticker-pack.entity';
import { Sticker } from './entities/sticker.entity';
import { StickersService } from './stickers.service';
import { StickersController } from './stickers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([StickerPack, Sticker])],
    controllers: [StickersController],
    providers: [StickersService],
    exports: [StickersService],
})
export class StickersModule { }
