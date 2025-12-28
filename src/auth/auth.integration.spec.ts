import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { testDB } from '../test/test-db.helper';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/mail/email.service';
import { ProfileService } from 'src/users/services/profile.service';
import { PreferenceService } from 'src/users/services/preference.service';
import { MailerService } from '@nestjs-modules/mailer';
import { eq } from 'drizzle-orm';
import * as schema from 'src/database/schema';

describe('AuthService', () => {
  let authService: AuthService;

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
  });

  beforeEach(async () => {
    await testDB.clean();
  });

  describe('authenticate', () => {
    it('should authenticate with valid OTP for existing user', async () => {
      const { user } =
        await testDB.factories.users.createWithProfileAndPreferences();
      await authService.sendOtp({ email: user.email });
      const otpCode = await testDB.db.query.verifications.findFirst({
        where: eq(schema.verifications.identifier, user.email),
        columns: {
          code: true,
        },
      });
      // - Returns both tokens
      const result = await authService.authenticate({
        otp: otpCode.code,
        email: user.email,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
    it('should throw INVALID_OTP when OTP is wrong', async () => {
      const email = 'test@example.com';

      await authService.sendOtp({ email });

      await expect(
        authService.authenticate({ email, otp: '99999x' }),
      ).rejects.toThrow('Invalid OTP code');
    });
  });
});
