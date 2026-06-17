import type { ReactNode } from 'react';

type ActionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function ActionCard({ title, description, icon }: ActionCardProps) {
  return (
    <button
      type="button"
      className="w-full rounded-3xl bg-white p-4 text-left shadow-soft transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-orange-100 text-2xl">
          {icon}
        </span>
        <span>
          <span className="block text-base font-extrabold text-asphalt">{title}</span>
          <span className="mt-1 block text-sm leading-snug text-gray-500">{description}</span>
        </span>
      </div>
    </button>
  );
}
