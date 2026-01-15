import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';

export class UserFactory {
  private counter = 0;
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async create(overrides: Partial<typeof schema.users.$inferInsert> = {}) {
    this.counter++;
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: `test${this.counter}@example.com`,
        postingCount: 0,
        ...overrides,
      })
      .returning();

    return user;
  }

  async createWithProfile(
    userOverrides: Partial<typeof schema.users.$inferInsert> = {},
    profileOverrides: Partial<typeof schema.profile.$inferInsert> = {},
  ) {
    this.counter++;
    const user = await this.create(userOverrides);

    const [profile] = await this.db
      .insert(schema.profile)
      .values({
        userId: user!.id,
        name: `Test User ${this.counter}`,
        gender: 'female',
        city: 'Istanbul',
        district: 'Kadikoy',
        photoUrl: `https://example.com/photo${this.counter}.jpg`,
        photoVerified: false,
        accountStatus: 'active',
        lastActiveAt: new Date(),
        ...profileOverrides,
      })
      .returning();

    return { user, profile };
  }

  async createWithProfileAndPreferences(
    userOverrides = {},
    profileOverrides = {},
    preferencesOverrides: Partial<typeof schema.preferences.$inferInsert> = {},
  ) {
    const { user, profile } = await this.createWithProfile(
      userOverrides,
      profileOverrides,
    );

    const [preferences] = await this.db
      .insert(schema.preferences)
      .values({
        userId: user!.id,
        genderPreference: 'mixed',
        budgetMin: 3000,
        budgetMax: 8000,
        smokingHabit: 'social',
        petOwnership: 'cat',
        ageMin: 18,
        ageMax: 50,
        petCompatibility: 'yes_love_pets',
        alcoholConsumption: 'occasionally',
        ...preferencesOverrides,
      })
      .returning();

    return { user, profile, preferences };
  }
}
