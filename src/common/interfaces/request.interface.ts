import { Request } from 'express';

/**
 * Interface mở rộng Express Request để bao gồm thông tin người dùng sau khi xác thực
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
