import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from '../mail/email.service';
import { OtpService } from './services/otp.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let emailService: EmailService;
  let otpService: OtpService;
  let usersService: UsersService;
  let tokenService: TokenService;

  const refreshToken =
    'c8a8437677fcfab679f92c8470ffc34b932f5aaa3296c09f652d2becfe1db8b2';
  const accessToken = 'mock-access-token-jwt';
  const mockEmailService = {
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockOtpService = {
    generateOTP: jest.fn(),
    insertOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    getUsername: jest.fn(),
    findById: jest.fn(),
  };

  const mockTokenService = {
    createAccessToken: jest.fn(),
    createRefreshToken: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    otpService = module.get<OtpService>(OtpService);
    usersService = module.get<UsersService>(UsersService);
    tokenService = module.get<TokenService>(TokenService);
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should generate OTP and send email', async () => {
      // Arrange
      const optDtoWithEmail = { email: 'test@gmail.com' };
      mockOtpService.generateOTP.mockReturnValue('123456');
      mockOtpService.insertOtp.mockResolvedValue('123456');
      mockUsersService.getUsername.mockResolvedValue('John');
      // Act
      await authService.sendOtp(optDtoWithEmail);
      // Assert
      expect(mockOtpService.generateOTP).toHaveBeenCalledTimes(1);
      expect(mockOtpService.insertOtp).toHaveBeenCalledWith(
        'test@gmail.com',
        '123456',
      );
    });
  });

  describe('authenticate', () => {
    it('should authenticate existing user with valid OTP', async () => {
      // Arrange
      const optDto = { email: 'test@gmail.com', otp: '123456' };
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockTokenService.createRefreshToken.mockResolvedValue(refreshToken);
      mockTokenService.createAccessToken.mockReturnValue(accessToken);
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        isActive: true,
        email: optDto.email,
      });
      // Act
      const result = await authService.authenticate(optDto);
      // Assert
      expect(result).toEqual({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    });
    it('should create new user if not exists', async () => {
      // Arrange
      const optDto = { email: 'test@gmail.com', otp: '123456' };
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockTokenService.createRefreshToken.mockResolvedValue(refreshToken);
      mockTokenService.createAccessToken.mockReturnValue(accessToken);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(optDto);

      // Act
      await authService.authenticate(optDto);
      // Assert
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        'test@gmail.com',
      );
    });
    it('should throw UnauthorizedException for invalid OTP', async () => {
      // Arrange
      const optDto = { email: 'test@gmail.com', otp: '123456' };
      mockOtpService.verifyOtp.mockResolvedValue(false);
      // Assert
      await expect(authService.authenticate(optDto)).rejects.toThrow(
        new UnauthorizedException('Invalid OTP'),
      );
    });
  });
});
