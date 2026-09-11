import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './database/drizzle.module';
import { EmailModule } from './mail/email.module';
import { UsersModule } from './users/users.module';
import { PostingsModule } from './postings/postings.module';
import { LocationsModule } from './locations/locations.module';
import { RedisModule } from './redis/redis.module';
import { FeedsModule } from './feeds/feeds.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { WebsocketModule } from './websocket/websocket.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    AuthModule,
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: Number(configService.get<string>('SMTP_PORT')),
          secure:
            configService.get<string>('NODE_ENV') === 'production'
              ? true
              : false,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM'),
        },
      }),
    }),
    EmailModule,
    MessagingModule,
    PostingsModule,
    LocationsModule,
    WebsocketModule,
    RedisModule,
    FeedsModule,
    SwipesModule,
    MatchesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
