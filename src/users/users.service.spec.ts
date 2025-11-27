import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { UsersService } from './users.service';
import { ProfileService } from './services/profile.service';
import { PreferenceService } from './services/preference.service';

describe('UsersService - validateUserExists', () => {
  let service: UsersService;
  const mockDb = {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DrizzleAsyncProvider, useValue: mockDb },
        { provide: ProfileService, useValue: {} },
        { provide: PreferenceService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);

    await expect(service['validateUserExists']('1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
