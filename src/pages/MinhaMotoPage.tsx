import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { motoRepository, useMoto, type Moto } from '../db';

const royalEnfieldModels = [
  'Hunter 350',
  'Meteor 350',
  'Classic 350',
  'Himalayan',
  'Scram 411',
  'Interceptor 650',
  'Continental GT',
  'Super Meteor 650',
  'Shotgun 650',
];

type MotoFormState = {
  apelido: string;
  marca: string;
  modelo: string;
  ano: string;
  kmAtual: string;
  capacidadeTanque: string;
  consumoMedioUrbano: string;
  consumoMedioEstrada: string;
};

const emptyForm: MotoFormState = {
  apelido: '',
  marca: 'Royal Enfield',
  modelo: '',
  ano: '',
  kmAtual: '',
  capacidadeTanque: '',
  consumoMedioUrbano: '',
  consumoMedioEstrada: '',
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

function decimalNumber(value: string) {
  return value.replace(/[^\d,.]/g, '').replace(',', '.');
}

function toNumber(value: string) {
  return Number(value || 0);
}

function motoToForm(moto: Moto): MotoFormState {
  return {
    apelido: moto.apelido,
    marca: moto.marca,
    modelo: moto.modelo,
    ano: String(moto.ano),
    kmAtual: String(moto.kmAtual),
    capacidadeTanque: String(moto.capacidadeTanque),
    consumoMedioUrbano: String(moto.consumoMedioUrbano),
    consumoMedioEstrada: String(moto.consumoMedioEstrada),
  };
}

export function MinhaMotoPage() {
  const { data: motos, isLoading } = useMoto();
  const moto = useMemo(() => motos[0], [motos]);
  const [form, setForm] = useState<MotoFormState>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (moto) {
      setForm(motoToForm(moto));
    }
  }, [moto]);

  function updateField(field: keyof MotoFormState, value: string) {
    setSaveStatus('idle');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus('saving');

    const payload = {
      apelido: form.apelido.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      ano: toNumber(form.ano),
      kmAtual: toNumber(form.kmAtual),
      capacidadeTanque: toNumber(form.capacidadeTanque),
      consumoMedioUrbano: toNumber(form.consumoMedioUrbano),
      consumoMedioEstrada: toNumber(form.consumoMedioEstrada),
    };

    try {
      if (moto?.id) {
        await motoRepository.update(moto.id, payload);
      } else {
        await motoRepository.create(payload);
      }

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Minha Moto"
        title={moto ? 'Editar moto' : 'Cadastrar moto'}
        description="Guarde os dados principais da sua companheira de estrada para alimentar abastecimentos, viagens e manutenÃ§Ã£o."
      />

      {saveStatus === 'saved' ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Dados da moto salvos no dispositivo.
        </div>
      ) : null}

      {saveStatus === 'error' ? (
        <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          NÃ£o foi possÃ­vel salvar agora. Tente novamente.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-black text-asphalt">IdentificaÃ§Ã£o</h2>
          <div className="space-y-4">
            <FormField
              id="apelido"
              label="Apelido da moto"
              placeholder="Ex: Himalayan da Serra"
              value={form.apelido}
              onChange={(event) => updateField('apelido', event.target.value)}
              required
            />
            <FormField
              id="marca"
              label="Marca"
              placeholder="Royal Enfield"
              value={form.marca}
              onChange={(event) => updateField('marca', event.target.value)}
              required
            />
            <FormField
              id="modelo"
              label="Modelo"
              list="royal-enfield-models"
              placeholder="Escolha ou digite outro modelo"
              value={form.modelo}
              onChange={(event) => updateField('modelo', event.target.value)}
              required
            />
            <datalist id="royal-enfield-models">
              {royalEnfieldModels.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-black text-asphalt">Dados de uso</h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              id="ano"
              label="Ano"
              inputMode="numeric"
              placeholder="2025"
              min={1900}
              max={2100}
              value={form.ano}
              onChange={(event) => updateField('ano', onlyNumbers(event.target.value).slice(0, 4))}
              required
            />
            <FormField
              id="kmAtual"
              label="Km atual"
              inputMode="numeric"
              placeholder="12500"
              value={form.kmAtual}
              onChange={(event) => updateField('kmAtual', onlyNumbers(event.target.value))}
              required
            />
            <FormField
              id="capacidadeTanque"
              label="Capacidade do tanque em litros"
              inputMode="decimal"
              placeholder="15"
              value={form.capacidadeTanque}
              onChange={(event) => updateField('capacidadeTanque', decimalNumber(event.target.value))}
              required
            />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-black text-asphalt">Consumo mÃ©dio</h2>
          <div className="space-y-4">
            <FormField
              id="consumoMedioUrbano"
              label="Consumo mÃ©dio urbano"
              hint="Informe em km/l"
              inputMode="decimal"
              placeholder="28"
              value={form.consumoMedioUrbano}
              onChange={(event) => updateField('consumoMedioUrbano', decimalNumber(event.target.value))}
              required
            />
            <FormField
              id="consumoMedioEstrada"
              label="Consumo mÃ©dio estrada"
              hint="Informe em km/l"
              inputMode="decimal"
              placeholder="32"
              value={form.consumoMedioEstrada}
              onChange={(event) => updateField('consumoMedioEstrada', decimalNumber(event.target.value))}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || saveStatus === 'saving'}
          className="sticky bottom-24 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {saveStatus === 'saving' ? 'Salvando...' : moto ? 'Salvar alteraÃ§Ãµes' : 'Cadastrar moto'}
        </button>
      </form>
    </section>
  );
}

