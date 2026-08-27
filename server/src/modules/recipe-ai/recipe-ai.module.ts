import { Module } from '@nestjs/common';
import { RecipeAiController } from './recipe-ai.controller';
import { RecipeAiService } from './recipe-ai.service';

@Module({
  controllers: [RecipeAiController],
  providers: [RecipeAiService],
})
export class RecipeAiModule {}
