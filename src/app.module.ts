import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './services/app.service';
import { EnvironmentVariables } from './types/env';
import { LoggerService } from './common/services/logger/logger.service';
import { DexService } from './services/dex.service';
import { SolanaService } from './services/solana.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: config => {
        const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
        const errors = validateSync(validatedConfig, { skipMissingProperties: false });

        if (errors.length > 0) {
          throw new Error(errors.toString());
        }
        return validatedConfig;
      },
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService, DexService, SolanaService, LoggerService],
})
export class AppModule {}
