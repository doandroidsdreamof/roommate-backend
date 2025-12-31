import { and, between, eq, gte, ilike, lte, or, sql, SQL } from 'drizzle-orm';
import {
  BooleanFilterParams,
  ExactMatchParams,
  IQueryBuilder,
  PaginationParams,
  RangeFilterParams,
  SearchFilterParams,
} from './builder-types';
import { Logger } from '@nestjs/common';

// TODO integration testing
export class QueryBuilder implements IQueryBuilder {
  private conditions: SQL[] = [];
  private readonly logger = new Logger(QueryBuilder.name);

  addRange({ min, max, column }: RangeFilterParams) {
    if (min && max) {
      this.conditions.push(between(column, min, max));
    } else if (min) {
      this.conditions.push(gte(column, min));
    } else if (max) {
      this.conditions.push(lte(column, max));
    }
    return this;
  }
  addBoolean({ value, column }: BooleanFilterParams) {
    if (typeof value === 'boolean') {
      this.conditions.push(eq(column, value));
    }
    return this;
  }
  addSearch({ query, columns }: SearchFilterParams) {
    if (!query || columns.length === 0) return this;
    if (typeof query === 'string') {
      const searchConditions = columns.map((col) => ilike(col, `%${query}%`));
      const searchCondition = or(...searchConditions);

      if (searchCondition) {
        this.conditions.push(searchCondition);
      }
    }
    return this;
  }
  addExactMatch({ value, column }: ExactMatchParams) {
    if (value == undefined) return this;
    this.conditions.push(eq(column, value));
    return this;
  }
  addPagination({ column, cursor }: PaginationParams) {
    if (!cursor) {
      return this;
    }
    this.conditions.push(sql`${column} < ${new Date(cursor)}`);
    return this;
  }
  build() {
    if (this.conditions.length === 0) return undefined;
    return and(...this.conditions);
  }
}
