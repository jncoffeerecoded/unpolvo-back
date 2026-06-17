import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

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

  @Post("chat/conversations/:id/messages")
  send(
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.sendInConversation(id, user.id, dto.body);
  }
}
