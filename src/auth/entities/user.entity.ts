import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        unique: true,
    })
    email: string;

    @Column({
        name: 'password_hash',
        type: 'varchar',
    })
    passwordHash: string;

    @Column({
        type: 'varchar',
        default: 'admin',
    })
    role: string;

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
}
