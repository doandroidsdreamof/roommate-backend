import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL_LOCAL_TEST ||
      'postgresql://postgres:postgres@127.0.0.1:5435/roommate_test',
  },
});
