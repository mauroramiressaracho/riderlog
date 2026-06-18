import { type FormEvent, useMemo, useState } from 'react';
import { useAppFeedback } from '../components/AppFeedback';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { pontosSalvosRepository, usePontosSalvos, type PontoSalvo } from '../db';

type SavedPlaceFormState = {
  nome: string;
  tipo: string;
  cidadeUf: string;
  endereco: string;
  telefone: string;
  observacao: string;
  avaliacao: string;
  linkMaps: string;
};

const placeTypes = [
  'Restaurante',
  'Hotel/Pousada',
  'Posto',
  'Borracharia',
  'Oficina',
  'Farmácia',
  'Hospital',
  'Ponto turístico',
  'Ponto de descanso',
  'Local perigoso',
  'Outro',
];

const emptyForm: SavedPlaceFormState = {
  nome: '',
  tipo: '',
  cidadeUf: '',
  endereco: '',
  telefone: '',
  observacao: '',
  avaliacao: '',
  linkMaps: '',
};

function placeToForm(place: PontoSalvo): SavedPlaceFormState {
  return {
    nome: place.nome,
    tipo: place.tipo,
    cidadeUf: place.cidadeUf,
    endereco: place.endereco ?? '',
    telefone: place.telefone ?? '',
    observacao: place.observacao ?? '',
    avaliacao: place.avaliacao ?? '',
    linkMaps: place.linkMaps ?? '',
  };
}

function buildMapsSearchUrl(place: PontoSalvo) {
  const query = [place.nome, place.endereco, place.cidadeUf].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/${encodeURIComponent(query).replace(/%20/g, '+')}`;
}

function shortText(value?: string) {
  if (!value) {
    return 'Sem observações.';
  }

  return value.length > 86 ? `${value.slice(0, 86).trim()}...` : value;
}

export function PontosSalvosPage() {
  const { data: pontosSalvos, isLoading } = usePontosSalvos();
  const { confirm, showToast } = useAppFeedback();
  const [activeType, setActiveType] = useState('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PontoSalvo>();
  const [form, setForm] = useState<SavedPlaceFormState>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const filteredPlaces = useMemo(() => {
    const places = activeType === 'Todos' ? pontosSalvos : pontosSalvos.filter((place) => place.tipo === activeType);

    return [...places].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }, [activeType, pontosSalvos]);

  function openNewForm() {
    setEditingPlace(undefined);
    setForm(emptyForm);
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function openEditForm(place: PontoSalvo) {
    setEditingPlace(place);
    setForm(placeToForm(place));
    setSaveStatus('idle');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingPlace(undefined);
  }

  function updateField(field: keyof SavedPlaceFormState, value: string) {
    setSaveStatus('idle');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openMaps(place: PontoSalvo) {
    window.open(place.linkMaps || buildMapsSearchUrl(place), '_blank', 'noopener,noreferrer');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveStatus === 'saving') return;

    if (!form.nome.trim()) {
      showToast('Nome do ponto salvo é obrigatório.', 'warning');
      return;
    }

    if (!form.tipo) {
      showToast('Informe o tipo do ponto salvo.', 'warning');
      return;
    }

    setSaveStatus('saving');

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cidadeUf: form.cidadeUf.trim(),
      endereco: form.endereco.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      avaliacao: form.avaliacao.trim() || undefined,
      linkMaps: form.linkMaps.trim() || undefined,
    };

    try {
      if (editingPlace?.id) {
        await pontosSalvosRepository.update(editingPlace.id, payload);
      } else {
        await pontosSalvosRepository.create(payload);
      }

      setSaveStatus('saved');
      showToast(editingPlace ? 'Ponto salvo atualizado com sucesso.' : 'Ponto salvo cadastrado com sucesso.', 'success');
      setTimeout(() => closeForm(), 650);
    } catch {
      setSaveStatus('error');
      showToast('Erro ao salvar ponto.', 'error');
    }
  }

  async function handleDelete(place: PontoSalvo) {
    if (!place.id) {
      return;
    }

    const confirmed = await confirm({
      title: 'Excluir ponto salvo',
      message: 'Tem certeza que deseja excluir este registro?',
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await pontosSalvosRepository.remove(place.id);
      showToast('Ponto salvo excluído.', 'success');
    } catch {
      showToast('Não foi possível excluir o ponto salvo.', 'error');
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Pontos Salvos"
        title="Lugares úteis da estrada"
        description="Cadastre manualmente locais importantes para consultar depois, mesmo sem internet."
      />

      {saveStatus === 'saved' && !isFormOpen ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Ponto salvo no dispositivo.
        </div>
      ) : null}

      <div className="mb-4 rounded-[2rem] bg-asphalt p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-orange-200">Consulta offline</p>
        <h2 className="mt-1 text-3xl font-black">{pontosSalvos.length}</h2>
        <p className="mt-2 text-sm font-semibold text-white/60">
          Os dados ficam salvos no aparelho. Abrir no Maps depende de conexão.
        </p>
      </div>

      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {['Todos', ...placeTypes].map((type) => {
            const isActive = activeType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`min-h-12 shrink-0 rounded-2xl px-4 text-sm font-black transition active:scale-[0.98] ${
                  isActive ? 'bg-asphalt text-white shadow-soft' : 'bg-white text-gray-600 shadow-soft'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={openNewForm}
        className="mb-5 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow transition active:scale-[0.99]"
      >
        Novo ponto salvo
      </button>

      {isLoading ? (
        <div className="rounded-[2rem] bg-white p-5 text-center font-bold text-gray-500 shadow-soft">
          Carregando pontos...
        </div>
      ) : null}

      {!isLoading && filteredPlaces.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-orange-300 bg-orange-50 p-5">
          <p className="text-lg font-black text-asphalt">Nenhum ponto encontrado.</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Salve restaurantes, oficinas, pousadas e lugares úteis antes ou durante a viagem.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredPlaces.map((place) => (
          <article key={place.id} className="rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">{place.tipo}</p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-asphalt">{place.nome}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500">{place.cidadeUf}</p>
              </div>
              {place.avaliacao ? (
                <span className="rounded-2xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-700">
                  {place.avaliacao}
                </span>
              ) : null}
            </div>

            {place.endereco ? (
              <p className="mt-3 text-sm font-bold leading-relaxed text-gray-600">{place.endereco}</p>
            ) : null}

            {place.telefone ? (
              <a
                href={`tel:${place.telefone}`}
                className="mt-2 inline-flex rounded-2xl bg-gray-100 px-3 py-2 text-sm font-black text-asphalt"
              >
                {place.telefone}
              </a>
            ) : null}

            <p className="mt-3 rounded-2xl bg-sand px-3 py-2 text-sm font-semibold leading-relaxed text-gray-600">
              {shortText(place.observacao)}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => openMaps(place)}
                className="h-12 rounded-2xl bg-gradient-to-br from-ember to-flame text-sm font-black text-white active:scale-[0.99]"
              >
                {place.linkMaps ? 'Abrir no Google Maps' : 'Pesquisar no Google Maps'}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openEditForm(place)}
                  className="h-12 rounded-2xl bg-asphalt text-sm font-black text-white active:scale-[0.99]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(place)}
                  className="h-12 rounded-2xl bg-red-50 text-sm font-black text-red-600 active:scale-[0.99]"
                >
                  Excluir
                </button>
              </div>
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
                  {editingPlace ? 'Editar' : 'Novo'}
                </p>
                <h2 className="text-xl font-black text-asphalt">Ponto salvo</h2>
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
                    id="saved-place-name"
                    label="Nome do local"
                    placeholder="Pousada da Serra"
                    value={form.nome}
                    onChange={(event) => updateField('nome', event.target.value)}
                    required
                  />

                  <label className="block" htmlFor="saved-place-type">
                    <span className="text-sm font-extrabold text-gray-700">Tipo</span>
                    <select
                      id="saved-place-type"
                      value={form.tipo}
                      onChange={(event) => updateField('tipo', event.target.value)}
                      className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-asphalt outline-none focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
                      required
                    >
                      <option value="">Selecione</option>
                      {placeTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <FormField
                    id="saved-place-city"
                    label="Cidade/UF"
                    placeholder="Chapada dos Guimarães/MT"
                    value={form.cidadeUf}
                    onChange={(event) => updateField('cidadeUf', event.target.value)}
                    required
                  />
                  <FormField
                    id="saved-place-address"
                    label="Endereço"
                    placeholder="Rua, bairro, referência..."
                    value={form.endereco}
                    onChange={(event) => updateField('endereco', event.target.value)}
                  />
                  <FormField
                    id="saved-place-phone"
                    label="Telefone"
                    inputMode="tel"
                    placeholder="(65) 99999-9999"
                    value={form.telefone}
                    onChange={(event) => updateField('telefone', event.target.value)}
                  />
                  <FormField
                    id="saved-place-rating"
                    label="Avaliação pessoal"
                    placeholder="Ex: Excelente, bom custo-benefício, evitar à noite"
                    value={form.avaliacao}
                    onChange={(event) => updateField('avaliacao', event.target.value)}
                  />
                  <FormField
                    id="saved-place-maps"
                    label="Link do Google Maps"
                    inputMode="url"
                    placeholder="https://maps.google.com/..."
                    value={form.linkMaps}
                    onChange={(event) => updateField('linkMaps', event.target.value)}
                  />

                  <label className="block" htmlFor="saved-place-note">
                    <span className="text-sm font-extrabold text-gray-700">Observação</span>
                    <textarea
                      id="saved-place-note"
                      value={form.observacao}
                      onChange={(event) => updateField('observacao', event.target.value)}
                      placeholder="Horário, atendimento, segurança, dica de acesso..."
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
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar ponto'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
