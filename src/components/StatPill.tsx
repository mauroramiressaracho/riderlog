type StatPillProps = {
  label: string;
  value: string;
};

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="rounded-3xl bg-white/15 p-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
