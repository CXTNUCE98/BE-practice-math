import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard bảo vệ các route yêu cầu xác thực JWT
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
