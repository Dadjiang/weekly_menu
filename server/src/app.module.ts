import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { RecipesModule } from '@/modules/recipes/recipes.module';
import { RecipeAiModule } from '@/modules/recipe-ai/recipe-ai.module';
import { DictionariesModule } from '@/modules/dictionaries/dictionaries.module';
import { WeeklyPlansModule } from '@/modules/weekly-plans/weekly-plans.module';

@Module({
  imports: [RecipesModule, RecipeAiModule, DictionariesModule, WeeklyPlansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
