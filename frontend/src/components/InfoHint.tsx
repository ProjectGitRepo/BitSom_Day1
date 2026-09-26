import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

export default function InfoHint({
  children,
  align = "left",
  size = 13
}: {
  children: ReactNode;
  align?: "left" | "right";
  size?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPinned((p) => !p);
        }}
        className="flex items-center justify-center text-stone-400 hover:text-brand-600"
        aria-label="Why this score"
      >
        <Info size={size} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full z-30 mt-1.5 w-80 rounded-lg border border-stone-200 bg-white p-3.5 text-left text-xs leading-relaxed text-stone-600 shadow-panel ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </span>
  );
}
