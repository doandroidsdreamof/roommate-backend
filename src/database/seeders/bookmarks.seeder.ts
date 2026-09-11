import * as schema from '../schema';
import { UserBookmark } from '../schema';
import { seederDb as db } from './seed-db-instance';

async function seedBookmarks() {
  const [user] = await db!
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1);

  const [posting] = await db!
    .select({ id: schema.postings.id })
    .from(schema.postings)
    .limit(1);

  if (!user || !posting) {
    throw new Error('Seed users and postings first');
  }

  const userId = user.id;
  const postingId = posting.id;
  const bookmarks = [];
  const now = new Date();

  for (let i = 1; i <= 500; i++) {
    const timestamp = new Date(now.getTime() - i * 1000);
    bookmarks.push({
      userId,
      postingId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  for (let i = 0; i < bookmarks.length; i += 100) {
    const batch = bookmarks.slice(i, i + 100);
    await db!.insert(schema.userBookmarks).values(batch as UserBookmark[]);
    console.log(`Inserted batch ${i / 100 + 1}`);
  }

  console.log('Done => Inserted 500 bookmarks');
}

void seedBookmarks();
