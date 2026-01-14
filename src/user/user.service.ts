import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách tất cả người dùng kèm theo số lượng bài thi đã làm
   */
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        className: true,
        role: true,
        createdAt: true,
        _count: {
          select: { results: true },
        },
        results: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          select: {
            score: true,
            startedAt: true,
            exam: {
              select: { title: true },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      examCount: user._count.results,
      latestResult: user.results[0] || null,
    }));
  }

  /**
   * Lấy lịch sử làm bài của một user cụ thể
   */
  async getUserHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.prisma.result.findMany({
      where: { userId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
  /**
   * Cập nhật thông tin cá nhân
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<any> {
    const { fullName, className, role } = updateProfileDto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        className,
        role: role as any, // Cast to any or import Role enum from client if strict
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        className: true,
        role: true,
      },
    });

    return user;
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
