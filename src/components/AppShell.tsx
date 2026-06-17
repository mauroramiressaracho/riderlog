import type { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import type { TabId } from '../types/navigation';

type AppShellProps = {
  activeTab: TabId;
  children: ReactNode;
  onTabChange: (tab: TabId) => void;
};

export function AppShell({ activeTab, children, onTabChange }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-asphalt text-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.24),transparent_18rem),linear-gradient(180deg,#0b111f_0%,#151c2e_44%,#0b111f_100%)] shadow-2xl shadow-black/40">
        <main className="flex-1 px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)]">
          {children}
        </main>
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
}
