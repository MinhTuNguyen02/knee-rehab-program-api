import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { StaffAccountsQueryDto } from './dto/staff-accounts-query.dto';

@Injectable()
export class StaffAccountsService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(query: StaffAccountsQueryDto) {
        const qb = this.userRepository.createQueryBuilder('user')
            .select([
                'user.id',
                'user.email',
                'user.role',
                'user.isActive',
                'user.createdAt',
            ])
            .orderBy('user.createdAt', 'DESC');

        if (query.search && query.search.trim() !== '') {
            qb.andWhere('user.email ILIKE :search', { search: `%${query.search.trim()}%` });
        }

        if (query.role && query.role !== 'all') {
            qb.andWhere('user.role = :role', { role: query.role });
        }

        if (query.status && query.status !== 'all') {
            if (query.status === 'active') {
                qb.andWhere('(user.isActive = true OR user.isActive IS NULL)');
            } else if (query.status === 'inactive') {
                qb.andWhere('user.isActive = false');
            }
        }

        const staffList = await qb.getMany();

        // Ensure isActive is boolean true if null for legacy accounts
        return staffList.map((staff) => ({
            id: staff.id,
            email: staff.email,
            role: staff.role,
            isActive: staff.isActive !== false,
            createdAt: staff.createdAt,
        }));
    }

    async updateStatus(currentUserId: string, targetUserId: string, isActive: boolean) {
        if (currentUserId === targetUserId && !isActive) {
            throw new BadRequestException('You cannot deactivate your own account.');
        }

        const user = await this.userRepository.findOneBy({ id: targetUserId });
        if (!user) {
            throw new NotFoundException('Staff account not found.');
        }

        user.isActive = isActive;
        const savedUser = await this.userRepository.save(user);

        return {
            id: savedUser.id,
            email: savedUser.email,
            role: savedUser.role,
            isActive: savedUser.isActive !== false,
            createdAt: savedUser.createdAt,
            message: `Staff account ${isActive ? 'activated' : 'deactivated'} successfully.`,
        };
    }
}
