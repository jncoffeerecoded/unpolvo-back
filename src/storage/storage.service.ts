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

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// Resultado de leer un objeto, con soporte de descarga parcial (Range) para vídeo.
export type ObjectChunk = {
  body: Buffer;
  contentType: string;
  contentLength: number;
  // Cuando se pide un Range, S3 responde 206 con estos datos.
  contentRange?: string;
  totalLength?: number;
  partial: boolean;
};

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

  isVideo(mime: string) {
    return ACCEPTED_VIDEO_TYPES.includes(mime);
  }

  // Comprime a WebP y sube bajo el prefijo indicado. Devuelve la ruta relativa
  // (/img/<key>) para las fotos públicas, o la clave cruda para contenido privado.
  async uploadImage(buffer: Buffer, prefix = "profiles"): Promise<string> {
    const webp = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const key = `${prefix}/${randomUUID()}.webp`;
    await this.put(key, webp, "image/webp");
    return prefix === "profiles" ? `/img/${key}` : key;
  }

  // Alias del flujo público histórico (fotos de anuncio servidas por /img/...).
  upload(buffer: Buffer): Promise<string> {
    return this.uploadImage(buffer, "profiles");
  }

  // Sube el vídeo SIN transcodificar bajo premium/. Devuelve la clave privada.
  async uploadVideo(buffer: Buffer, mime: string): Promise<string> {
    const ext = mime === "video/webm" ? "webm" : "mp4";
    const key = `premium/${randomUUID()}.${ext}`;
    await this.put(key, buffer, mime);
    return key;
  }

  private async put(key: string, body: Buffer, contentType: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  // Lee un objeto. Si se pasa `range` (cabecera HTTP "bytes=...") devuelve el
  // tramo correspondiente (206) — necesario para el streaming de vídeo.
  async getObject(key: string, range?: string): Promise<ObjectChunk> {
    const obj = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: range }),
    );
    const bytes = await obj.Body!.transformToByteArray();
    const body = Buffer.from(bytes);
    return {
      body,
      contentType: obj.ContentType ?? "application/octet-stream",
      contentLength: body.length,
      contentRange: obj.ContentRange,
      totalLength: obj.ContentRange
        ? Number(obj.ContentRange.split("/")[1])
        : body.length,
      partial: !!obj.ContentRange,
    };
  }
}
