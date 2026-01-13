import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import {
  GetDistrictsByProvinceDto,
  SearchNeighborhoodsDto,
  getDistrictsByProvinceSchema,
  searchNeighborhoodsSchema,
} from './dto/location.dto';

@Controller({ path: 'locations', version: '1' })
@UseGuards(AuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('neighborhoods/search')
  searchNeighborhoods(
    @Query(new ZodValidationPipe(searchNeighborhoodsSchema))
    query: SearchNeighborhoodsDto,
  ) {
    return this.locationsService.searchNeighborhoods(query.query, query.limit);
  }
  @Get('provinces/:provinceId/districts')
  getDistrictsByProvince(
    @Param(new ZodValidationPipe(getDistrictsByProvinceSchema))
    dto: GetDistrictsByProvinceDto,
  ) {
    return this.locationsService.getDistrictsByProvince(dto.provinceId);
  }
}
