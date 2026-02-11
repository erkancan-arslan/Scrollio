import { IsUUID, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitQuizParamsDto {
  @ApiProperty({ description: 'UUID of the quiz' })
  @IsUUID()
  quizId: string;
}

export class SubmitAnswerDto {
  @ApiProperty({ description: 'UUID of the question being answered' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Selected answer ID(s)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedAnswers: string[];

  @ApiPropertyOptional({ description: 'Time taken to answer in seconds' })
  @IsOptional()
  timeTakenSeconds?: number;
}
