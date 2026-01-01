import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';

export class PostingFactory {
  private counter = 0;
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async create(
    userId: string,
    overrides: Partial<typeof schema.postings.$inferInsert> = {},
  ) {
    this.counter++;
    const [posting] = await this.db
      .insert(schema.postings)
      .values({
        userId,
        title: `Test title ${this.counter}`,
        city: 'Istanbul',
        district: 'Kadikoy',
        neighborhoodId: 1,
        coverImageUrl: `https://example.com/photo${this.counter}.jpg`,
        latitude: '41.0082',
        longitude: '28.9784',
        rentAmount: 20000,
        roomCount: 2,
        bathroomCount: 1,
        squareMeters: 200,
        isFurnished: true,
        preferredRoommateGender: 'mixed',
        availableFrom: new Date(),
        ...overrides,
      })
      .returning();

    return posting;
  }
}
