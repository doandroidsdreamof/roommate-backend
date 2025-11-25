import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';

describe('OtpService', () => {
  let service: OtpService;

  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ code: '123456' }]),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    jest.clearAllMocks();
  });

  it('should return false when max attempts reached', async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        identifier: 'test@example.com',
        code: '123456',
        status: 'pending',
        attemptsCount: 3,
        maxAttempts: 3,
      },
    ]);

    const result = await service.verifyOtp('test@example.com', '123456');

    expect(result).toBe(false);
  });
  it('should return length as six', () => {
    const result = service.generateOTP();
    expect(result.length).toBe(6);
  });
  it('should have >97% uniqueness in 50k samples', () => {
    const ITERATIONS = 50000; //* Sample size
    const otpSet = new Set();
    for (let i = 0; i < ITERATIONS; i++) {
      otpSet.add(service.generateOTP());
    }
    const uniquenessRatio = otpSet.size / ITERATIONS; //* lower value => more collisions
    expect(uniquenessRatio).toBeGreaterThan(0.97);
  });
  it('should generate only numeric digits', () => {
    const otp = service.generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });
});
