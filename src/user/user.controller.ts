import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Quản lý Người dùng (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng và số lượt thi (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Xem lịch sử thi của một user cụ thể (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lịch sử thi của user' })
  async getUserHistory(@Param('id') id: string) {
    return this.userService.getUserHistory(id);
  }
}
