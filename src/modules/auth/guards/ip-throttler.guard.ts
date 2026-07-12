import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
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