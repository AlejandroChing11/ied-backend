import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DB_SCHEMA } from '../common/constants';

const ALLOWED_SCHEMAS = new Set(['proyecto-universidad']);

@Injectable()
export class SupabaseService {
  readonly admin: SupabaseClient<any, 'public', typeof DB_SCHEMA>;
  readonly anon: SupabaseClient<any, 'public', typeof DB_SCHEMA>;
  readonly schema: string;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const requested = config.get<string>('SUPABASE_DB_SCHEMA') ?? DB_SCHEMA;
    if (!ALLOWED_SCHEMAS.has(requested)) {
      throw new Error('SUPABASE_DB_SCHEMA no está en la lista permitida');
    }
    this.schema = requested;
    const options = {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: this.schema as typeof DB_SCHEMA },
    };
    this.admin = createClient(url, config.getOrThrow<string>('SUPABASE_SERVICE_KEY'), options);
    this.anon = createClient(url, config.getOrThrow<string>('SUPABASE_ANON_KEY'), options);
  }

  from(table: string) {
    return this.admin.from(table);
  }
}
