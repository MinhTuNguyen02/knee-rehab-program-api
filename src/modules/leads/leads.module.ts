import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Patient } from '../assessments/entities/patient.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AuthModule } from '../auth/auth.module';
import { PatientAuthModule } from '../patient-auth/patient-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Assessment]),
    AuthModule,
    PatientAuthModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

