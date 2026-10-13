import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PublicConfirmationDto } from './dto/events.dto';
import { EventsService } from './events.service';

/**
 * Endpoints públicos (sin sesión): el aprendiz confirma desde el enlace de
 * la convocatoria; el token QR es la capacidad de acceso (RF-15).
 */
@Controller('public')
export class PublicController {
  constructor(private readonly events: EventsService) {}

  @Post('confirmations')
  @HttpCode(HttpStatus.OK)
  confirm(@Body() dto: PublicConfirmationDto) {
    return this.events.confirmByToken(dto);
  }
}
