import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ImageController } from "./image.controller";
import { MediaController } from "./media.controller";

@Module({
  controllers: [ImageController, MediaController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
