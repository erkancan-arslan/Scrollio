import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetQuizParamsDto {
  @ApiProperty({ description: 'UUID of the content to get quiz for' })
  @IsUUID()
  contentId: string;
}
