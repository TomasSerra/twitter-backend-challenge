// Runtime environments
import * as process from 'node:process';

export enum NodeEnv {
  DEV = 'development',
  PROD = 'production',
}

// Logging levels
export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warn',
  ERROR = 'error',
}

// Environment variables, casting to correct type and setting default values for them.
export class Constants {
  // Node runtime environment
  static NODE_ENV: NodeEnv = (process.env.NODE_ENV as NodeEnv) || NodeEnv.DEV;

  // Logging level
  static LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

  // Port to run the server in
  static PORT: string = process.env.PORT ?? '8081';

  // CORS urls to allow
  static CORS_WHITELIST: string = process.env.CORS_WHITELIST ?? '*';

  // Authentication secret
  static TOKEN_SECRET: string = process.env.TOKEN_SECRET ?? 'secret';

  static SALT_OR_ROUNDS: number = Number(process.env.SALT_OR_ROUNDS) ?? 10;

  static BUCKET_NAME: string = process.env.BUCKET_NAME ?? 'defaultBucket';
  static BUCKET_REGION: string = process.env.BUCKET_REGION ?? 'defaultRegion';
  static ACCESS_KEY: string = process.env.ACCESS_KEY ?? 'defaultAccessKey';
  static SECRET_ACCESS_KEY: string = process.env.SECRET_ACCESS_KEY ?? 'defaultSecretAccessKey';

  static PRE_SIGNED_URL_LIFETIME: number = 60 * 5;

  static DEPLOY_URL: string = process.env.DEPLOY_URL ?? '';
}
