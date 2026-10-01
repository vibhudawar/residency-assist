/** A deterministic Code-128-style bar pattern for the ticket foot. Decorative; the number above it is the real reference. */
export function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const seed = value || "RA-000000";
  for (let i = 0; i < seed.length * 4; i++) {
    const code = seed.charCodeAt(i % seed.length) * (i + 7);
    const w = (code % 3) + 1;
    if (i % 2 === 0) bars.push({ x, w });
    x += w + ((code >> 2) % 2) + 1;
  }
  return (
    <svg aria-hidden viewBox={`0 0 ${x} 28`} preserveAspectRatio="none" className={className}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={28} fill="currentColor" />
      ))}
    </svg>
  );
}
