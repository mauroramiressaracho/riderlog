import { tabs } from '../app/tabs';
import type { TabId } from '../types/navigation';

type BottomNavigationProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/10 bg-asphalt/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-18px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 text-xs font-bold transition ${
                isActive
                  ? 'bg-gradient-to-br from-ember to-flame text-white shadow-glow'
                  : 'text-slate-400 active:bg-white/10 active:text-white'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="mt-1 truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
