import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { WeeklyPlansService } from './weekly-plans.service';

@Controller('weekly-plans')
export class WeeklyPlansController {
  constructor(private readonly weeklyPlansService: WeeklyPlansService) {}

  @Get('today')
  async getTodayPlan() {
    const data = await this.weeklyPlansService.getTodayPlan();
    return { code: 200, msg: 'success', data };
  }

  @Get('latest')
  async getLatestPlan() {
    const data = await this.weeklyPlansService.getLatestPlan();
    return { code: 200, msg: 'success', data };
  }

  @Get()
  async getWeekPlan() {
    const data = await this.weeklyPlansService.getWeekPlan();
    return { code: 200, msg: 'success', data };
  }

  @Post()
  async savePlan(
    @Body('planData') planData?: any[],
    @Body('filters') filters?: Record<string, any>,
    @Body('userId') userId?: string,
  ) {
    if (!Array.isArray(planData) || planData.length === 0) {
      return { code: 400, msg: '缺少周计划数据', data: null };
    }
    const data = await this.weeklyPlansService.savePlan(planData, filters, userId);
    return { code: 200, msg: '保存成功', data };
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    await this.weeklyPlansService.deletePlan(id);
    return { code: 200, msg: '删除成功', data: null };
  }
}
