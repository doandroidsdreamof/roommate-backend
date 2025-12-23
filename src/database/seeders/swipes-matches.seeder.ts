import 'dotenv/config';
import { ne } from 'drizzle-orm';
import * as schema from '../schema';
import { seederDb as db } from './seed-db-instance';

async function seedSwipesAndMatches() {
  const testUserId = '5a0a2ed6-b674-4fec-a553-979df73dc792';

  // Get 1000 random users
  const users = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(ne(schema.users.id, testUserId))
    .limit(1000);

  // Create 300 swipes (150 left, 150 right)
  const swipes = users.slice(0, 300).map((u, i) => ({
    swiperId: testUserId,
    swipedId: u.id,
    action: (i < 150 ? 'pass' : 'like') as 'pass' | 'like',
  }));

  await db.insert(schema.swipes).values(swipes);

  // Create 50 matches
  const matchUsers = users.slice(300, 350);
  const matches = matchUsers.map((u) => ({
    userFirstId: testUserId < u.id ? testUserId : u.id,
    userSecondId: testUserId < u.id ? u.id : testUserId,
  }));

  await db.insert(schema.matches).values(matches);

  // Create 20 blocks
  const blockUsers = users.slice(350, 370);
  const blocks = blockUsers.map((u) => ({
    blockerId: testUserId,
    blockedId: u.id,
  }));

  await db.insert(schema.userBlocks).values(blocks);

  console.log('Seeded: 300 swipes, 50 matches, 20 blocks');
}

seedSwipesAndMatches().catch(console.error);
