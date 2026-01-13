import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module quản lý kết nối Prisma toàn cục
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
