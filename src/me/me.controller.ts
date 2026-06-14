import { Controller, Get, UseGuards } from "@nestjs/common";
import { ProfilesService } from "../profiles/profiles.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("me")
export class MeController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get("profiles")
  myProfiles(@CurrentUser() user: AuthUser) {
    return this.profiles.byUser(user.id);
  }
}
