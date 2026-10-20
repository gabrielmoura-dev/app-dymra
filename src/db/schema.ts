import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'dymra.db';

/**
 * Cada item é uma migração. Nunca altere uma migração já publicada:
 * adicione uma nova no fim da lista.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nome TEXT NOT NULL,
    objetivo TEXT NOT NULL,
    sexo TEXT NOT NULL,
    peso_kg REAL NOT NULL,
    altura_cm REAL NOT NULL,
    meta_agua_ml INTEGER NOT NULL DEFAULT 2500,
    descanso_padrao_seg INTEGER NOT NULL DEFAULT 90,
    programa_id TEXT,
    health_connect INTEGER NOT NULL DEFAULT 0,
    lembrete_agua INTEGER NOT NULL DEFAULT 0,
    lembrete_treino_dias TEXT NOT NULL DEFAULT '[]',
    lembrete_treino_hora INTEGER NOT NULL DEFAULT 18,
    ultimo_backup_em TEXT,
    criado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    programa_id TEXT,
    dia_id TEXT,
    nome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativa',
    iniciado_em TEXT NOT NULL,
    finalizado_em TEXT,
    duracao_seg INTEGER,
    kcal REAL,
    kcal_fonte TEXT,
    fc_media REAL,
    fc_max REAL,
    peso_corporal_kg REAL,
    observacao TEXT
  );

  CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercicio_id TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    substituto_de TEXT,
    reps_min INTEGER NOT NULL DEFAULT 8,
    reps_max INTEGER NOT NULL DEFAULT 12,
    descanso_seg INTEGER NOT NULL DEFAULT 90,
    duracao_seg INTEGER
  );

  CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    peso_kg REAL,
    reps INTEGER,
    duracao_seg INTEGER,
    esforco INTEGER,
    aquecimento INTEGER NOT NULL DEFAULT 0,
    concluida INTEGER NOT NULL DEFAULT 0,
    concluida_em TEXT
  );

  CREATE TABLE IF NOT EXISTS exercise_notes (
    exercicio_id TEXT PRIMARY KEY,
    nota TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS body_measures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    peso_kg REAL,
    cintura_cm REAL,
    quadril_cm REAL,
    peito_cm REAL,
    braco_cm REAL,
    coxa_cm REAL,
    panturrilha_cm REAL,
    gordura_pct REAL
  );

  CREATE TABLE IF NOT EXISTS progress_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    arquivo TEXT NOT NULL,
    pose TEXT NOT NULL,
    observacao TEXT
  );

  CREATE TABLE IF NOT EXISTS water_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia TEXT NOT NULL,
    ml INTEGER NOT NULL,
    registrado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_se_session ON session_exercises(session_id);
  CREATE INDEX IF NOT EXISTS idx_se_exercicio ON session_exercises(exercicio_id);
  CREATE INDEX IF NOT EXISTS idx_sets_se ON sets(session_exercise_id);
  CREATE INDEX IF NOT EXISTS idx_water_dia ON water_log(dia);
  `,
  `
  CREATE TABLE IF NOT EXISTS custom_programs (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    dono TEXT NOT NULL DEFAULT '',
    descricao TEXT NOT NULL DEFAULT '',
    dias TEXT NOT NULL DEFAULT '[]',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS machine_steps (
    maquina_id TEXT PRIMARY KEY,
    passo_kg REAL NOT NULL
  );

  ALTER TABLE profile ADD COLUMN sugerir_aquecimento INTEGER NOT NULL DEFAULT 1;
  `,
];

export const DATABASE_VERSION = MIGRATIONS.length;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  if (current === 0) {
    await db.execAsync("PRAGMA journal_mode = 'wal';");
  }
  while (current < DATABASE_VERSION) {
    await db.execAsync(MIGRATIONS[current]);
    current += 1;
    await db.execAsync(`PRAGMA user_version = ${current}`);
  }
}

/**
 * Tabelas incluídas no backup, na ordem segura para restaurar.
 * As fotos de progresso ficam de fora (decisão de vocês): continuam só no celular.
 */
export const BACKUP_TABLES = [
  'profile',
  'sessions',
  'session_exercises',
  'sets',
  'exercise_notes',
  'body_measures',
  'water_log',
  'custom_programs',
  'machine_steps',
] as const;
