import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Patient } from '../assessments/entities/patient.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PatientAuthService } from '../patient-auth/patient-auth.service';

@Injectable()
export class LeadsService {
    private readonly logger = new Logger(LeadsService.name);

    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,
        private patientAuthService: PatientAuthService,
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    // 1. POST /leads
    async create(dto: CreateLeadDto): Promise<Patient> {
        let savedPatient = await this.patientRepository.findOneBy({ email: dto.email.toLowerCase() });

        if (savedPatient) {
            savedPatient.firstName = dto.firstName;
            savedPatient.lastName = dto.lastName;
            savedPatient.mobile = dto.mobile;
            savedPatient.age = dto.age;
            savedPatient.gender = dto.gender;
            savedPatient.kneeSide = dto.kneeSide || null;
            savedPatient.consentAccepted = dto.consentAccepted;
            if (dto.notificationPrefs) {
                savedPatient.notificationPrefs = dto.notificationPrefs;
            }
            savedPatient = await this.patientRepository.save(savedPatient);
        } else {
            // New patient: generate account credentials
            const tempPassword = PatientAuthService.generateTempPassword();
            const passwordHash = await this.patientAuthService.hashPassword(tempPassword);

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
                passwordHash: passwordHash,
                forcePasswordChange: true,
            });
            savedPatient = await this.patientRepository.save(newPatient);

            // Send welcome email with temp password
            const patientPortalUrl = this.configService.get<string>('PATIENT_PORTAL_URL') ?? 'http://localhost:3003';

            try {
                await this.mailerService.sendMail({
                    to: savedPatient.email,
                    subject: 'Welcome to KRPS - Your account is ready',
                    html: `
                        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
                            <h2>Welcome to KRPS</h2>
                            <p>Hi ${savedPatient.firstName},</p>
                            <p>Thank you for opting into the Knee Rehab Program. Your patient portal account has been created.</p>
                            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                <p style="margin-top: 0;"><strong>Your login details:</strong></p>
                                <p>Email: ${savedPatient.email}</p>
                                <p>Temporary Password: <strong>${tempPassword}</strong></p>
                            </div>
                            <p>For your security, you will be required to change this password when you first sign in.</p>
                            <a href="${patientPortalUrl}/login" 
                               style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
                                Sign In to Portal
                            </a>
                        </div>
                    `,
                });
            } catch (error) {
                this.logger.error('Failed to send welcome email', error);
            }
        }

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

    // 2. GET /leads
    async findAll(query: { limit?: number; after?: string; before?: string; zone?: string }) {
        const limit = query.limit && query.limit > 0 ? query.limit : 20;

        const queryBuilder = this.patientRepository.createQueryBuilder('patient')
            .leftJoinAndSelect('patient.assessments', 'assessment');

        if (query.zone) {
            // Filter patients who have at least one assessment in the specified zone
            queryBuilder.andWhere('assessment.zone = :zone', { zone: query.zone });
        }

        if (query.after) {
            queryBuilder.andWhere('assessment.createdAt < :after', { after: new Date(query.after) });
        }

        queryBuilder.orderBy('assessment.createdAt', 'DESC');

        queryBuilder.take(limit + 1);

        const rawData = await queryBuilder.getMany();

        const hasMore = rawData.length > limit;
        const data = hasMore ? rawData.slice(0, limit) : rawData;

        const endCursor = data.length > 0 ? data[data.length - 1].createdAt.toISOString() : null;


        return {
            data,
            meta: {
                hasMore,
                endCursor,
                limit,
            },
        };
    }

    // 3. GET /leads/:id
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
