import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.test' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL_TEST!,
  },
});
