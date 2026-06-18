import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckSquare } from 'lucide-react';
import { useAppFeedback } from '../components/AppFeedback';
import { PageHeader } from '../components/PageHeader';
import { checklistsRepository, useChecklists, type Checklist, type ChecklistItem } from '../db';

type ChecklistTemplate = {
  nome: string;
  tipo: string;
  itens: string[];
};

const suggestedItems = [
  'Calibrar pneus',
  'Conferir óleo',
  'Conferir corrente',
  'Conferir freios',
  'Conferir farol',
  'Conferir setas',
  'Conferir lanterna',
  'Conferir documentos',
  'Conferir seguro',
  'Levar capa de chuva',
  'Levar luvas',
  'Levar jaqueta',
  'Levar ferramentas básicas',
  'Levar kit reparo pneu',
  'Levar power bank',
  'Conferir suporte de celular',
  'Conferir baú/alforges',
  'Levar água',
  'Levar dinheiro/cartão',
  'Conferir segunda chave',
];

const checklistTemplates: ChecklistTemplate[] = [
  { nome: 'Bate-volta', tipo: 'bate-volta', itens: suggestedItems },
  { nome: 'Viagem fim de semana', tipo: 'fim-de-semana', itens: suggestedItems },
  { nome: 'Viagem longa', tipo: 'viagem-longa', itens: suggestedItems },
  { nome: 'Viagem com garupa', tipo: 'com-garupa', itens: suggestedItems },
  { nome: 'Viagem com chuva', tipo: 'com-chuva', itens: suggestedItems },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function createChecklistFromTemplate(template: ChecklistTemplate): Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    nome: template.nome,
    tipo: template.tipo,
    itens: template.itens.map((item) => ({
      id: `${template.tipo}-${slugify(item)}`,
      titulo: item,
      concluido: false,
    })),
  };
}

function getProgress(items: ChecklistItem[]) {
  const completed = items.filter((item) => item.concluido).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

export function ChecklistPage() {
  const { data: checklists, isLoading } = useChecklists();
  const { confirm, showToast } = useAppFeedback();
  const [activeType, setActiveType] = useState(checklistTemplates[0].tipo);
  const [customItem, setCustomItem] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const ensuringTypes = useRef(new Set<string>());

  const activeTemplate = checklistTemplates.find((template) => template.tipo === activeType) ?? checklistTemplates[0];
  const activeChecklist = useMemo(
    () => checklists.find((checklist) => checklist.tipo === activeType),
    [activeType, checklists],
  );

  const progress = getProgress(activeChecklist?.itens ?? []);

  useEffect(() => {
    async function ensureChecklist() {
      if (isLoading || activeChecklist || ensuringTypes.current.has(activeType)) {
        return;
      }

      ensuringTypes.current.add(activeType);
      const existing = (await checklistsRepository.list()).find((checklist) => checklist.tipo === activeType);

      if (!existing) {
        await checklistsRepository.create(createChecklistFromTemplate(activeTemplate));
      }

      ensuringTypes.current.delete(activeType);
    }

    ensureChecklist();
  }, [activeChecklist, activeTemplate, activeType, isLoading]);

  async function updateItems(checklist: Checklist, itens: ChecklistItem[], message?: string) {
    if (!checklist.id) {
      return;
    }

    setIsUpdating(true);

    try {
      await checklistsRepository.update(checklist.id, { itens });

      if (message) {
        setFeedback(message);
        showToast(message, 'success');
        window.setTimeout(() => setFeedback(''), 1600);
      }
    } catch {
      showToast('Não foi possível salvar o checklist.', 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  async function toggleItem(itemId: string) {
    if (!activeChecklist || isUpdating) {
      return;
    }

    const itens = activeChecklist.itens.map((item) =>
      item.id === itemId ? { ...item, concluido: !item.concluido } : item,
    );

    await updateItems(activeChecklist, itens);
    showToast('Checklist atualizado.', 'success', 1400);
  }

  async function resetChecklist() {
    if (!activeChecklist || isUpdating) {
      return;
    }

    const confirmed = await confirm({
      title: 'Resetar checklist',
      message: 'Tem certeza que deseja desmarcar todos os itens deste checklist?',
      confirmLabel: 'Resetar',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    const itens = activeChecklist.itens.map((item) => ({ ...item, concluido: false }));
    await updateItems(activeChecklist, itens, 'Checklist resetado.');
  }

  async function addCustomItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeChecklist || isUpdating) {
      return;
    }

    if (!customItem.trim()) {
      showToast('Digite um item personalizado.', 'warning');
      return;
    }

    const titulo = customItem.trim();
    const item: ChecklistItem = {
      id: `custom-${Date.now()}-${slugify(titulo)}`,
      titulo,
      concluido: false,
      personalizado: true,
    };

    await updateItems(activeChecklist, [...activeChecklist.itens, item], 'Item personalizado adicionado.');
    setCustomItem('');
  }

  async function deleteCustomItem(itemId: string) {
    if (!activeChecklist || isUpdating) {
      return;
    }

    const confirmed = await confirm({
      title: 'Excluir item',
      message: 'Tem certeza que deseja excluir este item personalizado?',
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    const itens = activeChecklist.itens.filter((item) => item.id !== itemId);
    await updateItems(activeChecklist, itens, 'Item personalizado excluído.');
  }

  return (
    <section>
      <PageHeader
        eyebrow="Checklist"
        title="Antes de sair"
        description="Escolha um modelo, marque os itens da preparação e mantenha tudo salvo no dispositivo."
      />

      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {checklistTemplates.map((template) => {
            const isActive = activeType === template.tipo;

            return (
              <button
                key={template.tipo}
                type="button"
                onClick={() => {
                  setActiveType(template.tipo);
                  setFeedback('');
                }}
                className={`min-h-12 shrink-0 rounded-2xl px-4 text-sm font-black transition active:scale-[0.98] ${
                  isActive ? 'bg-gradient-to-br from-ember to-flame text-white shadow-glow' : 'bg-white/10 text-slate-200 shadow-soft backdrop-blur'
                }`}
              >
                {template.nome}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-road via-asphalt to-black p-5 text-white shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-200">{activeTemplate.nome}</p>
            <h2 className="mt-1 text-3xl font-black">{progress.completed}/{progress.total}</h2>
            <p className="mt-1 text-sm font-semibold text-white/60">itens concluídos</p>
          </div>
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-ember to-flame shadow-glow">
            <CheckSquare size={28} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-gold via-ember to-flame transition-all" style={{ width: `${progress.percentage}%` }} />
        </div>
        <p className="mt-2 text-right text-sm font-black text-white/70">{progress.percentage}% pronto</p>
      </div>

      {feedback ? (
        <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {feedback}
        </div>
      ) : null}

      <form className="mb-4 rounded-[2rem] border border-white/10 bg-white/95 p-4 shadow-soft" onSubmit={addCustomItem}>
        <label className="block" htmlFor="custom-checklist-item">
          <span className="text-sm font-extrabold text-gray-700">Item personalizado</span>
          <div className="mt-2 flex gap-2">
            <input
              id="custom-checklist-item"
              value={customItem}
              onChange={(event) => setCustomItem(event.target.value)}
              placeholder="Ex: remédio, elástico, câmera..."
              className="h-14 min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold text-asphalt outline-none focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
            <button
              type="submit"
              disabled={isUpdating}
              className="h-14 rounded-2xl bg-gradient-to-br from-ember to-flame px-4 text-sm font-black text-white active:scale-[0.98]"
            >
              {isUpdating ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </label>
      </form>

      <button
        type="button"
        onClick={resetChecklist}
        disabled={!activeChecklist || isUpdating}
        className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/15 text-sm font-black text-white shadow-soft backdrop-blur active:scale-[0.99] disabled:text-gray-400"
      >
        {isUpdating ? 'Processando...' : 'Resetar checklist'}
      </button>

      {isLoading || !activeChecklist ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 text-center font-bold text-slate-300 shadow-soft backdrop-blur">
          Preparando checklist...
        </div>
      ) : (
        <div className="space-y-3">
          {activeChecklist.itens.map((item) => (
            <div
              key={item.id}
              className={`flex min-h-16 items-center gap-3 rounded-3xl border px-4 shadow-soft backdrop-blur ${
                item.concluido ? 'border-green-400/30 bg-green-950/45' : 'border-white/10 bg-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                disabled={isUpdating}
                className={`grid size-11 shrink-0 place-items-center rounded-2xl border-2 text-xl font-black ${
                  item.concluido ? 'border-green-400 bg-green-500 text-white' : 'border-slate-500 bg-white/10 text-transparent'
                }`}
                aria-label={item.concluido ? `Desmarcar ${item.titulo}` : `Marcar ${item.titulo}`}
              >
                {item.concluido ? <Check size={22} strokeWidth={3} aria-hidden="true" /> : null}
              </button>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`min-h-16 flex-1 py-3 text-left text-base font-bold ${
                item.concluido ? 'text-slate-400 line-through' : 'text-white'
                }`}
              >
                {item.titulo}
              </button>
              {item.personalizado ? (
                <button
                  type="button"
                  onClick={() => deleteCustomItem(item.id)}
                  disabled={isUpdating}
                  className="h-11 rounded-2xl bg-red-50 px-3 text-xs font-black text-red-600 active:scale-[0.98]"
                >
                  Excluir
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
