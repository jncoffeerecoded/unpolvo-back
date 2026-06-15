import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MAX_IMAGE_BYTES, StorageService } from "../storage/storage.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { uniqueSlug } from "../util/slug";

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

const isFeatured = (d: Date | null) => !!d && d.getTime() > Date.now();
const avg = (sum: number, count: number) => (count > 0 ? sum / count : 0);

// Compone la URL pública absoluta de una foto. En BD guardamos la ruta relativa
// (/img/...); aquí le anteponemos el dominio del backend para que el front la
// sirva tal cual. Si ya es absoluta (datos antiguos) se devuelve sin tocar.
function publicUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;
  const base = (process.env.PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
  const path = stored.startsWith("/") ? stored : `/img/${stored}`;
  return base ? `${base}${path}` : path;
}

const CARD_INCLUDE = {
  photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
  city: true,
  country: true,
} satisfies Prisma.ProfileInclude;

type CardRow = {
  slug: string;
  title: string;
  nickname: string;
  age: number;
  gender: string;
  bodyType: string | null;
  isVerified: boolean;
  featuredUntil: Date | null;
  commentsCount: number;
  likesCount: number;
  ratingSum: number;
  ratingCount: number;
  photos: { url: string }[];
  city: { slug: string; name: string };
  country: { code: string };
};

function toCard(p: CardRow) {
  return {
    slug: p.slug,
    title: p.title,
    nickname: p.nickname,
    age: p.age,
    gender: p.gender,
    bodyType: p.bodyType,
    isVerified: p.isVerified,
    featured: isFeatured(p.featuredUntil),
    photoUrl: publicUrl(p.photos[0]?.url),
    countryCode: p.country.code,
    citySlug: p.city.slug,
    cityName: p.city.name,
    commentsCount: p.commentsCount,
    likesCount: p.likesCount,
    ratingCount: p.ratingCount,
    ratingAvg: avg(p.ratingSum, p.ratingCount),
  };
}

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async list(params: {
    country?: string;
    city?: string;
    featured?: string;
    take?: string;
  }) {
    const where: Prisma.ProfileWhereInput = { status: "active" };
    if (params.country) where.country = { code: params.country };
    if (params.city) where.city = { slug: params.city };
    if (params.featured === "true") where.featuredUntil = { gt: new Date() };
    if (params.featured === "false") {
      where.OR = [{ featuredUntil: null }, { featuredUntil: { lt: new Date() } }];
    }
    const take = Math.min(Number(params.take) || 24, 100);

    const rows = await this.prisma.profile.findMany({
      where,
      orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
      take,
      include: CARD_INCLUDE,
    });
    return rows.map(toCard);
  }

  async bySlug(slug: string) {
    const p = await this.prisma.profile.findFirst({
      where: { slug, status: "active" },
      include: {
        photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        city: true,
        country: true,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            user: { select: { name: true, image: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { name: true, image: true } } },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException("Perfil no encontrado");

    return {
      id: p.id,
      ownerId: p.userId,
      slug: p.slug,
      title: p.title,
      nickname: p.nickname,
      age: p.age,
      gender: p.gender,
      bodyType: p.bodyType,
      isVerified: p.isVerified,
      featured: isFeatured(p.featuredUntil),
      photoUrl: publicUrl(p.photos[0]?.url),
      countryCode: p.country.code,
      countryName: p.country.name,
      citySlug: p.city.slug,
      cityName: p.city.name,
      commentsCount: p.commentsCount,
      likesCount: p.likesCount,
      ratingCount: p.ratingCount,
      ratingAvg: avg(p.ratingSum, p.ratingCount),
      bio: p.bio,
      photos: p.photos.map((ph) => ({ url: publicUrl(ph.url) ?? ph.url, alt: ph.alt })),
      comments: p.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        authorName: c.user.name ?? "Anónimo",
        authorImage: c.user.image,
        authorId: c.userId,
        replies: c.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt,
          authorName: r.user.name ?? "Anónimo",
          authorImage: r.user.image,
          authorId: r.userId,
          replies: [],
        })),
      })),
      createdAt: p.createdAt,
    };
  }

  async related(slug: string, take = 4) {
    const base = await this.prisma.profile.findUnique({
      where: { slug },
      select: { cityId: true },
    });
    if (!base) return [];
    const rows = await this.prisma.profile.findMany({
      where: { status: "active", cityId: base.cityId, slug: { not: slug } },
      orderBy: { createdAt: "desc" },
      take,
      include: CARD_INCLUDE,
    });
    return rows.map(toCard);
  }

  async create(userId: string, dto: CreateProfileDto, files: UploadedImage[]) {
    const city = await this.prisma.city.findFirst({
      where: { slug: dto.citySlug, country: { code: dto.countryCode } },
      include: { country: true },
    });
    if (!city) {
      throw new BadRequestException("Selecciona un país y una ciudad válidos.");
    }

    const valid = (files ?? [])
      .filter((f) => this.storage.isImage(f.mimetype) && f.size <= MAX_IMAGE_BYTES)
      .slice(0, 6);
    const photoUrls: string[] = [];
    for (const f of valid) photoUrls.push(await this.storage.upload(f.buffer));

    const slug = uniqueSlug(`${dto.nickname}-${city.slug}`);
    await this.prisma.profile.create({
      data: {
        slug,
        title: dto.title,
        nickname: dto.nickname,
        bio: dto.bio,
        age: dto.age,
        gender: dto.gender,
        userId,
        countryId: city.countryId,
        cityId: city.id,
        bodyType: dto.bodyType ?? null,
        status: "active",
        featuredUntil: dto.featured
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
        photos: photoUrls.length
          ? {
              create: photoUrls.map((url, i) => ({
                url,
                order: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
      },
    });
    return { slug, path: `/${city.country.code}/${city.slug}/${slug}` };
  }

  async byUser(userId: string) {
    const rows = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: CARD_INCLUDE,
    });
    return rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      nickname: p.nickname,
      status: p.status,
      featured: isFeatured(p.featuredUntil),
      isVerified: p.isVerified,
      photoUrl: publicUrl(p.photos[0]?.url),
      countryCode: p.country.code,
      citySlug: p.city.slug,
      cityName: p.city.name,
      countryName: p.country.name,
      commentsCount: p.commentsCount,
      likesCount: p.likesCount,
      ratingCount: p.ratingCount,
      ratingAvg: avg(p.ratingSum, p.ratingCount),
      createdAt: p.createdAt,
    }));
  }
}
