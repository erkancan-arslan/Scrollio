import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectTopicsDto {
  @ApiProperty({ description: 'Array of topic UUIDs to follow', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  topicIds: string[];
}
