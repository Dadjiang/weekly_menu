import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  private getBaseUrl(req: Request): string {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto || req.protocol;
    return `${proto}://${req.get('host')}`;
  }

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('cuisine') cuisine?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: Request,
  ) {
    const data = await this.recipesService.findAll(
      {
        category,
        cuisine,
        search,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      },
      req ? this.getBaseUrl(req) : undefined,
    );
    return { code: 200, msg: 'success', data };
  }

  @Get('popular')
  async getPopular(@Query('limit') limit?: string, @Req() req?: Request) {
    const data = await this.recipesService.getPopular(
      limit ? parseInt(limit) : 5,
      req ? this.getBaseUrl(req) : undefined,
    );
    return { code: 200, msg: 'success', data };
  }

  @Get('stats')
  async getStats() {
    const data = await this.recipesService.getStats();
    return { code: 200, msg: 'success', data };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Req() req?: Request) {
    const data = await this.recipesService.findById(id, req ? this.getBaseUrl(req) : undefined);
    if (!data) {
      return { code: 404, msg: '菜谱不存在', data: null };
    }
    return { code: 200, msg: 'success', data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.recipesService.create(body);
    return { code: 200, msg: '创建成功', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.recipesService.update(id, body);
    return { code: 200, msg: '更新成功', data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.recipesService.delete(id);
    return { code: 200, msg: '删除成功', data: null };
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Body('userId') userId?: string) {
    const data = await this.recipesService.toggleLike(id, userId);
    return { code: 200, msg: data.liked ? '点赞成功' : '取消点赞', data };
  }

  @Get(':id/liked')
  async isLiked(@Param('id') id: string, @Query('userId') userId?: string) {
    const liked = await this.recipesService.isLiked(id, userId);
    return { code: 200, msg: 'success', data: { liked } };
  }
}
