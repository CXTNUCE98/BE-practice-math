import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';

/**
 * Cấu trúc dữ liệu của một câu hỏi được phân tích từ file docx
 */
export interface ParsedQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
}

/**
 * Dịch vụ phân tích file Word để trích xuất đề thi
 */
@Injectable()
export class ParserService {
  /**
   * Phân tích nội dung file docx và trả về danh sách câu hỏi
   */
  async parseDocx(fileBuffer: Buffer): Promise<ParsedQuestion[]> {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value;

    return this.extractQuestions(text);
  }

  /**
   * Trích xuất các câu hỏi từ văn bản thô sử dụng regex
   */
  private extractQuestions(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    // Tách các câu dựa trên "Câu X"
    const questionBlocks = text
      .split(/Câu \d+[:\.]/g)
      .filter((block) => block.trim() !== '');

    for (const block of questionBlocks) {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '');
      if (lines.length < 2) continue;

      const content = lines[0];
      // Tìm các lựa chọn A, B, C, D
      const optionsBlocks = block.match(/[A-D][\.\:]\s*([^A-D\n]+)/g);

      if (optionsBlocks && optionsBlocks.length >= 4) {
        const options = optionsBlocks.map((opt) =>
          opt.replace(/^[A-D][\.\:]\s*/, '').trim(),
        );

        questions.push({
          content,
          options: options.slice(0, 4),
          correctAnswer: 0, // Mặc định đáp án đầu tiên, admin sẽ sửa sau hoặc dựa trên file giải
        });
      }
    }

    return questions;
  }
}
