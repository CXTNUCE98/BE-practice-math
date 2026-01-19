import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@ApiTags('Quản lý Câu hỏi (Questions)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('questions')
export class QuestionController {
  constructor(private readonly examService: ExamService) {}

  @Post(':examId')
  @ApiOperation({ summary: 'Thêm câu hỏi mới vào đề thi' })
  @ApiResponse({ status: 201, description: 'Câu hỏi đã được tạo' })
  async addQuestion(
    @Param('examId') examId: string,
    @Body() data: CreateQuestionDto,
  ) {
    return this.examService.addQuestion(examId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nội dung câu hỏi' })
  @ApiResponse({ status: 200, description: 'Câu hỏi đã được cập nhật' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() data: UpdateQuestionDto,
  ) {
    return this.examService.updateQuestion(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa câu hỏi khỏi đề thi' })
  @ApiResponse({ status: 200, description: 'Câu hỏi đã được xóa' })
  async deleteQuestion(@Param('id') id: string) {
    return this.examService.deleteQuestion(id);
  }
}
