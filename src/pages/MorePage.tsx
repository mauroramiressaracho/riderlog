import {
  Bike,
  CloudUpload,
  Map,
  MapPin,
  Settings,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

type MoreLink = {
  title: string;
  icon: LucideIcon;
  action?: string;
};

const moreLinks: MoreLink[] = [
  { title: 'Minha Moto', icon: Bike, action: 'my-bike' },
  { title: 'Manutenção', icon: Wrench, action: 'maintenance' },
  { title: 'Histórico de Viagens', icon: Map, action: 'trip-history' },
  { title: 'SOS Estrada', icon: ShieldAlert, action: 'sos' },
  { title: 'Pontos Salvos', icon: MapPin, action: 'saved-places' },
  { title: 'Backup', icon: CloudUpload, action: 'backup' },
  { title: 'Configurações', icon: Settings, action: 'settings' },
];

type MorePageProps = {
  onOpenMinhaMoto: () => void;
  onOpenManutencao: () => void;
  onOpenHistoricoViagens: () => void;
  onOpenSOS: () => void;
  onOpenPontosSalvos: () => void;
  onOpenBackup: () => void;
  onOpenConfiguracoes: () => void;
};

export function MorePage({
  onOpenMinhaMoto,
  onOpenManutencao,
  onOpenHistoricoViagens,
  onOpenSOS,
  onOpenPontosSalvos,
  onOpenBackup,
  onOpenConfiguracoes,
}: MorePageProps) {
  function handleAction(action?: string) {
    if (action === 'my-bike') {
      onOpenMinhaMoto();
      return;
    }

    if (action === 'maintenance') {
      onOpenManutencao();
      return;
    }

    if (action === 'trip-history') {
      onOpenHistoricoViagens();
      return;
    }

    if (action === 'sos') {
      onOpenSOS();
      return;
    }

    if (action === 'saved-places') {
      onOpenPontosSalvos();
      return;
    }

    if (action === 'backup') {
      onOpenBackup();
      return;
    }

    if (action === 'settings') {
      onOpenConfiguracoes();
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Mais"
        title="Central do piloto"
        description="Atalhos para evoluir o RiderLog com moto, manutenção, histórico e recursos úteis."
      />

      <div className="space-y-3">
        {moreLinks.map((link) => {
          const Icon = link.icon;

          return (
            <button
              key={link.title}
              type="button"
              onClick={() => handleAction(link.action)}
              className="flex min-h-16 w-full items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 text-left text-white shadow-soft backdrop-blur active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-orange-500/20 text-xl">
                  <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span className="font-extrabold">{link.title}</span>
              </span>
              <span className="text-2xl text-orange-200" aria-hidden="true">
                ›
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
