import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<string>('DATABASE_URL');
      const pool = new Pool({
        connectionString,
      });
      try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
      }
      return drizzle(pool, { schema, logger: true }) as NodePgDatabase<
        typeof schema
      >;
    },
  },
];
