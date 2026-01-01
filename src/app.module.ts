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
          host: configService.get('SMTP_HOST'),
          port: +configService.get('SMTP_PORT'),
          secure: configService.get('NODE_ENV') === 'production' ? true : false,
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get('SMTP_FROM'),
        },
      }),
    }),
    EmailModule,
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
