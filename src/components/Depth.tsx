import { useEffect } from "react";

// Хулганы байрлалыг --mx/--my (-1..1) болгож hero-гийн parallax-д өгнө,
// заагчийн доорх картыг 3D-ээр хазайлгаж гялбаа (--gx/--gy) тусгана.
const TILT = ".door:not(.locked), .stat, .mystery-card, .login-panel, .depth-tilt";

export function useDepth() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    const root = document.documentElement;
    let frame = 0;
    let mx = 0,
      my = 0,
      cx = 0,
      cy = 0;
    let card: HTMLElement | null = null;

    const release = (el: HTMLElement) => {
      el.classList.remove("is-tilting");
      for (const p of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(p);
    };
    const render = () => {
      frame = 0;
      root.style.setProperty("--mx", mx.toFixed(3));
      root.style.setProperty("--my", my.toFixed(3));
      if (!card) return;
      const r = card.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (cx - r.left) / r.width));
      const ny = Math.min(1, Math.max(0, (cy - r.top) / r.height));
      // Том хавтан бага, жижиг карт илүү хазайна.
      const max = r.width > 420 ? 3.5 : 9;
      card.style.setProperty("--ry", ((nx - 0.5) * 2 * max).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-(ny - 0.5) * 2 * max).toFixed(2) + "deg");
      card.style.setProperty("--gx", (nx * 100).toFixed(1) + "%");
      card.style.setProperty("--gy", (ny * 100).toFixed(1) + "%");
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const move = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      cx = e.clientX;
      cy = e.clientY;
      const next = (e.target as Element | null)?.closest?.(TILT) as HTMLElement | null;
      if (next !== card) {
        if (card) release(card);
        card = next;
        card?.classList.add("is-tilting");
      }
      queue();
    };
    const leave = () => {
      mx = my = 0;
      if (card) release(card);
      card = null;
      queue();
    };
    window.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      if (card) release(card);
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
    };
  }, []);
}
