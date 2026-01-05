import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller({ path: 'locations', version: '1' })
@UseGuards(AuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('neighborhoods/search')
  searchNeighborhoods(@Query('q') query: string) {
    return this.locationsService.searchNeighborhoods(query);
  }
}
