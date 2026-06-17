export type EntityId = number;

export type TimestampFields = {
  createdAt: string;
  updatedAt: string;
};

export type Moto = TimestampFields & {
  id?: EntityId;
  apelido: string;
  marca: string;
  modelo: string;
  ano: number;
  kmAtual: number;
  capacidadeTanque: number;
  consumoMedioUrbano: number;
  consumoMedioEstrada: number;
};

export type Abastecimento = TimestampFields & {
  id?: EntityId;
  data: string;
  kmAtual: number;
  litros: number;
  valorTotal: number;
  precoPorLitro: number;
  cidadePosto: string;
  observacao?: string;
  consumoCalculado?: number;
  custoPorKm?: number;
};

export type Viagem = TimestampFields & {
  id?: EntityId;
  data: string;
  origem: string;
  destino: string;
  kmTotal: number;
  gasto: number;
  consumoMedio?: number;
  observacoes?: string;
  avaliacao?: string;
  comGarupa: boolean;
  condicaoEstrada?: string;
};

export type Manutencao = TimestampFields & {
  id?: EntityId;
  data: string;
  km: number;
  tipo: string;
  valor: number;
  local?: string;
  observacao?: string;
  proximaKm?: number;
};

export type PontoSalvo = TimestampFields & {
  id?: EntityId;
  nome: string;
  tipo: string;
  cidadeUf: string;
  endereco?: string;
  telefone?: string;
  observacao?: string;
  avaliacao?: string;
  linkMaps?: string;
};

export type ChecklistItem = {
  id: string;
  titulo: string;
  concluido: boolean;
  personalizado?: boolean;
};

export type Checklist = TimestampFields & {
  id?: EntityId;
  nome: string;
  tipo: string;
  itens: ChecklistItem[];
};

export type TemaConfiguracao = 'sistema' | 'claro' | 'escuro';
export type UnidadeConsumo = 'kmL' | 'L100km';

export type Configuracoes = TimestampFields & {
  id?: EntityId;
  tema: TemaConfiguracao;
  unidadeConsumo: UnidadeConsumo;
  margemSegurancaAutonomia: number;
};

export type RiderLogTables = {
  moto: Moto;
  abastecimentos: Abastecimento;
  viagens: Viagem;
  manutencoes: Manutencao;
  pontosSalvos: PontoSalvo;
  checklists: Checklist;
  configuracoes: Configuracoes;
};

export type TableName = keyof RiderLogTables;
