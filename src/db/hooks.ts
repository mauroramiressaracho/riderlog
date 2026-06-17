import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { createCrud } from './crud';
import { db } from './localDatabase';
import type { EntityId, RiderLogTables, TableName } from './entities';

type UseCollectionState<TTableName extends TableName> = {
  data: RiderLogTables[TTableName][];
  isLoading: boolean;
  error?: Error;
};

export function useCollection<TTableName extends TableName>(tableName: TTableName) {
  const [state, setState] = useState<UseCollectionState<TTableName>>({
    data: [],
    isLoading: true,
  });

  useEffect(() => {
    const subscription = liveQuery(() =>
      db.table<RiderLogTables[TTableName], EntityId>(tableName).orderBy('updatedAt').reverse().toArray(),
    ).subscribe({
      next: (data) => setState({ data, isLoading: false }),
      error: (error: unknown) =>
        setState({
          data: [],
          isLoading: false,
          error: error instanceof Error ? error : new Error('Erro ao ler dados locais.'),
        }),
    });

    return () => subscription.unsubscribe();
  }, [tableName]);

  return {
    ...state,
    repository: createCrud(tableName),
  };
}

export const useMoto = () => useCollection('moto');
export const useAbastecimentos = () => useCollection('abastecimentos');
export const useViagens = () => useCollection('viagens');
export const useManutencoes = () => useCollection('manutencoes');
export const usePontosSalvos = () => useCollection('pontosSalvos');
export const useChecklists = () => useCollection('checklists');
export const useConfiguracoes = () => useCollection('configuracoes');
