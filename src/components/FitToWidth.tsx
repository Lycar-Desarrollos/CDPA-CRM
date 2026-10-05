"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Escala su contenido (de ancho fijo) para que quepa en el contenedor.
 * En impresión se desactiva la escala.
 */
export function FitToWidth({ children, baseWidth = 816 }: { children: ReactNode; baseWidth?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      if (!outer.current || !inner.current) return;
      const s = Math.min(1, outer.current.clientWidth / baseWidth);
      setScale(s);
      setHeight(inner.current.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [baseWidth]);

  return (
    <div ref={outer} className="fit-outer w-full overflow-hidden" style={{ height }}>
      <div
        ref={inner}
        className="fit-inner origin-top-left"
        style={{ width: baseWidth, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
