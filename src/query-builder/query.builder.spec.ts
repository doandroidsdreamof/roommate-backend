import { pgTable, integer, boolean } from 'drizzle-orm/pg-core';
import { QueryBuilder } from './query.builder';

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    queryBuilder = new QueryBuilder();
  });

  describe('addRange', () => {
    it('should support method chaining', () => {
      const testTable = pgTable('test', {
        age: integer('age'),
        active: boolean('active'),
      });

      const result = queryBuilder
        .addRange({ min: 18, column: testTable.age })
        .addBoolean({ value: true, column: testTable.active })
        .build();

      expect(result).toBeDefined();
      expect(queryBuilder).toBeInstanceOf(QueryBuilder);
    });
  });
});
