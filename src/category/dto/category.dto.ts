import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Toán 12' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'toan-12' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Đề thi Toán lớp 12', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
