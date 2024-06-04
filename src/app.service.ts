import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Connection, PublicKey, ConfirmedSignatureInfo, VersionedTransactionResponse } from '@solana/web3.js';
import { lastValueFrom } from 'rxjs';
import { DexscreenerResponse, Pair } from './interfaces/dexscreener-response.interface';
import { TokenData } from './interfaces/token-data.interface';
import { EnvironmentVariables } from './types/env';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly TOKEN_ADDRESS = this.configService.get<string>('TOKEN_ADDRESS');
  private readonly DEXSCREENER_API_URL = this.configService.get<string>('DEXSCREENER_API_URL');
  private readonly connection = new Connection(this.configService.get<string>('SOLANA_RPC_URL'), 'confirmed');

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async getTokenData(): Promise<TokenData | { message: string }> {
    try {
      // Получение ликвидности из Dexscreener
      const dexResponse = await lastValueFrom(
        this.httpService.get<DexscreenerResponse>(`${this.DEXSCREENER_API_URL}/${this.TOKEN_ADDRESS}`),
      );
      const pairs: Pair[] = dexResponse.data.pairs;

      if (!pairs || pairs.length === 0) {
        return { message: 'No trading pairs found for the token.' };
      }

      // Поиск пары JUP/USDC
      const usdcPair = pairs.find(pair => pair.quoteToken.symbol === 'USDC');

      if (!usdcPair) {
        return { message: 'No JUP/USDC trading pair found.' };
      }

      const liquidityUSD = usdcPair.liquidity.usd;

      // Получение последних транзакций с помощью Solana RPC API
      const tokenPublicKey = new PublicKey(this.TOKEN_ADDRESS);
      const limit = 25; // Получаем 25 последних подписей транзакций для увеличения вероятности нахождения покупки
      const signatures: ConfirmedSignatureInfo[] = await this.connection.getSignaturesForAddress(tokenPublicKey, {
        limit,
      });

      for (const signatureInfo of signatures) {
        const lastSignature = signatureInfo.signature;

        // Получаем полные данные о транзакции по ее подписи (lastSignature).
        const transaction: VersionedTransactionResponse | null = await this.connection.getTransaction(lastSignature, {
          maxSupportedTransactionVersion: 0,
        });

        // Проверяем, что данные о транзакции существуют и содержат необходимые метаданные и балансы.
        if (
          transaction &&
          transaction.meta &&
          transaction.meta.preTokenBalances &&
          transaction.meta.postTokenBalances &&
          transaction.meta.preTokenBalances.length > 0 &&
          transaction.meta.postTokenBalances.length > 0
        ) {
          const { slot } = transaction;
          const { preTokenBalances, postTokenBalances } = transaction.meta;

          // Проверяем, что есть счет с увеличением количества JUP токенов
          const purchaseOperation = postTokenBalances.find(postBalance => {
            const preBalance = preTokenBalances.find(
              preBalance => preBalance.accountIndex === postBalance.accountIndex,
            );
            return (
              postBalance.mint === this.TOKEN_ADDRESS &&
              preBalance &&
              postBalance.uiTokenAmount.uiAmount! > (preBalance.uiTokenAmount.uiAmount || 0)
            );
          });

          if (purchaseOperation) {
            // Ищем уменьшение количества токенов на другом счете у того же владельца
            const sellerOperation = preTokenBalances.find(preBalance => {
              const postBalance = postTokenBalances.find(
                postBalance => postBalance.accountIndex === preBalance.accountIndex,
              );
              return (
                preBalance.owner === purchaseOperation.owner &&
                preBalance.mint !== this.TOKEN_ADDRESS && // Убедимся, что это другой токен
                preBalance.uiTokenAmount.uiAmount! > (postBalance?.uiTokenAmount.uiAmount || 0)
              );
            });

            if (!sellerOperation) {
              continue;
            }

            const transactionAmount =
              purchaseOperation.uiTokenAmount.uiAmount! -
              (preTokenBalances.find(balance => balance.accountIndex === purchaseOperation.accountIndex)?.uiTokenAmount
                .uiAmount || 0);

            return {
              liquidity: liquidityUSD,
              lastTransaction: lastSignature,
              slot,
              wallet: purchaseOperation.owner || 'Data not available',
              transactionAmount,
            };
          }
        }
      }

      return { message: 'No recent purchase transactions found for the token.' };
    } catch (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }
  }
}
