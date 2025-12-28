import { Test } from '@nestjs/testing';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { testDB } from '../test/test-db.helper';
import { PreferenceService } from './services/preference.service';
import { ProfileService } from './services/profile.service';
import { UsersService } from './users.service';
import { DomainException } from 'src/exceptions/domain.exception';
import { eq } from 'drizzle-orm';
import * as schema from 'src/database/schema';

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

  it('should throw USER_NOT_FOUND for non-existent user', async () => {
    await expect(
      testableService.testValidateUserExists(
        '1a657aca-00f4-4cdc-852b-6363a72d17fd',
      ),
    ).rejects.toThrow(DomainException);
  });

  it('should not throw when user exists', async () => {
    const user = await testableService.createUser('test@example.com');
    await expect(
      testableService.testValidateUserExists(user.id),
    ).resolves.toBeUndefined();
  });
  it('should not allow negative posting count when decrementing', async () => {
    const user = await testableService.createUser('test@example.com');
    await testableService.decrementPostingCount(user.id);

    const updatedUser = await testDB.db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
    });

    expect(updatedUser.postingCount).toBe(0);
  });

  it('should throw BOOKMARK_NOT_FOUND when trying to unbookmark a posting that was never bookmarked', async () => {
    // TODO entity factory for tests
    const user = await testableService.createUser('test@example.com');
    const [posting] = await testDB.db
      .insert(schema.postings)
      .values({
        userId: user.id,
        title: 'Test Posting',
        type: 'looking_for_roommate',
        city: 'Istanbul',
        coverImageUrl: '',
        district: 'Kadikoy',
        neighborhoodId: 1,
        latitude: '41.0082',
        longitude: '28.9784',
        rentAmount: 5000,
        roomCount: 2,
        bathroomCount: 1,
        squareMeters: 80,
        isFurnished: true,
        preferredRoommateGender: 'female_only',
        availableFrom: new Date(),
      })
      .returning();

    await expect(
      testableService.unbookmarkPosting(user.id, {
        postingId: posting.id,
      }),
    ).rejects.toThrow(DomainException);
  });
});
