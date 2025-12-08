import { SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export interface RangeFilterParams {
  min?: number | Date;
  max?: number | Date;
  column: PgColumn;
}

export interface BooleanFilterParams {
  value?: boolean;
  column: PgColumn;
}

export interface SearchFilterParams {
  query?: string;
  columns: PgColumn[];
}

export interface ExactMatchParams {
  value?: string | number;
  column: PgColumn;
}

export interface DateRangeParams {
  before?: Date | string;
  after?: Date | string;
  column: PgColumn;
}

export interface PaginationParams {
  cursor?: string;
  column: PgColumn;
}
export interface IQueryBuilder {
  addRange(params: RangeFilterParams): this;
  addBoolean(params: BooleanFilterParams): this;
  addSearch(params: SearchFilterParams): this;
  addExactMatch(params: ExactMatchParams): this;
  addPagination(params: PaginationParams): this;
  build(): SQL | undefined;
}
