import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ImageController } from "./image.controller";

@Module({
  controllers: [ImageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
