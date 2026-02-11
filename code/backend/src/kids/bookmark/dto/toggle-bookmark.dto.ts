import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleBookmarkDto {
  @ApiProperty({ description: 'UUID of the content to bookmark/unbookmark' })
  @IsUUID()
  contentId: string;
}
