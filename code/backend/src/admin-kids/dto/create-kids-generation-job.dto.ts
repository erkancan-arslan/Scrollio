import { IsOptional, IsArray, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGenerationJobDto } from '../../admin/generation-jobs/dto/create-generation-job.dto';

/**
 * Kids single-job create: same as core job body plus optional feed metadata for publish.
 */
export class CreateKidsGenerationJobDto extends CreateGenerationJobDto {
  @ApiPropertyOptional({ enum: ['7-9', '10-12'] })
  @IsOptional()
  @IsIn(['7-9', '10-12'])
  ageGroup?: '7-9' | '10-12';

  @ApiPropertyOptional({
    type: [String],
    description: 'Topic names for kids_content.topic_tags (must match kids_topics.name for child feed overlap)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicTags?: string[];
}
