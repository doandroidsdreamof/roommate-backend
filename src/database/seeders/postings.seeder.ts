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

const NUM_POSTINGS = 1_000_000;
const BATCH_SIZE = 1000;

// ============= TYPES =============

interface NeighborhoodData {
  id: number;
  districtName: string;
}

type NeighborhoodMap = Record<string, NeighborhoodData[]>;

// ============= LOAD REAL DATA =============

async function loadUserIds(db, limit: number): Promise<string[]> {
  const users = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(limit);

  return users.map((u) => u.id);
}

async function loadNeighborhoods(db): Promise<NeighborhoodMap> {
  const neighborhoods = await db
    .select({
      id: schema.neighborhoods.id,
      provinceName: schema.provinces.name,
      districtName: schema.districts.name,
    })
    .from(schema.neighborhoods)
    .innerJoin(
      schema.districts,
      eq(schema.neighborhoods.districtId, schema.districts.id),
    )
    .innerJoin(
      schema.counties,
      eq(schema.districts.countyId, schema.counties.id),
    )
    .innerJoin(
      schema.provinces,
      eq(schema.counties.provincePlateCode, schema.provinces.plateCode),
    )
    .where(inArray(schema.provinces.name, ['İSTANBUL', 'ANKARA', 'İZMİR']));

  const grouped: NeighborhoodMap = {};

  for (const n of neighborhoods) {
    if (!grouped[n.provinceName]) {
      grouped[n.provinceName] = [];
    }
    grouped[n.provinceName].push({
      id: n.id,
      districtName: n.districtName,
    });
  }

  return grouped;
}

// ============= GENERATORS =============

function generatePostingType():
  | 'offering_room'
  | 'looking_for_roommate'
  | 'looking_for_room' {
  return faker.helpers.weightedArrayElement([
    { weight: 60, value: 'offering_room' as const },
    { weight: 30, value: 'looking_for_roommate' as const },
    { weight: 10, value: 'looking_for_room' as const },
  ]);
}

function generateRentAmount(province: string): number {
  const ranges: Record<string, { min: number; max: number }> = {
    İSTANBUL: { min: 8000, max: 20000 },
    ANKARA: { min: 6000, max: 15000 },
    İZMİR: { min: 5000, max: 12000 },
  };

  const range = ranges[province] || { min: 4000, max: 10000 };
  return faker.number.int({ min: range.min, max: range.max });
}

function generateTitle(district: string): string {
  const templates = [
    `Güneşli daire ${district}'de`,
    `Modern oda ${district} merkezde`,
    `Balkonlu daire ${district}`,
    `Ferah oda metronun yanında`,
    `Geniş daire ${district}'de kiralık`,
  ];

  return faker.helpers.arrayElement(templates);
}

function generateDescription(): string {
  const descriptions = [
    'Merkezi konumda, ulaşıma yakın ferah daire. Öğrenciler ve genç profesyoneller için ideal.',
    'Modern eşyalı, balkonlu oda. Sessiz ve güvenli bir mahallede.',
    'Yeni tadilatlı, doğal ışık alan geniş daire. Alışveriş merkezlerine yakın.',
    'Toplu taşımaya 2 dakika, üniversiteye 10 dakika mesafede konforlu oda.',
  ];

  return faker.helpers.arrayElement(descriptions);
}

function generateCoordinates(province: string): { lat: string; lng: string } {
  const coords: Record<string, { lat: string; lng: string }> = {
    İSTANBUL: { lat: '41.0', lng: '28.9' },
    ANKARA: { lat: '39.9', lng: '32.8' },
    İZMİR: { lat: '38.4', lng: '27.1' },
  };

  const base = coords[province] || { lat: '39.0', lng: '35.0' };

  return {
    lat: `${parseFloat(base.lat) + (Math.random() - 0.5) * 0.1}`,
    lng: `${parseFloat(base.lng) + (Math.random() - 0.5) * 0.1}`,
  };
}

// ============= MAIN SEEDER =============

async function seedPostings() {
  console.log('📍 Loading data...');

  const neighborhoodsByProvince = await loadNeighborhoods(db);
  const userIds = await loadUserIds(db, 100000);

  console.log(`✓ Loaded ${userIds.length} users`);
  console.log(`✓ Loaded neighborhoods for 3 provinces`);

  const existingCount = await db.$count(schema.postings);
  const startFrom = Math.floor(existingCount / BATCH_SIZE);

  console.log(`✓ Found ${existingCount} existing postings`);
  console.log(`📝 Resuming from batch ${startFrom}...\n`);

  for (let batch = startFrom; batch < NUM_POSTINGS / BATCH_SIZE; batch++) {
    const postingBatch: (typeof schema.postings.$inferInsert)[] = [];
    const specsBatch: Omit<
      typeof schema.postingSpecs.$inferInsert,
      'postingId'
    >[] = [];
    const imagesBatch: Omit<
      typeof schema.postingImages.$inferInsert,
      'postingSpecsId'
    >[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const postingIndex = batch * BATCH_SIZE + i;

      const userId = faker.helpers.arrayElement(userIds);

      const province = faker.helpers.weightedArrayElement([
        { weight: 40, value: 'İSTANBUL' as const },
        { weight: 15, value: 'ANKARA' as const },
        { weight: 12, value: 'İZMİR' as const },
      ]);

      const neighborhoodData = faker.helpers.arrayElement(
        neighborhoodsByProvince[province],
      );
      const coords = generateCoordinates(province);
      const rentAmount = generateRentAmount(province);
      const roomCount = faker.number.int({ min: 1, max: 4 });

      postingBatch.push({
        userId,
        type: generatePostingType(),
        status: faker.helpers.weightedArrayElement([
          { weight: 85, value: 'active' as const },
          { weight: 10, value: 'inactive' as const },
          { weight: 5, value: 'rented' as const },
        ]),
        title: generateTitle(neighborhoodData.districtName),
        coverImageUrl: `https://picsum.photos/seed/${postingIndex}/800/600`,
        isVerified: Math.random() < 0.3,
        city: province,
        district: neighborhoodData.districtName,
        neighborhoodId: neighborhoodData.id,
        latitude: coords.lat,
        longitude: coords.lng,
        rentAmount,
        roomCount,
        bathroomCount: faker.number.int({
          min: 1,
          max: Math.min(roomCount, 3),
        }),
        squareMeters: faker.number.int({ min: 50, max: 200 }),
        isFurnished: Math.random() < 0.7,
        preferredRoommateGender: faker.helpers.weightedArrayElement([
          { weight: 40, value: 'mixed' as const },
          { weight: 35, value: 'female_only' as const },
          { weight: 25, value: 'male_only' as const },
        ]),
        availableFrom: faker.date.soon({ days: 60 }),
        bookmarkCount: faker.number.int({ min: 0, max: 50 }),
        viewCount: faker.number.int({ min: 0, max: 500 }),
      });

      specsBatch.push({
        description: generateDescription(),
        depositAmount: rentAmount * faker.number.int({ min: 1, max: 3 }),
        billsIncluded: Math.random() < 0.4,
        floor: faker.number.int({ min: 0, max: 15 }),
        totalFloors: faker.number.int({ min: 5, max: 20 }),
        hasBalcony: Math.random() < 0.6,
        hasParking: Math.random() < 0.4,
        hasElevator: Math.random() < 0.7,
        currentOccupants: faker.number.int({ min: 0, max: 3 }),
        totalCapacity: faker.number.int({ min: 2, max: 5 }),
        availableRooms: faker.number.int({ min: 1, max: 2 }),
        occupantGenderComposition: faker.helpers.arrayElement([
          'all_male',
          'all_female',
          'mixed',
        ] as const),
        occupantAgeRange: faker.helpers.arrayElement([
          '18-24',
          '25-30',
          '31-35',
          '36-40',
        ] as const),
        preferredRoommateAgeRange: faker.helpers.arrayElement([
          '18-24',
          '25-30',
          '31-35',
          '36-40',
        ] as const),
        smokingAllowed: Math.random() < 0.3,
        alcoholFriendly: Math.random() < 0.6,
        hasPets: Math.random() < 0.2,
        currentPetOwnership: faker.helpers.weightedArrayElement([
          { weight: 70, value: 'none' as const },
          { weight: 15, value: 'cat' as const },
          { weight: 10, value: 'dog' as const },
          { weight: 5, value: 'other' as const },
        ]),
        availableUntil:
          faker.helpers.maybe(() => faker.date.future({ years: 1 }), {
            probability: 0.3,
          }) ?? null,
        nearbyTransport: 'Metro 5 dk, otobüs durakları yakın',
      });

      const imageCount = faker.number.int({ min: 2, max: 6 });
      const images = Array.from({ length: imageCount }, (_, idx) => ({
        url: `https://picsum.photos/seed/${postingIndex}-${idx}/800/600`,
        order: idx,
      }));

      imagesBatch.push({
        images,
        isVerified: Math.random() < 0.2,
      });
    }

    const insertedPostings = await db
      .insert(schema.postings)
      .values(postingBatch)
      .returning({ id: schema.postings.id });

    const specsWithIds: (typeof schema.postingSpecs.$inferInsert)[] =
      specsBatch.map((spec, idx) => ({
        ...spec,
        postingId: insertedPostings[idx].id,
      }));

    const insertedSpecs = await db
      .insert(schema.postingSpecs)
      .values(specsWithIds)
      .returning({ id: schema.postingSpecs.id });

    const imagesWithIds: (typeof schema.postingImages.$inferInsert)[] =
      imagesBatch.map((img, idx) => ({
        ...img,
        postingSpecsId: insertedSpecs[idx].id,
      }));

    await db.insert(schema.postingImages).values(imagesWithIds);

    if ((batch + 1) % 10 === 0) {
      const progress = (
        (((batch + 1) * BATCH_SIZE) / NUM_POSTINGS) *
        100
      ).toFixed(1);
      console.log(
        `📊 Progress: ${(batch + 1) * BATCH_SIZE}/${NUM_POSTINGS} (${progress}%)`,
      );
    }
  }

  console.log('\n✨ Seeding completed!');
}

async function main() {
  await seedPostings();
  process.exit(0);
}

main().catch(console.error);
