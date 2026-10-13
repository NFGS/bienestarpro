import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Configuración JWT compartida (firma y expiración).
 * Cualquier módulo cuyos controladores usen JwtAuthGuard debe importarla,
 * para que el guard resuelva JwtService en su propio contexto.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secreto-solo-desarrollo',
      signOptions: {
        expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
      },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
