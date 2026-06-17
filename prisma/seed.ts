import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "./seed-data";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "ciudad"
  );
}

async function main() {
  let countriesUp = 0;
  let citiesUp = 0;

  for (const c of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, locale: c.locale },
      create: { code: c.code, name: c.name, locale: c.locale },
    });
    countriesUp++;

    for (const cityName of c.cities) {
      const slug = slugify(cityName);
      await prisma.city.upsert({
        where: { countryId_slug: { countryId: country.id, slug } },
        update: { name: cityName },
        create: { countryId: country.id, slug, name: cityName },
      });
      citiesUp++;
    }
    console.log(`✓ ${c.name} (${c.code}) — ${c.cities.length} ciudades`);
  }

  console.log(`\nListo: ${countriesUp} países, ${citiesUp} ciudades procesadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
