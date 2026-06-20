import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { SubscriptionsService } from "./subscriptions.service";
import { CreatePlanDto, UpdatePlanDto } from "./dto/plan.dto";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
} from "../storage/storage.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

type UploadedFile = { buffer: Buffer; mimetype: string; size: number };

const ACCEPTED_MEDIA = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

@UseGuards(JwtAuthGuard)
@Controller()
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  // ─── Anunciante: planes ────────────────────────────────────────
  @Post("me/profiles/:profileId/plans")
  createPlan(
    @Param("profileId") profileId: string,
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subs.createPlan(user.id, profileId, dto);
  }

  @Get("me/profiles/:profileId/plans")
  listPlans(@Param("profileId") profileId: string, @CurrentUser() user: AuthUser) {
    return this.subs.listPlans(user.id, profileId);
  }

  @Patch("me/plans/:planId")
  updatePlan(
    @Param("planId") planId: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subs.updatePlan(user.id, planId, dto);
  }

  @Delete("me/plans/:planId")
  deletePlan(@Param("planId") planId: string, @CurrentUser() user: AuthUser) {
    return this.subs.deletePlan(user.id, planId);
  }

  // ─── Anunciante: media (fotos + vídeos) ────────────────────────
  @Post("me/plans/:planId/media")
  @UseInterceptors(
    FilesInterceptor("files", 12, {
      limits: { fileSize: MAX_VIDEO_BYTES },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileFilter: (_req: any, file: any, cb: any) =>
        cb(null, ACCEPTED_MEDIA.includes(file.mimetype)),
    }),
  )
  addMedia(
    @Param("planId") planId: string,
    @UploadedFiles() files: UploadedFile[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.subs.addMedia(user.id, planId, files);
  }

  @Delete("me/media/:mediaId")
  deleteMedia(@Param("mediaId") mediaId: string, @CurrentUser() user: AuthUser) {
    return this.subs.deleteMedia(user.id, mediaId);
  }

  // ─── Anunciante: suscriptores ──────────────────────────────────
  @Get("me/profiles/:profileId/subscribers")
  subscribers(@Param("profileId") profileId: string, @CurrentUser() user: AuthUser) {
    return this.subs.listSubscribers(user.id, profileId);
  }

  @Post("me/subscriptions/:id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.subs.decide(user.id, id, true);
  }

  @Post("me/subscriptions/:id/reject")
  reject(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.subs.decide(user.id, id, false);
  }

  // ─── Suscriptor ────────────────────────────────────────────────
  @Post("plans/:planId/subscribe")
  subscribe(@Param("planId") planId: string, @CurrentUser() user: AuthUser) {
    return this.subs.subscribe(user.id, planId);
  }

  @Get("me/subscriptions")
  mine(@CurrentUser() user: AuthUser) {
    return this.subs.mySubscriptions(user.id);
  }

  @Get("plans/:planId/content")
  content(@Param("planId") planId: string, @CurrentUser() user: AuthUser) {
    return this.subs.planContent(user.id, planId);
  }
}
