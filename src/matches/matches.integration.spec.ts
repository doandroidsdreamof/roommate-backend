import { Test } from '@nestjs/testing';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { testDB } from '../test/test-db.helper';
import * as schema from 'src/database/schema';
import { MatchesService } from './matches.service';
import { and, eq, or } from 'drizzle-orm';

describe('MatchesService', () => {
  let matchesService: MatchesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: DrizzleAsyncProvider,
          useValue: testDB.db,
        },
      ],
    }).compile();

    matchesService = module.get<MatchesService>(MatchesService);
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('insertMatch', () => {
    it('should return undefined when match already exists (onConflictDoNothing)', async () => {
      const { user: userFirst } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userSecond } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await matchesService.insertMatch(userFirst.id, userSecond.id);
      await expect(
        matchesService.insertMatch(userFirst.id, userSecond.id),
      ).resolves.toBe(undefined);
    });
    it('should store user IDs in sorted order regardless of input order', async () => {
      const { user: userFirst } =
        await testDB.factories.users.createWithProfileAndPreferences();

      const { user: userSecond } =
        await testDB.factories.users.createWithProfileAndPreferences();

      const result = await matchesService.insertMatch(
        userFirst.id,
        userSecond.id,
      );
      const [first, second] = [userFirst.id, userSecond.id].sort();

      expect(result!.userFirstId).toBe(first);
      expect(result!.userSecondId).toBe(second);
    });
    it('should handle concurrent creation (only one match created)', async () => {
      const { user: userFirst } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userSecond } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const functionList = Array.from({ length: 20 }, (_, index) => {
        if (index % 2 === 0) {
          return matchesService.insertMatch(userFirst.id, userSecond.id);
        } else {
          return matchesService.insertMatch(userSecond.id, userFirst.id);
        }
      });
      const results = await Promise.all(functionList);

      expect(results).toHaveLength(20);
      const matchRecord = await testDB.db.query.matches.findMany({
        where: and(
          or(
            and(
              eq(schema.matches.userFirstId, userFirst.id),
              eq(schema.matches.userSecondId, userSecond.id),
            ),
            and(
              eq(schema.matches.userFirstId, userSecond.id),
              eq(schema.matches.userSecondId, userFirst.id),
            ),
          ),
        ),
      });
      expect(matchRecord.length).toBe(1);
    });
  });

  describe('unmatch', () => {
    describe('success cases', () => {
      it('should successfully unmatch when user is userFirstId', async () => {
        const { user: userFirst } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userSecond } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const matchRecord = await matchesService.insertMatch(
          userFirst.id,
          userSecond.id,
        );

        await expect(
          matchesService.unmatch(userFirst.id, matchRecord!.id),
        ).resolves.toEqual({ message: 'Unmatched' });
      });

      it('should successfully unmatch when user is userSecondId', async () => {
        const { user: userFirst } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userSecond } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const matchRecord = await matchesService.insertMatch(
          userFirst.id,
          userSecond.id,
        );

        await expect(
          matchesService.unmatch(userSecond.id, matchRecord!.id),
        ).resolves.toEqual({ message: 'Unmatched' });
      });

      it('should set unmatchedAt to current timestamp', async () => {
        const { user: userFirst } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userSecond } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const matchRecord = await matchesService.insertMatch(
          userFirst.id,
          userSecond.id,
        );

        const before = new Date();
        await matchesService.unmatch(userFirst.id, matchRecord!.id);
        const after = new Date();

        const [match] = await testDB.db.query.matches.findMany({
          where: eq(schema.matches.id, matchRecord!.id),
        });
        expect(match).toBeDefined();

        const unmatchedTime = new Date(match.unmatchedAt ?? '').getTime();
        expect(unmatchedTime).toBeGreaterThanOrEqual(before.getTime());
        expect(unmatchedTime).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('error cases', () => {
      it('should throw MATCH_NOT_FOUND when user is not part of match (authorization)', async () => {
        const { user: userFirst } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userSecond } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userThird } =
          await testDB.factories.users.createWithProfileAndPreferences();

        const matchRecord = await matchesService.insertMatch(
          userFirst.id,
          userSecond.id,
        );
        await expect(
          matchesService.unmatch(userThird.id, matchRecord!.id),
        ).rejects.toThrow('Match not found or already unmatched');
      });

      it('should throw MATCH_NOT_FOUND when match already unmatched', async () => {
        const { user: userFirst } =
          await testDB.factories.users.createWithProfileAndPreferences();
        const { user: userSecond } =
          await testDB.factories.users.createWithProfileAndPreferences();

        const matchRecord = await matchesService.insertMatch(
          userFirst.id,
          userSecond.id,
        );
        await matchesService.unmatch(userFirst.id, matchRecord!.id);

        await expect(
          matchesService.unmatch(userFirst.id, matchRecord!.id),
        ).rejects.toThrow('Match not found or already unmatched');
      });
    });
  });
});
