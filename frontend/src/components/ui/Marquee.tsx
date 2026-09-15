import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  className?: string;
}

/** An infinite horizontal ticker. Duplicates its content once so the loop is seamless. */
export function Marquee({ items, className }: MarqueeProps) {
  const track = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-4 font-display text-sm tracking-wide text-bone-dim sm:text-base">{item}</span>
          <span className="text-scope">✲</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("overflow-hidden whitespace-nowrap border-y border-ink-700 py-4", className)} aria-hidden="true">
      <div className="flex w-max animate-marquee">
        {track}
        {track}
      </div>
    </div>
  );
}
