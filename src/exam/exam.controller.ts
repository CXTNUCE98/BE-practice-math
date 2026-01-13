import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';

/**
 * Điều hướng các yêu cầu liên quan đến quản lý đề thi
 */
@ApiTags('Quản lý Đề thi (Exams)')
@ApiBearerAuth()
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  /**
   * Endpoint upload đề thi từ file Word (Chỉ dành cho Admin)
   */
  @Post('upload')
  @ApiOperation({ summary: 'Tải lên đề thi từ file Word (.docx)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File Word đề thi',
        },
        title: {
          type: 'string',
          example: 'Đề thi cuối kỳ Toán 10',
          description: 'Tiêu đề đề thi',
        },
        duration: {
          type: 'string',
          example: '90',
          description: 'Thời gian làm bài (phút)',
        },
      },
      required: ['file', 'title', 'duration'],
    },
  })
  @ApiResponse({ status: 201, description: 'Đề thi đã được tạo thành công' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExam(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('duration') duration: string,
  ): Promise<any> {
    return this.examService.createFromDocx(
      file.buffer,
      title,
      parseInt(duration, 10),
    );
  }

  /**
   * Lấy danh sách đề thi (Cho tất cả người dùng đã đăng nhập)
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh sách đề thi' })
  @ApiResponse({ status: 200, description: 'Danh sách đề thi' })
  @UseGuards(JwtAuthGuard)
  async getAllExams(): Promise<any[]> {
    return this.examService.findAll();
  }

  /**
   * Lấy lịch sử thi của người dùng hiện tại
   */
  @Get('history')
  @ApiOperation({ summary: 'Xem lịch sử làm bài của bản thân' })
  @ApiResponse({ status: 200, description: 'Lịch sử làm bài' })
  @UseGuards(JwtAuthGuard)
  async getMyHistory(@Req() req: AuthenticatedRequest): Promise<any[]> {
    return this.examService.getHistory(req.user.userId);
  }

  /**
   * Lấy chi tiết một đề thi theo ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đề thi' })
  @ApiResponse({ status: 200, description: 'Thông tin đề thi và câu hỏi' })
  @UseGuards(JwtAuthGuard)
  async getExamById(@Param('id') id: string): Promise<any> {
    return this.examService.findOne(id);
  }

  /**
   * Nộp bài thi
   */
  @Post(':id/submit')
  @ApiOperation({ summary: 'Nộp bài thi và tính điểm' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'array',
          items: { type: 'number' },
          example: [0, 1, 2, 0],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Kết quả bài thi' })
  @UseGuards(JwtAuthGuard)
  async submitExam(
    @Req() req: AuthenticatedRequest,
    @Param('id') examId: string,
    @Body('answers') answers: number[],
  ): Promise<any> {
    return this.examService.submitExam(req.user.userId, examId, answers);
  }
}
