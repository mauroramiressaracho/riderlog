import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppFeedback } from '../components/AppFeedback';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import {
  abastecimentosRepository,
  motoRepository,
  useAbastecimentos,
  useMoto,
  type Abastecimento,
} from '../db';

type FuelFormState = {
  data: string;
  kmAtual: string;
  litros: string;
  valorTotal: string;
  precoPorLitro: string;
  cidadePosto: string;
  observacao: string;
};

const emptyForm: FuelFormState = {
  data: new Date().toISOString().slice(0, 10),
  kmAtual: '',
  litros: '',
  valorTotal: '',
  precoPorLitro: '',
  cidadePosto: '',
  observacao: '',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

function decimalNumber(value: string) {
  const sanitized = value.replace(/[^\d,.]/g, '').replace(',', '.');
  const [integerPart, decimalPart] = sanitized.split('.');

  if (decimalPart === undefined) {
    return integerPart;
  }

  return `${integerPart}.${decimalPart.slice(0, 2)}`;
}

function toNumber(value: string) {
  return Number(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function fuelToForm(abastecimento: Abastecimento): FuelFormState {
  return {
    data: abastecimento.data,
    kmAtual: String(abastecimento.kmAtual),
    litros: String(abastecimento.litros),
    valorTotal: String(abastecimento.valorTotal),
    precoPorLitro: String(abastecimento.precoPorLitro),
    cidadePosto: abastecimento.cidadePosto,
    observacao: abastecimento.observacao ?? '',
  };
}

function sortByNewest(abastecimentos: Abastecimento[]) {
  return [...abastecimentos].sort((first, second) => {
    const byDate = second.data.localeCompare(first.data);
    return byDate || second.kmAtual - first.kmAtual;
  });
}

function recalculateFuelLogs(abastecimentos: Abastecimento[]) {
  const orderedByKm = [...abastecimentos].sort((first, second) => {
    const byKm = first.kmAtual - second.kmAtual;
    return byKm || first.data.localeCompare(second.data);
  });

  return orderedByKm.map((abastecimento, index) => {
    const previous = orderedByKm[index - 1];
    const kmRodado = previous ? abastecimento.kmAtual - previous.kmAtual : 0;
    const consumoCalculado = kmRodado > 0 && abastecimento.litros > 0 ? kmRodado / abastecimento.litros : undefined;
    const custoPorKm = kmRodado > 0 ? abastecimento.valorTotal / kmRodado : undefined;

    return {
      ...abastecimento,
      consumoCalculado,
      custoPorKm,
    };
  });
}

async function saveRecalculatedLogs(nextLogs: Abastecimento[]) {
  const recalculated = recalculateFuelLogs(nextLogs);

  await Promise.all(
    recalculated.map((abastecimento) => {
      if (!abastecimento.id) {
        return Promise.resolve();
      }

      return abastecimentosRepository.update(abastecimento.id, {
        consumoCalculado: abastecimento.consumoCalculado,
        custoPorKm: abastecimento.custoPorKm,
      });
    }),
  );
}

export function FuelPage() {
  const { data: abastecimentos, isLoading } = useAbastecimentos();
  const { data: motos } = useMoto();
  const { confirm, showToast } = useAppFeedback();
  const moto = motos[0];
  const sortedAbastecimentos = useMemo(() => sortByNewest(abastecimentos), [abastecimentos]);
  const consumoMedioGeral = useMemo(() => {
    const consumosValidos = abastecimentos
      .map((abastecimento) => abastecimento.consumoCalculado)
      .filter((consumo): consumo is number => Boolean(consumo && consumo > 0));

    if (consumosValidos.length === 0) {
      return undefined;
    }

    return consumosValidos.reduce((total, consumo) => total + consumo, 0) / consumosValidos.length;
  }, [abastecimentos]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFuel, setEditingFuel] = useState<Abastecimento>();
  const [form, setForm] = useState<FuelFormState>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const litros = toNumber(form.litros);
    const valorTotal = toNumber(form.valorTotal);

    if (litros > 0 && valorTotal > 0) {
      const precoPorLitro = valorTotal / litros;
      setForm((current) => ({
        ...current,
        precoPorLitro: precoPorLitro.toFixed(2),
      }));
    }
  }, [form.litros, form.valorTotal]);

  function openNewForm() {
    setEditingFuel(undefined);
    setForm({
      ...emptyForm,
      kmAtual: moto?.kmAtual ? String(moto.kmAtual) : '',
    });
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function openEditForm(abastecimento: Abastecimento) {
    setEditingFuel(abastecimento);
    setForm(fuelToForm(abastecimento));
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingFuel(undefined);
  }

  function updateField(field: keyof FuelFormState, value: string) {
    setSaveStatus('idle');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveStatus === 'saving') return;

    if (!form.data) {
      showToast('Informe a data do abastecimento.', 'warning');
      return;
    }

    if (toNumber(form.kmAtual) < 0) {
      showToast('Km atual não pode ser negativo.', 'warning');
      return;
    }

    if (toNumber(form.litros) <= 0) {
      showToast('Litros abastecidos precisa ser maior que zero.', 'warning');
      return;
    }

    if (toNumber(form.valorTotal) <= 0) {
      showToast('Valor total precisa ser maior que zero.', 'warning');
      return;
    }

    if (toNumber(form.precoPorLitro) <= 0) {
      showToast('Preço por litro precisa ser maior que zero.', 'warning');
      return;
    }

    if (!form.cidadePosto.trim()) {
      showToast('Informe a cidade ou posto.', 'warning');
      return;
    }

    setSaveStatus('saving');

    const payload = {
      data: form.data,
      kmAtual: toNumber(form.kmAtual),
      litros: toNumber(form.litros),
      valorTotal: toNumber(form.valorTotal),
      precoPorLitro: toNumber(form.precoPorLitro),
      cidadePosto: form.cidadePosto.trim(),
      observacao: form.observacao.trim() || undefined,
      consumoCalculado: undefined,
      custoPorKm: undefined,
    };

    try {
      if (editingFuel?.id) {
        await abastecimentosRepository.update(editingFuel.id, payload);
      } else {
        await abastecimentosRepository.create(payload);
      }

      const nextLogs = await abastecimentosRepository.list();
      await saveRecalculatedLogs(nextLogs);

      if (moto?.id && payload.kmAtual > moto.kmAtual) {
        await motoRepository.update(moto.id, { kmAtual: payload.kmAtual });
      }

      setSaveStatus('saved');
      showToast(editingFuel ? 'Abastecimento atualizado com sucesso.' : 'Abastecimento registrado com sucesso.', 'success');
      setTimeout(() => {
        closeForm();
      }, 650);
    } catch {
      setSaveStatus('error');
      showToast('Erro ao salvar abastecimento.', 'error');
    }
  }

  async function handleDelete(abastecimento: Abastecimento) {
    if (!abastecimento.id) {
      return;
    }

    const confirmed = await confirm({
      title: 'Excluir abastecimento',
      message: 'Tem certeza que deseja excluir este registro?',
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await abastecimentosRepository.remove(abastecimento.id);
      const nextLogs = await abastecimentosRepository.list();
      await saveRecalculatedLogs(nextLogs);
      showToast('Abastecimento excluído.', 'success');
    } catch {
      showToast('Não foi possível excluir o abastecimento.', 'error');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Abastecimentos"
        title="Controle de combustível"
        description="Registre cada parada no posto e acompanhe consumo, custo por km e histórico."
      />

      {saveStatus === 'saved' && !isFormOpen ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Abastecimento salvo e cálculos atualizados.
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-asphalt p-4 text-white shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">Média geral</p>
          <p className="mt-2 text-2xl font-black">
            {consumoMedioGeral ? `${decimalFormatter.format(consumoMedioGeral)} km/l` : 'Pendente'}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Registros</p>
          <p className="mt-2 text-2xl font-black text-asphalt">{abastecimentos.length}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={openNewForm}
        className="mb-5 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99]"
      >
        Novo abastecimento
      </button>

      {isLoading ? (
        <div className="rounded-[2rem] bg-white p-5 text-center font-bold text-gray-500 shadow-soft">
          Carregando abastecimentos...
        </div>
      ) : null}

      {!isLoading && sortedAbastecimentos.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-orange-300 bg-orange-50 p-5">
          <p className="text-lg font-black text-asphalt">Nenhum abastecimento registrado.</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Cadastre o primeiro abastecimento para começar a calcular consumo e custo por km.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {sortedAbastecimentos.map((abastecimento) => (
          <article key={abastecimento.id} className="rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
                  {formatDate(abastecimento.data)}
                </p>
                <h2 className="mt-1 text-xl font-black text-asphalt">
                  {decimalFormatter.format(abastecimento.kmAtual)} km
                </h2>
                <p className="mt-1 text-sm font-semibold text-gray-500">{abastecimento.cidadePosto}</p>
              </div>
              <span className="rounded-2xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-700">
                {decimalFormatter.format(abastecimento.litros)} L
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Valor</p>
                <p className="mt-1 font-black text-asphalt">{currencyFormatter.format(abastecimento.valorTotal)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Preço/L</p>
                <p className="mt-1 font-black text-asphalt">{currencyFormatter.format(abastecimento.precoPorLitro)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Consumo</p>
                <p className="mt-1 font-black text-asphalt">
                  {abastecimento.consumoCalculado
                    ? `${decimalFormatter.format(abastecimento.consumoCalculado)} km/l`
                    : 'Pendente'}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Custo/km</p>
                <p className="mt-1 font-black text-asphalt">
                  {abastecimento.custoPorKm ? currencyFormatter.format(abastecimento.custoPorKm) : 'Pendente'}
                </p>
              </div>
            </div>

            {abastecimento.observacao ? (
              <p className="mt-3 rounded-2xl bg-sand px-3 py-2 text-sm font-semibold text-gray-600">
                {abastecimento.observacao}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openEditForm(abastecimento)}
                className="h-12 rounded-2xl bg-asphalt text-sm font-black text-white active:scale-[0.99]"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(abastecimento)}
                className="h-12 rounded-2xl bg-red-50 text-sm font-black text-red-600 active:scale-[0.99]"
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-30 mx-auto max-w-md bg-asphalt/50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 backdrop-blur-sm">
          <div className="flex max-h-full flex-col rounded-[2rem] bg-sand shadow-soft">
            <div className="flex items-center justify-between border-b border-white/70 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
                  {editingFuel ? 'Editar' : 'Novo'}
                </p>
                <h2 className="text-xl font-black text-asphalt">Abastecimento</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="grid size-11 place-items-center rounded-2xl bg-white text-2xl font-black text-gray-500"
                aria-label="Fechar formulário"
              >
                ×
              </button>
            </div>

            <form className="space-y-4 overflow-y-auto p-4" onSubmit={handleSubmit}>
              {saveStatus === 'saved' ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
                  Salvo com sucesso.
                </div>
              ) : null}

              {saveStatus === 'error' ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                  Não foi possível salvar. Tente novamente.
                </div>
              ) : null}

              <div className="rounded-[2rem] bg-white p-5 shadow-soft">
                <div className="space-y-4">
                  <FormField
                    id="fuel-date"
                    label="Data"
                    type="date"
                    value={form.data}
                    onChange={(event) => updateField('data', event.target.value)}
                    required
                  />
                  <FormField
                    id="fuel-km"
                    label="Km atual"
                    inputMode="numeric"
                    placeholder="12500"
                    value={form.kmAtual}
                    onChange={(event) => updateField('kmAtual', onlyNumbers(event.target.value))}
                    required
                  />
                  <FormField
                    id="fuel-liters"
                    label="Litros abastecidos"
                    inputMode="decimal"
                    placeholder="13,5"
                    value={form.litros}
                    onChange={(event) => updateField('litros', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="fuel-total"
                    label="Valor total pago"
                    inputMode="decimal"
                    placeholder="100,00"
                    value={form.valorTotal}
                    onChange={(event) => updateField('valorTotal', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="fuel-price"
                    label="Preço por litro"
                    inputMode="decimal"
                    placeholder="Calculado automaticamente"
                    value={form.precoPorLitro}
                    onChange={(event) => updateField('precoPorLitro', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="fuel-place"
                    label="Cidade/posto"
                    placeholder="Cuiabá - Posto Estrada"
                    value={form.cidadePosto}
                    onChange={(event) => updateField('cidadePosto', event.target.value)}
                    required
                  />
                  <FormField
                    id="fuel-note"
                    label="Observação"
                    placeholder="Gasolina comum, viagem, chuva..."
                    value={form.observacao}
                    onChange={(event) => updateField('observacao', event.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar abastecimento'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
