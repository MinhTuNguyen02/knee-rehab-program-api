import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './entities/assessment.entity';
import { AssessmentDto } from './dto/assessment.dto';

@Injectable()
export class AssessmentsService {
    constructor(
        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,
    ) { }

    private calculateScoreAndZone(pain: number, func: number) {
        const score = 10 - pain - func;
        let zone: string;
        if (score > 5) zone = 'green';
        else if (score >= 3) zone = 'amber';
        else zone = 'red';

        return { score, zone };
    }

    // 1. POST /assessments
    async create(dto: AssessmentDto): Promise<Assessment> {
        const { score, zone } = this.calculateScoreAndZone(dto.pain, dto.function);

        const newAssessment = this.assessmentRepository.create({
            pain: dto.pain,
            functionScore: dto.function,
            score,
            zone,
        });

        return this.assessmentRepository.save(newAssessment);
    }

    // 2. GET /assessments
    async findAll(query: { page?: number; limit?: number; zone?: string; source?: string }) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.assessmentRepository.createQueryBuilder('assessment')
            .leftJoinAndSelect('assessment.patient', 'patient');

        if (query.zone) {
            queryBuilder.andWhere('assessment.zone = :zone', { zone: query.zone });
        }

        if (query.source) {
            queryBuilder.andWhere('assessment.source = :source', { source: query.source });
        }

        queryBuilder.orderBy('assessment.createdAt', 'DESC');
        queryBuilder.skip(skip);
        queryBuilder.take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // 3. GET /assessments/:id
    async findOne(id: string): Promise<Assessment> {
        const assessment = await this.assessmentRepository.findOneBy({ id });
        if (!assessment) {
            throw new NotFoundException(`Assessment with ID: ${id} not found`);
        }
        return assessment;
    }

    // 4. PUT /assessments/:id
    async update(id: string, dto: AssessmentDto): Promise<Assessment> {
        const assessment = await this.findOne(id);

        const { score, zone } = this.calculateScoreAndZone(dto.pain, dto.function);

        assessment.pain = dto.pain;
        assessment.functionScore = dto.function;
        assessment.score = score;
        assessment.zone = zone;

        return this.assessmentRepository.save(assessment);
    }
}