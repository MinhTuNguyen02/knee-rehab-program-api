import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('staff_notifications')
export class StaffNotification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column({ type: 'varchar' })
    type: 'patient_message' | 'new_lead' | 'system_alert';

    @Column()
    title: string;

    @Column('text')
    body: string;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any> | null;

    @Column({ type: 'timestamptz', nullable: true })
    readAt: Date | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}