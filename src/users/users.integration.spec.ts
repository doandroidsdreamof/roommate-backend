import { Test } from '@nestjs/testing';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { testDB } from '../test/test-db.helper';
import { PreferenceService } from './services/preference.service';
import { ProfileService } from './services/profile.service';
import { UsersService } from './users.service';
import { eq } from 'drizzle-orm';
import * as schema from 'src/database/schema';

//* wrapper for accessing protected method
class TestableUsersService extends UsersService {
  public testValidateUserExists(userId: string) {
    return this.validateUserExists(userId);
  }
}

describe('UsersService', () => {
  let testableService: TestableUsersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TestableUsersService,
        ProfileService,
        PreferenceService,
        {
          provide: DrizzleAsyncProvider,
          useValue: testDB.db,
        },
      ],
    }).compile();

    testableService = module.get<TestableUsersService>(TestableUsersService);
    await testDB.seedLocations();
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('isBlockedRelationship', () => {
    it('should return true when user A blocked user B', async () => {
      const { user: userA } = await testDB.factories.users.createWithProfile();
      const { user: userB } = await testDB.factories.users.createWithProfile();
      await testableService.blockUser(userA.id, {
        blockedId: userB.id,
      });

      await expect(
        testableService.isBlockedRelationship(userA.id, userB.id),
      ).resolves.toBe(true);
    });

    it('should return true when checking reverse direction after A blocked B', async () => {
      const { user: userA } = await testDB.factories.users.createWithProfile();
      const { user: userB } = await testDB.factories.users.createWithProfile();
      await testableService.blockUser(userA.id, {
        blockedId: userB.id,
      });

      await expect(
        testableService.isBlockedRelationship(userB.id, userA.id),
      ).resolves.toBe(true);
    });

    it('should return false when no block relationship exists', async () => {
      const { user: userA } = await testDB.factories.users.createWithProfile();
      const { user: userB } = await testDB.factories.users.createWithProfile();
      await expect(
        testableService.isBlockedRelationship(userB.id, userA.id),
      ).resolves.toBe(false);
    });
  });

  describe('blockUser', () => {
    it('should throw BLOCK_ALREADY_EXISTS', async () => {
      const { user } = await testDB.factories.users.createWithProfile();
      const { user: blockedUser } =
        await testDB.factories.users.createWithProfile();
      await testableService.blockUser(user.id, {
        blockedId: blockedUser.id,
      });
      await expect(
        testableService.blockUser(user.id, { blockedId: blockedUser.id }),
      ).rejects.toThrow('User is already blocked');
    });

    it('should throw CANNOT_BLOCK_SELF', async () => {
      const { user } = await testDB.factories.users.createWithProfile();

      await expect(
        testableService.blockUser(user.id, {
          blockedId: user.id,
        }),
      ).rejects.toThrow('Cannot block yourself');
    });
    it('should successfully block a user', async () => {
      const { user } = await testDB.factories.users.createWithProfile();
      const { user: blockedUser } =
        await testDB.factories.users.createWithProfile();
      const result = await testableService.blockUser(user.id, {
        blockedId: blockedUser.id,
      });

      expect(result).toMatchObject({
        message: 'User blocked successfully',
      });
    });
  });

  describe('decrementPostingCount', () => {
    it('should prevent posting count from going negative', async () => {
      const { user } = await testDB.factories.users.createWithProfile({
        postingCount: 0,
      });

      await testableService.decrementPostingCount(user.id);

      const updatedUser = await testDB.db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      });

      expect(updatedUser.postingCount).toBe(0);
    });
  });

  describe('unbookmarkPosting', () => {
    it('should throw BOOKMARK_NOT_FOUND when bookmark does not exist', async () => {
      const { user } = await testDB.factories.users.createWithProfile();
      const posting = await testDB.factories.postings.create(user.id);

      await expect(
        testableService.unbookmarkPosting(user.id, {
          postingId: posting.id,
        }),
      ).rejects.toThrow('Bookmark not found');
    });

    it('should decrement posting bookmark count', async () => {
      const { user } = await testDB.factories.users.createWithProfile();
      const posting = await testDB.factories.postings.create(user.id);

      await testableService.bookmarkPosting(user.id, {
        postingId: posting.id,
      });

      const bookmarkedPosting = await testDB.db.query.postings.findFirst({
        where: eq(schema.postings.id, posting.id),
      });

      expect(bookmarkedPosting.bookmarkCount).toBe(1);

      await testableService.unbookmarkPosting(user.id, {
        postingId: posting.id,
      });
      const unbookmarkedPosting = await testDB.db.query.postings.findFirst({
        where: eq(schema.postings.id, posting.id),
      });
      expect(unbookmarkedPosting.bookmarkCount).toBe(0);
    });
  });
});
