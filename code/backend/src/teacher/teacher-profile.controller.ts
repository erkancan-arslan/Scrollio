import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { TeacherProfileService } from './teacher-profile.service';
import { UpdateTeacherProfileDto } from './dto';

@ApiTags('teacher-profile')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('teacher/profile')
export class TeacherProfileController {
  constructor(private readonly profileService: TeacherProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current teacher profile' })
  async getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update teacher profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateTeacherProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Post('reference-video')
  @ApiOperation({ summary: 'Upload teacher reference video' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async uploadReferenceVideo(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadReferenceVideo(
      req.user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }
}
