import { Controller, Get } from '@nestjs/common';
import { AppService } from './services/app.service';
import { TokenData } from './interfaces/token-data.interface';

@Controller('jup')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('token_v_1')
  async getTokenDataV1(): Promise<TokenData | { message: string }> {
    return this.appService.getTokenDataV1();
  }

  @Get('token_v_2')
  async getTokenDataV2(): Promise<TokenData | { message: string }> {
    return this.appService.getTokenDataV2();
  }
}
