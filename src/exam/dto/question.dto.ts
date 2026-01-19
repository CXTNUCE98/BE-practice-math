import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: 'Nội dung câu hỏi (HTML/LaTeX)' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Các lựa chọn đáp án', type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Chỉ số đáp án đúng (0-3)' })
  @IsInt()
  @Min(0)
  correctAnswer: number;

  @ApiProperty({ description: 'Lời giải chi tiết', required: false })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
