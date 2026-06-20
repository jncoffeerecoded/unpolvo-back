import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { StorageService } from "./storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

// Servido de contenido PRIVADO (premium + capturas del chat) con control de
// acceso. Nunca se cachea públicamente. Soporta Range para streaming de vídeo.
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("premium/:id")
  async premium(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Headers("range") range: string | undefined,
    @Res() res: Response,
  ) {
    const media = await this.prisma.premiumMedia.findUnique({
      where: { id },
      include: { plan: { include: { profile: { select: { userId: true } } } } },
    });
    if (!media) throw new NotFoundException();

    const isOwner = media.plan.profile.userId === user.id;
    if (!isOwner) {
      const sub = await this.prisma.subscription.findUnique({
        where: {
          planId_subscriberId: { planId: media.planId, subscriberId: user.id },
        },
        select: { status: true },
      });
      if (sub?.status !== "approved") {
        throw new ForbiddenException("No tienes acceso a este contenido.");
      }
    }

    await this.stream(media.url, range, res);
  }

  @Get("chat/:id")
  async chat(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const att = await this.prisma.messageAttachment.findUnique({
      where: { id },
      include: {
        message: {
          include: {
            conversation: { select: { ownerId: true, guestId: true } },
          },
        },
      },
    });
    if (!att) throw new NotFoundException();
    const conv = att.message.conversation;
    if (conv.ownerId !== user.id && conv.guestId !== user.id) {
      throw new ForbiddenException("No participas en esta conversación.");
    }

    await this.stream(att.url, undefined, res);
  }

  // Lee del bucket (con Range opcional) y responde de forma privada.
  private async stream(key: string, range: string | undefined, res: Response) {
    let chunk;
    try {
      chunk = await this.storage.getObject(key, range);
    } catch {
      throw new NotFoundException();
    }
    res.set("Content-Type", chunk.contentType);
    res.set("Cache-Control", "private, no-store");
    res.set("Accept-Ranges", "bytes");
    if (chunk.partial && chunk.contentRange) {
      res.status(206);
      res.set("Content-Range", chunk.contentRange);
    }
    res.set("Content-Length", String(chunk.contentLength));
    res.send(chunk.body);
  }
}
