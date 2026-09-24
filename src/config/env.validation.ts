import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsUrl({ require_tld: false })
  SUPABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_ANON_KEY: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_KEY: string;

  @IsOptional()
  @IsString()
  SUPABASE_DB_SCHEMA?: string;

  @IsOptional()
  @IsString()
  BOOTSTRAP_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.toString()).join('\n'));
  }
  return validated;
}
