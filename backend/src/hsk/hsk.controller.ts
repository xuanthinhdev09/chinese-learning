import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HskService } from './hsk.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('hsk')
export class HskController {
  constructor(private readonly hskService: HskService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.hskService.findAll();
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.hskService.findOne(id);
  }
}