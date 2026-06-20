import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
