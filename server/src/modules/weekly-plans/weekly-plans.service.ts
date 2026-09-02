import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

@Injectable()
export class WeeklyPlansService {
  private client = getSupabaseClient();

  async getTodayPlan() {
    const today = new Date();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const todayName = dayNames[today.getDay()];

    // 获取最新的周计划
    const { data: weekPlans, error } = await this.client
      .from('weekly_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!weekPlans || weekPlans.length === 0) {
      return null;
    }

    const weekPlan = weekPlans[0];
    const planData = weekPlan.plan_data;

    // 从 plan_data 中提取今日菜谱
    if (planData && planData[todayName]) {
      return {
        id: weekPlan.id,
        day: todayName,
        ...planData[todayName],
      };
    }

    return null;
  }

  async getWeekPlan() {
    const { data, error } = await this.client
      .from('weekly_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data;
  }
}
