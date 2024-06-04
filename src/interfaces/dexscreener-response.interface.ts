export interface Token {
  address: string;
  name: string;
  symbol: string;
}

export interface Liquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface Volume {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

export interface PriceChange {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

export interface Transactions {
  buys: number;
  sells: number;
}

export interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[];
  baseToken: Token;
  quoteToken: Token;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: Transactions;
    h1: Transactions;
    h6: Transactions;
    h24: Transactions;
  };
  volume: Volume;
  priceChange: PriceChange;
  liquidity: Liquidity;
  fdv: number;
  pairCreatedAt: number;
  info: {
    imageUrl: string;
    websites: { label: string; url: string }[];
    socials: { type: string; url: string }[];
  };
}

export interface DexscreenerResponse {
  schemaVersion: string;
  pairs: Pair[];
}
