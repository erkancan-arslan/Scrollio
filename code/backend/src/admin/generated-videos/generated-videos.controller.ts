import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { GeneratedVideosService } from './generated-videos.service';
import { FeedPublishingService } from '../feeds/feed-publishing.service';
import { GeneratedVideoQueryDto } from './dto/generated-video-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/generated-videos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class GeneratedVideosController {
  constructor(
    private readonly service: GeneratedVideosService,
    private readonly feedService: FeedPublishingService,
  ) {}

  @Get()
  findAll(@Query() query: GeneratedVideoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    const video = await this.service.findOne(id);
    await this.feedService.publish(id, video.content_target);
    return { message: 'Published', videoId: id };
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    await this.feedService.unpublish(id);
    return { message: 'Unpublished', videoId: id };
  }
}
