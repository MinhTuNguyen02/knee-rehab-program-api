import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard dùng cho tất cả patient-protected routes.
 * Yêu cầu JWT hợp lệ với type: 'patient'.
 */
@Injectable()
export class PatientJwtAuthGuard extends AuthGuard('patient-jwt') {}
