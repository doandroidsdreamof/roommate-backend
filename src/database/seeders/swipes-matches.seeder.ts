/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import { fakerTR as faker } from '@faker-js/faker';
import * as schema from '../schema';
import { seederDb as db } from './seed-db-instance';

const USER_BATCH_SIZE = 100; // Process 100 users at a time
const SWIPE_CHUNK_SIZE = 500; // Insert max 500 swipes at once
const TEST_USER_ID = '5a0a2ed6-b674-4fec-a553-979df73dc792';

function getSwipeCount(): number {
  const rand = Math.random();

  if (rand < 0.3) return faker.number.int({ min: 0, max: 20 }); // 30% light users
  if (rand < 0.7) return faker.number.int({ min: 20, max: 100 }); // 40% medium users
  if (rand < 0.95) return faker.number.int({ min: 100, max: 300 }); // 25% heavy users
  return faker.number.int({ min: 300, max: 500 }); // 5% very active
}

function generateAction(): 'pass' | 'like' {
  return Math.random() < 0.35 ? 'like' : 'pass';
}

function shouldMatch(): boolean {
  return Math.random() < 0.2;
}

function getBlockCount(): number {
  const rand = Math.random();
  if (rand < 0.98) return 0;
  if (rand < 0.995) return faker.number.int({ min: 1, max: 3 });
  return faker.number.int({ min: 3, max: 10 });
}

// ============= HELPER: INSERT IN CHUNKS =============

async function insertInChunks<T>(
  data: T[],
  insertFn: (chunk: T[]) => Promise<void>,
  chunkSize: number,
) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await insertFn(chunk);
  }
}

// ============= MAIN SEEDER =============

async function seedSwipesAndMatches() {
  console.log('👥 Loading users...');

  const allUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .orderBy(schema.users.createdAt);

  const totalUsers = allUsers.length;
  console.log(`✓ Loaded ${totalUsers} users\n`);

  // Ensure test user exists in the list
  const testUserExists = allUsers.some((u) => u.id === TEST_USER_ID);
  if (!testUserExists) {
    console.log(`⚠️  Test user ${TEST_USER_ID} not found in database`);
  }

  console.log(`Starting swipe generation...\n`);

  let totalSwipes = 0;
  let totalMatches = 0;
  let totalBlocks = 0;

  // Process users in small batches
  for (
    let batchStart = 0;
    batchStart < totalUsers;
    batchStart += USER_BATCH_SIZE
  ) {
    const userBatch = allUsers.slice(batchStart, batchStart + USER_BATCH_SIZE);

    const swipesBatch: (typeof schema.swipes.$inferInsert)[] = [];
    const matchesBatch: (typeof schema.matches.$inferInsert)[] = [];
    const blocksBatch: (typeof schema.userBlocks.$inferInsert)[] = [];

    for (const user of userBatch) {
      // Give test user more swipes for testing
      const isTestUser = user.id === TEST_USER_ID;
      const swipeCount = isTestUser ? 300 : getSwipeCount();
      const blockCount = isTestUser ? 20 : getBlockCount();

      // Get potential targets (excluding self)
      const potentialTargets = allUsers.filter((u) => u.id !== user.id);

      // Generate swipes
      const swipeTargets = faker.helpers.arrayElements(
        potentialTargets,
        Math.min(swipeCount, potentialTargets.length),
      );

      for (const target of swipeTargets) {
        const action = generateAction();

        swipesBatch.push({
          swiperId: user.id,
          swipedId: target.id,
          action,
        });

        // If like, check if it's a match
        if (action === 'like' && shouldMatch()) {
          const [first, second] =
            user.id < target.id ? [user.id, target.id] : [target.id, user.id];

          matchesBatch.push({
            userFirstId: first,
            userSecondId: second,
          });
        }
      }

      // Generate blocks
      if (blockCount > 0) {
        const blockTargets = faker.helpers.arrayElements(
          potentialTargets,
          Math.min(blockCount, potentialTargets.length),
        );

        for (const blocked of blockTargets) {
          blocksBatch.push({
            blockerId: user.id,
            blockedId: blocked.id,
          });
        }
      }
    }

    // Insert in chunks to avoid stack overflow
    try {
      if (swipesBatch.length > 0) {
        await insertInChunks(
          swipesBatch,
          async (chunk) => {
            await db.insert(schema.swipes).values(chunk).onConflictDoNothing();
          },
          SWIPE_CHUNK_SIZE,
        );
        totalSwipes += swipesBatch.length;
      }

      if (matchesBatch.length > 0) {
        await insertInChunks(
          matchesBatch,
          async (chunk) => {
            await db.insert(schema.matches).values(chunk).onConflictDoNothing();
          },
          SWIPE_CHUNK_SIZE,
        );
        totalMatches += matchesBatch.length;
      }

      if (blocksBatch.length > 0) {
        await insertInChunks(
          blocksBatch,
          async (chunk) => {
            await db
              .insert(schema.userBlocks)
              .values(chunk)
              .onConflictDoNothing();
          },
          SWIPE_CHUNK_SIZE,
        );
        totalBlocks += blocksBatch.length;
      }

      if (
        (batchStart + USER_BATCH_SIZE) % 1000 === 0 ||
        batchStart + USER_BATCH_SIZE >= totalUsers
      ) {
        const progress = (
          ((batchStart + USER_BATCH_SIZE) / totalUsers) *
          100
        ).toFixed(1);
        console.log(
          `📊 Progress: ${Math.min(batchStart + USER_BATCH_SIZE, totalUsers)}/${totalUsers} users (${progress}%) | ` +
            `Swipes: ${totalSwipes} | Matches: ${totalMatches} | Blocks: ${totalBlocks}`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error in batch ${batchStart}-${batchStart + USER_BATCH_SIZE}:`,
        error,
      );
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log(`📊 Final stats:`);
  console.log(`   Swipes: ${totalSwipes}`);
  console.log(`   Matches: ${totalMatches}`);
  console.log(`   Blocks: ${totalBlocks}`);
  console.log(
    `   Avg swipes per user: ${(totalSwipes / totalUsers).toFixed(1)}`,
  );
}

async function main() {
  await seedSwipesAndMatches();
  process.exit(0);
}

main().catch(console.error);
