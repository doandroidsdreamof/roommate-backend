import { Test } from '@nestjs/testing';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { MatchesService } from 'src/matches/matches.service';
import { RedisService } from 'src/redis/redis.service';
import { PreferenceService } from 'src/users/services/preference.service';
import { ProfileService } from 'src/users/services/profile.service';
import { UsersService } from 'src/users/users.service';
import { testDB } from '../test/test-db.helper';
import { SwipesService } from './swipes.service';
import { eq } from 'drizzle-orm';
import * as schema from 'src/database/schema';

describe('SwipesService', () => {
  let swipesService: SwipesService;
  let userService: UsersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SwipesService,
        UsersService,
        MatchesService,
        ProfileService,
        PreferenceService,
        {
          provide: RedisService,
          useValue: {
            getJSON: jest.fn().mockResolvedValue(null),
            setJSONWithExpiry: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: DrizzleAsyncProvider,
          useValue: testDB.db,
        },
      ],
    }).compile();

    swipesService = module.get<SwipesService>(SwipesService);
    userService = module.get<UsersService>(UsersService);
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('validation', () => {
    it('should throw CANNOT_SWIPE_SELF when userId equals swipedId', async () => {
      const {
        user: { id: userId },
      } = await testDB.factories.users.createWithProfileAndPreferences();
      await expect(
        swipesService.swipeAction(userId, {
          swipedId: userId,
          action: 'pass',
        }),
      ).rejects.toThrow('Cannot swipe on yourself');
    });

    it('should throw SWIPE_TARGET_NOT_FOUND when target user does not exist', async () => {
      const nonExistedTargetUser = 'd3d16a9a-a81e-4d61-8d41-915ae0c42685';
      const {
        user: { id: userId },
      } = await testDB.factories.users.createWithProfileAndPreferences();

      await expect(
        swipesService.swipeAction(userId, {
          swipedId: nonExistedTargetUser,
          action: 'pass',
        }),
      ).rejects.toThrow('User not found');
    });

    it('should throw BLOCKED_USER_INTERACTION when user A blocks user B, and B tries to swipe A', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      // A blocks B
      await userService.blockUser(userA.id, { blockedId: userB.id });

      // B tries to swipe A - should fail
      await expect(
        swipesService.swipeAction(userB.id, {
          swipedId: userA.id,
          action: 'like',
        }),
      ).rejects.toThrow('Cannot interact with blocked user');
    });

    it('should throw BLOCKED_USER_INTERACTION when user A blocks user B, and A tries to swipe B', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      // A blocks B
      await userService.blockUser(userA.id, { blockedId: userB.id });

      // A tries to swipe B - should also fail
      await expect(
        swipesService.swipeAction(userA.id, {
          swipedId: userB.id,
          action: 'like',
        }),
      ).rejects.toThrow('Cannot interact with blocked user');
    });
  });
  describe('swipe recording', () => {
    it('should record PASS action and return matched: false', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      const result = await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'pass',
      });
      expect(result.matched).toBe(false);
      expect(result.swipe.action).toEqual('pass');
    });

    it('should record LIKE action without mutual like and return matched: false', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      const result = await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'like',
      });
      expect(result.matched).toBe(false);
      expect(result.swipe.action).toEqual('like');
    });

    it('should update existing swipe when user changes action (PASS to LIKE)', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'pass',
      });

      const result = await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'like',
      });
      const swipeRecord = await testDB.db.query.swipes.findFirst({
        where: eq(schema.swipes.id, result.swipe.id),
      });
      expect(swipeRecord!.action).toEqual('like');
      expect(result.swipe.action).toEqual('like');
    });

    it('should update existing swipe when user changes action (LIKE to PASS)', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'like',
      });

      const result = await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'pass',
      });
      const swipeRecord = await testDB.db.query.swipes.findFirst({
        where: eq(schema.swipes.id, result.swipe.id),
      });
      expect(swipeRecord!.action).toBe('pass');
      expect(result.swipe.action).toBe('pass');
    });
    it('should create match when user changes PASS to LIKE and mutual like exists', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();

      await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'pass',
      });
      await swipesService.swipeAction(userB.id, {
        swipedId: userA.id,
        action: 'like',
      });
      const result = await swipesService.swipeAction(userA.id, {
        swipedId: userB.id,
        action: 'like',
      });
      expect(result.matched).toBe(true);
    });
  });

  describe('race condition prevention', () => {
    it('should create only ONE match when both users like each other concurrently', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();
      // TODO  research more robust ways
      await Promise.all([
        swipesService.swipeAction(userA.id, {
          swipedId: userB.id,
          action: 'like',
        }),
        swipesService.swipeAction(userB.id, {
          swipedId: userA.id,
          action: 'like',
        }),
      ]);
      const matches = await testDB.db.query.matches.findMany();
      expect(matches.length).toBe(1);
    });

    it('should handle concurrent swipes without creating duplicate swipes', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userB } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const functionList = Array.from({ length: 10 }, () =>
        swipesService.swipeAction(userA.id, {
          swipedId: userB.id,
          action: 'like',
        }),
      );

      const results = await Promise.all(functionList);

      // All requests completed successfully
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.swipe).toBeDefined();
      });

      // But only ONE swipe in database
      const swipes = await testDB.db.query.swipes.findMany();
      expect(swipes.length).toBe(1);
    });
  });

  describe('database constraints', () => {
    it('should prevent self-swipe at database level (CHECK constraint)', async () => {
      const { user: userA } =
        await testDB.factories.users.createWithProfileAndPreferences();

      await expect(
        testDB.db
          .insert(schema.swipes)
          .values({ swipedId: userA.id, swiperId: userA.id, action: 'like' }),
      ).rejects.toThrow();
    });
  });
});
