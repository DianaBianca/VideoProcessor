import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path'; // 👈 AQUI
import { VideoService } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

 @Post('upload')
@UseInterceptors(FileInterceptor('video', { storage: memoryStorage() }))
async upload(
  @UploadedFile() file: Express.Multer.File,
  @Res({ passthrough: false }) res,
) {
  const zipPath = await this.videoService.processVideo(file);

  if (!fs.existsSync(zipPath)) {
    throw new Error('ZIP not found');
  }

  const stat = fs.statSync(zipPath);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${path.basename(zipPath)}"`,
  );
  res.setHeader('Content-Length', stat.size);

  const stream = fs.createReadStream(zipPath);
  stream.pipe(res);

  stream.on('end', () => {
    res.end();
  });
}

}
