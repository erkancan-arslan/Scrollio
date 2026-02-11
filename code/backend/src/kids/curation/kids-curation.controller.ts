import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsCurationService } from './kids-curation.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { RecommendationRequestDto } from './dto';

@ApiTags('kids-curation')
@Controller('kids/curation')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsCurationController {
  constructor(private readonly kidsCurationService: KidsCurationService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized content recommendations for child' })
  async getRecommendations(
    @CurrentChild() childId: string,
    @Query() query: RecommendationRequestDto,
  ) {
    return this.kidsCurationService.getRecommendations(childId, query);
  }
}
