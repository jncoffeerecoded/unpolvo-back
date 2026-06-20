import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { ACCEPTED_IMAGE_TYPES } from "../storage/storage.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // El visitante contacta al autor de un anuncio (crea/usa la conversación).
  @Post("profiles/:id/chat")
  start(
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.startWithProfile(id, user.id, dto.body);
  }

  @Get("chat/conversations")
  list(@CurrentUser() user: AuthUser) {
    return this.chat.listConversations(user.id);
  }

  @Get("chat/unread-count")
  unread(@CurrentUser() user: AuthUser) {
    return this.chat.unreadCount(user.id);
  }

  @Get("chat/conversations/:id")
  conversation(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.chat.getConversation(id, user.id);
  }

  // Acepta JSON ({ body }) o multipart (campo body + images[]). Multer ignora
  // los cuerpos JSON, así que un único endpoint sirve para ambos casos.
  @Post("chat/conversations/:id/messages")
  @UseInterceptors(
    FilesInterceptor("images", 6, {
      limits: { fileSize: 5 * 1024 * 1024 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileFilter: (_req: any, file: any, cb: any) =>
        cb(null, ACCEPTED_IMAGE_TYPES.includes(file.mimetype)),
    }),
  )
  send(
    @Param("id") id: string,
    @Body("body") body: string | undefined,
    @UploadedFiles() files: UploadedImage[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.sendInConversation(id, user.id, body ?? "", files);
  }
}
