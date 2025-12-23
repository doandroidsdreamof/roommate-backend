import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../schema';
import { seederDb as db } from './seed-db-instance';

interface Neighborhood {
  name: string;
  code: string;
}

interface District {
  name: string;
  neighborhoods: Neighborhood[];
}

interface County {
  name: string;
  districts: District[];
}

interface Province {
  name: string;
  counties: County[];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const locationData: Province[] = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../../districts/districts.json'),
    'utf-8',
  ),
);

const PLATE_CODES: Record<string, number> = {
  ADANA: 1,
  ADIYAMAN: 2,
  AFYONKARAHİSAR: 3,
  AĞRI: 4,
  AMASYA: 5,
  ANKARA: 6,
  ANTALYA: 7,
  ARTVİN: 8,
  AYDIN: 9,
  BALIKESİR: 10,
  BİLECİK: 11,
  BİNGÖL: 12,
  BİTLİS: 13,
  BOLU: 14,
  BURDUR: 15,
  BURSA: 16,
  ÇANAKKALE: 17,
  ÇANKIRI: 18,
  ÇORUM: 19,
  DENİZLİ: 20,
  DİYARBAKIR: 21,
  EDİRNE: 22,
  ELAZIĞ: 23,
  ERZİNCAN: 24,
  ERZURUM: 25,
  ESKİŞEHİR: 26,
  GAZİANTEP: 27,
  GİRESUN: 28,
  GÜMÜŞHANE: 29,
  HAKKARİ: 30,
  HATAY: 31,
  ISPARTA: 32,
  MERSİN: 33,
  İSTANBUL: 34,
  İZMİR: 35,
  KARS: 36,
  KASTAMONU: 37,
  KAYSERİ: 38,
  KIRKLARELİ: 39,
  KIRŞEHİR: 40,
  KOCAELİ: 41,
  KONYA: 42,
  KÜTAHYA: 43,
  MALATYA: 44,
  MANİSA: 45,
  KAHRAMANMARAŞ: 46,
  MARDİN: 47,
  MUĞLA: 48,
  MUŞ: 49,
  NEVŞEHİR: 50,
  NİĞDE: 51,
  ORDU: 52,
  RİZE: 53,
  SAKARYA: 54,
  SAMSUN: 55,
  SİİRT: 56,
  SİNOP: 57,
  SİVAS: 58,
  TEKİRDAĞ: 59,
  TOKAT: 60,
  TRABZON: 61,
  TUNCELİ: 62,
  ŞANLIURFA: 63,
  UŞAK: 64,
  VAN: 65,
  YOZGAT: 66,
  ZONGULDAK: 67,
  AKSARAY: 68,
  BAYBURT: 69,
  KARAMAN: 70,
  KIRIKKALE: 71,
  BATMAN: 72,
  ŞIRNAK: 73,
  BARTIN: 74,
  ARDAHAN: 75,
  IĞDIR: 76,
  YALOVA: 77,
  KARABÜK: 78,
  KİLİS: 79,
  OSMANİYE: 80,
  DÜZCE: 81,
};

async function seedLocations() {
  try {
    console.log('Creating Turkey...');
    // clearLocationData().catch(console.error);

    const [turkey] = await db
      .insert(schema.countries)
      .values({
        name: 'Turkey',
        code: 'TR',
      })
      .returning();

    console.log(`Country created: ${turkey.name}\n`);

    for (const provinceData of locationData) {
      console.log(`Processing: ${provinceData.name}`);

      const plateCode = PLATE_CODES[provinceData.name];

      const [province] = await db
        .insert(schema.provinces)
        .values({
          name: provinceData.name,
          plateCode: plateCode,
          countryId: turkey.id,
        })
        .returning();

      for (const countyData of provinceData.counties) {
        const [county] = await db
          .insert(schema.counties)
          .values({
            name: countyData.name,
            provincePlateCode: province.plateCode,
          })
          .returning();

        for (const districtData of countyData.districts) {
          const [district] = await db
            .insert(schema.districts)
            .values({
              name: districtData.name,
              countyId: county.id,
            })
            .returning();

          const neighborhoodValues = districtData.neighborhoods.map((n) => ({
            name: n.name,
            postalCode: n.code,
            districtId: district.id,
          }));

          await db.insert(schema.neighborhoods).values(neighborhoodValues);
        }
      }

      console.log(`  ✓ ${provinceData.name} completed`);
    }

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

seedLocations().catch(console.error);
