import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { ParserService } from './parser.service';
import { PandocService } from './pandoc.service';

/**
 * Module quản lý toàn bộ logic liên quan đến đề thi
 */
@Module({
  providers: [ExamService, ParserService, PandocService],
  controllers: [ExamController],
  exports: [ExamService],
})
export class ExamModule {}
