import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { QuestionController } from './question.controller';
import { ParserService } from './parser.service';
import { PandocService } from './pandoc.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module quản lý toàn bộ logic liên quan đến đề thi
 */
@Module({
  imports: [PrismaModule],
  providers: [ExamService, ParserService, PandocService],
  controllers: [ExamController, QuestionController],
  exports: [ExamService],
})
export class ExamModule {}
