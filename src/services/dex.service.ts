import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { DexscreenerResponse } from '../interfaces/dexscreener-response.interface';

@Injectable()
export class DexService {
  constructor(private readonly httpService: HttpService) {}

  async getLiquidity(tokenAddress: string, apiUrl: string): Promise<number | null> {
    const dexResponse = await lastValueFrom(this.httpService.get<DexscreenerResponse>(`${apiUrl}/${tokenAddress}`));
    const pairs = dexResponse.data.pairs;

    if (!pairs || pairs.length === 0) {
      return null;
    }

    // Поиск пары JUP/USDC
    const usdcPair = pairs.find(pair => pair.quoteToken.symbol === 'USDC');

    if (!usdcPair) {
      return null;
    }

    return usdcPair.liquidity.usd;
  }
}
