/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import { fakerTR as faker } from '@faker-js/faker';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../schema';
import { seederDb as db } from './seed-db-instance';

const NUM_USERS = 1_000_000;
const BATCH_SIZE = 1000;

async function loadLocations(db): Promise<Record<string, string[]>> {
  const locations = await db
    .select({
      provinceName: schema.provinces.name,
      districtName: schema.districts.name,
    })
    .from(schema.districts)
    .innerJoin(
      schema.counties,
      eq(schema.districts.countyId, schema.counties.id),
    )
    .innerJoin(
      schema.provinces,
      eq(schema.counties.provincePlateCode, schema.provinces.plateCode),
    )
    .where(inArray(schema.provinces.name, ['İSTANBUL', 'ANKARA', 'İZMİR']));

  const grouped: Record<string, string[]> = {};

  for (const loc of locations) {
    if (!grouped[loc.provinceName]) {
      grouped[loc.provinceName] = [];
    }
    grouped[loc.provinceName].push(loc.districtName);
  }

  return grouped;
}

async function seedUsers() {
  console.log('📍 Loading locations...');
  const locationsByProvince = await loadLocations(db);

  console.log(`👥 Starting to seed ${NUM_USERS} users...\n`);

  const existingUsersCount = await db.$count(schema.users);
  const startFrom = Math.floor(existingUsersCount / BATCH_SIZE);

  for (let batch = startFrom; batch < NUM_USERS / BATCH_SIZE; batch++) {
    const userBatch: (typeof schema.users.$inferInsert)[] = [];
    const profileBatch: Omit<typeof schema.profile.$inferInsert, 'userId'>[] =
      [];
    const preferenceBatch: Omit<
      typeof schema.preferences.$inferInsert,
      'userId'
    >[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const userIndex = batch * BATCH_SIZE + i;

      const province = faker.helpers.weightedArrayElement([
        { weight: 40, value: 'İSTANBUL' as const },
        { weight: 15, value: 'ANKARA' as const },
        { weight: 12, value: 'İZMİR' as const },
      ]);

      const district = faker.helpers.arrayElement(
        locationsByProvince[province],
      );

      const gender = faker.helpers.weightedArrayElement([
        { weight: 49, value: 'male' as const },
        { weight: 49, value: 'female' as const },
        { weight: 2, value: 'other' as const },
      ]);

      const photoUrl = faker.helpers.maybe(() => faker.image.avatar(), {
        probability: 0.7,
      });
      const budgetMin = faker.number.int({ min: 5000, max: 12000 });

      userBatch.push({
        email: `user${userIndex}@roommate.app`,
        phoneNumber:
          faker.helpers.maybe(
            () => `+90${userIndex.toString().padStart(10, '0')}`, // Unique based on index
            { probability: 0.3 },
          ) ?? null,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: Math.random() < 0.2,
      });

      profileBatch.push({
        name: faker.person.firstName(gender === 'male' ? 'male' : 'female'),
        ageRange: faker.helpers.weightedArrayElement([
          { weight: 25, value: '18-24' as const },
          { weight: 35, value: '25-30' as const },
          { weight: 20, value: '31-35' as const },
          { weight: 12, value: '36-40' as const },
          { weight: 5, value: '41-45' as const },
          { weight: 3, value: '46-50' as const },
        ]),
        gender,
        city: province,
        district,
        photoUrl: photoUrl ?? null,
        photoVerified: photoUrl ? Math.random() < 0.3 : false,
        accountStatus: 'active' as const,
        lastActiveAt: faker.date.recent({ days: 30 }),
      });

      preferenceBatch.push({
        housingSearchType: faker.helpers.weightedArrayElement([
          { weight: 60, value: 'looking_for_roommate' as const },
          { weight: 30, value: 'looking_for_room' as const },
          { weight: 10, value: 'offering_room' as const },
        ]),
        budgetMin,
        budgetMax: budgetMin + faker.number.int({ min: 1000, max: 3000 }),
        genderPreference:
          faker.helpers.maybe(
            () =>
              faker.helpers.arrayElement([
                'female_only',
                'male_only',
                'mixed',
              ] as const),
            { probability: 0.95 },
          ) ?? null,
        smokingHabit:
          faker.helpers.maybe(
            () =>
              faker.helpers.weightedArrayElement([
                { weight: 60, value: 'no' as const },
                { weight: 30, value: 'social' as const },
                { weight: 10, value: 'regular' as const },
              ]),
            { probability: 0.9 },
          ) ?? null,
        petOwnership:
          faker.helpers.maybe(
            () =>
              faker.helpers.weightedArrayElement([
                { weight: 70, value: 'none' as const },
                { weight: 15, value: 'cat' as const },
                { weight: 10, value: 'dog' as const },
                { weight: 5, value: 'other' as const },
              ]),
            { probability: 0.9 },
          ) ?? null,
        petCompatibility:
          faker.helpers.maybe(
            () =>
              faker.helpers.weightedArrayElement([
                { weight: 40, value: 'doesnt_matter' as const },
                { weight: 30, value: 'yes_love_pets' as const },
                { weight: 20, value: 'no_bothered' as const },
                { weight: 10, value: 'no' as const },
              ]),
            { probability: 0.9 },
          ) ?? null,
        alcoholConsumption:
          faker.helpers.maybe(
            () =>
              faker.helpers.weightedArrayElement([
                { weight: 40, value: 'socially' as const },
                { weight: 30, value: 'occasionally' as const },
                { weight: 20, value: 'never' as const },
                { weight: 10, value: 'regularly' as const },
              ]),
            { probability: 0.9 },
          ) ?? null,
      });
    }

    const insertedUsers = await db
      .insert(schema.users)
      .values(userBatch)
      .returning({ id: schema.users.id });

    const profilesWithIds: (typeof schema.profile.$inferInsert)[] =
      profileBatch.map((profile, idx) => ({
        ...profile,
        userId: insertedUsers[idx].id,
      }));

    const preferencesWithIds: (typeof schema.preferences.$inferInsert)[] =
      preferenceBatch.map((pref, idx) => ({
        ...pref,
        userId: insertedUsers[idx].id,
      }));

    await Promise.all([
      db.insert(schema.profile).values(profilesWithIds),
      db.insert(schema.preferences).values(preferencesWithIds),
    ]);

    if ((batch + 1) % 10 === 0) {
      const progress = ((((batch + 1) * BATCH_SIZE) / NUM_USERS) * 100).toFixed(
        1,
      );
      console.log(
        `📊 Progress: ${(batch + 1) * BATCH_SIZE}/${NUM_USERS} (${progress}%)`,
      );
    }
  }

  console.log('\n✨ Seeding completed!');
}

async function main() {
  await seedUsers();
  process.exit(0);
}

main().catch(console.error);
