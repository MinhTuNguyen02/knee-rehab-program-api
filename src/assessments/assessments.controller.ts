import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentDto } from './dto/assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
    constructor(private readonly assessmentsService: AssessmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new assessment' })
    @ApiResponse({ status: 201, description: 'The assessment has been successfully created.' })
    create(@Body() dto: AssessmentDto) {
        return this.assessmentsService.create(dto);
    }

    @Get()
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all assessments' })
    @ApiQuery({ name: 'after', required: false, description: 'Cursor for next page' })
    @ApiQuery({ name: 'before', required: false, description: 'Cursor for previous page' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'zone', required: false })
    @ApiResponse({ status: 200, description: 'Return all assessments.' })
    findAll(
        @Query('after') after?: string,
        @Query('before') before?: string,
        @Query('limit') limit?: string,
        @Query('zone') zone?: string,
    ) {
        return this.assessmentsService.findAll({
            after,
            before,
            limit: limit ? parseInt(limit, 10) : undefined,
            zone,
        });
    }

    @Get(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get an assessment by ID' })
    @ApiResponse({ status: 200, description: 'Return the assessment.' })
    findOne(@Param('id') id: string) {
        return this.assessmentsService.findOne(id);
    }

    @Put(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an assessment by ID' })
    @ApiResponse({ status: 200, description: 'The assessment has been successfully updated.' })
    update(@Param('id') id: string, @Body() dto: AssessmentDto) {
        return this.assessmentsService.update(id, dto);
    }
}