import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Patient } from '../assessments/entities/patient.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AssessmentQueryDto } from './dto/assessment-query.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Injectable()
export class PatientDataService {
    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,
    ) { }

    //  GET /patient/me
    async getMe(patientId: string) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Get the latest assessment
        const latestAssessment = await this.assessmentRepository.findOne({
            where: { patientId },
            order: { createdAt: 'DESC' },
        });

        return {
            data: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                mobile: patient.mobile,
                age: patient.age,
                gender: patient.gender,
                kneeSide: patient.kneeSide,
                consentAccepted: patient.consentAccepted,
                notificationPrefs: patient.notificationPrefs,
                forcePasswordChange: patient.forcePasswordChange,
                createdAt: patient.createdAt,
                latestAssessment: latestAssessment
                    ? {
                        id: latestAssessment.id,
                        score: latestAssessment.score,
                        zone: latestAssessment.zone,
                        pain: latestAssessment.pain,
                        functionScore: latestAssessment.functionScore,
                        createdAt: latestAssessment.createdAt,
                    }
                    : null,
            },
        };
    }

    //  PATCH /patient/me
    async updateMe(patientId: string, dto: UpdatePatientDto) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Only update firstName, lastName, mobile — do not touch email/age/gender/kneeSide
        if (dto.firstName !== undefined) patient.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined) patient.lastName = dto.lastName.trim();
        if (dto.mobile !== undefined) patient.mobile = dto.mobile.trim();

        const updated = await this.patientRepository.save(patient);

        return {
            data: {
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                email: updated.email,
                mobile: updated.mobile,
                age: updated.age,
                gender: updated.gender,
                kneeSide: updated.kneeSide,
            },
        };
    }

    //  GET /patient/assessments (cursor-based pagination)
    async getAssessments(patientId: string, query: AssessmentQueryDto) {
        const limit = query.limit ?? 10;

        const whereClause: any = { patientId };

        if (query.before) {
            const beforeDate = new Date(query.before);
            if (!isNaN(beforeDate.getTime())) {
                whereClause.createdAt = LessThan(beforeDate);
            }
        }

        const assessments = await this.assessmentRepository.find({
            where: whereClause,
            order: { createdAt: 'DESC' },
            take: limit + 1, // Fetch 1 extra to check if there is a next page
        });

        const hasMore = assessments.length > limit;
        const data = hasMore ? assessments.slice(0, limit) : assessments;

        // Cursor for next request = createdAt of the last item in the response
        const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

        return {
            data: data.map((a) => ({
                id: a.id,
                score: a.score,
                zone: a.zone,
                pain: a.pain,
                functionScore: a.functionScore,
                createdAt: a.createdAt,
            })),
            meta: {
                hasMore,
                nextCursor,
                limit,
            },
        };
    }

    //  GET /patient/assessments/:id
    async getAssessmentDetail(patientId: string, assessmentId: string) {
        const assessment = await this.assessmentRepository.findOne({
            where: { id: assessmentId },
        });

        if (!assessment) {
            throw new NotFoundException('Assessment not found');
        }

        // Ensure patient can only view their own assessment
        if (assessment.patientId !== patientId) {
            throw new ForbiddenException('Access denied');
        }

        return {
            data: {
                id: assessment.id,
                score: assessment.score,
                zone: assessment.zone,
                pain: assessment.pain,
                functionScore: assessment.functionScore,
                source: assessment.source,
                entryType: assessment.entryType,
                createdAt: assessment.createdAt,
            },
        };
    }

    //  PATCH /patient/notification-preferences
    async updateNotificationPreferences(patientId: string, dto: UpdateNotificationPrefsDto) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Merge with current prefs
        const currentPrefs = patient.notificationPrefs ?? {};
        patient.notificationPrefs = {
            ...currentPrefs,
            ...(dto.assessmentReminders !== undefined && { assessmentReminders: dto.assessmentReminders }),
            ...(dto.emailNotifications !== undefined && { emailNotifications: dto.emailNotifications }),
            ...(dto.smsNotifications !== undefined && { smsNotifications: dto.smsNotifications }),
        };

        await this.patientRepository.save(patient);

        return {
            data: {
                notificationPrefs: patient.notificationPrefs,
            },
        };
    }
}
