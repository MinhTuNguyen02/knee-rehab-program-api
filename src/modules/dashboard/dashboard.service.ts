import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { Patient } from '../assessments/entities/patient.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async getStats() {
    const totalSubmissions = await this.assessmentRepository.count();
    const totalOptedIn = await this.patientRepository.count();

    const green = await this.assessmentRepository.countBy({ zone: 'green' });
    const amber = await this.assessmentRepository.countBy({ zone: 'amber' });
    const red = await this.assessmentRepository.countBy({ zone: 'red' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAssessments = await this.assessmentRepository.find({
      where: { createdAt: MoreThan(sevenDaysAgo) },
      select: ['createdAt']
    });

    const recentTimestamps = recentAssessments.map(a => a.createdAt);

    return {
      totalSubmissions,
      totalOptedIn,
      byZone: {
        green,
        amber,
        red,
      },
      recentTimestamps,
    };
  }
}
