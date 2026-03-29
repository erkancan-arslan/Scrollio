import { IsArray, IsString, IsUUID, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovedJobTopic {
  @IsUUID()
  jobId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(500)
  subTopic: string;
}

export class ApproveTopicsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedJobTopic)
  jobs: ApprovedJobTopic[];
}
