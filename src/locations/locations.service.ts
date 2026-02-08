import { Inject, Injectable } from '@nestjs/common';
import { eq, ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { REDIS_TTL } from 'src/constants/redis-ttl.config';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { CacheKeys } from 'src/redis/cache-keys';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LocationsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly redis: RedisService,
  ) {}

  async getNeighborhoodsByDistrict(districtId: number) {
    const cacheKey = CacheKeys.neighborhoodsByDistrict(districtId.toString());

    const cached = await this.redis.getJSON(cacheKey);
    if (cached) {
      return cached;
    }

    const neighborhoods = await this.db.query.neighborhoods.findMany({
      where: eq(schema.neighborhoods.districtId, districtId),
      orderBy: (neighborhoods, { asc }) => [asc(neighborhoods.name)],
    });

    await this.redis.setJSONWithExpiry(
      cacheKey,
      neighborhoods,
      REDIS_TTL.NEIGHBORHOODS,
    );

    return neighborhoods;
  }

  async getProvinces() {
    const cacheKey = CacheKeys.provinces();

    const cached =
      await this.redis.getJSON<(typeof schema.provinces.$inferSelect)[]>(
        cacheKey,
      );
    if (cached) {
      return cached;
    }

    const provinces = await this.db.query.provinces.findMany({
      orderBy: (provinces, { asc }) => [asc(provinces.name)],
    });
    await this.redis.setJSONWithExpiry(
      cacheKey,
      provinces,
      REDIS_TTL.PROVINCES,
    );

    return provinces;
  }
  async getDistrictsByProvince(provinceId: number) {
    const cacheKey = CacheKeys.districtsByProvince(provinceId?.toString());

    const cached = await this.redis.getJSON(cacheKey);
    if (cached) {
      return cached;
    }

    const districts = await this.db.query.counties.findMany({
      where: eq(schema.counties.provincePlateCode, provinceId),
    });

    await this.redis.setJSONWithExpiry(
      cacheKey,
      districts,
      REDIS_TTL.DISTRICTS,
    );

    return districts;
  }
  async searchNeighborhoods(query: string, limit = 20) {
    return await this.db.query.neighborhoods.findMany({
      where: ilike(schema.neighborhoods.name, `%${query}%`), // TODO review here
      with: {
        district: {
          with: {
            county: {
              with: {
                province: true,
              },
            },
          },
        },
      },
      limit,
    });
  }
}
