import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { configuracoesRepository, useConfiguracoes, type Configuracoes, type TemaConfiguracao } from '../db';

type SettingsForm = {
  tema: TemaConfiguracao;
  margemSegurancaAutonomia: string;
};

const defaultSettings: SettingsForm = {
  tema: 'sistema',
  margemSegurancaAutonomia: '15',
};

function toNumber(value: string) {
  return Number(value || 0);
}

function settingsToForm(settings?: Configuracoes): SettingsForm {
  if (!settings) {
    return defaultSettings;
  }

  return {
    tema: settings.tema,
    margemSegurancaAutonomia: String(settings.margemSegurancaAutonomia),
  };
}

export function ConfiguracoesPage() {
  const { data: configuracoes } = useConfiguracoes();
  const settings = useMemo(() => configuracoes[0], [configuracoes]);
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setForm(settingsToForm(settings));
  }, [settings]);

  useEffect(() => {
    if (form.tema === 'sistema') {
      document.documentElement.style.removeProperty('color-scheme');
      return;
    }

    document.documentElement.style.colorScheme = form.tema === 'escuro' ? 'dark' : 'light';
  }, [form.tema]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      tema: form.tema,
      unidadeConsumo: 'kmL' as const,
      margemSegurancaAutonomia: toNumber(form.margemSegurancaAutonomia),
    };

    if (settings?.id) {
      await configuracoesRepository.update(settings.id, payload);
    } else {
      await configuracoesRepository.create(payload);
    }

    setFeedback('ConfiguraÃ§Ãµes salvas.');
    window.setTimeout(() => setFeedback(''), 1600);
  }

  return (
    <section>
      <PageHeader
        eyebrow="ConfiguraÃ§Ãµes"
        title="PreferÃªncias do RiderLog"
        description="Ajuste preferÃªncias locais do app. Tudo fica salvo apenas neste navegador."
      />

      {feedback ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {feedback}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-black text-asphalt">AparÃªncia</h2>
          <label className="block" htmlFor="theme">
            <span className="text-sm font-extrabold text-gray-700">Tema</span>
            <select
              id="theme"
              value={form.tema}
              onChange={(event) => setForm((current) => ({ ...current, tema: event.target.value as TemaConfiguracao }))}
              className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-asphalt outline-none focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
            >
              <option value="sistema">Sistema</option>
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
            </select>
          </label>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-black text-asphalt">Autonomia</h2>
          <FormField
            id="safety-margin"
            label="Margem padrÃ£o de seguranÃ§a da autonomia"
            hint="Percentual usado como reserva no planejamento de viagem"
            inputMode="decimal"
            placeholder="15"
            value={form.margemSegurancaAutonomia}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                margemSegurancaAutonomia: event.target.value.replace(/[^\d,.]/g, '').replace(',', '.'),
              }))
            }
            required
          />

          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Unidade de consumo</p>
            <p className="mt-1 text-lg font-black text-asphalt">km/l</p>
          </div>
        </div>

        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow active:scale-[0.99]"
        >
          Salvar configuraÃ§Ãµes
        </button>
      </form>

      <div className="mt-5 rounded-[2rem] bg-asphalt p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-200">Sobre o app</p>
        <h2 className="mt-3 text-2xl font-black">RiderLog</h2>
        <p className="mt-1 text-lg font-bold text-white/80">Seu diÃ¡rio de bordo na estrada.</p>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-white/70">
          App criado para motociclistas controlarem abastecimentos, viagens, manutenÃ§Ã£o, checklists e pontos de apoio.
          Os dados ficam salvos localmente no navegador do usuÃ¡rio.
        </p>
      </div>
    </section>
  );
}

