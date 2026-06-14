import { NestFactory } from "@nestjs/core";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3002")
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  });

  // Todos los errores salen como JSON { error, fieldErrors? }.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // La validación devuelve { error, fieldErrors } (mismo shape que el front).
      exceptionFactory: (errors) => {
        const fieldErrors: Record<string, string> = {};
        for (const e of errors) {
          const msg = e.constraints
            ? Object.values(e.constraints)[0]
            : undefined;
          if (msg && !fieldErrors[e.property]) fieldErrors[e.property] = msg;
        }
        return new BadRequestException({
          error: "Revisa los campos marcados.",
          fieldErrors,
        });
      },
    }),
  );

  const port = Number(process.env.PORT ?? 3008);
  await app.listen(port, "0.0.0.0");
  console.log(`unpolvo-back escuchando en :${port}`);
}
bootstrap();
