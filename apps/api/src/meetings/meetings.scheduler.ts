import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MeetingsService } from './meetings.service';

/**
 * RF-38: planificador de recordatorios de reuniones. Corre sin contexto de
 * centro: reclama los recordatorios vencidos (claim atómico SECURITY DEFINER)
 * y los encola por el hub. En pruebas se desactiva con
 * MEETINGS_SCHEDULER_ENABLED=false y se invoca `runReminders()` explícito.
 */
@Injectable()
export class MeetingsScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly meetings: MeetingsService) {}

  onModuleInit(): void {
    const autoStart = process.env.MEETINGS_SCHEDULER_ENABLED !== 'false';
    if (!autoStart) {
      return;
    }
    this.timer = setInterval(() => {
      void this.runReminders().catch((error) =>
        console.error('[reuniones] planificador:', error),
      );
    }, 30_000);
    setTimeout(() => {
      void this.runReminders().catch(() => undefined);
    }, 2_000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** Público para pruebas: ejecuta una pasada de recordatorios. */
  async runReminders(): Promise<number> {
    return this.meetings.runReminders();
  }
}
