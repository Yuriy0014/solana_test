export interface TokenData {
  liquidity: number | 'Data not available';
  lastTransaction: string | 'Data not available';
  slot: number | 'Data not available';
  wallet: string | 'Data not available';
  transactionAmount: number | 'Data not available';
}
