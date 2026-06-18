import { type FormEvent, useMemo, useState } from 'react';
import { useAppFeedback } from '../components/AppFeedback';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { manutencoesRepository, motoRepository, useManutencoes, useMoto, type Manutencao } from '../db';

type MaintenanceFormState = {
  data: string;
  km: string;
  tipo: string;
  valor: string;
  local: string;
  observacao: string;
  proximaKm: string;
};

type SortMode = 'data' | 'km';

const maintenanceTypes = [
  'Troca de óleo',
  'Filtro de óleo',
  'Filtro de ar',
  'Lubrificação de corrente',
  'Ajuste de corrente',
  'Relação',
  'Pneus',
  'Pastilhas de freio',
  'Fluido de freio',
  'Revisão',
  'Bateria',
  'Acessório instalado',
  'Seguro',
  'IPVA/licenciamento',
  'Outro',
];

const emptyForm: MaintenanceFormState = {
  data: new Date().toISOString().slice(0, 10),
  km: '',
  tipo: '',
  valor: '',
  local: '',
  observacao: '',
  proximaKm: '',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
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

function maintenanceToForm(manutencao: Manutencao): MaintenanceFormState {
  return {
    data: manutencao.data,
    km: String(manutencao.km),
    tipo: manutencao.tipo,
    valor: String(manutencao.valor),
    local: manutencao.local ?? '',
    observacao: manutencao.observacao ?? '',
    proximaKm: manutencao.proximaKm ? String(manutencao.proximaKm) : '',
  };
}

function getMaintenanceAlert(kmAtual?: number, proximaKm?: number) {
  if (!kmAtual || !proximaKm) {
    return undefined;
  }

  if (kmAtual >= proximaKm) {
    return {
      label: 'Manutenção vencida',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }

  if (proximaKm - kmAtual < 500) {
    return {
      label: 'Manutenção próxima',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };
  }

  return undefined;
}

export function ManutencaoPage() {
  const { data: manutencoes, isLoading } = useManutencoes();
  const { data: motos } = useMoto();
  const { confirm, showToast } = useAppFeedback();
  const moto = motos[0];
  const [sortMode, setSortMode] = useState<SortMode>('data');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Manutencao>();
  const [form, setForm] = useState<MaintenanceFormState>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const sortedMaintenances = useMemo(() => {
    return [...manutencoes].sort((first, second) => {
      if (sortMode === 'km') {
        return second.km - first.km || second.data.localeCompare(first.data);
      }

      return second.data.localeCompare(first.data) || second.km - first.km;
    });
  }, [manutencoes, sortMode]);

  function openNewForm() {
    setEditingMaintenance(undefined);
    setForm({
      ...emptyForm,
      km: moto?.kmAtual ? String(moto.kmAtual) : '',
    });
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function openEditForm(manutencao: Manutencao) {
    setEditingMaintenance(manutencao);
    setForm(maintenanceToForm(manutencao));
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingMaintenance(undefined);
  }

  function updateField(field: keyof MaintenanceFormState, value: string) {
    setSaveStatus('idle');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveStatus === 'saving') return;

    if (!form.data) {
      showToast('Informe a data da manutenção.', 'warning');
      return;
    }

    if (toNumber(form.km) < 0) {
      showToast('Km da manutenção não pode ser negativo.', 'warning');
      return;
    }

    if (!form.tipo.trim()) {
      showToast('Tipo de manutenção é obrigatório.', 'warning');
      return;
    }

    if (toNumber(form.valor) < 0) {
      showToast('Valor gasto não pode ser negativo.', 'warning');
      return;
    }

    setSaveStatus('saving');

    const payload = {
      data: form.data,
      km: toNumber(form.km),
      tipo: form.tipo.trim(),
      valor: toNumber(form.valor),
      local: form.local.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      proximaKm: form.proximaKm ? toNumber(form.proximaKm) : undefined,
    };

    try {
      if (editingMaintenance?.id) {
        await manutencoesRepository.update(editingMaintenance.id, payload);
      } else {
        await manutencoesRepository.create(payload);
      }

      if (moto?.id && payload.km > moto.kmAtual) {
        await motoRepository.update(moto.id, { kmAtual: payload.km });
      }

      setSaveStatus('saved');
      showToast(editingMaintenance ? 'Manutenção atualizada com sucesso.' : 'Manutenção registrada com sucesso.', 'success');
      setTimeout(() => closeForm(), 650);
    } catch {
      setSaveStatus('error');
      showToast('Erro ao salvar manutenção.', 'error');
    }
  }

  async function handleDelete(manutencao: Manutencao) {
    if (!manutencao.id) {
      return;
    }

    const confirmed = await confirm({
      title: 'Excluir manutenção',
      message: 'Tem certeza que deseja excluir este registro?',
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await manutencoesRepository.remove(manutencao.id);
      showToast('Manutenção excluída.', 'success');
    } catch {
      showToast('Não foi possível excluir a manutenção.', 'error');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Manutenção"
        title="Cuidados da moto"
        description="Registre serviços, gastos e próximas revisões para não ser surpreendido na estrada."
      />

      {saveStatus === 'saved' && !isFormOpen ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Manutenção salva no histórico.
        </div>
      ) : null}

      <div className="mb-4 rounded-[2rem] bg-asphalt p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-orange-200">Km atual da moto</p>
        <h2 className="mt-1 text-3xl font-black">{moto ? `${numberFormatter.format(moto.kmAtual)} km` : 'Não cadastrado'}</h2>
        <p className="mt-2 text-sm font-semibold text-white/60">
          {moto ? moto.apelido : 'Cadastre sua moto para ativar alertas por quilometragem.'}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSortMode('data')}
          className={`h-12 rounded-2xl text-sm font-black shadow-soft active:scale-[0.99] ${
            sortMode === 'data' ? 'bg-asphalt text-white' : 'bg-white text-asphalt'
          }`}
        >
          Mais recentes
        </button>
        <button
          type="button"
          onClick={() => setSortMode('km')}
          className={`h-12 rounded-2xl text-sm font-black shadow-soft active:scale-[0.99] ${
            sortMode === 'km' ? 'bg-asphalt text-white' : 'bg-white text-asphalt'
          }`}
        >
          Maior km
        </button>
      </div>

      <button
        type="button"
        onClick={openNewForm}
        className="mb-5 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99]"
      >
        Nova manutenção
      </button>

      {isLoading ? (
        <div className="rounded-[2rem] bg-white p-5 text-center font-bold text-gray-500 shadow-soft">
          Carregando manutenções...
        </div>
      ) : null}

      {!isLoading && sortedMaintenances.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-orange-300 bg-orange-50 p-5">
          <p className="text-lg font-black text-asphalt">Nenhuma manutenção registrada.</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Comece registrando trocas de óleo, revisões, pneus e outros cuidados da moto.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {sortedMaintenances.map((manutencao) => {
          const alert = getMaintenanceAlert(moto?.kmAtual, manutencao.proximaKm);

          return (
            <article key={manutencao.id} className="rounded-[2rem] bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
                    {formatDate(manutencao.data)}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-asphalt">{manutencao.tipo}</h2>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    {numberFormatter.format(manutencao.km)} km {manutencao.local ? `• ${manutencao.local}` : ''}
                  </p>
                </div>
                <span className="rounded-2xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-700">
                  {currencyFormatter.format(manutencao.valor)}
                </span>
              </div>

              {alert ? (
                <div className={`mt-4 rounded-2xl border px-3 py-2 text-sm font-black ${alert.className}`}>
                  {alert.label}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-400">Próxima em</p>
                  <p className="mt-1 font-black text-asphalt">
                    {manutencao.proximaKm ? `${numberFormatter.format(manutencao.proximaKm)} km` : 'Não informado'}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-400">Faltam</p>
                  <p className="mt-1 font-black text-asphalt">
                    {moto && manutencao.proximaKm
                      ? `${numberFormatter.format(Math.max(0, manutencao.proximaKm - moto.kmAtual))} km`
                      : '—'}
                  </p>
                </div>
              </div>

              {manutencao.observacao ? (
                <p className="mt-3 rounded-2xl bg-sand px-3 py-2 text-sm font-semibold text-gray-600">
                  {manutencao.observacao}
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openEditForm(manutencao)}
                  className="h-12 rounded-2xl bg-asphalt text-sm font-black text-white active:scale-[0.99]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(manutencao)}
                  className="h-12 rounded-2xl bg-red-50 text-sm font-black text-red-600 active:scale-[0.99]"
                >
                  Excluir
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-30 mx-auto max-w-md bg-asphalt/50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 backdrop-blur-sm">
          <div className="flex max-h-full flex-col rounded-[2rem] bg-sand shadow-soft">
            <div className="flex items-center justify-between border-b border-white/70 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
                  {editingMaintenance ? 'Editar' : 'Nova'}
                </p>
                <h2 className="text-xl font-black text-asphalt">Manutenção</h2>
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
                    id="maintenance-date"
                    label="Data"
                    type="date"
                    value={form.data}
                    onChange={(event) => updateField('data', event.target.value)}
                    required
                  />
                  <FormField
                    id="maintenance-km"
                    label="Km"
                    inputMode="numeric"
                    placeholder="12500"
                    value={form.km}
                    onChange={(event) => updateField('km', onlyNumbers(event.target.value))}
                    required
                  />
                  <FormField
                    id="maintenance-type"
                    label="Tipo de manutenção"
                    list="maintenance-types"
                    placeholder="Escolha ou digite outro tipo"
                    value={form.tipo}
                    onChange={(event) => updateField('tipo', event.target.value)}
                    required
                  />
                  <datalist id="maintenance-types">
                    {maintenanceTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  <FormField
                    id="maintenance-value"
                    label="Valor gasto"
                    inputMode="decimal"
                    placeholder="250,00"
                    value={form.valor}
                    onChange={(event) => updateField('valor', decimalNumber(event.target.value))}
                    required
                  />
                  <FormField
                    id="maintenance-place"
                    label="Oficina/local"
                    placeholder="Oficina, concessionária ou casa"
                    value={form.local}
                    onChange={(event) => updateField('local', event.target.value)}
                  />
                  <FormField
                    id="maintenance-next-km"
                    label="Próxima manutenção em qual km"
                    inputMode="numeric"
                    placeholder="15000"
                    value={form.proximaKm}
                    onChange={(event) => updateField('proximaKm', onlyNumbers(event.target.value))}
                  />
                  <FormField
                    id="maintenance-note"
                    label="Observação"
                    placeholder="Peças trocadas, garantia, detalhes..."
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
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar manutenção'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
