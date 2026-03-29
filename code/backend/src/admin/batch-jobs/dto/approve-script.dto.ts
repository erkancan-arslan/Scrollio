import { IsOptional, IsString } from 'class-validator';

export class ApproveScriptDto {
  @IsOptional()
  @IsString()
  script?: string;
}
