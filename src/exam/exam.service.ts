import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParserService } from './parser.service';

/**
 * Dịch vụ quản lý đề thi và bài làm
 */
@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parserService: ParserService,
  ) {}

  /**
   * Tạo đề thi mới từ file docx uploaded
   */
  async createFromDocx(
    fileBuffer: Buffer,
    title: string,
    duration: number,
  ): Promise<any> {
    const parsedQuestions = await this.parserService.parseDocx(fileBuffer);

    const exam = await this.prisma.exam.create({
      data: {
        title,
        duration,
        questions: {
          create: parsedQuestions.map((q) => ({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    return exam;
  }

  /**
   * Lấy danh sách tất cả đề thi
   */
  async findAll(): Promise<any[]> {
    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết một đề thi bao gồm câu hỏi
   */
  async findOne(id: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    return exam;
  }

  /**
   * Tính điểm và lưu kết quả bài thi
   */
  async submitExam(
    userId: string,
    examId: string,
    userAnswers: number[],
  ): Promise<any> {
    const exam = await this.findOne(examId);
    let correctCount = 0;

    exam.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / exam.questions.length) * 10;

    return this.prisma.result.create({
      data: {
        userId,
        examId,
        score,
        answers: userAnswers,
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Lấy lịch sử thi của người dùng
   */
  async getHistory(userId: string): Promise<any[]> {
    return this.prisma.result.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết một kết quả thi kèm theo đề bài và câu hỏi
   */
  async getResult(id: string, userId: string): Promise<any> {
    const result = await this.prisma.result.findUnique({
      where: { id },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Không tìm thấy kết quả bài thi');
    }

    if (result.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền xem kết quả này');
    }

    return result;
  }

  /**
   * Xóa đề thi
   */
  async remove(id: string): Promise<any> {
    await this.findOne(id);
    return this.prisma.exam.delete({
      where: { id },
    });
  }
}
