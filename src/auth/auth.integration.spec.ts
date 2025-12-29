import { MailerService } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { EmailService } from 'src/mail/email.service';
import { PreferenceService } from 'src/users/services/preference.service';
import { ProfileService } from 'src/users/services/profile.service';
import { UsersService } from 'src/users/users.service';
import { testDB } from '../test/test-db.helper';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { VERIFICATION_STATUS } from 'src/constants/enums';
import { RedisService } from 'src/redis/redis.service';

describe('AuthService', () => {
  let authService: AuthService;
  let tokenService: TokenService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET'),
            signOptions: {
              expiresIn: '4h',
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        OtpService,
        TokenService,
        UsersService,
        ProfileService,
        PreferenceService,
        EmailService,
        {
          provide: RedisService,
          useValue: {
            getJSON: jest.fn().mockResolvedValue(null), //* Always cache miss
            setJSONWithExpiry: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DrizzleAsyncProvider,
          useValue: testDB.db,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('authenticate', () => {
    it('should authenticate with valid OTP for existing user', async () => {
      const { user } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await authService.sendOtp({ email: user.email });
      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, user.email),
        columns: {
          code: true,
        },
      });

      const result = await authService.authenticate({
        otp,
        email: user.email,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken.split('.').length).toBe(3); // JWT has 3 parts
      expect(result.refreshToken.length).toBeGreaterThan(32); // Hex string
    });
    it('should create new user and authenticate on first-time login', async () => {
      const email = 'test-2@gmail.com';

      await authService.sendOtp({ email });
      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: {
          code: true,
        },
      });
      await authService.authenticate({ email, otp });
      const user = await testDB.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(true);
      expect(user.email).toMatch(email);
    });

    it('should throw INVALID_OTP when OTP is wrong', async () => {
      const email = 'test@example.com';

      await authService.sendOtp({ email });

      await expect(
        authService.authenticate({ email, otp: '99999x' }),
      ).rejects.toThrow('Invalid OTP code');
    });
  });
  describe('Token Refresh', () => {
    it('should issue new access token with valid refresh token', async () => {
      const email = 'test-refresh-token@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });
      const { refreshToken } = await authService.authenticate({ email, otp });
      const result = await authService.refreshToken({
        refreshToken,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.accessToken.split('.').length).toBe(3);
    });

    it('should reject refresh with revoked token', async () => {
      const email = 'test-refresh-token-revoke@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });
      const { refreshToken } = await authService.authenticate({ email, otp });
      const { id: userId } = await testDB.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      await tokenService.revokeRefreshToken(refreshToken, userId);
      await expect(authService.refreshToken({ refreshToken })).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
    it('should reject refresh with expired token', async () => {
      const email = 'test-refresh-token-expired@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });
      const { refreshToken } = await authService.authenticate({ email, otp });
      const { id: userId } = await testDB.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      await testDB.db
        .update(schema.refreshToken)
        .set({
          expiresAt: sql`NOW() AT TIME ZONE 'UTC'`,
        })
        .where(eq(schema.refreshToken.userId, userId));

      await expect(authService.refreshToken({ refreshToken })).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });
  describe('OTP', () => {
    it('should reject already-used OTP (status = VERIFIED)', async () => {
      const email = 'test-verified@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });
      await authService.authenticate({ email, otp });

      const { status: tokenStatus } =
        await testDB.db.query.verifications.findFirst({
          where: eq(schema.verifications.identifier, email),
          columns: { status: true },
        });
      expect(tokenStatus).toMatch(VERIFICATION_STATUS.VERIFIED);
      await expect(authService.authenticate({ email, otp })).rejects.toThrow(
        'Invalid OTP code',
      );
    });

    it('should reject expired OTP even if code is correct', async () => {
      const email = 'test-expired@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });

      expect(otp).toBeDefined();

      // Expire it
      await testDB.db
        .update(schema.verifications)
        .set({
          codeExpiresAt: sql`NOW() AT TIME ZONE 'UTC'`,
        })
        .where(eq(schema.verifications.identifier, email));

      // Should fail
      await expect(authService.authenticate({ email, otp })).rejects.toThrow(
        'Expired OTP code',
      );
    });
  });
  describe('Logout', () => {
    it('should successfully logout with valid token', async () => {
      const email = 'test-logout-success@gmail.com';

      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });

      const { refreshToken } = await authService.authenticate({ email, otp });

      const { id: userId } = await testDB.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      await expect(
        authService.logout({ refreshToken }, userId),
      ).resolves.toMatchObject({
        message: 'Logged out successfully',
      });
    });

    it('should reject logout when token belongs to different user', async () => {
      const email = 'cross-user-token-authorization@gmail.com';
      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });

      const { refreshToken } = await authService.authenticate({ email, otp });
      const { user: evilUser } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await expect(
        authService.logout({ refreshToken }, evilUser.id),
      ).rejects.toThrow('Logout failed');
    });

    it('should reject logout with already revoked token', async () => {
      const email = 'reject-logout@gmail.com';
      await authService.sendOtp({ email });

      const { code: otp } = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, email),
        columns: { code: true },
      });

      const { refreshToken } = await authService.authenticate({ email, otp });
      const { id: userId } = await testDB.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      await tokenService.revokeRefreshToken(refreshToken, userId);
      await expect(
        authService.logout({ refreshToken }, userId),
      ).rejects.toThrow('Logout failed');
    });
  });
});
