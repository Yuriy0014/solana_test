import { Injectable } from '@nestjs/common';
import { Connection, PublicKey, ConfirmedSignatureInfo, VersionedTransactionResponse } from '@solana/web3.js';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../types/env';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {
    this.connection = new Connection(this.configService.get<string>('SOLANA_RPC_URL'), 'confirmed');
  }

  async getRecentTransactions(tokenAddress: string, limit: number): Promise<ConfirmedSignatureInfo[]> {
    const tokenPublicKey = new PublicKey(tokenAddress);
    return this.connection.getSignaturesForAddress(tokenPublicKey, { limit });
  }

  async getTransactionData(signature: string): Promise<VersionedTransactionResponse | null> {
    return this.connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });
  }
}
