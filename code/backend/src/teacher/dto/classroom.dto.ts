import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassroomDto {
  @ApiProperty({ example: 'Matematik 101' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Matematik' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional()
  @IsString()
  grade?: string;
}

export class JoinClassroomDto {
  @ApiProperty({ example: 'AB3K9X', description: '6-character classroom code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
