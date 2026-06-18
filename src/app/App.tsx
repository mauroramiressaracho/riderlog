import { type ReactElement, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { AppFeedbackProvider } from '../components/AppFeedback';
import { BackupPage } from '../pages/BackupPage';
import { ChecklistPage } from '../pages/ChecklistPage';
import { ConfiguracoesPage } from '../pages/ConfiguracoesPage';
import { FuelPage } from '../pages/FuelPage';
import { HistoricoViagensPage } from '../pages/HistoricoViagensPage';
import { HomePage } from '../pages/HomePage';
import { ManutencaoPage } from '../pages/ManutencaoPage';
import { MinhaMotoPage } from '../pages/MinhaMotoPage';
import { MorePage } from '../pages/MorePage';
import { PontosSalvosPage } from '../pages/PontosSalvosPage';
import { SOSEstradaPage } from '../pages/SOSEstradaPage';
import { TripPage } from '../pages/TripPage';
import type { TabId } from '../types/navigation';

type AppScreen = TabId | 'my-bike' | 'maintenance' | 'trip-history' | 'sos' | 'saved-places' | 'backup' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeScreen, setActiveScreen] = useState<AppScreen>('home');

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setActiveScreen(tab);
  }

  function openMinhaMoto() {
    setActiveTab('more');
    setActiveScreen('my-bike');
  }

  function openManutencao() {
    setActiveTab('more');
    setActiveScreen('maintenance');
  }

  function openHistoricoViagens() {
    setActiveTab('more');
    setActiveScreen('trip-history');
  }

  function openSOS() {
    setActiveTab('more');
    setActiveScreen('sos');
  }

  function openPontosSalvos() {
    setActiveTab('more');
    setActiveScreen('saved-places');
  }

  function openBackup() {
    setActiveTab('more');
    setActiveScreen('backup');
  }

  function openConfiguracoes() {
    setActiveTab('more');
    setActiveScreen('settings');
  }

  const activePage = useMemo(() => {
    const pages: Record<AppScreen, ReactElement> = {
      home: (
        <HomePage
          onRegisterMoto={openMinhaMoto}
          onNewFuel={() => handleTabChange('fuel')}
          onPlanTrip={() => handleTabChange('trip')}
          onSOS={openSOS}
          onChecklist={() => handleTabChange('checklist')}
        />
      ),
      fuel: <FuelPage />,
      trip: <TripPage />,
      checklist: <ChecklistPage />,
      more: (
        <MorePage
          onOpenMinhaMoto={openMinhaMoto}
          onOpenManutencao={openManutencao}
          onOpenHistoricoViagens={openHistoricoViagens}
          onOpenSOS={openSOS}
          onOpenPontosSalvos={openPontosSalvos}
          onOpenBackup={openBackup}
          onOpenConfiguracoes={openConfiguracoes}
        />
      ),
      'my-bike': <MinhaMotoPage />,
      maintenance: <ManutencaoPage />,
      'trip-history': <HistoricoViagensPage />,
      sos: <SOSEstradaPage />,
      'saved-places': <PontosSalvosPage />,
      backup: <BackupPage />,
      settings: <ConfiguracoesPage />,
    };

    return pages[activeScreen];
  }, [activeScreen]);

  return (
    <AppFeedbackProvider>
      <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
        {activePage}
      </AppShell>
    </AppFeedbackProvider>
  );
}
