import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TokenData } from './interfaces/token-data.interface';

@Controller('token')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getTokenData(): Promise<TokenData | { message: string }> {
    return this.appService.getTokenData();
  }
}
