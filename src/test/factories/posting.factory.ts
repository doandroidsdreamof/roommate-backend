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

  /**
   * Complete posting with specs
   */
  async createWithSpecs(
    userId: string,
    postingOverrides: Partial<typeof schema.postings.$inferInsert> = {},
    specsOverrides: Partial<typeof schema.postingSpecs.$inferInsert> = {},
  ) {
    const posting = await this.create(userId, postingOverrides);

    const [specs] = await this.db
      .insert(schema.postingSpecs)
      .values({
        postingId: posting!.id,
        description:
          'Test description with enough characters to pass validation',
        depositAmount: 40000,
        billsIncluded: false,
        floor: 3,
        totalFloors: 5,
        hasBalcony: true,
        hasParking: false,
        hasElevator: true,
        currentOccupants: 1,
        totalCapacity: 3,
        availableRooms: 2,
        occupantGenderComposition: 'mixed',
        ageMax: 35,
        ageMin: 18,
        smokingAllowed: false,
        alcoholFriendly: true,
        hasPets: false,
        currentPetOwnership: 'none',
        nearbyTransport: 'Metro 5 min walk',
        ...specsOverrides,
      })
      .returning();

    return { posting, specs };
  }

  /**
   * Complete posting with specs and images
   */
  async createWithSpecsAndImages(
    userId: string,
    postingOverrides: Partial<typeof schema.postings.$inferInsert> = {},
    specsOverrides: Partial<typeof schema.postingSpecs.$inferInsert> = {},
    imageCount: number = 3,
  ) {
    const { posting, specs } = await this.createWithSpecs(
      userId,
      postingOverrides,
      specsOverrides,
    );

    const images = Array.from({ length: imageCount }, (_, i) => ({
      url: `https://example.com/image-${this.counter}-${i}.jpg`,
      order: i,
    }));

    const [postingImages] = await this.db
      .insert(schema.postingImages)
      .values({
        postingSpecsId: specs!.id,
        images,
        isVerified: false,
      })
      .returning();

    return { posting, specs, postingImages };
  }

  async createMultiple(
    userId: string,
    count: number,
    baseOverrides: Partial<typeof schema.postings.$inferInsert> = {},
  ) {
    const postings = [];

    for (let i = 0; i < count; i++) {
      const posting = await this.create(userId, {
        neighborhoodId: 1,
        city: 'Istanbul',
        district: 'Kadikoy',
        ...baseOverrides,
      });
      postings.push(posting);
    }

    return postings;
  }
  /**
   * Create closed/deleted posting
   */
  async createClosed(
    userId: string,
    status: 'inactive' | 'rented' = 'inactive',
    overrides: Partial<typeof schema.postings.$inferInsert> = {},
  ) {
    return this.create(userId, {
      ...overrides,
      status,
      deletedAt: new Date(),
    });
  }
}
