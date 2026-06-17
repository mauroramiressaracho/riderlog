import { db } from './localDatabase';
import type { RiderLogTables, TableName } from './entities';

export type RiderLogBackup = {
  app: 'RiderLog';
  version: 1;
  exportedAt: string;
  data: {
    [Key in TableName]: RiderLogTables[Key][];
  };
};

const tableNames: TableName[] = [
  'moto',
  'abastecimentos',
  'viagens',
  'manutencoes',
  'pontosSalvos',
  'checklists',
  'configuracoes',
];

export async function exportBackup(): Promise<RiderLogBackup> {
  const entries = await Promise.all(
    tableNames.map(async (tableName) => [tableName, await db.table(tableName).toArray()] as const),
  );

  return {
    app: 'RiderLog',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(entries) as RiderLogBackup['data'],
  };
}

export function isValidBackup(value: unknown): value is RiderLogBackup {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const backup = value as Partial<RiderLogBackup>;

  if (backup.app !== 'RiderLog' || !backup.data || typeof backup.data !== 'object') {
    return false;
  }

  return tableNames.every((tableName) => Array.isArray(backup.data?.[tableName]));
}

export async function importBackup(backup: RiderLogBackup) {
  await db.transaction('rw', tableNames.map((tableName) => db.table(tableName)), async () => {
    await Promise.all(tableNames.map((tableName) => db.table(tableName).clear()));

    for (const tableName of tableNames) {
      const rows = backup.data[tableName];

      if (rows.length > 0) {
        await db.table(tableName).bulkAdd(rows);
      }
    }
  });
}

export async function clearAllData() {
  await db.transaction('rw', tableNames.map((tableName) => db.table(tableName)), async () => {
    await Promise.all(tableNames.map((tableName) => db.table(tableName).clear()));
  });
}
