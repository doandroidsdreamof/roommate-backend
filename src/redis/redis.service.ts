import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

// TODO test error handling after creating global exception filter
//* encapsulation may works here to protect default implementation
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

  async getJSON<T>(key: string): Promise<T | null> {
    if (typeof key !== 'string') {
      throw new Error(`Redis key must be a string, received: ${typeof key}`);
    }

    const cached = await this.get(key);
    if (!cached) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return JSON.parse(cached) as T;
  }

  async setJSONWithExpiry<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    if (typeof key !== 'string') {
      throw new Error(`Redis key must be a string, received: ${typeof key}`);
    }

    if (value === null || value === undefined) {
      throw new Error(`Cannot cache null or undefined value for key: ${key}`);
    }

    const serialized = JSON.stringify(value);
    await this.setex(key, ttlSeconds, serialized);

    this.logger.debug(`Cached key: ${key} with TTL: ${ttlSeconds}s`);
  }

  onModuleDestroy() {
    return this.quit();
  }
}
