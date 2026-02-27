import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateMentorDto {
  @ApiProperty({ description: 'Base64 data URL of the drawing image (e.g. data:image/png;base64,...)' })
  @IsString()
  imageBase64: string;

  @ApiPropertyOptional({ description: 'Child name for storage' })
  @IsOptional()
  @IsString()
  childName?: string;
}
