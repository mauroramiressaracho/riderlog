import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Fuel, Navigation } from 'lucide-react';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { useAbastecimentos, useConfiguracoes, useMoto } from '../db';

type TripPlanForm = {
  origem: string;
  destino: string;
  distanciaKm: string;
  consumoMedio: string;
  valorGasolina: string;
  capacidadeTanque: string;
  margemSeguranca: string;
};

type TripEstimate = {
  litrosEstimados: number;
  custoEstimado: number;
  autonomiaTeorica: number;
  autonomiaSegura: number;
  paradasAproximadas: number;
};

const emptyForm: TripPlanForm = {
  origem: '',
  destino: '',
  distanciaKm: '',
  consumoMedio: '',
  valorGasolina: '',
  capacidadeTanque: '',
  margemSeguranca: '15',
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

function formatDecimalInput(value?: number) {
  if (!value || value <= 0) {
    return '';
  }

  return String(Number(value.toFixed(2)));
}

export function TripPage() {
  const { data: motos } = useMoto();
  const { data: abastecimentos } = useAbastecimentos();
  const { data: configuracoes } = useConfiguracoes();
  const moto = motos[0];
  const settings = configuracoes[0];

  const consumoMedioGeral = useMemo(() => {
    const consumosValidos = abastecimentos
      .map((abastecimento) => abastecimento.consumoCalculado)
      .filter((consumo): consumo is number => Boolean(consumo && consumo > 0));

    if (consumosValidos.length === 0) {
      return undefined;
    }

    return consumosValidos.reduce((total, consumo) => total + consumo, 0) / consumosValidos.length;
  }, [abastecimentos]);

  const valorMedioGasolina = useMemo(() => {
    const precosValidos = abastecimentos
      .map((abastecimento) => abastecimento.precoPorLitro)
      .filter((preco): preco is number => Boolean(preco && preco > 0));

    if (precosValidos.length === 0) {
      return undefined;
    }

    return precosValidos.reduce((total, preco) => total + preco, 0) / precosValidos.length;
  }, [abastecimentos]);

  const suggestedForm = useMemo<TripPlanForm>(() => {
    const consumoSugerido = moto?.consumoMedioEstrada || consumoMedioGeral;

    return {
      ...emptyForm,
      consumoMedio: formatDecimalInput(consumoSugerido),
      valorGasolina: formatDecimalInput(valorMedioGasolina),
      capacidadeTanque: formatDecimalInput(moto?.capacidadeTanque),
      margemSeguranca: settings?.margemSegurancaAutonomia ? String(settings.margemSegurancaAutonomia) : emptyForm.margemSeguranca,
    };
  }, [consumoMedioGeral, moto?.capacidadeTanque, moto?.consumoMedioEstrada, settings?.margemSegurancaAutonomia, valorMedioGasolina]);

  const [form, setForm] = useState<TripPlanForm>(suggestedForm);
  const [estimate, setEstimate] = useState<TripEstimate>();
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      consumoMedio: current.consumoMedio || suggestedForm.consumoMedio,
      valorGasolina: current.valorGasolina || suggestedForm.valorGasolina,
      capacidadeTanque: current.capacidadeTanque || suggestedForm.capacidadeTanque,
    }));
  }, [suggestedForm]);

  function updateField(field: keyof TripPlanForm, value: string) {
    setError('');
    setEstimate(undefined);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const distanciaKm = toNumber(form.distanciaKm);
    const consumoMedio = toNumber(form.consumoMedio);
    const valorGasolina = toNumber(form.valorGasolina);
    const capacidadeTanque = toNumber(form.capacidadeTanque);
    const margemSeguranca = toNumber(form.margemSeguranca);

    if (distanciaKm <= 0 || consumoMedio <= 0 || valorGasolina <= 0 || capacidadeTanque <= 0) {
      setError('Informe distância, consumo, gasolina e tanque com valores maiores que zero.');
      return;
    }

    const litrosEstimados = distanciaKm / consumoMedio;
    const custoEstimado = litrosEstimados * valorGasolina;
    const autonomiaTeorica = capacidadeTanque * consumoMedio;
    const autonomiaSegura = autonomiaTeorica * (1 - margemSeguranca / 100);
    const paradasAproximadas = autonomiaSegura > 0 ? Math.max(0, Math.ceil(distanciaKm / autonomiaSegura) - 1) : 0;

    setEstimate({
      litrosEstimados,
      custoEstimado,
      autonomiaTeorica,
      autonomiaSegura,
      paradasAproximadas,
    });
  }

  function handleClear() {
    setForm(suggestedForm);
    setEstimate(undefined);
    setError('');
  }

  return (
    <section>
      <PageHeader
        eyebrow="Planejar Viagem"
        title="Quanto vai custar o rolê?"
        description="Simule combustível, autonomia segura e paradas antes de colocar a moto na estrada."
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-[2rem] border border-white/10 bg-white/95 p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-asphalt">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-100">
              <Navigation size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            Rota
          </h2>
          <div className="space-y-4">
            <FormField
              id="trip-origin"
              label="Origem"
              placeholder="Cuiabá"
              value={form.origem}
              onChange={(event) => updateField('origem', event.target.value)}
            />
            <FormField
              id="trip-destination"
              label="Destino"
              placeholder="Chapada dos Guimarães"
              value={form.destino}
              onChange={(event) => updateField('destino', event.target.value)}
            />
            <FormField
              id="trip-distance"
              label="Distância estimada em km"
              inputMode="decimal"
              placeholder="300"
              value={form.distanciaKm}
              onChange={(event) => updateField('distanciaKm', decimalNumber(event.target.value))}
              required
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/95 p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-asphalt">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-100">
              <Fuel size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            Combustível e autonomia
          </h2>
          <div className="space-y-4">
            <FormField
              id="trip-consumption"
              label="Consumo médio esperado em km/l"
              hint={moto?.consumoMedioEstrada ? 'Preenchido pelo consumo de estrada da moto' : 'Pode vir da média dos abastecimentos'}
              inputMode="decimal"
              placeholder="30"
              value={form.consumoMedio}
              onChange={(event) => updateField('consumoMedio', decimalNumber(event.target.value))}
              required
            />
            <FormField
              id="trip-fuel-price"
              label="Valor médio da gasolina"
              hint="Use o preço por litro"
              inputMode="decimal"
              placeholder="6,00"
              value={form.valorGasolina}
              onChange={(event) => updateField('valorGasolina', decimalNumber(event.target.value))}
              required
            />
            <FormField
              id="trip-tank"
              label="Capacidade do tanque"
              hint={moto ? 'Preenchido pela ficha da moto' : 'Informe em litros'}
              inputMode="decimal"
              placeholder="15"
              value={form.capacidadeTanque}
              onChange={(event) => updateField('capacidadeTanque', decimalNumber(event.target.value))}
              required
            />
            <FormField
              id="trip-safety-margin"
              label="Margem de segurança da autonomia em percentual"
              inputMode="decimal"
              placeholder="15"
              value={form.margemSeguranca}
              onChange={(event) => updateField('margemSeguranca', decimalNumber(event.target.value))}
              required
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl border border-white/10 bg-white/15 text-base font-black text-white shadow-soft backdrop-blur active:scale-[0.99]"
          >
            Limpar
          </button>
          <button
            type="submit"
            className="h-14 rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow active:scale-[0.99]"
          >
            Calcular
          </button>
        </div>
      </form>

      {estimate ? (
        <div className="mt-5 rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-road via-asphalt to-black p-5 text-white shadow-glow">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-200">Estimativa da viagem</p>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            {form.destino ? `Rumo a ${form.destino}` : 'Plano de estrada pronto'}
          </h2>
          <p className="mt-3 text-base font-semibold leading-relaxed text-white/80">
            Para essa viagem de {numberFormatter.format(toNumber(form.distanciaKm))} km, sua moto deve consumir
            aproximadamente {numberFormatter.format(estimate.litrosEstimados)} litros. Custo estimado:{' '}
            {currencyFormatter.format(estimate.custoEstimado)}. Autonomia segura:{' '}
            {numberFormatter.format(estimate.autonomiaSegura)} km. Recomendado sair com tanque cheio e planejar{' '}
            {estimate.paradasAproximadas} {estimate.paradasAproximadas === 1 ? 'parada' : 'paradas'}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/50">Autonomia teórica</p>
              <p className="mt-1 text-lg font-black">{numberFormatter.format(estimate.autonomiaTeorica)} km</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold text-white/50">Litros estimados</p>
              <p className="mt-1 text-lg font-black">{numberFormatter.format(estimate.litrosEstimados)} L</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
