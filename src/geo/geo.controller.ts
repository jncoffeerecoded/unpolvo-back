import { Controller, Get, Param } from "@nestjs/common";
import { GeoService } from "./geo.service";

@Controller()
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("countries")
  countries() {
    return this.geo.countries();
  }

  @Get("countries-with-cities")
  countriesWithCities() {
    return this.geo.countriesWithCities();
  }

  @Get("countries/:code")
  country(@Param("code") code: string) {
    return this.geo.country(code);
  }

  @Get("countries/:code/cities/:slug")
  city(@Param("code") code: string, @Param("slug") slug: string) {
    return this.geo.city(code, slug);
  }
}
