import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from 'src/database/schema';
import { TestFactories } from './factories';

class TestDatabase {
  private static instance: TestDatabase;
  private pool: Pool;
  public factories: TestFactories;
  public db: NodePgDatabase<typeof schema>;
  private locationSeeded = false;
  public testNeighborhoodId: number | null = null;

  private constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL_TEST ||
        'postgresql://postgres:postgres@localhost:5435/roommate_test',
    });
    this.db = drizzle(this.pool, { schema });
    this.factories = new TestFactories(this.db);
  }

  static getInstance() {
    if (!TestDatabase.instance) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('TestDatabase can only be used in test environment');
      }
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async seedLocations() {
    if (this.locationSeeded) return;

    const [country] = await this.db
      .insert(schema.countries)
      .values({ name: 'Turkey', code: 'TR' })
      .onConflictDoNothing()
      .returning();

    const [province] = await this.db
      .insert(schema.provinces)
      .values({ plateCode: 34, name: 'Istanbul', countryId: country?.id || 1 })
      .onConflictDoNothing()
      .returning();

    const [county] = await this.db
      .insert(schema.counties)
      .values({ name: 'Kadikoy', provincePlateCode: province?.plateCode || 34 })
      .onConflictDoNothing()
      .returning();

    const [district] = await this.db
      .insert(schema.districts)
      .values({ name: 'Kadikoy Center', countyId: county?.id || 1 })
      .onConflictDoNothing()
      .returning();

    const [neighborhood] = await this.db
      .insert(schema.neighborhoods)
      .values({
        name: 'Test Mahalle',
        postalCode: '34710',
        districtId: district?.id || 1,
      })
      .onConflictDoNothing()
      .returning();

    this.testNeighborhoodId = neighborhood?.id || 1;
    this.locationSeeded = true;
  }

  async clean() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Cannot clean database outside of test environment');
    }

    await this.db.execute(sql`
    TRUNCATE TABLE 
      posting_images, 
      posting_specs, 
      postings,
      user_bookmarks, 
      user_blocks,
      matches, 
      swipes, 
      preferences, 
      profile, 
      refresh_tokens, 
      verifications, 
      users 
    RESTART IDENTITY CASCADE
    `);
  }

  async close() {
    await this.pool.end();
  }
}

export const testDB = TestDatabase.getInstance();
