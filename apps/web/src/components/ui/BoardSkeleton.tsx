export function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading schedule"
      className="grid animate-pulse grid-cols-[64px_repeat(4,1fr)] gap-2"
    >
      <div />
      {Array.from({ length: 4 }, (_, col) => (
        <div key={col} className="space-y-2">
          <div className="h-12 rounded-lg bg-slate-200" />
          <div className="h-[560px] rounded-lg bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}
