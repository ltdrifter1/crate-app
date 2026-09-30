/**
 * Lightweight fixed-row virtual list — no extra deps.
 * Parent scrolls; only the visible window (+ overscan) mounts.
 */
import { useEffect, useRef, useState } from "react";

export default function VirtualList({
  items = [],
  estimateSize = 64,
  overscan = 6,
  maxHeight = 480,
  renderItem,
  getKey = (item, index) => item?.id ?? index,
  style,
  className,
}) {
  const parentRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(maxHeight);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return undefined;
    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => setViewport(el.clientHeight || maxHeight))
      : null;
    ro?.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    setViewport(el.clientHeight || maxHeight);
    return () => {
      ro?.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [maxHeight, items.length]);

  const count = items.length;
  const row = Math.max(1, estimateSize);
  const total = count * row;
  const start = Math.max(0, Math.floor(scrollTop / row) - overscan);
  const end = Math.min(count, Math.ceil((scrollTop + viewport) / row) + overscan);

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        maxHeight,
        overflow: "auto",
        position: "relative",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      <div style={{ height: total, position: "relative" }}>
        {items.slice(start, end).map((item, i) => {
          const index = start + i;
          return (
            <div
              key={getKey(item, index)}
              style={{
                position: "absolute",
                top: index * row,
                left: 0,
                right: 0,
                height: row,
                boxSizing: "border-box",
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
