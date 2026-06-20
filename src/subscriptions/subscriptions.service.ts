import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  StorageService,
} from "../storage/storage.service";
import { CreatePlanDto, UpdatePlanDto } from "./dto/plan.dto";

type UploadedFile = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ─── Helpers de propiedad ──────────────────────────────────────
  private async ownProfileOrThrow(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true },
    });
    if (!profile) throw new NotFoundException("Anuncio no encontrado");
    if (profile.userId !== userId) {
      throw new ForbiddenException("Este anuncio no es tuyo.");
    }
    return profile;
  }

  private async ownPlanOrThrow(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { profile: { select: { userId: true } } },
    });
    if (!plan) throw new NotFoundException("Plan no encontrado");
    if (plan.profile.userId !== userId) {
      throw new ForbiddenException("Este plan no es tuyo.");
    }
    return plan;
  }

  private planView(p: {
    id: string;
    name: string;
    description: string | null;
    price: { toString(): string };
    currency: string;
    active: boolean;
    order: number;
    media?: { id: string; type: string; order: number }[];
    _count?: { media: number; subscriptions: number };
  }) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price.toString()),
      currency: p.currency,
      active: p.active,
      order: p.order,
      mediaCount: p._count?.media ?? p.media?.length ?? 0,
      subscriberCount: p._count?.subscriptions ?? 0,
      media: p.media?.map((m) => ({ id: m.id, type: m.type, order: m.order })),
    };
  }

  // ─── Anunciante: planes ────────────────────────────────────────
  async createPlan(userId: string, profileId: string, dto: CreatePlanDto) {
    await this.ownProfileOrThrow(userId, profileId);
    const count = await this.prisma.subscriptionPlan.count({ where: { profileId } });
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        profileId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        currency: dto.currency ?? "USD",
        order: count,
      },
    });
    return this.planView(plan);
  }

  async listPlans(userId: string, profileId: string) {
    await this.ownProfileOrThrow(userId, profileId);
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { profileId },
      orderBy: { order: "asc" },
      include: {
        media: { orderBy: { order: "asc" } },
        _count: { select: { media: true, subscriptions: true } },
      },
    });
    return plans.map((p) => this.planView(p));
  }

  async updatePlan(userId: string, planId: string, dto: UpdatePlanDto) {
    await this.ownPlanOrThrow(userId, planId);
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.price != null ? { price: dto.price } : {}),
        ...(dto.currency != null ? { currency: dto.currency } : {}),
        ...(dto.active != null ? { active: dto.active } : {}),
      },
    });
    return this.planView(plan);
  }

  async deletePlan(userId: string, planId: string) {
    await this.ownPlanOrThrow(userId, planId);
    await this.prisma.subscriptionPlan.delete({ where: { id: planId } });
    return { ok: true };
  }

  // ─── Anunciante: media del plan ────────────────────────────────
  async addMedia(userId: string, planId: string, files: UploadedFile[]) {
    const plan = await this.ownPlanOrThrow(userId, planId);
    if (!files?.length) throw new BadRequestException("No se subió ningún archivo.");

    const start = await this.prisma.premiumMedia.count({ where: { planId } });
    const created: { id: string; type: string }[] = [];
    let i = start;
    for (const f of files) {
      let url: string;
      let type: string;
      if (this.storage.isImage(f.mimetype) && f.size <= MAX_IMAGE_BYTES) {
        url = await this.storage.uploadImage(f.buffer, "premium");
        type = "image";
      } else if (this.storage.isVideo(f.mimetype) && f.size <= MAX_VIDEO_BYTES) {
        url = await this.storage.uploadVideo(f.buffer, f.mimetype);
        type = "video";
      } else {
        continue; // formato/tamaño no admitido → se omite
      }
      const m = await this.prisma.premiumMedia.create({
        data: { planId, profileId: plan.profileId, url, type, order: i++ },
      });
      created.push({ id: m.id, type: m.type });
    }
    if (!created.length) {
      throw new BadRequestException(
        "Archivos no válidos. Fotos (máx. 5 MB) o vídeos MP4/WebM (máx. 80 MB).",
      );
    }
    return { created };
  }

  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.prisma.premiumMedia.findUnique({
      where: { id: mediaId },
      include: { plan: { include: { profile: { select: { userId: true } } } } },
    });
    if (!media) throw new NotFoundException("Contenido no encontrado");
    if (media.plan.profile.userId !== userId) {
      throw new ForbiddenException("Este contenido no es tuyo.");
    }
    await this.prisma.premiumMedia.delete({ where: { id: mediaId } });
    return { ok: true };
  }

  // ─── Anunciante: suscriptores ──────────────────────────────────
  async listSubscribers(userId: string, profileId: string) {
    await this.ownProfileOrThrow(userId, profileId);
    const subs = await this.prisma.subscription.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      include: {
        subscriber: { select: { id: true, name: true, email: true, image: true } },
        plan: { select: { id: true, name: true, price: true, currency: true } },
      },
    });
    return subs.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      decidedAt: s.decidedAt,
      conversationId: s.conversationId,
      subscriber: {
        id: s.subscriber.id,
        name: s.subscriber.name ?? s.subscriber.email,
        image: s.subscriber.image,
      },
      plan: {
        id: s.plan.id,
        name: s.plan.name,
        price: Number(s.plan.price.toString()),
        currency: s.plan.currency,
      },
    }));
  }

  async decide(userId: string, subId: string, approve: boolean) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subId },
      include: { plan: { select: { name: true } } },
    });
    if (!sub) throw new NotFoundException("Suscripción no encontrada");
    if (sub.ownerId !== userId) {
      throw new ForbiddenException("No puedes gestionar esta suscripción.");
    }
    const status = approve ? "approved" : "rejected";
    await this.prisma.subscription.update({
      where: { id: subId },
      data: { status, decidedAt: new Date() },
    });
    await this.prisma.notification.create({
      data: {
        userId: sub.subscriberId,
        actorId: userId,
        profileId: sub.profileId,
        type: approve ? "subscription_approved" : "subscription_rejected",
        body: sub.plan.name,
      },
    });
    return { ok: true, status };
  }

  // ─── Suscriptor ────────────────────────────────────────────────
  async subscribe(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { profile: { select: { id: true, userId: true, nickname: true } } },
    });
    if (!plan || !plan.active) throw new NotFoundException("Plan no disponible");
    const ownerId = plan.profile.userId;
    if (!ownerId) throw new BadRequestException("Este anuncio no admite suscripciones.");
    if (ownerId === userId) {
      throw new ForbiddenException("No puedes suscribirte a tu propio anuncio.");
    }

    const profileId = plan.profile.id;

    // Conversación guest↔owner (una por perfil/visitante): reutiliza o crea.
    let conv = await this.prisma.conversation.findUnique({
      where: { profileId_guestId: { profileId, guestId: userId } },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { profileId, ownerId, guestId: userId, status: "pending" },
      });
    }

    // Suscripción (idempotente por plan/suscriptor). Si fue rechazada, se reabre.
    const existing = await this.prisma.subscription.findUnique({
      where: { planId_subscriberId: { planId, subscriberId: userId } },
    });
    let subscription;
    if (existing) {
      subscription =
        existing.status === "rejected"
          ? await this.prisma.subscription.update({
              where: { id: existing.id },
              data: { status: "pending", decidedAt: null, conversationId: conv.id },
            })
          : existing;
    } else {
      subscription = await this.prisma.subscription.create({
        data: {
          planId,
          profileId,
          subscriberId: userId,
          ownerId,
          conversationId: conv.id,
          status: "pending",
        },
      });

      // Mensaje automático de solicitud + notificación al anunciante.
      const body = `Hola, quiero suscribirme al plan "${plan.name}". ¿Cómo hago el pago?`;
      await this.prisma.message.create({
        data: { conversationId: conv.id, senderId: userId, body },
      });
      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date() },
      });
      await this.prisma.notification.create({
        data: {
          userId: ownerId,
          actorId: userId,
          profileId,
          type: "subscription_request",
          body: plan.name,
        },
      });
    }

    return {
      subscriptionId: subscription.id,
      conversationId: conv.id,
      status: subscription.status,
    };
  }

  async mySubscriptions(userId: string) {
    const subs = await this.prisma.subscription.findMany({
      where: { subscriberId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { id: true, name: true, price: true, currency: true } },
        profile: { select: { slug: true, nickname: true } },
      },
    });
    return subs.map((s) => ({
      id: s.id,
      planId: s.planId,
      status: s.status,
      conversationId: s.conversationId,
      plan: {
        id: s.plan.id,
        name: s.plan.name,
        price: Number(s.plan.price.toString()),
        currency: s.plan.currency,
      },
      profile: { slug: s.profile.slug, nickname: s.profile.nickname },
    }));
  }

  // Contenido del plan: solo si el viewer está aprobado o es el dueño.
  async planContent(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { profile: { select: { userId: true } } },
    });
    if (!plan) throw new NotFoundException("Plan no encontrado");

    const isOwner = plan.profile.userId === userId;
    if (!isOwner) {
      const sub = await this.prisma.subscription.findUnique({
        where: { planId_subscriberId: { planId, subscriberId: userId } },
        select: { status: true },
      });
      if (sub?.status !== "approved") {
        throw new ForbiddenException("No tienes acceso a este contenido.");
      }
    }

    const media = await this.prisma.premiumMedia.findMany({
      where: { planId },
      orderBy: { order: "asc" },
      select: { id: true, type: true, order: true },
    });
    return { planId, media };
  }
}
