type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow = 'RiderLog', title, description }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow-sm">{title}</h1>
      <p className="mt-2 text-base font-medium leading-relaxed text-slate-300">{description}</p>
    </header>
  );
}
