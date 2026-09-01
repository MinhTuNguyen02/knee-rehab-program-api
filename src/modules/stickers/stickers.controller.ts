import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StickersService } from './stickers.service';

@ApiTags('stickers')
@Controller('stickers')
export class StickersController {
    constructor(private readonly stickersService: StickersService) { }

    @Get('packs')
    @ApiOperation({ summary: 'Get all active sticker packs with stickers' })
    @ApiResponse({ status: 200, description: 'Returns all sticker packs.' })
    async getPacks() {
        return this.stickersService.getActivePacks();
    }
}
