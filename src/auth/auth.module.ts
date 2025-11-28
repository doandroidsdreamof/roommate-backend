import { Module } from '@nestjs/common';
import { EmailModule } from 'src/mail/email.module';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './services/token.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    EmailModule,
    UsersModule,
    DrizzleModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') === 'development';

        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: isDev ? '365d' : '4h', // 1 year in dev
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService],
  exports: [JwtModule],
})
export class AuthModule {}
