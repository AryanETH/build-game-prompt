import { useEffect, useRef } from "react";

export default function RocketCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const currentXRef = useRef(0);
  const currentYRef = useRef(0);

  useEffect(() => {
    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    const handleMouseMove = (event: MouseEvent) => {
      targetXRef.current = event.clientX;
      targetYRef.current = event.clientY;
      cursorEl.style.opacity = "1";
      startAnimation();
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };

    const startAnimation = () => {
      if (rafRef.current) return;
      const tick = () => {
        const dx = targetXRef.current - currentXRef.current;
        const dy = targetYRef.current - currentYRef.current;
        currentXRef.current += dx * 0.2;
        currentYRef.current += dy * 0.2;
        if (cursorRef.current) {
          const offsetX = 12;
          const offsetY = 12;
          cursorRef.current.style.transform = `translate3d(${currentXRef.current - offsetX}px, ${currentYRef.current - offsetY}px, 0)`;
        }
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = undefined;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "24px",
        height: "24px",
        transform: "translate3d(-100px, -100px, 0)",
        transition: "opacity 150ms ease",
        opacity: 0,
        pointerEvents: "none",
        zIndex: 2147483647,
        fontSize: "20px",
        lineHeight: "24px",
        willChange: "transform",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      🚀
    </div>
  );
}
