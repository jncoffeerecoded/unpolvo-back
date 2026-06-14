import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { SocialService } from "./social.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { RatingDto } from "./dto/rating.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

@UseGuards(JwtAuthGuard)
@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post("profiles/:id/comments")
  addComment(
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.social.addComment(id, user.id, dto.body, dto.parentId);
  }

  @Delete("comments/:id")
  deleteComment(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.social.deleteComment(id, user.id);
  }

  @Post("profiles/:id/like")
  toggleLike(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.social.toggleLike(id, user.id);
  }

  @Put("profiles/:id/rating")
  rate(
    @Param("id") id: string,
    @Body() dto: RatingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.social.rate(id, user.id, dto.value);
  }

  @Get("profiles/:id/interaction")
  interaction(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.social.interaction(id, user.id);
  }
}
