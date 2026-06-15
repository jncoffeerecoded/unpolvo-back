import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import sharp from "sharp";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

@Injectable()
export class StorageService {
  private s3 = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  private bucket = process.env.S3_BUCKET ?? "";

  isImage(mime: string) {
    return ACCEPTED_IMAGE_TYPES.includes(mime);
  }

  // Comprime a WebP y sube. Devuelve la ruta relativa servida por este backend
  // (/img/...). La URL absoluta se compone al leer (ver publicUrl en profiles).
  async upload(buffer: Buffer): Promise<string> {
    const webp = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const key = `profiles/${randomUUID()}.webp`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `/img/${key}`;
  }

  async getObject(key: string) {
    const obj = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await obj.Body!.transformToByteArray();
    return { body: Buffer.from(bytes), contentType: obj.ContentType ?? "image/webp" };
  }
}
