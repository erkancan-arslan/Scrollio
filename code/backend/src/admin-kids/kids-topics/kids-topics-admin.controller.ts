import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { KidsTopicsAdminService } from './kids-topics-admin.service';
import { CreateAdminKidsTopicDto } from './dto/create-admin-kids-topic.dto';

@ApiTags('admin-kids')
@ApiBearerAuth()
@Controller('admin/kids/topics')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class KidsTopicsAdminController {
  constructor(private readonly service: KidsTopicsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all kids_topics (catalog for feed tags)' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a kids topic (for new feed tags children can subscribe to)' })
  create(@Body() dto: CreateAdminKidsTopicDto) {
    return this.service.create(dto);
  }
}
