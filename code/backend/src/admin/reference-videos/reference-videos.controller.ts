import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ReferenceVideosService } from './reference-videos.service';
import { AdminStorageService } from '../storage/admin-storage.service';
import { CreateReferenceVideoDto } from './dto/create-reference-video.dto';
import { UpdateReferenceVideoDto } from './dto/update-reference-video.dto';
import { ReferenceVideoQueryDto } from './dto/reference-video-query.dto';
import { UploadReferenceVideoDto } from './dto/upload-reference-video.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/reference-videos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ReferenceVideosController {
  constructor(
    private readonly service: ReferenceVideosService,
    private readonly storageService: AdminStorageService,
  ) {}

  @Post('upload-file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadReferenceVideoDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    const { storagePath, publicUrl } = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      req.user.id,
      file.mimetype || 'video/mp4',
    );

    return this.service.create(
      {
        title: body.title || file.originalname,
        description: body.description,
        personaName: body.personaName,
        language: body.language || 'tr',
        audienceTag: body.audienceTag,
        characterId: body.characterId,
        storagePath,
        publicUrl,
      },
      req.user.id,
    );
  }

  @Post()
  create(@Body() dto: CreateReferenceVideoDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: ReferenceVideoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferenceVideoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
