import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentDto } from './dto/assessment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('assessments')
export class AssessmentsController {
    constructor(private readonly assessmentsService: AssessmentsService) { }

    @Post()
    create(@Body() dto: AssessmentDto) {
        return this.assessmentsService.create(dto);
    }

    @Get()
    // @Roles('admin')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('zone') zone?: string,
        @Query('source') source?: string,
    ) {
        return this.assessmentsService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            zone,
            source,
        });
    }

    @Get(':id')
    // @Roles('admin')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(@Param('id') id: string) {
        return this.assessmentsService.findOne(id);
    }

    @Put(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() dto: AssessmentDto) {
        return this.assessmentsService.update(id, dto);
    }
}