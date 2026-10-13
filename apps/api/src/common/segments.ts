import { BadRequestException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/db.module';
import { groups, learners, programs } from '../db/schema';
import { JOURNEYS } from '../directory/dto/groups.dto';

/** Referencia de segmento compartida por M6 (publicaciones) y M7 (encuestas). */
export interface SegmentRef {
  segmentType: string;
  segmentValue: string;
}

export interface SegmentLearner {
  id: string;
  fullName: string;
  email: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida que el segmento (programa | ficha | jornada) exista en el centro. */
export async function validateSegment(
  db: Database,
  segment: SegmentRef,
): Promise<void> {
  if (segment.segmentType === 'jornada') {
    if (!JOURNEYS.includes(segment.segmentValue as (typeof JOURNEYS)[number])) {
      throw new BadRequestException('Jornada inválida');
    }
    return;
  }
  if (!UUID_PATTERN.test(segment.segmentValue)) {
    throw new BadRequestException('Identificador de segmento inválido');
  }
  if (segment.segmentType === 'ficha') {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, segment.segmentValue))
      .limit(1);
    if (!group) {
      throw new BadRequestException('La ficha indicada no existe');
    }
    return;
  }
  const [program] = await db
    .select()
    .from(programs)
    .where(eq(programs.id, segment.segmentValue))
    .limit(1);
  if (!program) {
    throw new BadRequestException('El programa indicado no existe');
  }
}

/** Resuelve los aprendices activos del segmento (sin segmentos = todo el centro). */
export async function resolveSegmentLearners(
  db: Database,
  segments: SegmentRef[],
): Promise<SegmentLearner[]> {
  const map = new Map<string, SegmentLearner>();
  const add = (learner: {
    id: string;
    fullName: string;
    email: string | null;
  }): void => {
    map.set(learner.id, {
      id: learner.id,
      fullName: learner.fullName,
      email: learner.email,
    });
  };

  if (segments.length === 0) {
    const all = await db
      .select()
      .from(learners)
      .where(eq(learners.status, 'activo'));
    for (const learner of all) {
      add(learner);
    }
    return [...map.values()];
  }

  for (const segment of segments) {
    if (segment.segmentType === 'ficha') {
      const rows = await db
        .select()
        .from(learners)
        .where(
          and(
            eq(learners.groupId, segment.segmentValue),
            eq(learners.status, 'activo'),
          ),
        );
      for (const learner of rows) {
        add(learner);
      }
      continue;
    }
    const column =
      segment.segmentType === 'jornada' ? groups.journey : groups.programId;
    const rows = await db
      .select({ learner: learners })
      .from(learners)
      .innerJoin(groups, eq(learners.groupId, groups.id))
      .where(
        and(eq(column, segment.segmentValue), eq(learners.status, 'activo')),
      );
    for (const row of rows) {
      add(row.learner);
    }
  }
  return [...map.values()];
}
