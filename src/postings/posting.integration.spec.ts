import { Test } from '@nestjs/testing';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { testDB } from '../test/test-db.helper';
import * as schema from 'src/database/schema';
import { PostingsService } from './postings.service';
import { UsersService } from 'src/users/users.service';
import { ProfileService } from 'src/users/services/profile.service';
import { PreferenceService } from 'src/users/services/preference.service';
import { RedisService } from 'src/redis/redis.service';
import { ForbiddenException } from '@nestjs/common';
import {
  createPostingTestDto,
  ICreatePostingTestDto,
} from 'src/constants/testData';
import { eq } from 'drizzle-orm';

describe('PostingsService', () => {
  let postingsService: PostingsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostingsService,
        UsersService,
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

    postingsService = module.get<PostingsService>(PostingsService);
    await testDB.seedLocations();
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('create', () => {
    it('should rollback transaction if specs insertion fails', async () => {
      const { user } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await expect(
        postingsService.create(user!.id, createPostingTestDto),
      ).rejects.toThrow('Failed to create posting');

      const postings = await testDB.db.select().from(schema.postings);
      expect(postings).toHaveLength(0);

      const specs = await testDB.db.select().from(schema.postingSpecs);
      expect(specs).toHaveLength(0);

      const updatedUser = await testDB.db.query.users.findFirst({
        where: eq(schema.users.id, user!.id),
      });
      expect(updatedUser!.postingCount).toBe(0);
    });

    it('should throw MAX_POSTINGS_REACHED when user has 2 active postings', async () => {
      const { user } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await testDB.factories.postings.createMultiple(user!.id, 2);
      const dtoCopy = JSON.parse(
        JSON.stringify(createPostingTestDto),
      ) as ICreatePostingTestDto;
      dtoCopy.specs.description = 'prevent constraing';
      dtoCopy.neighborhoodId = 1;

      await expect(postingsService.create(user!.id, dtoCopy)).rejects.toThrow(
        'You have reached the maximum limit of 2 active postings',
      );
    });

    it('should throw DUPLICATE_POSTING for same user in same neighborhood', async () => {
      const { user } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await testDB.factories.postings.createMultiple(user!.id, 1);
      const dtoCopy = JSON.parse(
        JSON.stringify(createPostingTestDto),
      ) as ICreatePostingTestDto;
      await expect(postingsService.create(user!.id, dtoCopy)).rejects.toThrow(
        'You already have an active posting in this neighborhood',
      );
    });
  });

  describe('update', () => {
    it('should throw FORBIDDEN when non-owner tries to update posting', async () => {
      const { user: attacker } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const { user: userSecond } =
        await testDB.factories.users.createWithProfileAndPreferences();
      const posting = await testDB.factories.postings.create(userSecond!.id);
      await expect(
        postingsService.update(attacker!.id, posting!.id, { rentAmount: 200 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /*   describe('updatePostingsImages', () => {
    it('should throw FORBIDDEN when non-owner tries to update images', async () => {});

    it('should correctly merge new URLs preserving existing images', async () => {});

    it('should return "No changes detected" when URLs are identical', async () => {});
  });

  describe('closePosting', () => {
    it('should throw FORBIDDEN when non-owner tries to close posting', async () => {});

    it('should throw POSTING_ALREADY_CLOSED when closing already-closed posting', async () => {});

    it('should allow new posting in same neighborhood after closing previous', async () => {});
  }); */
});
