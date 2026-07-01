import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) {}

    @Post()
    create(@Body() dto: CreateLeadDto) {
        return this.leadsService.create(dto);
    }

    @Get()
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('zone') zone?: string,
    ) {
        return this.leadsService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            zone,
        });
    }

    @Get(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }
}
