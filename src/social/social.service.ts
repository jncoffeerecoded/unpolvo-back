import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  private async ownerId(profileId: string): Promise<string | null> {
    const p = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });
    if (!p) throw new NotFoundException("Perfil no encontrado");
    return p.userId;
  }

  private async notify(
    recipientId: string | null,
    actorId: string,
    type: "comment" | "like" | "rating",
    profileId: string,
    body?: string,
  ) {
    if (recipientId && recipientId !== actorId) {
      await this.prisma.notification.create({
        data: { userId: recipientId, actorId, profileId, type, body },
      });
    }
  }

  async addComment(
    profileId: string,
    userId: string,
    body: string,
    parentId?: string,
  ) {
    const owner = await this.ownerId(profileId);
    const isOwner = !!owner && owner === userId;

    if (!parentId && isOwner) {
      throw new ForbiddenException(
        "Como propietario solo puedes responder comentarios, no crear nuevos.",
      );
    }
    if (!parentId && !isOwner) {
      const existing = await this.prisma.comment.findFirst({
        where: { profileId, userId, parentId: null },
        select: { id: true },
      });
      if (existing) throw new BadRequestException("Ya has comentado este anuncio.");
    }

    let parent: { userId: string; profileId: string } | null = null;
    if (parentId) {
      parent = await this.prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true, profileId: true },
      });
      if (!parent || parent.profileId !== profileId) {
        throw new BadRequestException("Comentario no válido.");
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { profileId, userId, body, parentId: parentId ?? null },
      }),
      this.prisma.profile.update({
        where: { id: profileId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    if (isOwner && parent) {
      await this.notify(parent.userId, userId, "comment", profileId, body.slice(0, 120));
    } else {
      await this.notify(owner, userId, "comment", profileId, body.slice(0, 120));
    }
    return { ok: true, id: comment.id };
  }

  async deleteComment(commentId: string, userId: string) {
    const c = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
        profileId: true,
        profile: { select: { userId: true } },
        _count: { select: { replies: true } },
      },
    });
    if (!c) throw new NotFoundException("El comentario no existe.");
    if (c.userId !== userId && c.profile.userId !== userId) {
      throw new ForbiddenException("No autorizado.");
    }
    const removed = 1 + c._count.replies;
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.profile.update({
        where: { id: c.profileId },
        data: { commentsCount: { decrement: removed } },
      }),
    ]);
    return { ok: true };
  }

  async toggleLike(profileId: string, userId: string) {
    const owner = await this.ownerId(profileId);
    if (owner === userId) {
      throw new ForbiddenException("No puedes dar like a tu propio anuncio.");
    }
    const existing = await this.prisma.like.findUnique({
      where: { profileId_userId: { profileId, userId } },
    });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existing.id } }),
        this.prisma.profile.update({
          where: { id: profileId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    }
    await this.prisma.$transaction([
      this.prisma.like.create({ data: { profileId, userId } }),
      this.prisma.profile.update({
        where: { id: profileId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
    await this.notify(owner, userId, "like", profileId);
    return { liked: true };
  }

  async rate(profileId: string, userId: string, value: number) {
    const owner = await this.ownerId(profileId);
    if (owner === userId) {
      throw new ForbiddenException("No puedes valorar tu propio anuncio.");
    }
    const v = Math.max(1, Math.min(5, Math.round(value)));
    const existing = await this.prisma.rating.findUnique({
      where: { profileId_userId: { profileId, userId } },
    });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.rating.update({ where: { id: existing.id }, data: { value: v } }),
        this.prisma.profile.update({
          where: { id: profileId },
          data: { ratingSum: { increment: v - existing.value } },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.rating.create({ data: { profileId, userId, value: v } }),
        this.prisma.profile.update({
          where: { id: profileId },
          data: { ratingSum: { increment: v }, ratingCount: { increment: 1 } },
        }),
      ]);
      await this.notify(owner, userId, "rating", profileId, String(v));
    }
    return { myRating: v };
  }

  async interaction(profileId: string, userId: string) {
    const [like, rating] = await Promise.all([
      this.prisma.like.findUnique({
        where: { profileId_userId: { profileId, userId } },
      }),
      this.prisma.rating.findUnique({
        where: { profileId_userId: { profileId, userId } },
      }),
    ]);
    return { liked: !!like, myRating: rating?.value ?? null };
  }
}
