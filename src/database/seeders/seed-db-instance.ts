import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import * as dotenv from 'dotenv';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

let seederDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (isDev) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_LOCAL,
  });

  seederDb = drizzle(pool, { schema });

  pool
    .connect()
    .then((client) => {
      console.log('Seeder DB connected');
      client.release();
    })
    .catch((err) => {
      console.error('Seeder DB connection failed:', err);
    });
} else {
  console.log('Seeder DB skipped (not in development)');
}

export { seederDb };
