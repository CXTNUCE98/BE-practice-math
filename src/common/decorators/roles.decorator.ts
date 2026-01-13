import { SetMetadata } from '@nestjs/common';

/**
 * Key dùng để lưu trữ thông tin roles trong metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator dùng để phân quyền cho các endpoint theo vai trò người dùng
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
