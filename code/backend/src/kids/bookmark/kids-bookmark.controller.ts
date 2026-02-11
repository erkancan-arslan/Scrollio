import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsBookmarkService } from './kids-bookmark.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { ToggleBookmarkDto } from './dto';

@ApiTags('kids-bookmark')
@Controller('kids/bookmark')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsBookmarkController {
  constructor(private readonly kidsBookmarkService: KidsBookmarkService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle bookmark on content' })
  async toggleBookmark(
    @CurrentChild() childId: string,
    @Body() dto: ToggleBookmarkDto,
  ) {
    return this.kidsBookmarkService.toggleBookmark(childId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarked content for child' })
  async getBookmarks(@CurrentChild() childId: string) {
    return this.kidsBookmarkService.getBookmarks(childId);
  }
}
