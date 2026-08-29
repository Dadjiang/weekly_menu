import { Controller, Get, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { readFile } from '../../storage/object-storage';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

function getContentType(key: string): string {
  const dotIndex = key.lastIndexOf('.');
  const ext = dotIndex >= 0 ? key.slice(dotIndex).toLowerCase() : '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

@Controller('storage')
export class StorageController {
  @Get('image')
  async getImage(@Query('key') key: string, @Res() res: Response): Promise<void> {
    if (!key) {
      throw new NotFoundException('缺少 key 参数');
    }
    try {
      const buffer = await readFile(key);
      res.setHeader('Content-Type', getContentType(key));
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      console.error(`读取图片失败 (${key}):`, error);
      throw new NotFoundException('图片不存在');
    }
  }
}
