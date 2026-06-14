import { Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("verification")
export class VerificationController {
  // Inicio de verificación KYC. En producción crea una sesión con el proveedor
  // (Stripe Identity / Veriff / Onfido). Nunca almacenamos biometría.
  @Post("start")
  start() {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        message:
          "Configura STRIPE_SECRET_KEY para activar la verificación real. No se procesa biometría en este modo.",
      };
    }
    return {
      message:
        "Stripe configurado: integra el SDK para crear la sesión de verificación.",
    };
  }
}
