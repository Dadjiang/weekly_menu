import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Injectable()
export class RecipeAiService {
  private get client() {
    return getSupabaseClient();
  }

  private get llmClient() {
    const config = new Config();
    return new LLMClient(config);
  }

  async generateRecipe(params: {
    ingredients: string[];
    cuisine?: string;
    flavor?: string;
    calories?: string;
  }): Promise<any> {
    const { ingredients, cuisine = '家常菜', flavor = '清淡' } = params;

    const prompt = `请根据以下食材和条件，生成2-3个菜谱建议。

食材：${ingredients.join('、')}
菜系：${cuisine}
口味偏好：${flavor}

要求：
1. 每个菜谱包含：菜名、简介、预计时间、卡路里、难度、食材清单（含用量）、烹饪步骤（4-6步）
2. 食材用量要具体（如"2个"、"300克"、"适量"）
3. 烹饪步骤要详细清晰
4. 返回JSON格式，字段包括：name, description, time, calories, difficulty, ingredients(数组，每项含name和amount), steps(数组，每项含step和description)

请直接返回JSON数组，不要其他内容。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-mini-260215', temperature: 0.8 }
      );

      console.log('[AI生成] LLM响应:', response.content);

      // 解析LLM返回的JSON
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recipes = JSON.parse(jsonMatch[0]);
        return recipes.map((recipe: any) => ({
          ...recipe,
          cuisine,
          category: this.mapCuisineToCategory(cuisine),
          is_ai_generated: true,
          image: null,
        }));
      }
    } catch (error) {
      console.log('[AI生成] LLM调用失败，使用模板生成:', error);
    }

    // 降级：使用模板生成
    return this.generateWithTemplate(ingredients, cuisine, flavor);
  }

  private generateWithTemplate(ingredients: string[], cuisine: string, flavor: string) {
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

    return recipeTemplates.map(recipe => ({
      ...recipe,
      cuisine,
      category: this.mapCuisineToCategory(cuisine),
      is_ai_generated: true,
      image: null,
    }));
  }

  async generateWeeklyPlan(params: {
    ingredients?: string[];
    cuisine?: string;
    caloriesMin?: number;
    caloriesMax?: number;
    flavors?: string[];
    scenes?: string[];
  }): Promise<any> {
    const { ingredients, cuisine = '家常菜', caloriesMin = 200, caloriesMax = 600 } = params;

    const ingredientsText = ingredients && ingredients.length > 0
      ? `\n用户提供的食材：${ingredients.join('、')}\n请优先使用这些食材生成菜谱，如果食材不够生成7天菜谱，请随机补充其他常见食材。`
      : '';

    const prompt = `请生成一周（7天）的三餐菜谱计划。

要求：
- 菜系偏好：${cuisine}${ingredientsText}
- 卡路里范围：${caloriesMin}-${caloriesMax}千卡
- 每天包含早餐、午餐、晚餐
- 早餐要简单快捷，午餐要营养均衡，晚餐要清淡易消化
- 菜品要多样化，不要重复

返回JSON格式，结构如下：
{
  "周一": {
    "breakfast": { "name": "菜名", "calories": "卡路里" },
    "lunch": { "name": "菜名", "calories": "卡路里" },
    "dinner": { "name": "菜名", "calories": "卡路里" }
  },
  ...
}

请直接返回JSON对象，不要其他内容。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-mini-260215', temperature: 0.8 }
      );

      console.log('[AI周计划] LLM响应:', response.content);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('[AI周计划] LLM调用失败，使用模板生成:', error);
    }

    // 降级：使用模板生成
    return this.generateWeeklyPlanWithTemplate(cuisine);
  }

  private generateWeeklyPlanWithTemplate(cuisine: string) {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const meals = ['breakfast', 'lunch', 'dinner'];

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
        };
      });
    });

    return plan;
  }

  private mapCuisineToCategory(cuisine: string): string {
    const map: Record<string, string> = {
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
      '印度菜': 'indian',
      '素食': 'vegetarian',
      '早餐': 'breakfast',
      '午餐': 'lunch',
      '晚餐': 'dinner',
      '夜宵': 'snack',
    };
    return map[cuisine] || 'homestyle';
  }
}
