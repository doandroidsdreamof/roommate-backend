import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_LOCAL,
});

const db = drizzle(pool, { schema });

const USER_ID = '5a0a2ed6-b674-4fec-a553-979df73dc792';
const NUM_POSTINGS = 10;

const CITIES = ['İstanbul', 'Ankara', 'İzmir'];
const ISTANBUL_DISTRICTS = ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar'];
const ANKARA_DISTRICTS = ['Çankaya', 'Keçiören', 'Mamak'];
const IZMIR_DISTRICTS = ['Karşıyaka', 'Bornova', 'Konak'];

const TITLES = [
  'Sunny apartment in {district}',
  'Bright sunny room with balcony',
  'Modern furnished apartment with sunny terrace',
  'Cozy sunny studio near metro',
  'Spacious apartment with sunny living room',
  'Beautiful sunny flat with parking',
  'Luxurious sunny penthouse',
  'Charming sunny apartment in city center',
];

const DESCRIPTIONS = [
  'Beautiful sunny apartment with lots of natural light. Perfect for students or young professionals. Close to public transport.',
  'Spacious sunny room in a shared apartment. Great balcony with city views. Friendly roommates.',
  'Modern apartment with a sunny terrace. Close to public transport and amenities. Recently renovated.',
  'Cozy studio with excellent natural lighting. Ideal location near universities and shopping centers.',
  'Large apartment with sunny exposure throughout the day. Quiet neighborhood with all conveniences nearby.',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBoolean(): boolean {
  return Math.random() > 0.5;
}

function getDistrictsForCity(city: string): string[] {
  if (city === 'İstanbul') return ISTANBUL_DISTRICTS;
  if (city === 'Ankara') return ANKARA_DISTRICTS;
  if (city === 'İzmir') return IZMIR_DISTRICTS;
  return ['Center'];
}

async function seedPostings() {
  try {
    console.log('🏠 Starting postings seed...\n');

    const neighborhoods = await db.query.neighborhoods.findMany({
      limit: 10,
    });

    if (neighborhoods.length === 0) {
      throw new Error('No neighborhoods found. Please seed locations first.');
    }

    for (let i = 0; i < NUM_POSTINGS; i++) {
      const city = getRandomElement(CITIES);
      const district = getRandomElement(getDistrictsForCity(city));
      const neighborhood = getRandomElement(neighborhoods);
      const rentAmount = getRandomInt(1200, 2000);
      const roomCount = getRandomInt(2, 3);
      const title = getRandomElement(TITLES).replace('{district}', district);

      console.log(`Creating posting ${i + 1}/${NUM_POSTINGS}: ${title}`);

      const [posting] = await db
        .insert(schema.postings)
        .values({
          userId: USER_ID,
          type: 'offering_room',
          status: 'active',
          title: title,
          coverImageUrl: `https://picsum.photos/seed/${i}/800/600`,
          isVerified: getRandomBoolean(),
          city: city,
          district: district,
          neighborhoodId: neighborhood.id,
          latitude: `40.${getRandomInt(9800, 9900)}`,
          longitude: `29.${getRandomInt(100, 300)}`,
          rentAmount: rentAmount,
          roomCount: roomCount,
          bathroomCount: getRandomInt(1, 2),
          squareMeters: getRandomInt(60, 120),
          isFurnished: true,
          preferredRoommateGender: 'mixed',
          availableFrom: new Date(),
          bookmarkCount: getRandomInt(0, 20),
          viewCount: getRandomInt(0, 100),
        })
        .returning();

      await db.insert(schema.postingSpecs).values({
        postingId: posting.id,
        description: getRandomElement(DESCRIPTIONS),
        depositAmount: rentAmount * 2,
        billsIncluded: getRandomBoolean(),
        floor: getRandomInt(1, 8),
        totalFloors: getRandomInt(5, 10),
        hasBalcony: true,
        hasParking: true,
        hasElevator: getRandomBoolean(),
        currentOccupants: getRandomInt(1, 3),
        totalCapacity: getRandomInt(2, 4),
        availableRooms: 1,
        occupantGenderComposition: getRandomElement([
          'all_male',
          'all_female',
          'mixed',
        ]),
        occupantAgeRange: getRandomElement([
          '18-24',
          '25-30',
          '31-35',
          '36-40',
        ]),
        preferredRoommateAgeRange: getRandomElement([
          '18-24',
          '25-30',
          '31-35',
          '36-40',
        ]),
        smokingAllowed: getRandomBoolean(),
        alcoholFriendly: getRandomBoolean(),
        hasPets: getRandomBoolean(),
        currentPetOwnership: getRandomElement(['cat', 'dog', 'other', 'none']),
        nearbyTransport: 'Metro station 5 min walk, bus stops nearby',
      } as unknown as typeof schema.postingSpecs.$inferInsert);

      console.log(`  ✓ Created: ${title} - ${rentAmount}₺/month`);
    }

    console.log('\n✨ Seeding completed successfully!');
    console.log(`📊 Created ${NUM_POSTINGS} postings with specs`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  await seedPostings();
}

main().catch(console.error);
