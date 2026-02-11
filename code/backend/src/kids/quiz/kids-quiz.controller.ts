import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsQuizService } from './kids-quiz.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { GetQuizParamsDto, SubmitQuizParamsDto, SubmitAnswerDto } from './dto';

@ApiTags('kids-quiz')
@Controller('kids/quiz')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsQuizController {
  constructor(private readonly kidsQuizService: KidsQuizService) {}

  @Get(':contentId')
  @ApiOperation({ summary: 'Get quiz for a specific content' })
  async getQuiz(
    @CurrentChild() childId: string,
    @Param() params: GetQuizParamsDto,
  ) {
    return this.kidsQuizService.getQuizByContentId(childId, params.contentId);
  }

  @Post(':quizId/submit')
  @ApiOperation({ summary: 'Submit quiz answer' })
  async submitAnswer(
    @CurrentChild() childId: string,
    @Param() params: SubmitQuizParamsDto,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.kidsQuizService.submitAnswer(childId, params.quizId, dto);
  }
}
