import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { ProfilesModule } from "../profiles/profiles.module";

@Module({
  imports: [ProfilesModule],
  controllers: [MeController],
})
export class MeModule {}
