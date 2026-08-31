import { Controller, Get, Param } from '@nestjs/common';
import { DictionariesService } from './dictionaries.service';

@Controller('dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  async findAll() {
    const data = await this.dictionariesService.findAll();
    return { code: 200, msg: 'success', data };
  }

  @Get(':type')
  async findByType(@Param('type') type: string) {
    const data = await this.dictionariesService.findByType(type);
    return { code: 200, msg: 'success', data };
  }
}
