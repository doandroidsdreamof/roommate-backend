import * as schema from '../schema';
import { UserBookmark } from '../schema';
import { seederDb as db } from './seed-db-instance';

async function seedBookmarks() {
  const userId = '5a0a2ed6-b674-4fec-a553-979df73dc792';
  const postingId = '8e385c2c-b693-4389-82e6-961c808b9a96';
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
