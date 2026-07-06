import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('patients')
export class Patient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column()
    mobile: string;

    @Column()
    age: number;

    @Column()
    gender: string;

    @Column()
    kneeSide: string;

    @Column({ default: false })
    consentAccepted: boolean;

    @Column({ type: 'jsonb', nullable: true })
    notificationPrefs: Record<string, any> | null;

    @OneToMany(() => Assessment, (assessment) => assessment.patient)
    assessments: Assessment[];

    @CreateDateColumn()
    createdAt: Date;
}
