import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../assessments/entities/patient.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,
    ) {}

    // 1. POST /leads - Submit opt-in form
    async create(dto: CreateLeadDto): Promise<Patient> {
        // Create the patient record
        const newPatient = this.patientRepository.create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email.toLowerCase(),
            mobile: dto.mobile,
            age: dto.age,
            gender: dto.gender,
            kneeSide: dto.kneeSide,
            consentAccepted: dto.consentAccepted,
            notificationPrefs: dto.notificationPrefs || null,
        });

        const savedPatient = await this.patientRepository.save(newPatient);

        // Link with assessment if assessmentId is provided
        if (dto.assessmentId) {
            const assessment = await this.assessmentRepository.findOneBy({ id: dto.assessmentId });
            if (assessment) {
                assessment.patient = savedPatient;
                assessment.patientId = savedPatient.id;
                await this.assessmentRepository.save(assessment);
            } else {
                throw new NotFoundException(`Assessment with ID ${dto.assessmentId} not found`);
            }
        }

        return savedPatient;
    }

    // 2. GET /leads - List all opted-in patients (paginated, zone filters)
    async findAll(query: { page?: number; limit?: number; zone?: string }) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.patientRepository.createQueryBuilder('patient')
            .leftJoinAndSelect('patient.assessments', 'assessment');

        if (query.zone) {
            // Filter patients who have at least one assessment in the specified zone
            queryBuilder.andWhere('assessment.zone = :zone', { zone: query.zone });
        }

        queryBuilder.orderBy('patient.createdAt', 'DESC');
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

    // 3. GET /leads/:id - Get single patient detail with assessment history
    async findOne(id: string): Promise<Patient> {
        const patient = await this.patientRepository.findOne({
            where: { id },
            relations: ['assessments'],
        });

        if (!patient) {
            throw new NotFoundException(`Lead with ID ${id} not found`);
        }

        return patient;
    }

}
