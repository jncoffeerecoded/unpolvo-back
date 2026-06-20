import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { GeoModule } from "./geo/geo.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { StorageModule } from "./storage/storage.module";
import { SocialModule } from "./social/social.module";
import { ChatModule } from "./chat/chat.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { VerificationModule } from "./verification/verification.module";
import { MeModule } from "./me/me.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: 120 req/min por IP.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    GeoModule,
    ProfilesModule,
    StorageModule,
    SocialModule,
    ChatModule,
    NotificationsModule,
    VerificationModule,
    MeModule,
    SubscriptionsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
