import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeDto {
  @ApiProperty({ description: 'UUID of the content to like/unlike' })
  @IsUUID()
  contentId: string;
}
