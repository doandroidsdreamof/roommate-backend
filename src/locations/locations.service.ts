import { Inject, Injectable } from '@nestjs/common';
import { ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class LocationsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getProvinces() {
    return await this.db.query.provinces.findMany({
      orderBy: (provinces, { asc }) => [asc(provinces.name)],
    });
  }

  async searchNeighborhoods(query: string, limit = 20) {
    return await this.db.query.neighborhoods.findMany({
      where: ilike(schema.neighborhoods.name, `%${query}%`),
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
