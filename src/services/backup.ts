import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { BACKUP_TABLES, DATABASE_VERSION } from '@/db/schema';
import { dayKey } from '@/logic/dates';

import { photoFile, writePhotoFromBase64 } from './photos';

type Row = Record<string, string | number | null>;

interface BackupFile {
  app: 'dymra';
  formato: 1;
  schema: number;
  criadoEm: string;
  tabelas: Record<string, Row[]>;
  fotos: Record<string, string>;
}

/** Gera o arquivo de backup e abre o compartilhamento (Drive, WhatsApp, e-mail...). */
export async function exportBackup(db: SQLiteDatabase): Promise<void> {
  const tabelas: Record<string, Row[]> = {};
  for (const t of BACKUP_TABLES) {
    tabelas[t] = await db.getAllAsync<Row>(`SELECT * FROM ${t}`);
  }
  const fotos: Record<string, string> = {};
  for (const row of tabelas.progress_photos ?? []) {
    const nome = String(row.arquivo);
    try {
      const f = photoFile(nome);
      if (f.exists) fotos[nome] = await f.base64();
    } catch {
      // foto apagada manualmente: segue sem ela
    }
  }
  const data: BackupFile = {
    app: 'dymra',
    formato: 1,
    schema: DATABASE_VERSION,
    criadoEm: new Date().toISOString(),
    tabelas,
    fotos,
  };
  const file = new File(Paths.cache, `dymra-backup-${dayKey()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data));
  await db.runAsync('UPDATE profile SET ultimo_backup_em = ? WHERE id = 1', new Date().toISOString());
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do Dymra',
    });
  }
}

export class BackupError extends Error {}

/** Restaura um backup. Substitui TODOS os dados atuais. */
export async function importBackup(db: SQLiteDatabase): Promise<boolean> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || picked.assets.length === 0) return false;
  let data: BackupFile;
  try {
    data = JSON.parse(await new File(picked.assets[0].uri).text());
  } catch {
    throw new BackupError('Não consegui ler o arquivo. Ele é um backup do Dymra?');
  }
  if (data?.app !== 'dymra' || typeof data.tabelas !== 'object') {
    throw new BackupError('Este arquivo não é um backup do Dymra.');
  }
  if (data.schema > DATABASE_VERSION) {
    throw new BackupError('Este backup é de uma versão mais nova do app. Atualize o Dymra antes de restaurar.');
  }

  await db.withTransactionAsync(async () => {
    for (const t of [...BACKUP_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${t}`);
    }
    for (const t of BACKUP_TABLES) {
      const rows = data.tabelas[t] ?? [];
      if (rows.length === 0) continue;
      // Só aceita colunas que existem na tabela (protege contra arquivos adulterados).
      const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${t})`);
      const valid = new Set(info.map((c) => c.name));
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => valid.has(c));
        if (cols.length === 0) continue;
        await db.runAsync(
          `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          ...cols.map((c) => row[c]),
        );
      }
    }
  });

  for (const [nome, b64] of Object.entries(data.fotos ?? {})) {
    if (!/^[\w.-]+$/.test(nome)) continue;
    try {
      writePhotoFromBase64(nome, b64);
    } catch {
      // segue com as demais
    }
  }
  return true;
}
