import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { RecipesModule } from '@/modules/recipes/recipes.module';
import { RecipeAiModule } from '@/modules/recipe-ai/recipe-ai.module';
import { DictionariesModule } from '@/modules/dictionaries/dictionaries.module';

@Module({
  imports: [RecipesModule, RecipeAiModule, DictionariesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
