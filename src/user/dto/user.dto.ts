import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO cập nhật thông tin người dùng
 */
export class UpdateProfileDto {
  @ApiProperty({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'Lớp học',
    example: 'Lớp 12A1',
    required: false,
  })
  @IsString({ message: 'Lớp phải là chuỗi' })
  @IsNotEmpty({ message: 'Lớp không được để trống' })
  @IsOptional()
  className?: string;

  @ApiProperty({
    description: 'Vai trò người dùng',
    example: 'USER',
    required: false,
    enum: ['ADMIN', 'USER'],
  })
  @IsString({ message: 'Role phải là chuỗi' })
  @IsOptional()
  role?: 'ADMIN' | 'USER';
}

/**
 * DTO đổi mật khẩu
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'oldpassword123',
  })
  @IsString({ message: 'Mật khẩu cũ phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
