import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new lead' })
    @ApiResponse({ status: 201, description: 'The lead has been successfully created.' })
    create(@Body() dto: CreateLeadDto) {
        return this.leadsService.create(dto);
    }

    @Get()
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all leads' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'zone', required: false })
    @ApiResponse({ status: 200, description: 'Return all leads.' })
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
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a lead by ID' })
    @ApiResponse({ status: 200, description: 'Return the lead.' })
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }
}
