import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ViewedEventDto {
  @ApiProperty({ description: 'UUID of the content that was viewed' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ description: 'Number of seconds the content was watched' })
  @IsNumber()
  @Min(0)
  watchedSeconds: number;
}
