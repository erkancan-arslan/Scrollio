import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDrawingDto {
  @ApiProperty({ description: 'Base64-encoded drawing data' })
  @IsString()
  drawingData: string;

  @ApiPropertyOptional({ description: 'Title for the drawing' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'UUID of the related content' })
  @IsOptional()
  @IsUUID()
  contentId?: string;
}
