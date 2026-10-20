import type { SQLiteDatabase } from 'expo-sqlite';

import type { Goal, Program, RoutineDay, RoutineExercise, Sex } from '@/catalog/types';
import { dayKey } from '@/logic/dates';
import type { Effort, ExerciseHistoryEntry, LoggedSet, TimedSet } from '@/logic/types';

// ---------- Perfil ----------

export interface Profile {
  nome: string;
  objetivo: Goal;
  sexo: Sex;
  pesoKg: number;
  alturaCm: number;
  metaAguaMl: number;
  descansoPadraoSeg: number;
  programaId: string | null;
  healthConnect: boolean;
  lembreteAgua: boolean;
  lembreteTreinoDias: number[];
  lembreteTreinoHora: number;
  ultimoBackupEm: string | null;
  sugerirAquecimento: boolean;
  criadoEm: string;
}

interface ProfileRow {
  nome: string;
  objetivo: Goal;
  sexo: Sex;
  peso_kg: number;
  altura_cm: number;
  meta_agua_ml: number;
  descanso_padrao_seg: number;
  programa_id: string | null;
  health_connect: number;
  lembrete_agua: number;
  lembrete_treino_dias: string;
  lembrete_treino_hora: number;
  ultimo_backup_em: string | null;
  sugerir_aquecimento: number;
  criado_em: string;
}

function parseDays(raw: string): number[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  const r = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
  if (!r) return null;
  return {
    nome: r.nome,
    objetivo: r.objetivo,
    sexo: r.sexo,
    pesoKg: r.peso_kg,
    alturaCm: r.altura_cm,
    metaAguaMl: r.meta_agua_ml,
    descansoPadraoSeg: r.descanso_padrao_seg,
    programaId: r.programa_id,
    healthConnect: r.health_connect === 1,
    lembreteAgua: r.lembrete_agua === 1,
    lembreteTreinoDias: parseDays(r.lembrete_treino_dias),
    lembreteTreinoHora: r.lembrete_treino_hora,
    ultimoBackupEm: r.ultimo_backup_em,
    sugerirAquecimento: r.sugerir_aquecimento !== 0,
    criadoEm: r.criado_em,
  };
}

export async function createProfile(
  db: SQLiteDatabase,
  p: Pick<Profile, 'nome' | 'objetivo' | 'sexo' | 'pesoKg' | 'alturaCm' | 'metaAguaMl' | 'programaId'>,
) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO profile (id, nome, objetivo, sexo, peso_kg, altura_cm, meta_agua_ml, programa_id, criado_em)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    p.nome,
    p.objetivo,
    p.sexo,
    p.pesoKg,
    p.alturaCm,
    p.metaAguaMl,
    p.programaId,
    now,
  );
  await addBodyMeasure(db, { pesoKg: p.pesoKg });
}

const PROFILE_COLUMNS: Record<keyof Omit<Profile, 'criadoEm'>, string> = {
  nome: 'nome',
  objetivo: 'objetivo',
  sexo: 'sexo',
  pesoKg: 'peso_kg',
  alturaCm: 'altura_cm',
  metaAguaMl: 'meta_agua_ml',
  descansoPadraoSeg: 'descanso_padrao_seg',
  programaId: 'programa_id',
  healthConnect: 'health_connect',
  lembreteAgua: 'lembrete_agua',
  lembreteTreinoDias: 'lembrete_treino_dias',
  lembreteTreinoHora: 'lembrete_treino_hora',
  ultimoBackupEm: 'ultimo_backup_em',
  sugerirAquecimento: 'sugerir_aquecimento',
};

export async function updateProfile(db: SQLiteDatabase, patch: Partial<Omit<Profile, 'criadoEm'>>) {
  const entries = Object.entries(patch) as [keyof typeof PROFILE_COLUMNS, unknown][];
  if (entries.length === 0) return;
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [key, value] of entries) {
    sets.push(`${PROFILE_COLUMNS[key]} = ?`);
    if (typeof value === 'boolean') values.push(value ? 1 : 0);
    else if (Array.isArray(value)) values.push(JSON.stringify(value));
    else values.push(value as string | number | null);
  }
  await db.runAsync(`UPDATE profile SET ${sets.join(', ')} WHERE id = 1`, ...values);
}

// ---------- Sessões ----------

export type SessionStatus = 'ativa' | 'concluida';

export interface SessionRow {
  id: number;
  programa_id: string | null;
  dia_id: string | null;
  nome: string;
  status: SessionStatus;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_seg: number | null;
  kcal: number | null;
  kcal_fonte: 'relogio' | 'estimativa' | null;
  fc_media: number | null;
  fc_max: number | null;
  peso_corporal_kg: number | null;
  observacao: string | null;
}

export interface SessionExerciseRow {
  id: number;
  session_id: number;
  exercicio_id: string;
  ordem: number;
  substituto_de: string | null;
  reps_min: number;
  reps_max: number;
  descanso_seg: number;
  duracao_seg: number | null;
}

export interface SetRow {
  id: number;
  session_exercise_id: number;
  ordem: number;
  peso_kg: number | null;
  reps: number | null;
  duracao_seg: number | null;
  esforco: Effort | null;
  aquecimento: number;
  concluida: number;
  concluida_em: string | null;
}

export interface SessionDetail {
  session: SessionRow;
  exercises: { item: SessionExerciseRow; sets: SetRow[] }[];
}

/** Valores iniciais de cada série ao criar a sessão (vêm da sugestão inteligente). */
export interface PlannedExercise extends RoutineExercise {
  pesoSugeridoKg: number | null;
  repsSugeridas: number | null;
  /** Séries de aquecimento inseridas antes das séries de trabalho. */
  aquecimento?: { pesoKg: number | null; reps: number }[];
}

export async function startSession(
  db: SQLiteDatabase,
  input: {
    programaId: string | null;
    diaId: string | null;
    nome: string;
    pesoCorporalKg: number | null;
    exercicios: PlannedExercise[];
  },
): Promise<number> {
  let sessionId = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO sessions (programa_id, dia_id, nome, status, iniciado_em, peso_corporal_kg)
       VALUES (?, ?, ?, 'ativa', ?, ?)`,
      input.programaId,
      input.diaId,
      input.nome,
      new Date().toISOString(),
      input.pesoCorporalKg,
    );
    sessionId = res.lastInsertRowId;
    for (let i = 0; i < input.exercicios.length; i++) {
      await insertSessionExercise(db, sessionId, i, input.exercicios[i]);
    }
  });
  return sessionId;
}

async function insertSessionExercise(
  db: SQLiteDatabase,
  sessionId: number,
  ordem: number,
  ex: PlannedExercise,
  substitutoDe: string | null = null,
): Promise<number> {
  const res = await db.runAsync(
    `INSERT INTO session_exercises (session_id, exercicio_id, ordem, substituto_de, reps_min, reps_max, descanso_seg, duracao_seg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    sessionId,
    ex.exercicioId,
    ordem,
    substitutoDe,
    ex.repsMin,
    ex.repsMax,
    ex.descansoSeg,
    ex.duracaoSeg ?? null,
  );
  const seId = res.lastInsertRowId;
  const warmups = ex.aquecimento ?? [];
  for (let w = 0; w < warmups.length; w++) {
    await db.runAsync(
      `INSERT INTO sets (session_exercise_id, ordem, peso_kg, reps, aquecimento) VALUES (?, ?, ?, ?, 1)`,
      seId,
      w,
      warmups[w].pesoKg,
      warmups[w].reps,
    );
  }
  for (let s = 0; s < ex.series; s++) {
    await db.runAsync(
      `INSERT INTO sets (session_exercise_id, ordem, peso_kg, reps, duracao_seg) VALUES (?, ?, ?, ?, ?)`,
      seId,
      warmups.length + s,
      ex.pesoSugeridoKg,
      ex.repsSugeridas,
      ex.duracaoSeg ?? null,
    );
  }
  return seId;
}

export async function getActiveSessionId(db: SQLiteDatabase): Promise<number | null> {
  const r = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM sessions WHERE status = 'ativa' ORDER BY id DESC LIMIT 1",
  );
  return r?.id ?? null;
}

export async function getSessionDetail(db: SQLiteDatabase, id: number): Promise<SessionDetail | null> {
  const session = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?', id);
  if (!session) return null;
  const items = await db.getAllAsync<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE session_id = ? ORDER BY ordem',
    id,
  );
  const sets = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s JOIN session_exercises se ON se.id = s.session_exercise_id
     WHERE se.session_id = ? ORDER BY s.ordem`,
    id,
  );
  return {
    session,
    exercises: items.map((item) => ({
      item,
      sets: sets.filter((s) => s.session_exercise_id === item.id),
    })),
  };
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: number,
  patch: { pesoKg?: number | null; reps?: number | null; duracaoSeg?: number | null; esforco?: Effort | null; aquecimento?: boolean },
) {
  const cols: string[] = [];
  const vals: (number | null)[] = [];
  if ('pesoKg' in patch) {
    cols.push('peso_kg = ?');
    vals.push(patch.pesoKg ?? null);
  }
  if ('reps' in patch) {
    cols.push('reps = ?');
    vals.push(patch.reps ?? null);
  }
  if ('duracaoSeg' in patch) {
    cols.push('duracao_seg = ?');
    vals.push(patch.duracaoSeg ?? null);
  }
  if ('esforco' in patch) {
    cols.push('esforco = ?');
    vals.push(patch.esforco ?? null);
  }
  if ('aquecimento' in patch) {
    cols.push('aquecimento = ?');
    vals.push(patch.aquecimento ? 1 : 0);
  }
  if (cols.length === 0) return;
  await db.runAsync(`UPDATE sets SET ${cols.join(', ')} WHERE id = ?`, ...vals, setId);
}

export async function setCompleted(db: SQLiteDatabase, setId: number, done: boolean) {
  await db.runAsync(
    'UPDATE sets SET concluida = ?, concluida_em = ? WHERE id = ?',
    done ? 1 : 0,
    done ? new Date().toISOString() : null,
    setId,
  );
}

export async function addSet(db: SQLiteDatabase, sessionExerciseId: number) {
  const last = await db.getFirstAsync<SetRow>(
    'SELECT * FROM sets WHERE session_exercise_id = ? ORDER BY aquecimento ASC, ordem DESC LIMIT 1',
    sessionExerciseId,
  );
  const maxOrdem = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(ordem) AS m FROM sets WHERE session_exercise_id = ?',
    sessionExerciseId,
  );
  await db.runAsync(
    'INSERT INTO sets (session_exercise_id, ordem, peso_kg, reps, duracao_seg) VALUES (?, ?, ?, ?, ?)',
    sessionExerciseId,
    (maxOrdem?.m ?? -1) + 1,
    last?.peso_kg ?? null,
    last?.reps ?? null,
    last?.duracao_seg ?? null,
  );
}

export async function removeSet(db: SQLiteDatabase, setId: number) {
  await db.runAsync('DELETE FROM sets WHERE id = ?', setId);
}

export async function getSessionExercise(db: SQLiteDatabase, id: number): Promise<SessionExerciseRow | null> {
  return db.getFirstAsync<SessionExerciseRow>('SELECT * FROM session_exercises WHERE id = ?', id);
}

/** Troca o exercício (máquina ocupada). Vale só para esta sessão. */
export async function swapSessionExercise(
  db: SQLiteDatabase,
  sessionExerciseId: number,
  novoExercicioId: string,
  pesoSugeridoKg: number | null,
  repsSugeridas: number | null,
) {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<SessionExerciseRow>(
      'SELECT * FROM session_exercises WHERE id = ?',
      sessionExerciseId,
    );
    if (!row) return;
    const original = row.substituto_de ?? row.exercicio_id;
    const voltandoAoOriginal = novoExercicioId === original;

    // Se já fez séries neste exercício, elas ficam nele; só as que faltam vão para a alternativa.
    const feitas = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM sets WHERE session_exercise_id = ? AND concluida = 1',
      sessionExerciseId,
    );
    if ((feitas?.n ?? 0) > 0) {
      await db.runAsync(
        'UPDATE session_exercises SET ordem = ordem + 1 WHERE session_id = ? AND ordem > ?',
        row.session_id,
        row.ordem,
      );
      const res = await db.runAsync(
        `INSERT INTO session_exercises (session_id, exercicio_id, ordem, substituto_de, reps_min, reps_max, descanso_seg, duracao_seg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row.session_id,
        novoExercicioId,
        row.ordem + 1,
        voltandoAoOriginal ? null : original,
        row.reps_min,
        row.reps_max,
        row.descanso_seg,
        row.duracao_seg,
      );
      await db.runAsync(
        'UPDATE sets SET session_exercise_id = ?, peso_kg = ?, reps = ? WHERE session_exercise_id = ? AND concluida = 0',
        res.lastInsertRowId,
        pesoSugeridoKg,
        repsSugeridas,
        sessionExerciseId,
      );
      return;
    }

    await db.runAsync(
      'UPDATE session_exercises SET exercicio_id = ?, substituto_de = ? WHERE id = ?',
      novoExercicioId,
      voltandoAoOriginal ? null : original,
      sessionExerciseId,
    );
    await db.runAsync(
      'UPDATE sets SET peso_kg = ?, reps = ? WHERE session_exercise_id = ? AND concluida = 0',
      pesoSugeridoKg,
      repsSugeridas,
      sessionExerciseId,
    );
  });
}

export async function addExerciseToSession(db: SQLiteDatabase, sessionId: number, ex: PlannedExercise) {
  const r = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(ordem) AS m FROM session_exercises WHERE session_id = ?',
    sessionId,
  );
  await insertSessionExercise(db, sessionId, (r?.m ?? -1) + 1, ex);
}

export async function removeSessionExercise(db: SQLiteDatabase, sessionExerciseId: number) {
  await db.runAsync('DELETE FROM sets WHERE session_exercise_id = ?', sessionExerciseId);
  await db.runAsync('DELETE FROM session_exercises WHERE id = ?', sessionExerciseId);
}

export async function finishSession(
  db: SQLiteDatabase,
  id: number,
  data: {
    duracaoSeg: number;
    kcal: number | null;
    kcalFonte: 'relogio' | 'estimativa' | null;
    fcMedia: number | null;
    fcMax: number | null;
  },
) {
  await db.withTransactionAsync(async () => {
    // Séries não marcadas não contam no histórico.
    await db.runAsync(
      `DELETE FROM sets WHERE concluida = 0 AND session_exercise_id IN
       (SELECT id FROM session_exercises WHERE session_id = ?)`,
      id,
    );
    await db.runAsync(
      `DELETE FROM session_exercises WHERE session_id = ? AND id NOT IN (SELECT session_exercise_id FROM sets)`,
      id,
    );
    await db.runAsync(
      `UPDATE sessions SET status = 'concluida', finalizado_em = ?, duracao_seg = ?, kcal = ?, kcal_fonte = ?, fc_media = ?, fc_max = ?
       WHERE id = ?`,
      new Date().toISOString(),
      data.duracaoSeg,
      data.kcal,
      data.kcalFonte,
      data.fcMedia,
      data.fcMax,
      id,
    );
  });
}

export async function deleteSession(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM sets WHERE session_exercise_id IN (SELECT id FROM session_exercises WHERE session_id = ?)',
      id,
    );
    await db.runAsync('DELETE FROM session_exercises WHERE session_id = ?', id);
    await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
  });
}

export interface SessionListItem extends SessionRow {
  series: number;
  volume_kg: number;
  exercicios: number;
}

export async function listCompletedSessions(db: SQLiteDatabase, limit = 50): Promise<SessionListItem[]> {
  return db.getAllAsync<SessionListItem>(
    `SELECT s.*,
       (SELECT COUNT(*) FROM sets st JOIN session_exercises se ON se.id = st.session_exercise_id
          WHERE se.session_id = s.id AND st.aquecimento = 0) AS series,
       (SELECT COALESCE(SUM(COALESCE(st.peso_kg, 0) * COALESCE(st.reps, 0)), 0) FROM sets st
          JOIN session_exercises se ON se.id = st.session_exercise_id
          WHERE se.session_id = s.id AND st.aquecimento = 0) AS volume_kg,
       (SELECT COUNT(*) FROM session_exercises se WHERE se.session_id = s.id) AS exercicios
     FROM sessions s WHERE s.status = 'concluida' ORDER BY s.iniciado_em DESC LIMIT ?`,
    limit,
  );
}

export async function getLastCompletedSession(db: SQLiteDatabase): Promise<SessionRow | null> {
  return db.getFirstAsync<SessionRow>(
    "SELECT * FROM sessions WHERE status = 'concluida' ORDER BY iniciado_em DESC LIMIT 1",
  );
}

export async function getPreviousSessionOfDay(
  db: SQLiteDatabase,
  programaId: string | null,
  diaId: string | null,
  beforeIso: string,
): Promise<SessionRow | null> {
  if (!diaId) return null;
  return db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE status = 'concluida' AND programa_id IS ? AND dia_id = ? AND iniciado_em < ?
     ORDER BY iniciado_em DESC LIMIT 1`,
    programaId,
    diaId,
    beforeIso,
  );
}

function toLoggedSet(r: SetRow): LoggedSet {
  return {
    pesoKg: r.peso_kg,
    reps: r.reps,
    duracaoSeg: r.duracao_seg,
    esforco: r.esforco,
    aquecimento: r.aquecimento === 1,
  };
}

/** Histórico de um exercício, do mais recente para o mais antigo. */
export async function getExerciseHistory(
  db: SQLiteDatabase,
  exercicioId: string,
  limit = 10,
  excludeSessionId?: number,
): Promise<ExerciseHistoryEntry[]> {
  const rows = await db.getAllAsync<SetRow & { sid: number; data: string }>(
    `SELECT st.*, s.id AS sid, s.iniciado_em AS data FROM sets st
     JOIN session_exercises se ON se.id = st.session_exercise_id
     JOIN sessions s ON s.id = se.session_id
     WHERE se.exercicio_id = ? AND s.status = 'concluida' AND st.concluida = 1 AND s.id IS NOT ?
       AND s.id IN (
         SELECT s2.id FROM sessions s2 JOIN session_exercises se2 ON se2.session_id = s2.id
         WHERE se2.exercicio_id = ? AND s2.status = 'concluida'
         ORDER BY s2.iniciado_em DESC LIMIT ?
       )
     ORDER BY s.iniciado_em DESC, st.ordem`,
    exercicioId,
    excludeSessionId ?? null,
    exercicioId,
    limit,
  );
  const map = new Map<number, ExerciseHistoryEntry>();
  for (const r of rows) {
    let e = map.get(r.sid);
    if (!e) {
      e = { sessionId: r.sid, data: r.data, sets: [] };
      map.set(r.sid, e);
    }
    e.sets.push(toLoggedSet(r));
  }
  return [...map.values()];
}

/** Séries concluídas desde uma data (recuperação muscular e volume semanal). */
export async function getCompletedSetsSince(db: SQLiteDatabase, sinceIso: string): Promise<TimedSet[]> {
  const rows = await db.getAllAsync<{ exercicio_id: string; concluida_em: string; aquecimento: number }>(
    `SELECT se.exercicio_id, st.concluida_em, st.aquecimento FROM sets st
     JOIN session_exercises se ON se.id = st.session_exercise_id
     WHERE st.concluida = 1 AND st.concluida_em >= ?`,
    sinceIso,
  );
  return rows.map((r) => ({ exercicioId: r.exercicio_id, concluidaEm: r.concluida_em, aquecimento: r.aquecimento === 1 }));
}

/** Exercícios que já têm histórico (para a lista de recordes). */
export async function listTrainedExerciseIds(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ exercicio_id: string }>(
    `SELECT DISTINCT se.exercicio_id FROM session_exercises se JOIN sessions s ON s.id = se.session_id
     WHERE s.status = 'concluida'`,
  );
  return rows.map((r) => r.exercicio_id);
}

export async function listSessionDates(db: SQLiteDatabase, sinceIso: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ iniciado_em: string }>(
    "SELECT iniciado_em FROM sessions WHERE status = 'concluida' AND iniciado_em >= ? ORDER BY iniciado_em",
    sinceIso,
  );
  return rows.map((r) => r.iniciado_em);
}

// ---------- Notas por exercício ----------

export async function getExerciseNote(db: SQLiteDatabase, exercicioId: string): Promise<string> {
  const r = await db.getFirstAsync<{ nota: string }>(
    'SELECT nota FROM exercise_notes WHERE exercicio_id = ?',
    exercicioId,
  );
  return r?.nota ?? '';
}

export async function setExerciseNote(db: SQLiteDatabase, exercicioId: string, nota: string) {
  if (nota.trim() === '') {
    await db.runAsync('DELETE FROM exercise_notes WHERE exercicio_id = ?', exercicioId);
    return;
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO exercise_notes (exercicio_id, nota) VALUES (?, ?)',
    exercicioId,
    nota,
  );
}

// ---------- Corpo ----------

export interface BodyMeasure {
  id: number;
  data: string;
  pesoKg: number | null;
  cinturaCm: number | null;
  quadrilCm: number | null;
  peitoCm: number | null;
  bracoCm: number | null;
  coxaCm: number | null;
  panturrilhaCm: number | null;
  gorduraPct: number | null;
}

export type BodyMeasureInput = Partial<Omit<BodyMeasure, 'id' | 'data'>>;

export async function addBodyMeasure(db: SQLiteDatabase, m: BodyMeasureInput) {
  await db.runAsync(
    `INSERT INTO body_measures (data, peso_kg, cintura_cm, quadril_cm, peito_cm, braco_cm, coxa_cm, panturrilha_cm, gordura_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    new Date().toISOString(),
    m.pesoKg ?? null,
    m.cinturaCm ?? null,
    m.quadrilCm ?? null,
    m.peitoCm ?? null,
    m.bracoCm ?? null,
    m.coxaCm ?? null,
    m.panturrilhaCm ?? null,
    m.gorduraPct ?? null,
  );
  if (m.pesoKg != null) await updateProfile(db, { pesoKg: m.pesoKg });
}

export async function listBodyMeasures(db: SQLiteDatabase): Promise<BodyMeasure[]> {
  const rows = await db.getAllAsync<{
    id: number;
    data: string;
    peso_kg: number | null;
    cintura_cm: number | null;
    quadril_cm: number | null;
    peito_cm: number | null;
    braco_cm: number | null;
    coxa_cm: number | null;
    panturrilha_cm: number | null;
    gordura_pct: number | null;
  }>('SELECT * FROM body_measures ORDER BY data ASC');
  return rows.map((r) => ({
    id: r.id,
    data: r.data,
    pesoKg: r.peso_kg,
    cinturaCm: r.cintura_cm,
    quadrilCm: r.quadril_cm,
    peitoCm: r.peito_cm,
    bracoCm: r.braco_cm,
    coxaCm: r.coxa_cm,
    panturrilhaCm: r.panturrilha_cm,
    gorduraPct: r.gordura_pct,
  }));
}

export async function deleteBodyMeasure(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM body_measures WHERE id = ?', id);
}

export type PhotoPose = 'frente' | 'lado' | 'costas';

export interface ProgressPhoto {
  id: number;
  data: string;
  arquivo: string;
  pose: PhotoPose;
  observacao: string | null;
}

export async function addProgressPhoto(db: SQLiteDatabase, arquivo: string, pose: PhotoPose) {
  await db.runAsync(
    'INSERT INTO progress_photos (data, arquivo, pose) VALUES (?, ?, ?)',
    new Date().toISOString(),
    arquivo,
    pose,
  );
}

export async function listProgressPhotos(db: SQLiteDatabase): Promise<ProgressPhoto[]> {
  return db.getAllAsync<ProgressPhoto>('SELECT * FROM progress_photos ORDER BY data DESC');
}

export async function deleteProgressPhoto(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM progress_photos WHERE id = ?', id);
}

// ---------- Água ----------

export async function addWater(db: SQLiteDatabase, ml: number) {
  await db.runAsync(
    'INSERT INTO water_log (dia, ml, registrado_em) VALUES (?, ?, ?)',
    dayKey(),
    ml,
    new Date().toISOString(),
  );
}

export async function undoLastWater(db: SQLiteDatabase) {
  await db.runAsync(
    'DELETE FROM water_log WHERE id = (SELECT id FROM water_log WHERE dia = ? ORDER BY id DESC LIMIT 1)',
    dayKey(),
  );
}

export async function getWaterTotal(db: SQLiteDatabase, dia: string = dayKey()): Promise<number> {
  const r = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(ml) AS total FROM water_log WHERE dia = ?',
    dia,
  );
  return r?.total ?? 0;
}

export async function getWaterByDay(db: SQLiteDatabase, sinceDay: string): Promise<{ dia: string; total: number }[]> {
  return db.getAllAsync<{ dia: string; total: number }>(
    'SELECT dia, SUM(ml) AS total FROM water_log WHERE dia >= ? GROUP BY dia ORDER BY dia',
    sinceDay,
  );
}

// ---------- Fichas criadas no celular ----------

interface CustomProgramRow {
  id: string;
  nome: string;
  dono: string;
  descricao: string;
  dias: string;
}

function parseDias(raw: string): RoutineDay[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function listCustomPrograms(db: SQLiteDatabase): Promise<Program[]> {
  const rows = await db.getAllAsync<CustomProgramRow>('SELECT * FROM custom_programs ORDER BY criado_em');
  return rows.map((r) => ({ id: r.id, nome: r.nome, dono: r.dono, descricao: r.descricao, dias: parseDias(r.dias) }));
}

export async function upsertCustomProgram(db: SQLiteDatabase, p: Program) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO custom_programs (id, nome, dono, descricao, dias, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, dono = excluded.dono, descricao = excluded.descricao,
       dias = excluded.dias, atualizado_em = excluded.atualizado_em`,
    p.id,
    p.nome,
    p.dono,
    p.descricao,
    JSON.stringify(p.dias),
    now,
    now,
  );
}

export async function deleteCustomProgram(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM custom_programs WHERE id = ?', id);
}

// ---------- Passo de carga cadastrado por máquina ----------

export async function listMachineSteps(db: SQLiteDatabase): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ maquina_id: string; passo_kg: number }>('SELECT * FROM machine_steps');
  return Object.fromEntries(rows.map((r) => [r.maquina_id, r.passo_kg]));
}

/** `passoKg` nulo volta ao valor do catálogo. */
export async function setMachineStep(db: SQLiteDatabase, maquinaId: string, passoKg: number | null) {
  if (passoKg == null) {
    await db.runAsync('DELETE FROM machine_steps WHERE maquina_id = ?', maquinaId);
    return;
  }
  await db.runAsync(
    'INSERT INTO machine_steps (maquina_id, passo_kg) VALUES (?, ?) ON CONFLICT(maquina_id) DO UPDATE SET passo_kg = excluded.passo_kg',
    maquinaId,
    passoKg,
  );
}
