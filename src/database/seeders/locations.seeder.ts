import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import 'dotenv/config';

// TODO use all data
async function seedLocations() {
  const connectionString = process.env.DATABASE_URL_LOCAL;

  console.log('seeder ~ process.env.DATABASE_URL:', connectionString);

  const pool = new Pool({
    connectionString: connectionString,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('Seeding country...');
    const [turkey] = await db
      .insert(schema.countries)
      .values({
        name: 'Turkey',
        code: 'TR',
      })
      .returning();
    console.log(`Country created: ${turkey.name}`);
    console.log(' Seeding provinces...');

    const [istanbul] = await db
      .insert(schema.provinces)
      .values({
        plateCode: 34,
        name: 'Istanbul',
        countryId: turkey.id,
      })
      .returning();

    const [ankara] = await db
      .insert(schema.provinces)
      .values({
        plateCode: 6,
        name: 'Ankara',
        countryId: turkey.id,
      })
      .returning();

    console.log(` Provinces created: ${istanbul.name}, ${ankara.name}`);

    console.log(' Seeding counties...');
    const [kadikoy] = await db
      .insert(schema.counties)
      .values({
        name: 'Kadıköy',
        provincePlateCode: istanbul.plateCode,
      })
      .returning();

    const [besiktas] = await db
      .insert(schema.counties)
      .values({
        name: 'Beşiktaş',
        provincePlateCode: istanbul.plateCode,
      })
      .returning();

    const [cankaya] = await db
      .insert(schema.counties)
      .values({
        name: 'Çankaya',
        provincePlateCode: ankara.plateCode,
      })
      .returning();

    console.log(
      `Counties created: ${kadikoy.name}, ${besiktas.name}, ${cankaya.name}`,
    );
    console.log('Seeding districts...');

    const [kadikoyCentral] = await db
      .insert(schema.districts)
      .values({
        name: 'Kadıköy Merkez',
        countyId: kadikoy.id,
      })
      .returning();

    const [besiktasCentral] = await db
      .insert(schema.districts)
      .values({
        name: 'Beşiktaş Merkez',
        countyId: besiktas.id,
      })
      .returning();

    const [cankayaCentral] = await db
      .insert(schema.districts)
      .values({
        name: 'Çankaya Merkez',
        countyId: cankaya.id,
      })
      .returning();

    console.log(`Districts created: 3 districts`);

    console.log('Seeding neighborhoods...');
    const neighborhoods = await db
      .insert(schema.neighborhoods)
      .values([
        { name: 'Moda', code: '34710', districtId: kadikoyCentral.id },
        { name: 'Fenerbahçe', code: '34726', districtId: kadikoyCentral.id },
        { name: 'Göztepe', code: '34730', districtId: kadikoyCentral.id },
        { name: 'Bostancı', code: '34744', districtId: kadikoyCentral.id },

        { name: 'Ortaköy', code: '34347', districtId: besiktasCentral.id },
        { name: 'Bebek', code: '34342', districtId: besiktasCentral.id },
        { name: 'Etiler', code: '34337', districtId: besiktasCentral.id },

        { name: 'Kızılay', code: '06420', districtId: cankayaCentral.id },
        { name: 'Çayyolu', code: '06810', districtId: cankayaCentral.id },
        { name: 'Bahçelievler', code: '06490', districtId: cankayaCentral.id },
      ])
      .returning();

    console.log(`Neighborhoods created: ${neighborhoods.length} neighborhoods`);

    console.log('\n Location seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Countries: 1`);
    console.log(`   Provinces: 2`);
    console.log(`   Counties: 3`);
    console.log(`   Districts: 3`);
    console.log(`   Neighborhoods: ${neighborhoods.length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedLocations().catch(console.error);
