import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

@Injectable()
export class RecipeAiService {
  private get client() {
    return getSupabaseClient();
  }

  async generateRecipe(params: {
    ingredients: string[];
    cuisine?: string;
    flavor?: string;
    calories?: string;
  }): Promise<any> {
    // 基于食材和条件生成模拟菜谱（实际项目中可接入 LLM）
    const { ingredients, cuisine = '家常菜', flavor = '清淡' } = params;

    const recipeTemplates = [
      {
        name: `${ingredients[0] || '食材'}炒${ingredients[1] || '时蔬'}`,
        description: `一道简单快手的${cuisine}家常菜，以${ingredients.join('、')}为主要食材，${flavor}口味。`,
        time: '15分钟',
        calories: '280千卡',
        difficulty: '简单',
        ingredients: ingredients.map(name => ({ name, amount: '适量' })),
        steps: [
          { step: 1, description: `将${ingredients[0] || '主料'}清洗干净，切成合适大小` },
          { step: 2, description: `热锅凉油，放入${ingredients[0] || '主料'}翻炒至变色` },
          { step: 3, description: `加入${ingredients.slice(1).join('、')}继续翻炒` },
          { step: 4, description: '加入适量盐、生抽调味，翻炒均匀即可出锅' },
        ],
      },
      {
        name: `${ingredients[0] || '食材'}汤`,
        description: `一碗鲜美的${flavor}汤品，营养丰富，适合${cuisine}风格餐桌。`,
        time: '25分钟',
        calories: '180千卡',
        difficulty: '简单',
        ingredients: ingredients.map(name => ({ name, amount: '适量' })),
        steps: [
          { step: 1, description: `将${ingredients.join('、')}分别洗净切好` },
          { step: 2, description: '锅中加水烧开，放入所有食材' },
          { step: 3, description: '大火煮开后转小火慢炖15分钟' },
          { step: 4, description: '加入盐和少许胡椒粉调味即可' },
        ],
      },
    ];

    // 随机选择一个模板
    const template = recipeTemplates[Math.floor(Math.random() * recipeTemplates.length)];

    return {
      ...template,
      cuisine,
      category: this.mapCuisineToCategory(cuisine),
      is_ai_generated: true,
      image: null,
    };
  }

  async generateWeeklyPlan(params: {
    cuisine?: string;
    caloriesMin?: number;
    caloriesMax?: number;
    flavors?: string[];
    scenes?: string[];
  }): Promise<any> {
    const { cuisine = '家常菜' } = params;

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const meals = ['breakfast', 'lunch', 'dinner'];
    const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

    const recipePool = [
      { name: '小米粥', calories: '180千卡' },
      { name: '煎蛋三明治', calories: '320千卡' },
      { name: '豆浆油条', calories: '400千卡' },
      { name: '番茄炒蛋', calories: '280千卡' },
      { name: '红烧排骨', calories: '520千卡' },
      { name: '清蒸鲈鱼', calories: '350千卡' },
      { name: '麻婆豆腐', calories: '380千卡' },
      { name: '宫保鸡丁', calories: '420千卡' },
      { name: '蒜蓉西兰花', calories: '150千卡' },
      { name: '酸辣土豆丝', calories: '220千卡' },
      { name: '可乐鸡翅', calories: '480千卡' },
      { name: '蛋炒饭', calories: '350千卡' },
      { name: '凉拌黄瓜', calories: '80千卡' },
      { name: '紫菜蛋花汤', calories: '120千卡' },
      { name: '糖醋里脊', calories: '450千卡' },
    ];

    const plan: Record<string, any> = {};
    days.forEach(day => {
      plan[day] = {};
      meals.forEach(meal => {
        const randomRecipe = recipePool[Math.floor(Math.random() * recipePool.length)];
        plan[day][meal] = {
          name: randomRecipe.name,
          calories: randomRecipe.calories,
          mealType: mealNames[meal as keyof typeof mealNames],
        };
      });
    });

    return {
      plan,
      filters: {
        cuisine,
        caloriesMin: params.caloriesMin,
        caloriesMax: params.caloriesMax,
        flavors: params.flavors,
        scenes: params.scenes,
      },
    };
  }

  private mapCuisineToCategory(cuisine: string): string {
    const map: Record<string, string> = {
      '川菜': 'sichuan',
      '粤菜': 'cantonese',
      '湘菜': 'hunan',
      '家常菜': 'homestyle',
      '西餐': 'western',
      '日料': 'japanese',
      '素食': 'vegetarian',
    };
    return map[cuisine] || 'homestyle';
  }
}
