import { IsArray, IsIn, IsString, IsUUID, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovedTopicItem {
  @IsUUID()
  jobId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(500)
  subTopic: string;
}

export class ApproveAndSuggestNextDto {
  @IsIn(['beginner', 'intermediate'])
  currentDifficulty: 'beginner' | 'intermediate';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedTopicItem)
  approvedJobs: ApprovedTopicItem[];
}
