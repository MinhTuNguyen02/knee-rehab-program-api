import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('assessments')
export class Assessment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Generated('increment')
    displayId: number;

    @Column({ type: 'integer', default: 0 })
    pain: number;

    @Column({ type: 'integer', default: 0 })
    functionScore: number;

    @Column({ type: 'integer', default: 0 })
    score: number;

    @Column({ length: 10 })
    zone: string;

    @Column({ type: 'varchar', nullable: true, default: 'Website' })
    source: string | null;

    @Column({ default: 'assessment' })
    entryType: string;

    @ManyToOne(() => Patient, { nullable: true })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient | null;

    @Column({ name: 'patient_id', type: 'uuid', nullable: true })
    patientId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
