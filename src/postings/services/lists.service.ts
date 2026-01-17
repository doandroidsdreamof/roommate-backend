import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { paginateResults } from 'src/helpers/cursorPagination';
import { QueryBuilder } from 'src/query-builder/query.builder';
import { ListsQueryDto } from '../dto/lists.dto';

@Injectable()
export class ListsService {
  private readonly logger = new Logger(ListsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getLists(userId: string, query: ListsQueryDto) {
    const { limit, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const sortColumn =
      sortBy === 'viewCount'
        ? schema.postings.viewCount
        : sortBy === 'bookmarkCount'
          ? schema.postings.bookmarkCount
          : sortBy === 'rentAmount'
            ? schema.postings.rentAmount
            : schema.postings.createdAt;

    const conditions = new QueryBuilder()
      .addRange({
        min: query.minRent,
        max: query.maxRent,
        column: schema.postings.rentAmount,
      })
      .addRange({
        min: query.minRooms,
        max: query.maxRooms,
        column: schema.postings.roomCount,
      })
      .addRange({
        min: query.minSquareMeters,
        max: query.maxSquareMeters,
        column: schema.postings.squareMeters,
      })
      .addExactMatch({ value: query.city, column: schema.postings.city })
      .addExactMatch({
        value: query.district,
        column: schema.postings.district,
      })
      .addExactMatch({
        value: query.neighborhoodId,
        column: schema.postings.neighborhoodId,
      })
      .addExactMatch({
        value: query.preferredRoommateGender,
        column: schema.postings.preferredRoommateGender,
      })
      .addBoolean({
        value: query.isFurnished,
        column: schema.postings.isFurnished,
      })
      .addBoolean({
        value: query.hasParking,
        column: schema.postingSpecs.hasParking,
      })
      .addBoolean({
        value: query.hasBalcony,
        column: schema.postingSpecs.hasBalcony,
      })
      .addBoolean({
        value: query.hasElevator,
        column: schema.postingSpecs.hasElevator,
      })
      .addBoolean({
        value: query.billsIncluded,
        column: schema.postingSpecs.billsIncluded,
      })
      .addBoolean({
        value: query.smokingAllowed,
        column: schema.postingSpecs.smokingAllowed,
      })
      .addBoolean({
        value: query.alcoholFriendly,
        column: schema.postingSpecs.alcoholFriendly,
      })
      .addBoolean({ value: query.hasPets, column: schema.postingSpecs.hasPets })
      .addSearch({
        query: query.search,
        columns: [schema.postings.title, schema.postingSpecs.description],
      })
      .addPagination({
        cursor: query.cursor,
        column: schema.postings.createdAt,
      })
      .build();

    const listsItems = await this.db
      .select({
        viewCount: schema.postings.viewCount,
        availableFrom: schema.postings.availableFrom,
        city: schema.postings.city,
        id: schema.postings.id,
        title: schema.postings.title,
        bookmarkCount: schema.postings.bookmarkCount,
        coverImageUrl: schema.postings.coverImageUrl,
        createdAt: schema.postings.createdAt,
        rentAmount: schema.postings.rentAmount,
        roomCount: schema.postings.roomCount,
        district: schema.postings.district,
        preferredRoommateGender: schema.postings.preferredRoommateGender,
        specs: schema.postingSpecs,
        isBookmarked: sql<boolean>`
          CASE 
            WHEN ${schema.userBookmarks.id} IS NOT NULL THEN true 
            ELSE false 
          END
        `.as('is_bookmarked'),
      })
      .from(schema.postings)
      .leftJoin(
        schema.postingSpecs,
        eq(schema.postings.id, schema.postingSpecs.postingId),
      )
      .leftJoin(
        schema.userBookmarks,
        and(
          eq(schema.postings.id, schema.userBookmarks.postingId),
          eq(schema.userBookmarks.userId, userId),
        ),
      )
      .where(
        conditions
          ? and(isNull(schema.postings.deletedAt), conditions)
          : isNull(schema.postings.deletedAt),
      )
      .orderBy(
        sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn),
        desc(schema.postings.id),
      )
      .limit(limit + 1);

    const { items, nextCursor, hasMore } = paginateResults(
      listsItems,
      limit,
      'createdAt',
    );

    return {
      lists: items,
      nextCursor,
      hasMore,
    };
  }
}
