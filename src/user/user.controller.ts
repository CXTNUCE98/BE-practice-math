import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Quản lý Người dùng (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng và số lượt thi (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  @Roles('ADMIN')
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Xem lịch sử thi của một user cụ thể (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lịch sử thi của user' })
  @Roles('ADMIN')
  async getUserHistory(@Param('id') id: string) {
    return this.userService.getUserHistory(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }
}
