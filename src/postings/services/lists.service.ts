import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { ListsQueryDto } from '../dto/lists.dto';
import { and, sql } from 'drizzle-orm';
import { paginateResults } from 'src/helpers/cursorPagination';

@Injectable()
export class ListsService {
  private readonly logger = new Logger(ListsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getLists(query: ListsQueryDto) {
    const { cursor, limit } = query;
    const listsItems = await this.db.query.postings.findMany({
      where: and(
        sql`${schema.postings.deletedAt} IS NULL`,
        cursor
          ? sql`${schema.postings.createdAt} < ${new Date(cursor)}`
          : undefined,
      ),
      columns: {
        viewCount: true,
        availableFrom: true,
        city: true,
        id: true,
        title: true,
        bookmarkCount: true,
        coverImageUrl: true,
        createdAt: true,
        rentAmount: true,
        roomCount: true,
        district: true,
        preferredRoommateGender: true,
      },
      limit: limit + 1,
    });
    const { items, nextCursor, hasMore } = paginateResults(listsItems, limit);

    return {
      lists: items.map((item) => ({
        ...item,
      })),
      nextCursor,
      hasMore,
    };
  }
}
