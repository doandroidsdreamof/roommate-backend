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
import { and, eq, isNull, or } from 'drizzle-orm';

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
  async getMatchedUserIds(userId: string): Promise<string[]> {
    const matches = await this.db
      .select({
        userFirstId: schema.matches.userFirstId,
        userSecondId: schema.matches.userSecondId,
      })
      .from(schema.matches)
      .where(
        and(
          or(
            eq(schema.matches.userFirstId, userId),
            eq(schema.matches.userSecondId, userId),
          ),
          isNull(schema.matches.unmatchedAt),
        ),
      );

    return matches.map((m) =>
      m.userFirstId === userId ? m.userSecondId : m.userFirstId,
    );
  }
}
