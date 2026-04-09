import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsLikeService } from './kids-like.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { ToggleLikeDto } from './dto';

@ApiTags('kids-like')
@Controller('kids/like')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsLikeController {
  constructor(private readonly kidsLikeService: KidsLikeService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle like on content' })
  async toggleLike(
    @CurrentChild() childId: string,
    @Body() dto: ToggleLikeDto,
  ) {
    return this.kidsLikeService.toggleLike(childId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all liked content for child' })
  async getLikedContent(@CurrentChild() childId: string) {
    return this.kidsLikeService.getLikedContent(childId);
  }
}
