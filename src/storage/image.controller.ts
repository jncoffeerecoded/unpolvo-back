import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { StorageService } from "./storage.service";

@Controller()
export class ImageController {
  constructor(private readonly storage: StorageService) {}

  // Sirve las fotos del bucket (privado) como contenido cacheable.
  @Get("img/profiles/:file")
  async serve(@Param("file") file: string, @Res() res: Response) {
    try {
      const { body, contentType } = await this.storage.getObject(
        `profiles/${file}`,
      );
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(body);
    } catch {
      throw new NotFoundException();
    }
  }
}
