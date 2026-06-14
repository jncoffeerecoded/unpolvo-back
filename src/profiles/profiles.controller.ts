import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ProfilesService } from "./profiles.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { ACCEPTED_IMAGE_TYPES } from "../storage/storage.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  // GET /profiles?country=es&city=madrid&featured=true&take=10
  @Get()
  list(
    @Query("country") country?: string,
    @Query("city") city?: string,
    @Query("featured") featured?: string,
    @Query("take") take?: string,
  ) {
    return this.profiles.list({ country, city, featured, take });
  }

  // POST /profiles (multipart: campos + photos[])
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor("photos", 6, {
      limits: { fileSize: 5 * 1024 * 1024 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileFilter: (_req: any, file: any, cb: any) =>
        cb(null, ACCEPTED_IMAGE_TYPES.includes(file.mimetype)),
    }),
  )
  create(
    @Body() dto: CreateProfileDto,
    @UploadedFiles() files: UploadedImage[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.profiles.create(user.id, dto, files);
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.profiles.bySlug(slug);
  }

  @Get(":slug/related")
  related(@Param("slug") slug: string) {
    return this.profiles.related(slug);
  }
}
