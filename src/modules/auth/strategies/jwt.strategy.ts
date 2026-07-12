import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') ?? (() => { throw new Error('JWT_SECRET is not defined in environment variables'); })(),
        });
    }

    async validate(payload: { sub: string; email: string; role: string }) {
        const user = await this.userRepository.findOneBy({ id: payload.sub });
        if (!user) {
            throw new UnauthorizedException('Admin user not found');
        }
        return { id: user.id, email: user.email, role: user.role };
    }
}
