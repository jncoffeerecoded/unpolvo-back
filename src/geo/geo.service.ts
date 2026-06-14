import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  countries() {
    return this.prisma.country.findMany({
      orderBy: { name: "asc" },
      include: {
        cities: { orderBy: { name: "asc" }, take: 6 },
        _count: { select: { profiles: true, cities: true } },
      },
    });
  }

  async country(code: string) {
    const c = await this.prisma.country.findUnique({
      where: { code },
      include: {
        _count: { select: { profiles: true } },
        cities: {
          orderBy: { name: "asc" },
          include: { _count: { select: { profiles: true } } },
        },
      },
    });
    if (!c) throw new NotFoundException("País no encontrado");
    return c;
  }

  async city(code: string, slug: string) {
    const c = await this.prisma.city.findFirst({
      where: { slug, country: { code } },
      include: { country: true },
    });
    if (!c) throw new NotFoundException("Ciudad no encontrada");
    return c;
  }

  async countriesWithCities() {
    const rows = await this.prisma.country.findMany({
      orderBy: { name: "asc" },
      include: { cities: { orderBy: { name: "asc" } } },
    });
    return rows.map((c) => ({
      code: c.code,
      name: c.name,
      cities: c.cities.map((ci) => ({ slug: ci.slug, name: ci.name })),
    }));
  }
}
