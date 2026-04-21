import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { NextQuestionQueryDto, QuizStatusQueryDto, SubmitQuizDto } from './dto/quiz-dto';
import {
  NextQuestionResponse,
  QuizService,
  QuizStatusResponse,
  SubmitResponse,
} from './quiz.service';

interface AuthenticatedRequest {
  user?: { id: string };
}

/**
 * Core per-topic level-up quiz endpoints.
 * All endpoints require an authenticated user — anonymous sessions have
 * no watch history and therefore no quiz state.
 */
@Controller('feed/quiz')
@UseGuards(AuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /** GET /feed/quiz/status?topic=<t> */
  @Get('status')
  async getStatus(
    @Req() req: AuthenticatedRequest,
    @Query() query: QuizStatusQueryDto,
  ): Promise<QuizStatusResponse> {
    return this.quizService.getStatus(req.user!.id, query.topic);
  }

  /** GET /feed/quiz/next-question?topic=<t>&level=<beginner|intermediate> */
  @Get('next-question')
  async getNextQuestion(
    @Req() req: AuthenticatedRequest,
    @Query() query: NextQuestionQueryDto,
  ): Promise<NextQuestionResponse | null> {
    return this.quizService.getNextQuestion(req.user!.id, query.topic, query.level);
  }

  /** POST /feed/quiz/submit */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Req() req: AuthenticatedRequest,
    @Body() body: SubmitQuizDto,
  ): Promise<SubmitResponse> {
    return this.quizService.submit(req.user!.id, {
      topic: body.topic,
      level: body.level,
      questionId: body.questionId,
      videoId: body.videoId,
      selectedAnswer: body.selectedAnswer,
    });
  }
}
