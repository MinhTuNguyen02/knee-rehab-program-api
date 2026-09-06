import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { StaffAccountsController } from './staff-accounts.controller';
import { StaffAccountsService } from './staff-accounts.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [StaffAccountsController],
    providers: [StaffAccountsService],
    exports: [StaffAccountsService],
})
export class StaffAccountsModule { }
