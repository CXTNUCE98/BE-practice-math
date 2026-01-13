import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        role: true,
        createdAt: true,
        _count: {
          select: { results: true },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      examCount: user._count.results,
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
}
