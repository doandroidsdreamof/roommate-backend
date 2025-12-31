import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { Matches } from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { paginateResults } from 'src/helpers/cursorPagination';
import { GetMatchesDto } from './dto/matches.dto';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getMatches(userId: string, dto: GetMatchesDto) {
    try {
      const { cursor } = dto;
      const LIMIT = 20;
      const matches = await this.db.query.matches.findMany({
        where: and(
          or(
            eq(schema.matches.userFirstId, userId),
            eq(schema.matches.userSecondId, userId),
          ),
          isNull(schema.matches.unmatchedAt),
          cursor
            ? sql`${schema.matches.createdAt} < ${new Date(cursor)}`
            : undefined,
        ),
        orderBy: (matches, { desc }) => [desc(matches.createdAt)],
        limit: LIMIT + 1,
      });
      const { items, nextCursor, hasMore } = paginateResults(matches, LIMIT);

      return {
        ...items,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to get matches', error);
      throw new DomainException('DATABASE_ERROR');
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
        throw new DomainException('MATCH_NOT_FOUND');
      }
      return { message: 'Unmatched' };
    } catch (error) {
      this.logger.error('Failed to unmatch', error);
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException('UNMATCH_FAILED');
    }
  }

  async insertMatch(
    userFirstId: string,
    userSecondId: string,
  ): Promise<Matches | undefined> {
    const [first, second] = [userFirstId, userSecondId].sort() as [
      string,
      string,
    ]; // insert (A, B), never (B, A)

    try {
      const [data] = await this.db
        .insert(schema.matches)
        .values({
          userFirstId: first,
          userSecondId: second,
        })
        .onConflictDoNothing()
        .returning();

      return data; // Returns undefined already matched
    } catch (error) {
      this.logger.error('Failed to create match', error);
      throw new DomainException('MATCH_CREATION_FAILED');
    }
  }
}
