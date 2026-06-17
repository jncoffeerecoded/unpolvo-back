import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Mensajería interna entre el visitante (guest) y el autor (owner) de un anuncio.
//
// Regla de moderación:
//   • Mientras la conversación está "pending", el visitante solo puede enviar
//     UN mensaje. No puede insistir hasta que el autor responda.
//   • En cuanto el autor responde, la conversación pasa a "accepted" y ambos
//     pueden chatear sin límite.
@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private excerpt(body: string): string {
    return body.length > 120 ? body.slice(0, 120) + "…" : body;
  }

  // Crea un mensaje, actualiza la conversación y notifica al destinatario.
  private async deliver(args: {
    conversationId: string;
    profileId: string;
    senderId: string;
    recipientId: string;
    body: string;
    accept: boolean;
  }) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: args.conversationId,
          senderId: args.senderId,
          body: args.body,
        },
      }),
      this.prisma.conversation.update({
        where: { id: args.conversationId },
        data: {
          lastMessageAt: new Date(),
          ...(args.accept ? { status: "accepted" } : {}),
        },
      }),
    ]);

    await this.prisma.notification.create({
      data: {
        userId: args.recipientId,
        actorId: args.senderId,
        profileId: args.profileId,
        type: "message",
        body: this.excerpt(args.body),
      },
    });

    return message;
  }

  // Punto de entrada desde la ficha del anuncio: el visitante contacta al autor.
  async startWithProfile(profileId: string, userId: string, body: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true },
    });
    if (!profile) throw new NotFoundException("Perfil no encontrado");
    if (!profile.userId) {
      throw new BadRequestException("Este anuncio no admite mensajes.");
    }
    if (profile.userId === userId) {
      throw new ForbiddenException(
        "No puedes enviarte mensajes a tu propio anuncio.",
      );
    }

    const existing = await this.prisma.conversation.findUnique({
      where: { profileId_guestId: { profileId, guestId: userId } },
    });

    if (!existing) {
      const conversation = await this.prisma.conversation.create({
        data: {
          profileId,
          ownerId: profile.userId,
          guestId: userId,
          status: "pending",
        },
      });
      await this.deliver({
        conversationId: conversation.id,
        profileId,
        senderId: userId,
        recipientId: profile.userId,
        body,
        accept: false,
      });
      return { conversationId: conversation.id, status: "pending" };
    }

    // Ya hay conversación. Si aún está pendiente, el visitante agotó su único
    // mensaje y debe esperar respuesta.
    if (existing.status === "pending") {
      throw new ForbiddenException(
        "Ya enviaste un mensaje. Espera a que el autor te responda para continuar.",
      );
    }

    // Aceptada: puede escribir libremente.
    await this.deliver({
      conversationId: existing.id,
      profileId,
      senderId: userId,
      recipientId: existing.ownerId,
      body,
      accept: false,
    });
    return { conversationId: existing.id, status: existing.status };
  }

  // Envío dentro de una conversación existente (lo usan ambas partes).
  async sendInConversation(conversationId: string, userId: string, body: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, ownerId: true, guestId: true, status: true, profileId: true },
    });
    if (!conv) throw new NotFoundException("Conversación no encontrada");

    const isOwner = conv.ownerId === userId;
    const isGuest = conv.guestId === userId;
    if (!isOwner && !isGuest) {
      throw new ForbiddenException("No participas en esta conversación.");
    }

    if (conv.status === "pending") {
      if (isGuest) {
        throw new ForbiddenException(
          "Espera a que el autor te responda para seguir escribiendo.",
        );
      }
      // El autor responde por primera vez → se acepta la conversación.
      await this.deliver({
        conversationId: conv.id,
        profileId: conv.profileId,
        senderId: userId,
        recipientId: conv.guestId,
        body,
        accept: true,
      });
      return { ok: true, status: "accepted" };
    }

    await this.deliver({
      conversationId: conv.id,
      profileId: conv.profileId,
      senderId: userId,
      recipientId: isOwner ? conv.guestId : conv.ownerId,
      body,
      accept: false,
    });
    return { ok: true, status: "accepted" };
  }

  // Lista de conversaciones del usuario (como autor o como visitante).
  async listConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ ownerId: userId }, { guestId: userId }] },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        profile: { select: { slug: true, nickname: true, title: true } },
        owner: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            messages: { where: { readAt: null, senderId: { not: userId } } },
          },
        },
      },
    });

    return convs.map((c) => {
      const isOwner = c.ownerId === userId;
      const other = isOwner ? c.guest : c.owner;
      const last = c.messages[0];
      return {
        id: c.id,
        status: c.status,
        role: isOwner ? "owner" : "guest",
        profile: c.profile,
        otherName: other?.name ?? "Usuario",
        otherImage: other?.image ?? null,
        lastMessage: last ? this.excerpt(last.body) : null,
        lastMessageAt: c.lastMessageAt,
        unread: c._count.messages,
      };
    });
  }

  // Detalle de una conversación + sus mensajes. Marca como leídos los recibidos.
  async getConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        profile: { select: { slug: true, nickname: true, title: true } },
        owner: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
      },
    });
    if (!conv) throw new NotFoundException("Conversación no encontrada");

    const isOwner = conv.ownerId === userId;
    const isGuest = conv.guestId === userId;
    if (!isOwner && !isGuest) {
      throw new ForbiddenException("No participas en esta conversación.");
    }

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    const other = isOwner ? conv.guest : conv.owner;
    // El visitante con la conversación pendiente no puede volver a escribir.
    const canSend = conv.status === "accepted" || isOwner;

    return {
      id: conv.id,
      status: conv.status,
      role: isOwner ? "owner" : "guest",
      canSend,
      profile: conv.profile,
      otherName: other?.name ?? "Usuario",
      otherImage: other?.image ?? null,
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === userId,
        createdAt: m.createdAt,
      })),
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: { OR: [{ ownerId: userId }, { guestId: userId }] },
      },
    });
    return { count };
  }
}
