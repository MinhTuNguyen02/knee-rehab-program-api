import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class EmailThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const email = req.body?.email;

        if (email) {
            return email.toLowerCase();
        }

        return req.ip;
    }

    protected async throwThrottlingException(
        context: ExecutionContext,
        throttlerLimitDetail: any
    ): Promise<void> {
        throw new HttpException(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                error: 'Too Many Requests',
                message: 'Too many requests. Please try again later.',
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}