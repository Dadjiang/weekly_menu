import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

export interface SavedMeal {
  meal: string;
  type: string;
  name: string;
  calories: string;
  recipeId?: string;
}

export interface SavedDayPlan {
  day: string;
  totalCalories: string;
  meals: SavedMeal[];
}

const CUISINE_CATEGORY_MAP: Record<string, string> = {
  '川菜': 'sichuan',
  '粤菜': 'cantonese',
  '湘菜': 'hunan',
  '鲁菜': 'shandong',
  '苏菜': 'jiangsu',
  '浙菜': 'zhejiang',
  '闽菜': 'fujian',
  '徽菜': 'anhui',
  '家常菜': 'homestyle',
  '东北菜': 'northeast',
  '西北菜': 'northwest',
  '西南菜': 'southwest',
  '湖北菜': 'hubei',
  '豫菜': 'henan',
  '西餐': 'western',
  '日料': 'japanese',
  '韩料': 'korean',
  '韩餐': 'korean',
  '泰国菜': 'thai',
  '泰餐': 'thai',
};

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
    const planData = weekPlan.plan_data as SavedDayPlan[] | Record<string, any> | null;

    // 兼容两种存储结构：数组形式（[{ day, meals }]）与对象形式（{ 周一: {...} }）
    const days: SavedDayPlan[] = Array.isArray(planData)
      ? planData
      : this.normalizeLegacyPlan(planData);

    const todayPlan = days.find(d => d.day === todayName);
    if (!todayPlan) {
      return null;
    }

    return {
      id: weekPlan.id,
      day: todayName,
      meals: todayPlan.meals || [],
      totalCalories: todayPlan.totalCalories,
    };
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

  async getLatestPlan() {
    const { data, error } = await this.client
      .from('weekly_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async savePlan(
    planData: SavedDayPlan[],
    filters?: Record<string, any>,
    userId: string = 'anonymous',
  ) {
    const cuisine = (filters?.cuisine as string) || '家常菜';
    const category = CUISINE_CATEGORY_MAP[cuisine] || 'homestyle';

    // 为每道菜创建/更新 recipes 记录，并关联 recipeId
    const enrichedPlan: SavedDayPlan[] = [];
    for (const day of planData) {
      const meals: SavedMeal[] = [];
      for (const meal of day.meals || []) {
        let recipeId = meal.recipeId;
        const recipePayload = {
          name: meal.name,
          cuisine,
          category,
          calories: meal.calories || '300千卡',
          description: `${cuisine}风格的${meal.type || meal.meal || ''}菜品（每周菜谱生成）`,
          ingredients: [],
          steps: [],
          is_ai_generated: true,
        };

        if (recipeId) {
          // 已有关联菜谱，更新内容
          const { error: updateError } = await this.client
            .from('recipes')
            .update({ ...recipePayload, updated_at: new Date().toISOString() })
            .eq('id', recipeId);
          if (updateError) {
            recipeId = undefined;
          }
        }

        if (!recipeId) {
          const { data: created, error: createError } = await this.client
            .from('recipes')
            .insert(recipePayload)
            .select('id')
            .single();
          if (createError) {
            throw new Error(`创建菜谱失败: ${createError.message}`);
          }
          recipeId = (created as { id: string })?.id;
        }

        meals.push({ ...meal, recipeId });
      }
      enrichedPlan.push({ ...day, meals });
    }

    const { data, error } = await this.client
      .from('weekly_plans')
      .insert({
        user_id: userId,
        plan_data: enrichedPlan,
        filters: filters || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`保存周计划失败: ${error.message}`);
    }

    return data;
  }

  async deletePlan(id: string): Promise<void> {
    const { error } = await this.client
      .from('weekly_plans')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除周计划失败: ${error.message}`);
    }
  }

  private normalizeLegacyPlan(planData: Record<string, any> | null): SavedDayPlan[] {
    if (!planData || typeof planData !== 'object') {
      return [];
    }
    const mealNames: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
    };
    return Object.entries(planData).map(([day, info]) => {
      const dayInfo = (info || {}) as Record<string, any>;
      const meals: SavedMeal[] = Object.entries(mealNames)
        .filter(([key]) => dayInfo[key])
        .map(([key, type]) => ({
          meal: key,
          type,
          name: dayInfo[key]?.name || '',
          calories: dayInfo[key]?.calories || '',
        }));
      return { day, totalCalories: '', meals };
    });
  }
}
