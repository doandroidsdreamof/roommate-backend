import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { users } from '../database/schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findOne(id: string) {
    try {
      const user = await this.db
        .selectDistinct()
        .from(users)
        .where(eq(schema.users.id, id))
        .limit(1);

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user[0];
    } catch (err) {
      //* inotherwise it returns undefined and thinks it's successful
      throw err;
    }
  }
}
