import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';
import { UserFactory } from './user.factory';
import { PostingFactory } from './posting.factory';
import { AuthFactory } from './auth.factory';

export class TestFactories {
  public users: UserFactory;
  public postings: PostingFactory;
  public auth: AuthFactory;

  constructor(db: NodePgDatabase<typeof schema>) {
    this.users = new UserFactory(db);
    this.postings = new PostingFactory(db);
    this.auth = new AuthFactory(db);
  }
}
