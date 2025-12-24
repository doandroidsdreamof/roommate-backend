import 'dotenv/config';
import * as schema from '../schema';
import { seederDb as db } from './seed-db-instance';

const NUM_USERS = 50000;

const CITIES = ['İstanbul', 'Ankara', 'İzmir'];

const ISTANBUL_DISTRICTS = [
  'Kadıköy',
  'Beşiktaş',
  'Şişli',
  'Üsküdar',
  'Beyoğlu',
  'Fatih',
  'Bakırköy',
  'Maltepe',
  'Kartal',
  'Ataşehir',
  'Sarıyer',
  'Beykoz',
  'Pendik',
  'Ümraniye',
  'Bahçelievler',
];

const ANKARA_DISTRICTS = [
  'Çankaya',
  'Keçiören',
  'Mamak',
  'Yenimahalle',
  'Etimesgut',
  'Sincan',
  'Gölbaşı',
  'Altındağ',
  'Pursaklar',
  'Elvankent',
];

const IZMIR_DISTRICTS = [
  'Karşıyaka',
  'Bornova',
  'Konak',
  'Çeşme',
  'Alsancak',
  'Buca',
  'Gaziemir',
  'Balçova',
  'Narlıdere',
  'Bayraklı',
];

const NAMES = ['Ayşe', 'Fatma', 'Elif', 'Ender', 'Mücahit', 'Selin', 'Levent'];

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

function generateEmail(name: string, index: number): string {
  return `${name.toLowerCase()}.${index}@example.com`;
}

async function seedUsers() {
  try {
    console.log('👥 Starting users seed...\n');

    for (let i = 0; i < NUM_USERS; i++) {
      const name = getRandomElement(NAMES);
      const email = generateEmail(name, i);
      const city = getRandomElement(CITIES);
      const district = getRandomElement(getDistrictsForCity(city));
      const gender = getRandomElement(['male', 'female']);
      const ageRange = getRandomElement(['18-24', '25-30', '31-35', '36-40']);

      console.log(
        `Creating user ${i + 1}/${NUM_USERS}: ${name} (${gender}, ${city}/${district})`,
      );

      const [user] = await db
        .insert(schema.users)
        .values({
          email,
          isEmailVerified: true,
          isActive: true,
        })
        .returning();

      await db.insert(schema.profile).values({
        userId: user.id,
        name,
        ageRange,
        gender,
        city,
        district,
        photoVerified: getRandomBoolean(),
        accountStatus: 'active',
        lastActiveAt: new Date(
          Date.now() - getRandomInt(0, 7) * 24 * 60 * 60 * 1000,
        ),
      } as typeof schema.profile.$inferInsert);

      let genderPreference;
      const rand = Math.random();
      if (gender === 'female') {
        if (rand < 0.7) genderPreference = 'female_only';
        else if (rand < 0.9) genderPreference = 'mixed';
        else genderPreference = 'male_only';
      } else {
        if (rand < 0.6) genderPreference = 'mixed';
        else if (rand < 0.9) genderPreference = 'female_only';
        else genderPreference = 'male_only';
      }

      const budgetBase = getRandomInt(3000, 8000);
      const budgetMin = budgetBase;
      const budgetMax = budgetBase + getRandomInt(1000, 3000);

      await db.insert(schema.preferences).values({
        userId: user.id,
        housingSearchType: 'looking_for_roommate' as const,
        budgetMin,
        budgetMax,
        genderPreference: genderPreference as
          | 'female_only'
          | 'male_only'
          | 'any',
        smokingHabit: getRandomElement(['social', 'no', 'regular'] as const),
        petOwnership: getRandomElement([
          'cat',
          'dog',
          'other',
          'none',
        ] as const),
        petCompatibility: getRandomElement([
          'no_bothered',
          'yes_love_pets',
          'no',
          'doesnt_matter',
        ] as const),
        alcoholConsumption: getRandomElement([
          'socially',
          'regularly',
          'never',
          'occasionally',
        ] as const),
      } as typeof schema.preferences.$inferInsert);

      if ((i + 1) % 500 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${NUM_USERS} users created\n`);
      }
    }

    console.log('\n✨ Seeding completed successfully!');
    console.log(`📊 Created ${NUM_USERS} users with profiles and preferences`);

    const maleCount = await db.query.profile.findMany({
      where: (profile, { eq }) => eq(profile.gender, 'male'),
    });
    const femaleCount = await db.query.profile.findMany({
      where: (profile, { eq }) => eq(profile.gender, 'female'),
    });

    const istanbulCount = await db.query.profile.findMany({
      where: (profile, { eq }) => eq(profile.city, 'İstanbul'),
    });
    const ankaraCount = await db.query.profile.findMany({
      where: (profile, { eq }) => eq(profile.city, 'Ankara'),
    });
    const izmirCount = await db.query.profile.findMany({
      where: (profile, { eq }) => eq(profile.city, 'İzmir'),
    });

    console.log(`\n📈 Distribution:`);
    console.log(`     Gender:`);
    console.log(`     Male: ${maleCount.length}`);
    console.log(`     Female: ${femaleCount.length}`);
    console.log(`\n   Cities:`);
    console.log(`     İstanbul: ${istanbulCount.length}`);
    console.log(`     Ankara: ${ankaraCount.length}`);
    console.log(`     İzmir: ${izmirCount.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  await seedUsers();
}

main().catch(console.error);
