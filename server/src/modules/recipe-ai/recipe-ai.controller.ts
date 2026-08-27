import { Controller, Post, Body } from '@nestjs/common';
import { RecipeAiService } from './recipe-ai.service';

@Controller('recipe-ai')
export class RecipeAiController {
  constructor(private readonly recipeAiService: RecipeAiService) {}

  @Post('generate')
  async generateRecipe(@Body() body: {
    ingredients: string[];
    cuisine?: string;
    flavor?: string;
    calories?: string;
  }) {
    const data = await this.recipeAiService.generateRecipe(body);
    return { code: 200, msg: '生成成功', data };
  }

  @Post('weekly-plan')
  async generateWeeklyPlan(@Body() body: {
    cuisine?: string;
    caloriesMin?: number;
    caloriesMax?: number;
    flavors?: string[];
    scenes?: string[];
  }) {
    const data = await this.recipeAiService.generateWeeklyPlan(body);
    return { code: 200, msg: '生成成功', data };
  }
}
