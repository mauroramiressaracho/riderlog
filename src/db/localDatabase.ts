import Dexie, { type Table } from 'dexie';
import type {
  Abastecimento,
  Checklist,
  Configuracoes,
  Manutencao,
  Moto,
  PontoSalvo,
  Viagem,
} from './entities';

class RiderLogDatabase extends Dexie {
  moto!: Table<Moto, number>;
  abastecimentos!: Table<Abastecimento, number>;
  viagens!: Table<Viagem, number>;
  manutencoes!: Table<Manutencao, number>;
  pontosSalvos!: Table<PontoSalvo, number>;
  checklists!: Table<Checklist, number>;
  configuracoes!: Table<Configuracoes, number>;

  constructor() {
    super('riderlog');

    this.version(2).stores({
      moto: '++id, apelido, marca, modelo, kmAtual, updatedAt',
      abastecimentos: '++id, data, kmAtual, cidadePosto, updatedAt',
      viagens: '++id, data, origem, destino, updatedAt',
      manutencoes: '++id, data, km, tipo, proximaKm, updatedAt',
      pontosSalvos: '++id, nome, tipo, cidadeUf, updatedAt',
      checklists: '++id, nome, tipo, updatedAt',
      configuracoes: '++id, tema, unidadeConsumo, updatedAt',
    });
  }
}

export const db = new RiderLogDatabase();
