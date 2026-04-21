import { IsIn, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class QuizStatusQueryDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;
}

export class NextQuestionQueryDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsIn(['beginner', 'intermediate'])
  level!: 'beginner' | 'intermediate';
}

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsIn(['beginner', 'intermediate'])
  level!: 'beginner' | 'intermediate';

  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsUUID()
  videoId!: string;

  @IsInt()
  @Min(0)
  selectedAnswer!: number;
}
