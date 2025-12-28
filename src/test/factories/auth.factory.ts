import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';

export class AuthFactory {
  constructor(private db: NodePgDatabase<typeof schema>) {}
}
