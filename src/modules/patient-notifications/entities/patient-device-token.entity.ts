import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../assessments/entities/patient.entity';

@Entity('patient_device_tokens')
export class PatientDeviceToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id', type: 'uuid' })
    patientId: string;

    @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @Column({ unique: true })
    token: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
