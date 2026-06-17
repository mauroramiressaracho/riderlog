import { ChangeEvent, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { clearAllData, exportBackup, importBackup, isValidBackup } from '../db';

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

function downloadJson(content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `riderlog-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<Feedback>();
  const [isBusy, setIsBusy] = useState(false);

  async function handleExport() {
    setIsBusy(true);
    setFeedback(undefined);

    try {
      const backup = await exportBackup();
      downloadJson(backup);
      setFeedback({ type: 'success', message: 'Backup exportado com sucesso.' });
    } catch {
      setFeedback({ type: 'error', message: 'NÃ£o foi possÃ­vel exportar os dados.' });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsBusy(true);
    setFeedback(undefined);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isValidBackup(parsed)) {
        setFeedback({ type: 'error', message: 'Arquivo invÃ¡lido. Use um JSON exportado pelo RiderLog.' });
        return;
      }

      await importBackup(parsed);
      setFeedback({ type: 'success', message: 'Dados importados com sucesso.' });
    } catch {
      setFeedback({ type: 'error', message: 'NÃ£o foi possÃ­vel importar este arquivo.' });
    } finally {
      event.target.value = '';
      setIsBusy(false);
    }
  }

  async function handleClear() {
    const confirmed = window.confirm('Essa aÃ§Ã£o apagarÃ¡ todos os dados salvos neste aparelho. Tem certeza?');

    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setFeedback(undefined);

    try {
      await clearAllData();
      setFeedback({ type: 'success', message: 'Todos os dados locais foram apagados.' });
    } catch {
      setFeedback({ type: 'error', message: 'NÃ£o foi possÃ­vel limpar os dados.' });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Backup"
        title="Seus dados na sua mÃ£o"
        description="Exporte, importe ou limpe os dados salvos localmente neste navegador. Nada Ã© enviado para servidor."
      />

      {feedback ? (
        <div
          className={`mb-4 rounded-3xl border px-4 py-3 text-sm font-bold ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-asphalt">Exportar dados</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">
            Gera um arquivo JSON com moto, abastecimentos, viagens, manutenÃ§Ãµes, pontos salvos, checklists e configuraÃ§Ãµes.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={isBusy}
            className="mt-4 h-14 w-full rounded-2xl bg-gradient-to-br from-ember to-flame text-base font-black text-white shadow-glow active:scale-[0.99] disabled:bg-gray-400"
          >
            Exportar dados
          </button>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-asphalt">Importar dados</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">
            Selecione um arquivo JSON exportado pelo RiderLog. O conteÃºdo atual serÃ¡ substituÃ­do.
          </p>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="mt-4 h-14 w-full rounded-2xl bg-asphalt text-base font-black text-white active:scale-[0.99] disabled:bg-gray-400"
          >
            Importar dados
          </button>
        </div>

        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-5 shadow-soft">
          <h2 className="text-xl font-black text-red-700">Limpar todos os dados</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-red-700/75">
            Remove definitivamente todos os registros deste aparelho.
          </p>
          <button
            type="button"
            onClick={handleClear}
            disabled={isBusy}
            className="mt-4 h-14 w-full rounded-2xl bg-red-600 text-base font-black text-white active:scale-[0.99] disabled:bg-gray-400"
          >
            Limpar todos os dados
          </button>
        </div>
      </div>
    </section>
  );
}

