import { IsNotEmpty, IsString } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  readonly SOLANA_RPC_URL: string;

  @IsString()
  @IsNotEmpty()
  readonly TOKEN_ADDRESS: string;

  @IsString()
  @IsNotEmpty()
  readonly DEXSCREENER_API_URL: string;
}
