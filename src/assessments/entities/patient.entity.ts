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

    // --- Patient Portal Auth Fields ---
    @Column({
        name: 'password_hash',
        type: 'varchar',
        nullable: true,
        select: false,
    })
    passwordHash: string | null;

    @Column({
        name: 'force_password_change',
        default: false,
    })
    forcePasswordChange: boolean;

    @Column({
        name: 'reset_token',
        type: 'varchar',
        nullable: true,
    })
    resetToken: string | null;

    @Column({
        name: 'reset_token_expiry',
        type: 'timestamptz',
        nullable: true,
    })
    resetTokenExpiry: Date | null;

    @Column({
        name: 'fcm_token',
        type: 'varchar',
        nullable: true,
    })
    fcmToken: string | null;

    @OneToMany(() => Assessment, (assessment) => assessment.patient)
    assessments: Assessment[];

    @CreateDateColumn()
    createdAt: Date;
}

