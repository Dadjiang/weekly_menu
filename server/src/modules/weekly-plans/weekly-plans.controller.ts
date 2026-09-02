import { Controller, Get } from '@nestjs/common';
import { WeeklyPlansService } from './weekly-plans.service';

@Controller('weekly-plans')
export class WeeklyPlansController {
  constructor(private readonly weeklyPlansService: WeeklyPlansService) {}

  @Get('today')
  async getTodayPlan() {
    const data = await this.weeklyPlansService.getTodayPlan();
    return { code: 200, msg: 'success', data };
  }

  @Get()
  async getWeekPlan() {
    const data = await this.weeklyPlansService.getWeekPlan();
    return { code: 200, msg: 'success', data };
  }
}
