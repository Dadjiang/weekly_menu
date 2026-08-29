import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { RecipesModule } from '@/modules/recipes/recipes.module';
import { RecipeAiModule } from '@/modules/recipe-ai/recipe-ai.module';
import { StorageModule } from '@/modules/storage/storage.module';

@Module({
  imports: [RecipesModule, RecipeAiModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
