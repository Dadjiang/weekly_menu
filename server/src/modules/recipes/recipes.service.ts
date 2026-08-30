import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';
import { getSignedUrl } from '../../storage/object-storage';

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  description: string | null;
  image: string | null;
  image_key: string | null;
  time: string;
  calories: string;
  difficulty: string;
  ingredients: Array<{ name: string; amount: string }>;
  steps: Array<{ step: number; description: string }>;
  likes_count: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string | null;
}



@Injectable()
export class RecipesService {
  private get client() {
    return getSupabaseClient();
  }

  async findAll(params?: {
    category?: string;
    cuisine?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Recipe[]> {
    let query = this.client
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    if (params?.cuisine && params.cuisine !== 'all') {
      query = query.eq('cuisine', params.cuisine);
    }

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
    } else {
      query = query.limit(params?.limit || 20);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询菜谱失败: ${error.message}`);
    const recipes = (data || []) as Recipe[];
    // 为每个菜谱生成图片 URL
    for (const recipe of recipes) {
      if (recipe.image_key) {
        try {
          recipe.image = await getSignedUrl(recipe.image_key);
        } catch (error) {
          console.error(`生成图片 URL 失败 (${recipe.image_key}):`, error);
          // 保持原有的 image_key 作为 fallback
          recipe.image = recipe.image_key;
        }
      }
    }
    return recipes;
  }

  async findById(id: string): Promise<Recipe | null> {
    const { data, error } = await this.client
      .from('recipes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询菜谱失败: ${error.message}`);
    const recipe = data as Recipe | null;
    // 生成图片 URL
    if (recipe?.image_key) {
      try {
        recipe.image = await getSignedUrl(recipe.image_key);
      } catch (error) {
        console.error(`生成图片 URL 失败 (${recipe.image_key}):`, error);
        recipe.image = recipe.image_key;
      }
    }
    return recipe;
  }

  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    const { data, error } = await this.client
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    if (error) throw new Error(`创建菜谱失败: ${error.message}`);
    return data as Recipe;
  }

  async update(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const { data, error } = await this.client
      .from('recipes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`更新菜谱失败: ${error.message}`);
    return data as Recipe;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('recipes').delete().eq('id', id);
    if (error) throw new Error(`删除菜谱失败: ${error.message}`);
  }

  async toggleLike(recipeId: string, userId: string = 'anonymous'): Promise<{ liked: boolean; likes_count: number }> {
    // 检查是否已点赞
    const { data: existing } = await this.client
      .from('recipe_likes')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // 取消点赞
      const { error } = await this.client
        .from('recipe_likes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);
      if (error) throw new Error(`取消点赞失败: ${error.message}`);

      // 更新计数 - 先获取当前值
      const { data: currentData } = await this.client
        .from('recipes')
        .select('likes_count')
        .eq('id', recipeId)
        .maybeSingle();
      const currentCount = (currentData as any)?.likes_count || 0;
      await this.client
        .from('recipes')
        .update({ likes_count: Math.max(0, currentCount - 1) })
        .eq('id', recipeId);
      return { liked: false, likes_count: Math.max(0, currentCount - 1) };
    } else {
      // 点赞
      const { error } = await this.client
        .from('recipe_likes')
        .insert({ recipe_id: recipeId, user_id: userId });
      if (error) throw new Error(`点赞失败: ${error.message}`);

      // 更新计数 - 先获取当前值
      const { data: currentData } = await this.client
        .from('recipes')
        .select('likes_count')
        .eq('id', recipeId)
        .maybeSingle();
      const currentCount = (currentData as any)?.likes_count || 0;
      await this.client
        .from('recipes')
        .update({ likes_count: currentCount + 1 })
        .eq('id', recipeId);
      return { liked: true, likes_count: currentCount + 1 };
    }
  }

  async saveRecipe(recipeId: string, userId: string = 'default-user'): Promise<{ saved: boolean }> {
    // 检查是否已保存
    const { data: existing } = await this.client
      .from('recipe_saves')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // 取消保存
      const { error } = await this.client
        .from('recipe_saves')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);
      if (error) throw new Error(`取消保存失败: ${error.message}`);
      return { saved: false };
    } else {
      // 保存
      const { error } = await this.client
        .from('recipe_saves')
        .insert({ recipe_id: recipeId, user_id: userId });
      if (error) throw new Error(`保存菜谱失败: ${error.message}`);
      return { saved: true };
    }
  }

  async isLiked(recipeId: string, userId: string = 'anonymous'): Promise<boolean> {
    const { data } = await this.client
      .from('recipe_likes')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  }

  async getPopular(limit: number = 5): Promise<Recipe[]> {
    const { data, error } = await this.client
      .from('recipes')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`查询热门菜谱失败: ${error.message}`);

    const recipeList = data || [];
    // 遍历每个item，替换image字段为存储服务预签名url
    for (const recipe of recipeList) {
      if (recipe?.image_key) {
        try {
          recipe.image = await getSignedUrl(recipe.image_key);
        } catch (err) {
          console.error(`生成图片 URL 失败 (${recipe.image_key}):`, err);
          // 生成失败降级，保留原始key
          recipe.image = recipe.image_key;
        }
      }
    }

    return recipeList as Recipe[];
  }


  async getStats(): Promise<{ myRecipes: number; favorites: number; likes: number }> {
    const { count: myRecipes } = await this.client
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    const { count: favorites } = await this.client
      .from('recipe_likes')
      .select('*', { count: 'exact', head: true });

    const { data } = await this.client.from('recipes').select('likes_count');
    const likes = (data || []).reduce((sum: number, r: any) => sum + (r.likes_count || 0), 0);

    return {
      myRecipes: myRecipes || 0,
      favorites: favorites || 0,
      likes,
    };
  }
}
