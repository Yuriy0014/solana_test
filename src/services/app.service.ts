import { Injectable } from '@nestjs/common';
import { DexService } from './dex.service';
import { SolanaService } from './solana.service';
import { ConfigService } from '@nestjs/config';
import { VersionedTransactionResponse } from '@solana/web3.js';
import { EnvironmentVariables } from '../types/env';
import { TokenData } from '../interfaces/token-data.interface';

@Injectable()
export class AppService {
  private readonly TOKEN_ADDRESS = this.configService.get<string>('TOKEN_ADDRESS');
  private readonly DEXSCREENER_API_URL = this.configService.get<string>('DEXSCREENER_API_URL');

  constructor(
    private readonly dexService: DexService,
    private readonly solanaService: SolanaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async getTokenDataV1(): Promise<TokenData | { message: string }> {
    try {
      // Получение ликвидности из Dexscreener
      const liquidityUSD = await this.dexService.getLiquidity(this.TOKEN_ADDRESS, this.DEXSCREENER_API_URL);

      if (liquidityUSD === null) {
        return { message: 'No JUP/USDC trading pair found.' };
      }

      // Получение последних транзакций с помощью Solana RPC API
      const signatures = await this.solanaService.getRecentTransactions(this.TOKEN_ADDRESS, 25);

      for (const signatureInfo of signatures) {
        const lastSignature = signatureInfo.signature;

        // Получаем полные данные о транзакции по ее подписи (lastSignature).
        const transaction: VersionedTransactionResponse | null =
          await this.solanaService.getTransactionData(lastSignature);

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

  async getTokenDataV2(): Promise<TokenData | { message: string }> {
    try {
      const liquidityUSD = await this.dexService.getLiquidity(this.TOKEN_ADDRESS, this.DEXSCREENER_API_URL);

      if (liquidityUSD === null) {
        return { message: 'No JUP/USDC trading pair found.' };
      }

      const signatures = await this.solanaService.getRecentTransactions(this.TOKEN_ADDRESS, 25);

      for (const signatureInfo of signatures) {
        const lastSignature = signatureInfo.signature;
        const transaction: VersionedTransactionResponse | null =
          await this.solanaService.getTransactionData(lastSignature);

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
            const transactionAmount =
              purchaseOperation.uiTokenAmount.uiAmount! -
              (preTokenBalances.find(balance => balance.accountIndex === purchaseOperation.accountIndex)?.uiTokenAmount
                .uiAmount || 0);

            // Проверяем, есть ли в транзакции счета с другими валютами
            const differentCurrencies = postTokenBalances.some(
              postBalance => postBalance.mint !== this.TOKEN_ADDRESS && postBalance.owner === purchaseOperation.owner,
            );

            if (differentCurrencies) {
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
      }

      return { message: 'No recent purchase transactions found for the token.' };
    } catch (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }
  }
}
