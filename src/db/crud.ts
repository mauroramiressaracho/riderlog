import type { Table } from 'dexie';
import { db } from './localDatabase';
import type { EntityId, RiderLogTables, TableName, TimestampFields } from './entities';

type EntityFor<TTableName extends TableName> = RiderLogTables[TTableName];
type EntityInput<TTableName extends TableName> = Omit<EntityFor<TTableName>, 'id' | 'createdAt' | 'updatedAt'>;
type EntityUpdate<TTableName extends TableName> = Partial<EntityInput<TTableName>>;

function nowIso() {
  return new Date().toISOString();
}

function table<TTableName extends TableName>(tableName: TTableName) {
  return db.table<EntityFor<TTableName>, EntityId>(tableName) as Table<EntityFor<TTableName>, EntityId>;
}

export function createCrud<TTableName extends TableName>(tableName: TTableName) {
  const getTable = () => table(tableName);

  return {
    async list() {
      return getTable().orderBy('updatedAt').reverse().toArray();
    },

    async getById(id: EntityId) {
      return getTable().get(id);
    },

    async create(data: EntityInput<TTableName>) {
      const timestamp = nowIso();
      const entity = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as EntityFor<TTableName> & TimestampFields;

      return getTable().add(entity);
    },

    async update(id: EntityId, data: EntityUpdate<TTableName>) {
      const changes = {
        ...data,
        updatedAt: nowIso(),
      } as Parameters<ReturnType<typeof getTable>['update']>[1];

      return getTable().update(id, changes);
    },

    async remove(id: EntityId) {
      await getTable().delete(id);
    },

    async clear() {
      await getTable().clear();
    },
  };
}

export const motoRepository = createCrud('moto');
export const abastecimentosRepository = createCrud('abastecimentos');
export const viagensRepository = createCrud('viagens');
export const manutencoesRepository = createCrud('manutencoes');
export const pontosSalvosRepository = createCrud('pontosSalvos');
export const checklistsRepository = createCrud('checklists');
export const configuracoesRepository = createCrud('configuracoes');
