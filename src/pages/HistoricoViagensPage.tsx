import { type FormEvent, useMemo, useState } from 'react';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { viagensRepository, useViagens, type Viagem } from '../db';

type TripHistoryFormState = {
  data: string;
  origem: string;
  destino: string;
  kmTotal: string;
  gasto: string;
  consumoMedio: string;
  observacoes: string;
  avaliacao: string;
  comGarupa: boolean;
  condicaoEstrada: string;
};

const roadConditions = ['Boa', 'Regular', 'Ruim', 'Chuva', 'Terra', 'Mista'];
const tripRatings = ['Excelente', 'Boa', 'Regular', 'Ruim'];

const emptyForm: TripHistoryFormState = {
  data: new Date().toISOString().slice(0, 10),
  origem: '',
  destino: '',
  kmTotal: '',
  gasto: '',
  consumoMedio: '',
  observacoes: '',
  avaliacao: '',
  comGarupa: false,
  condicaoEstrada: '',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

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

function shortText(value?: string) {
  if (!value) {
    return 'Sem observaÃ§Ãµes registradas.';
  }

  return value.length > 92 ? `${value.slice(0, 92).trim()}...` : value;
}

function tripToForm(viagem: Viagem): TripHistoryFormState {
  return {
    data: viagem.data,
    origem: viagem.origem,
    destino: viagem.destino,
    kmTotal: String(viagem.kmTotal),
    gasto: String(viagem.gasto),
    consumoMedio: viagem.consumoMedio ? String(viagem.consumoMedio) : '',
    observacoes: viagem.observacoes ?? '',
    avaliacao: viagem.avaliacao ?? '',
    comGarupa: viagem.comGarupa,
    condicaoEstrada: viagem.condicaoEstrada ?? '',
  };
}

export function HistoricoViagensPage() {
  const { data: viagens, isLoading } = useViagens();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Viagem>();
  const [form, setForm] = useState<TripHistoryFormState>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const sortedTrips = useMemo(() => {
    return [...viagens].sort((first, second) => second.data.localeCompare(first.data));
  }, [viagens]);

  function openNewForm() {
    setEditingTrip(undefined);
    setForm(emptyForm);
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function openEditForm(viagem: Viagem) {
    setEditingTrip(viagem);
    setForm(tripToForm(viagem));
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTrip(undefined);
  }

  function updateField(field: keyof TripHistoryFormState, value: string | boolean) {
    setSaveStatus('idle');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus('saving');

    const payload = {
      data: form.data,
      origem: form.origem.trim(),
      destino: form.destino.trim(),
      kmTotal: toNumber(form.kmTotal),
      gasto: toNumber(form.gasto),
      consumoMedio: form.consumoMedio ? toNumber(form.consumoMedio) : undefined,
      observacoes: form.observacoes.trim() || undefined,
      avaliacao: form.avaliacao || undefined,
      comGarupa: form.comGarupa,
      condicaoEstrada: form.condicaoEstrada || undefined,
    };

    try {
      if (editingTrip?.id) {
        await viagensRepository.update(editingTrip.id, payload);
      } else {
        await viagensRepository.create(payload);
      }

      setSaveStatus('saved');
      setTimeout(() => closeForm(), 650);
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDelete(viagem: Viagem) {
    if (!viagem.id) {
      return;
    }

    const confirmed = window.confirm('Excluir esta viagem do diÃ¡rio? Esta aÃ§Ã£o nÃ£o pode ser desfeita.');

    if (!confirmed) {
      return;
    }

    await viagensRepository.remove(viagem.id);
  }

  return (
    <section>
      <PageHeader
        eyebrow="HistÃ³rico de Viagens"
        title="DiÃ¡rio de bordo"
        description="Registre as viagens realizadas, gastos, condiÃ§Ãµes da estrada e memÃ³rias do caminho."
      />

      {saveStatus === 'saved' && !isFormOpen ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Viagem salva no diÃ¡rio de bordo.
        </div>
      ) : null}

      <div className="mb-4 rounded-[2rem] bg-asphalt p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-orange-200">Viagens registradas</p>
        <h2 className="mt-1 text-3xl font-black">{viagens.length}</h2>
        <p className="mt-2 text-sm font-semibold text-white/60">
          Cada card aqui vira memÃ³ria, estatÃ­stica e contexto para o dashboard.
        </p>
      </div>

      <button
        type="button"
        onClick={openNewForm}
        className="mb-5 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99]"
      >
        Registrar viagem
      </button>

      {isLoading ? (
        <div className="rounded-[2rem] bg-white p-5 text-center font-bold text-gray-500 shadow-soft">
          Carregando viagens...
        </div>
      ) : null}

      {!isLoading && sortedTrips.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-orange-300 bg-orange-50 p-5">
          <p className="text-lg font-black text-asphalt">Nenhuma viagem registrada.</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Quando o primeiro rolÃª entrar aqui, ele tambÃ©m aparece como Ãºltima viagem no dashboard.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {sortedTrips.map((viagem) => (
          <article key={viagem.id} className="rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
                  {formatDate(viagem.data)}
                </p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-asphalt">{viagem.destino}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500">Saindo de {viagem.origem}</p>
              </div>
              {viagem.avaliacao ? (
                <span className="rounded-2xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-700">
                  {viagem.avaliacao}
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Km total</p>
                <p className="mt-1 font-black text-asphalt">{numberFormatter.format(viagem.kmTotal)} km</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Gasto</p>
                <p className="mt-1 font-black text-asphalt">{currencyFormatter.format(viagem.gasto)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Consumo</p>
                <p className="mt-1 font-black text-asphalt">
                  {viagem.consumoMedio ? `${numberFormatter.format(viagem.consumoMedio)} km/l` : 'â€”'}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-400">Estrada</p>
                <p className="mt-1 font-black text-asphalt">{viagem.condicaoEstrada ?? 'â€”'}</p>
              </div>
            </div>

            <p className="mt-3 rounded-2xl bg-sand px-3 py-2 text-sm font-semibold leading-relaxed text-gray-600">
              {shortText(viagem.observacoes)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                {viagem.comGarupa ? 'Com garupa' : 'Solo'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openEditForm(viagem)}
                className="h-12 rounded-2xl bg-asphalt text-sm font-black text-white active:scale-[0.99]"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(viagem)}
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
                  {editingTrip ? 'Editar' : 'Nova'}
                </p>
                <h2 className="text-xl font-black text-asphalt">Viagem realizada</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="grid size-11 place-items-center rounded-2xl bg-white text-2xl font-black text-gray-500"
                aria-label="Fechar formulÃ¡rio"
              >
                Ã—
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
                  NÃ£o foi possÃ­vel salvar. Tente novamente.
                </div>
              ) : null}

              <div className="rounded-[2rem] bg-white p-5 shadow-soft">
                <div className="space-y-4">
                  <FormField
                    id="trip-history-date"
                    label="Data"
                    type="date"
                    value={form.data}
                    onChange={(event) => updateField('data', event.target.value)}
                    required
                  />
                  <FormField
                    id="trip-history-origin"
                    label="Origem"
                    placeholder="CuiabÃ¡"
                    value={form.origem}
                    onChange={(event) => updateField('origem', event.target.value)}
                    required
                  />
                  <FormField
                    id="trip-history-destination"
                    label="Destino"
                    placeholder="Chapada dos GuimarÃ£es"
                    value={form.destino}
                    onChange={(event) => updateField('destino', event.target.value)}
                    required
                  />
                  <FormField
                    id="trip-history-km"
                    label="Km total"
                    inputMode="decimal"
                    placeholder="300"
                    value={form.kmTotal}
                    onChange={(event) => updateField('kmTotal', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="trip-history-cost"
                    label="Gasto"
                    inputMode="decimal"
                    placeholder="180,00"
                    value={form.gasto}
                    onChange={(event) => updateField('gasto', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="trip-history-consumption"
                    label="Consumo mÃ©dio"
                    inputMode="decimal"
                    placeholder="30"
                    value={form.consumoMedio}
                    onChange={(event) => updateField('consumoMedio', decimalNumber(event.target.value))}
                  />

                  <label className="block" htmlFor="trip-history-rating">
                    <span className="text-sm font-extrabold text-gray-700">AvaliaÃ§Ã£o da viagem</span>
                    <select
                      id="trip-history-rating"
                      value={form.avaliacao}
                      onChange={(event) => updateField('avaliacao', event.target.value)}
                      className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-asphalt outline-none focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="">Selecione</option>
                      {tripRatings.map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block" htmlFor="trip-history-road">
                    <span className="text-sm font-extrabold text-gray-700">CondiÃ§Ã£o da estrada</span>
                    <select
                      id="trip-history-road"
                      value={form.condicaoEstrada}
                      onChange={(event) => updateField('condicaoEstrada', event.target.value)}
                      className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-asphalt outline-none focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="">Selecione</option>
                      {roadConditions.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-gray-50 px-4">
                    <input
                      type="checkbox"
                      checked={form.comGarupa}
                      onChange={(event) => updateField('comGarupa', event.target.checked)}
                      className="size-6 accent-orange-500"
                    />
                    <span className="text-base font-extrabold text-gray-700">Viagem com garupa</span>
                  </label>

                  <label className="block" htmlFor="trip-history-notes">
                    <span className="text-sm font-extrabold text-gray-700">ObservaÃ§Ãµes</span>
                    <textarea
                      id="trip-history-notes"
                      value={form.observacoes}
                      onChange={(event) => updateField('observacoes', event.target.value)}
                      placeholder="Paisagem, estrada, paradas, perrengues e boas memÃ³rias..."
                      className="mt-2 min-h-28 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-semibold text-asphalt outline-none transition placeholder:text-gray-400 focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar viagem'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

