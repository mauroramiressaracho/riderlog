import { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAbastecimentos, useManutencoes, useMoto, useViagens } from '../db';

type HomePageProps = {
  onRegisterMoto: () => void;
  onNewFuel: () => void;
  onPlanTrip: () => void;
  onSOS: () => void;
  onChecklist: () => void;
};

type DashboardCardProps = {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
};

type QuickActionProps = {
  icon: string;
  title: string;
  onClick: () => void;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

function DashboardCard({ label, value, detail, highlight = false }: DashboardCardProps) {
  return (
    <div
      className={`rounded-3xl border p-4 shadow-soft ${
        highlight
          ? 'border-orange-400/30 bg-gradient-to-br from-ember to-flame text-white shadow-glow'
          : 'border-white/10 bg-white/10 text-white backdrop-blur'
      }`}
    >
      <p className={`text-xs font-black uppercase tracking-[0.16em] ${highlight ? 'text-orange-100' : 'text-gold'}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
      {detail ? <p className="mt-1 text-sm font-semibold text-white/70">{detail}</p> : null}
    </div>
  );
}

function QuickAction({ icon, title, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/10 px-3 text-center text-white shadow-soft backdrop-blur transition active:scale-[0.98]"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-orange-500/20 text-2xl ring-1 ring-orange-300/20">
        {icon}
      </span>
      <span className="mt-2 text-sm font-black">{title}</span>
    </button>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function HomePage({ onRegisterMoto, onNewFuel, onPlanTrip, onSOS, onChecklist }: HomePageProps) {
  const { data: motos } = useMoto();
  const { data: abastecimentos } = useAbastecimentos();
  const { data: viagens } = useViagens();
  const { data: manutencoes } = useManutencoes();

  const moto = motos[0];

  const dashboard = useMemo(() => {
    const totalGastoCombustivel = abastecimentos.reduce(
      (total, abastecimento) => total + abastecimento.valorTotal,
      0,
    );

    const consumosCalculados = abastecimentos
      .map((abastecimento) => abastecimento.consumoCalculado)
      .filter((consumo): consumo is number => Boolean(consumo && consumo > 0));

    const consumoMedioGeral =
      consumosCalculados.length > 0
        ? consumosCalculados.reduce((total, consumo) => total + consumo, 0) / consumosCalculados.length
        : undefined;

    const ultimaViagem = [...viagens].sort((first, second) => second.data.localeCompare(first.data))[0];

    const proximaManutencao = moto
      ? manutencoes
          .filter((manutencao) => manutencao.proximaKm && manutencao.proximaKm >= moto.kmAtual)
          .sort((first, second) => Number(first.proximaKm) - Number(second.proximaKm))[0]
      : undefined;

    const consumoParaAutonomia = moto?.consumoMedioEstrada || consumoMedioGeral || 0;
    const autonomiaEstimativa = moto && consumoParaAutonomia > 0 ? moto.capacidadeTanque * consumoParaAutonomia : 0;

    return {
      totalGastoCombustivel,
      consumoMedioGeral,
      ultimaViagem,
      proximaManutencao,
      autonomiaEstimativa,
    };
  }, [abastecimentos, manutencoes, moto, viagens]);

  return (
    <section>
      <PageHeader
        title="Seu diÃ¡rio de bordo na estrada."
        description="Resumo rÃ¡pido da moto, gastos e prÃ³ximas decisÃµes antes de rodar."
      />

      {!moto ? (
        <button
          type="button"
          onClick={onRegisterMoto}
          className="mb-5 w-full rounded-[2rem] border border-orange-300/30 bg-gradient-to-br from-road to-asphalt p-5 text-left shadow-glow transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-ember to-flame text-2xl shadow-glow">ðŸï¸</span>
            <span>
              <span className="block text-xl font-black text-white">Cadastre sua moto</span>
              <span className="mt-1 block text-sm font-semibold leading-relaxed text-slate-300">
                Informe modelo, km atual, tanque e consumo para liberar o painel.
              </span>
            </span>
          </div>
        </button>
      ) : (
        <div className="mb-5 overflow-hidden rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-road via-asphalt to-black p-5 shadow-glow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">{moto.modelo}</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-white">{moto.apelido}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-300">{moto.marca}</p>
            </div>
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-ember to-flame text-2xl shadow-glow">ðŸï¸</span>
          </div>
          <div className="mt-5 h-1 rounded-full bg-gradient-to-r from-gold via-ember to-flame" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DashboardCard
          label="Km atual"
          value={moto ? `${numberFormatter.format(moto.kmAtual)} km` : 'Pendente'}
          detail={moto ? 'OdÃ´metro da moto' : 'Cadastre a moto'}
          highlight
        />
        <DashboardCard
          label="Autonomia"
          value={
            moto && dashboard.autonomiaEstimativa > 0
              ? `${numberFormatter.format(dashboard.autonomiaEstimativa)} km`
              : 'Pendente'
          }
          detail={moto ? 'Estimativa por tanque' : 'Sem dados'}
          highlight
        />
        <DashboardCard
          label="Consumo geral"
          value={
            abastecimentos.length > 0 && dashboard.consumoMedioGeral
              ? `${numberFormatter.format(dashboard.consumoMedioGeral)} km/l`
              : 'Pendente'
          }
          detail={abastecimentos.length > 0 ? 'Com base nos abastecimentos' : 'Sem abastecimentos'}
        />
        <DashboardCard
          label="CombustÃ­vel"
          value={currencyFormatter.format(dashboard.totalGastoCombustivel)}
          detail="Total registrado"
        />
        <DashboardCard
          label="Ãšltima viagem"
          value={dashboard.ultimaViagem ? dashboard.ultimaViagem.destino : 'Nenhuma viagem registrada'}
          detail={dashboard.ultimaViagem ? `${dashboard.ultimaViagem.origem} â€¢ ${formatDate(dashboard.ultimaViagem.data)}` : undefined}
        />
        <DashboardCard
          label="PrÃ³xima manutenÃ§Ã£o"
          value={
            dashboard.proximaManutencao?.proximaKm
              ? `${numberFormatter.format(dashboard.proximaManutencao.proximaKm)} km`
              : 'Sem manutenÃ§Ã£o programada'
          }
          detail={dashboard.proximaManutencao?.tipo}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-black text-white">Atalhos rÃ¡pidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction icon="â›½" title="Novo abastecimento" onClick={onNewFuel} />
          <QuickAction icon="ðŸ§­" title="Planejar viagem" onClick={onPlanTrip} />
          <QuickAction icon="ðŸ†˜" title="SOS Estrada" onClick={onSOS} />
          <QuickAction icon="âœ“" title="Checklist" onClick={onChecklist} />
        </div>
      </div>
    </section>
  );
}

