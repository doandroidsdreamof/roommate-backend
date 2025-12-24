import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { Matches } from 'src/database/schema';
import { and, eq, isNull, or } from 'drizzle-orm';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  // TODO pagination
  async getMatches(userId: string) {
    try {
      const matches = await this.db.query.matches.findMany({
        where: and(
          or(
            eq(schema.matches.userFirstId, userId),
            eq(schema.matches.userSecondId, userId),
          ),
          isNull(schema.matches.unmatchedAt),
        ),
      });
      return matches;
    } catch (error) {
      this.logger.error('Failed to get matches', error);
      throw new InternalServerErrorException('Failed to get matches');
    }
  }

  async unmatch(userId: string, matchId: string) {
    try {
      const [match] = await this.db
        .update(schema.matches)
        .set({ unmatchedAt: new Date() })
        .where(
          and(
            eq(schema.matches.id, matchId),
            or(
              eq(schema.matches.userFirstId, userId),
              eq(schema.matches.userSecondId, userId),
            ),
            isNull(schema.matches.unmatchedAt),
          ),
        )
        .returning();

      if (!match) {
        throw new NotFoundException('Match not found or already unmatched');
      }
      this.logger.log(`Match ${matchId} unmatched by user ${userId}`);
      return { message: 'Unmatched' };
    } catch (error) {
      this.logger.error('Failed to unmatch', error);
      throw new InternalServerErrorException('Failed to unmatch');
    }
  }

  async insertMatch(
    userFirstId: string,
    userSecondId: string,
  ): Promise<Matches | undefined> {
    const [first, second] = [userFirstId, userSecondId].sort(); // Always tries to insert (A, B), never (B, A)

    try {
      const [data] = await this.db
        .insert(schema.matches)
        .values({
          userFirstId: first,
          userSecondId: second,
        })
        .onConflictDoNothing()
        .returning();

      if (data) {
        this.logger.log(`Match created between ${first} and ${second}`);
      }

      return data; // Returns undefined already matched
    } catch (error) {
      this.logger.error('Failed to create match', error);
      throw new InternalServerErrorException('Failed to create match');
    }
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
