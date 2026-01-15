import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly enabled = process.env.REDIS_ENABLED === 'true';

  constructor() {
    super({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
    });

    if (this.enabled) {
      this.connect().catch((err) =>
        this.logger.error('Redis connection failed:', err),
      );
      this.on('error', (err) => this.logger.error('Redis Error:', err));
      this.on('connect', () => this.logger.log('Redis connected'));
    } else {
      this.logger.warn('Redis is DISABLED');
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.enabled) return;
    await this.del(key);
    this.logger.debug(`Cache invalidated for key: ${key}`);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

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
    if (!this.enabled) return;

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
    if (this.enabled) {
      return this.quit();
    }
  }
}
