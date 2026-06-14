import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3002")
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = Number(process.env.PORT ?? 3008);
  await app.listen(port, "0.0.0.0");
  console.log(`unpolvo-back escuchando en :${port}`);
}
bootstrap();
