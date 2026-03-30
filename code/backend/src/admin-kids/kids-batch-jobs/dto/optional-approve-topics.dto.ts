import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovedJobTopic } from '../../../admin/batch-jobs/dto/approve-topics.dto';

/** Optional topic edits before kicking script generation (same shape as approve-topics, all fields optional). */
export class OptionalApproveTopicsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedJobTopic)
  jobs?: ApprovedJobTopic[];
}
