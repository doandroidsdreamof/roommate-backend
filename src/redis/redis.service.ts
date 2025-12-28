import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    super({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.on('error', (err) => this.logger.error('Redis Error:', err));
    this.on('connect', () => this.logger.log('Redis connected'));
  }

  onModuleDestroy() {
    return this.quit();
  }
}
