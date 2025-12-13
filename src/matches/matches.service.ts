import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { Matches } from 'src/database/schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
  ) {}

  getMatches(userId: string) {
    return `This action returns a #${userId} match`;
  }

  unmatch(userId: string, matchId: string) {
    return `This action removes a #${matchId} match`;
  }

  async insertMatch(
    userFirstId: string,
    userSecondId: string,
  ): Promise<Matches> {
    const [data] = await this.db
      .insert(schema.matches)
      .values({
        userFirstId: userFirstId,
        userSecondId: userSecondId,
      })
      .returning();

    if (!data) {
      throw new InternalServerErrorException('Failed to create match');
    }

    return data;
  }
}
