export default function ScoreBar({ score, height = 6 }: { score: number; height?: number }) {
  const color = score >= 72 ? "#0ca30c" : score >= 40 ? "#fab219" : "#d03b3b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden rounded-full bg-stone-100" style={{ height }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, score)}%`, backgroundColor: color }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-stone-600">{score}</span>
    </div>
  );
}
