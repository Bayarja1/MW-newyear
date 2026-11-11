import type React from "react";
import { useEffect, useRef } from "react";

// Цасны чөтгөрхөн: нүүр хуудсанд хааяа шагайж гараад цасан хүн рүү цасан бөмбөг шиднэ.
export function SnowImp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stopped = false;
    const timers: number[] = [];
    const spawned = new Set<HTMLElement>();
    const wait = (ms: number) =>
      new Promise<void>((done) => timers.push(window.setTimeout(done, ms)));
    const spawn = (className: string, x: number, y: number) => {
      const el = document.createElement("i");
      el.className = className;
      el.style.left = x + "px";
      el.style.top = y + "px";
      document.body.appendChild(el);
      spawned.add(el);
      return el;
    };
    const drop = (el: HTMLElement) => {
      el.remove();
      spawned.delete(el);
    };

    async function throwBall(imp: HTMLElement, target: Element, facingLeft: boolean) {
      const i = imp.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const sx = facingLeft ? i.left + i.width * 0.14 : i.right - i.width * 0.14;
      const sy = i.top + i.height * 0.42;
      const ex = t.left + t.width * (0.4 + Math.random() * 0.2);
      const ey = t.top + t.height * (0.3 + Math.random() * 0.35);
      const lift = Math.min(140, Math.abs(ex - sx) * 0.45 + 40);
      const ball = spawn("snow-imp-ball", sx, sy);
      const frames = Array.from({ length: 9 }, (_, k) => {
        const p = k / 8;
        const x = (ex - sx) * p;
        const y = (ey - sy) * p - lift * 4 * p * (1 - p);
        return { transform: `translate(${x}px, ${y}px) rotate(${p * 540}deg)` };
      });
      await ball.animate(frames, { duration: 620, easing: "linear" }).finished.catch(() => {});
      drop(ball);
      if (stopped) return;
      for (let k = 0; k < 7; k++) {
        const bit = spawn("snow-imp-bit", ex, ey);
        const a = (k / 7) * Math.PI * 2 + Math.random() * 0.5;
        const d = 16 + Math.random() * 18;
        bit
          .animate(
            [
              { transform: "translate(0,0) scale(1)", opacity: 1 },
              {
                transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 10}px) scale(.4)`,
                opacity: 0,
              },
            ],
            { duration: 520, easing: "cubic-bezier(.2,.7,.4,1)" },
          )
          .finished.catch(() => {})
          .then(() => drop(bit));
      }
      const tilt = facingLeft ? 1 : -1;
      target.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: `rotate(${-7 * tilt}deg)` },
          { transform: `rotate(${4 * tilt}deg)` },
          { transform: "rotate(0deg)" },
        ],
        { duration: 520, easing: "ease-out" },
      );
    }

    async function loop() {
      await wait(3500);
      while (!stopped) {
        const imp = ref.current;
        const target = document.querySelector(".hero .snowman");
        const t = target?.getBoundingClientRect();
        if (imp && target && t && t.width > 0 && t.bottom > 60 && t.top < window.innerHeight) {
          const w = imp.offsetWidth;
          const h = imp.offsetHeight;
          // Цасан хүний баруун талд зай байвал тэндээс (зүүн тийш харж), эс бөгөөс зүүн талаас.
          const facingLeft = window.innerWidth - t.right > w * 0.7 + 24;
          const x = facingLeft
            ? Math.min(window.innerWidth - w * 0.78, t.right + 60)
            : Math.max(-w * 0.22, t.left - w - 60);
          imp.style.left = x + "px";
          imp.style.top = Math.max(70, t.bottom - h) + "px";
          imp.dataset.facing = facingLeft ? "left" : "right";
          imp.dataset.state = "peek";
          await wait(650);
          for (let n = 0; n < 3 && !stopped; n++) {
            imp.dataset.state = "throw";
            await wait(260);
            void throwBall(imp, target, facingLeft);
            await wait(520);
            imp.dataset.state = "peek";
            await wait(260);
          }
          if (stopped) break;
          imp.dataset.state = "laugh";
          await wait(1300);
          imp.dataset.state = "hide";
        }
        await wait(15000);
      }
    }
    void loop();
    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      spawned.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div ref={ref} className="snow-imp" data-state="hide" data-facing="left" aria-hidden="true">
      <svg viewBox="0 0 120 140" className="snow-imp__art">
        <path
          d="M86 112 Q 112 112 108 90 Q 106 82 99 86"
          fill="none"
          stroke="#a9c8df"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="99" cy="86" r="5" fill="#d9eaf6" />
        <ellipse cx="44" cy="132" rx="12" ry="6" fill="#bcd6ea" />
        <ellipse cx="72" cy="132" rx="12" ry="6" fill="#bcd6ea" />
        <ellipse
          cx="58"
          cy="100"
          rx="31"
          ry="31"
          fill="#eef6fc"
          stroke="#eef6fc"
          strokeWidth="9"
          strokeDasharray="0.1 8"
          strokeLinecap="round"
        />
        <ellipse cx="55" cy="106" rx="17" ry="19" fill="#d6e8f5" />
        <path
          d="M86 92 Q 100 98 93 110"
          fill="none"
          stroke="#eef6fc"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path d="M34 30 Q 22 10 38 14 Q 39 24 45 28 Z" fill="#6f93b3" />
        <path d="M74 28 Q 84 8 90 20 Q 82 23 80 32 Z" fill="#6f93b3" />
        <circle
          cx="57"
          cy="52"
          r="28"
          fill="#eef6fc"
          stroke="#eef6fc"
          strokeWidth="9"
          strokeDasharray="0.1 8"
          strokeLinecap="round"
        />
        <circle cx="38" cy="62" r="5" fill="#f2a7a2" opacity="0.45" />
        <circle cx="74" cy="62" r="5" fill="#f2a7a2" opacity="0.45" />
        <ellipse cx="46" cy="50" rx="7.5" ry="8.5" fill="#fff" stroke="#c3d8e8" />
        <ellipse cx="67" cy="50" rx="7.5" ry="8.5" fill="#fff" stroke="#c3d8e8" />
        <g className="snow-imp__pupils" fill="#1e2a25">
          <circle cx="43" cy="52" r="3.6" />
          <circle cx="64" cy="52" r="3.6" />
        </g>
        <path
          d="M36 39 L 52 44 M 77 39 L 61 44"
          stroke="#2f4a5e"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          className="snow-imp__grin"
          d="M42 63 Q 56 77 70 61"
          fill="none"
          stroke="#2f4a5e"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M50 67.5 L 53 72 L 55 68.5 Z" fill="#fff" />
        <path
          d="M34 78 Q 57 90 82 78 L 82 86 Q 57 97 34 86 Z"
          fill="#a33c38"
        />
        <path d="M76 84 L 92 100 L 84 103 L 72 88 Z" fill="#a33c38" className="snow-imp__scarf" />
        <path d="M38 83 Q 57 92 79 83" fill="none" stroke="#ead49b" strokeWidth="2" />
        <g className="snow-imp__arm">
          <path
            d="M36 94 Q 20 88 17 72"
            fill="none"
            stroke="#eef6fc"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="17" cy="70" r="6.5" fill="#b88a43" />
          <circle className="snow-imp__ball" cx="15" cy="61" r="6.5" fill="#fff" stroke="#c3d8e8" />
        </g>
      </svg>
    </div>
  );
}

export function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "search" | "lock" | "camera" | "check" | "clock" | "spark";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    camera: (
      <>
        <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    spark: <path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

// Тасралтгүй орох цас. CSS calc() дотор "%" үйлдэл ажилладаггүй тул утгыг энд тооцно.
const FLAKES = Array.from({ length: 72 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const near = i % 9 === 0;
  const size = near ? 7 + r(1) * 3 : 2 + r(1) * 3.5;
  const duration = near ? 7 + r(2) * 3 : 9 + r(2) * 9;
  return {
    left: (r(3) * 100).toFixed(2) + "%",
    width: size + "px",
    height: size + "px",
    opacity: near ? 0.55 : 0.55 + r(4) * 0.4,
    filter: near ? "blur(1.5px)" : size < 3 ? "blur(0.3px)" : undefined,
    animationDuration: duration.toFixed(1) + "s",
    animationDelay: (-r(5) * duration).toFixed(1) + "s",
    "--drift": ((r(6) - 0.5) * 120).toFixed(0) + "px",
  } as React.CSSProperties;
});

export function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {FLAKES.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </div>
  );
}

export function Celebration({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="celebration" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <i key={i} style={{ "--i": i } as React.CSSProperties} />
      ))}
      <b className="firework one" />
      <b className="firework two" />
    </div>
  );
}

// Чаргатай Санта + 4 буга. Зураг зүүн тийш харсан; буцах замд CSS-ээр толин тусгална.
const GIFT_COLORS = [
  ["#c8342c", "#ead49b"],
  ["#285b48", "#ead49b"],
  ["#b88a43", "#a33c38"],
  ["#fffdf8", "#c8342c"],
  ["#3d6f8e", "#fffdf8"],
];

export function SantaFlight() {
  const deer = [0, 62, 124, 186];
  const shipRef = useRef<HTMLDivElement>(null);
  // Нисэх үед чарганаас бэлэг унагааж, нэг нислэгт нэг удаа мэндчилгээний цаас хаяна.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spawned = new Set<HTMLElement>();
    const add = (el: HTMLElement) => {
      document.body.appendChild(el);
      spawned.add(el);
      return el;
    };
    const drop = (el: HTMLElement) => {
      el.remove();
      spawned.delete(el);
    };
    const sleigh = () => {
      const ship = shipRef.current;
      if (!ship) return null;
      const r = ship.getBoundingClientRect();
      if (r.right < 0 || r.left > window.innerWidth || r.width === 0) return null;
      const m = new DOMMatrixReadOnly(getComputedStyle(ship).transform);
      const facingLeft = m.a >= 0;
      return {
        x: r.left + r.width * (facingLeft ? 0.82 : 0.18),
        y: r.top + r.height * 0.72,
        facingLeft,
        center: r.left + r.width / 2,
      };
    };

    const dropGift = () => {
      const s = sleigh();
      if (!s || document.hidden) return;
      const [box, ribbon] = GIFT_COLORS[Math.floor(Math.random() * GIFT_COLORS.length)];
      const el = add(document.createElement("i"));
      el.className = "santa-gift";
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";
      el.style.setProperty("--box", box);
      el.style.setProperty("--ribbon", ribbon);
      const size = 14 + Math.random() * 8;
      el.style.width = el.style.height = size + "px";
      const fall = window.innerHeight - s.y + 40;
      // Чарга урагшаа явж байгаа тул бэлэг эсрэг чиглэлд бага зэрэг хоцорно.
      const drift = (s.facingLeft ? 1 : -1) * (40 + Math.random() * 60);
      const spin = (Math.random() - 0.5) * 540;
      el.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${drift * 0.6}px, ${fall * 0.35}px) rotate(${spin * 0.4}deg)`,
            opacity: 1,
            offset: 0.4,
          },
          { transform: `translate(${drift}px, ${fall}px) rotate(${spin}deg)`, opacity: 0.9 },
        ],
        { duration: 2600 + Math.random() * 900, easing: "cubic-bezier(.45,.05,.75,.6)" },
      )
        .finished.catch(() => {})
        .then(() => drop(el));
    };

    let lastFacing: boolean | null = null;
    let greeted = false;
    const dropGreeting = () => {
      const s = sleigh();
      if (!s) return;
      if (s.facingLeft !== lastFacing) {
        lastFacing = s.facingLeft;
        greeted = false;
      }
      if (greeted || Math.abs(s.center - window.innerWidth / 2) > window.innerWidth * 0.12) return;
      greeted = true;
      const el = add(document.createElement("div"));
      el.className = "santa-greeting";
      el.innerHTML = "<span>Шинэ жилийн</span><strong>мэнд хүргэе!</strong>";
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";
      const fall = Math.max(120, window.innerHeight * 0.42 - s.y);
      el.animate(
        [
          { transform: "translate(-50%, 0) scale(.35) rotate(-14deg)", opacity: 0 },
          { transform: `translate(-50%, ${fall * 0.25}px) scale(.85) rotate(12deg)`, opacity: 1, offset: 0.18 },
          { transform: `translate(-30%, ${fall * 0.55}px) scale(1) rotate(-9deg)`, offset: 0.36 },
          { transform: `translate(-70%, ${fall * 0.82}px) scale(1) rotate(6deg)`, offset: 0.52 },
          { transform: `translate(-50%, ${fall}px) scale(1) rotate(-2deg)`, opacity: 1, offset: 0.66 },
          { transform: `translate(-50%, ${fall}px) scale(1) rotate(-2deg)`, opacity: 1, offset: 0.9 },
          { transform: `translate(-50%, ${fall + 30}px) scale(.96) rotate(-2deg)`, opacity: 0 },
        ],
        { duration: 7000, easing: "ease-in-out" },
      )
        .finished.catch(() => {})
        .then(() => drop(el));
    };

    const giftTimer = window.setInterval(dropGift, 900);
    const greetTimer = window.setInterval(dropGreeting, 200);
    return () => {
      clearInterval(giftTimer);
      clearInterval(greetTimer);
      spawned.forEach((el) => el.remove());
    };
  }, []);
  return (
    <div className="santa-flight" aria-hidden="true">
      <div ref={shipRef} className="santa-flight__ship">
        <svg viewBox="0 0 420 112" className="santa-flight__art">
          <g className="santa-flight__reins" stroke="#b88a43" strokeWidth="1.6" fill="none">
            <path d={`M${deer[3] + 14} 30 Q 250 44 300 46`} />
            <path d="M14 30 L 200 30" />
          </g>
          {deer.map((x, i) => (
            <g key={x} transform={`translate(${x} ${i % 2 ? 4 : 0})`}>
              <g
                className="santa-flight__deer"
                style={{ "--d": `${i * -0.15}s` } as React.CSSProperties}
              >
                {/* Хойд хөл (ард) */}
                <g
                  className="santa-flight__leg santa-flight__leg--back"
                  stroke="#7a4f28"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                >
                  <path d="M42 47 L50 56 L57 60" />
                  <path d="M46 47 L53 55 L61 57" />
                </g>
                <path
                  d="M44 40 L50 32 L54 36"
                  fill="none"
                  stroke="#8a5a2e"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <ellipse cx="30" cy="42" rx="20" ry="9" fill="#a8703d" />
                <ellipse cx="30" cy="46" rx="14" ry="4" fill="#f1dcc0" />
                {/* Урд хөл */}
                <g
                  className="santa-flight__leg santa-flight__leg--front"
                  stroke="#8a5a2e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                >
                  <path d="M18 47 L11 55 L6 60" />
                  <path d="M22 47 L16 57 L14 63" />
                </g>
                <path d="M11 40 L5 23 L14 20 L21 36 Z" fill="#a8703d" />
                <ellipse cx="7" cy="21" rx="8" ry="5.5" fill="#a8703d" />
                <ellipse
                  cx="13"
                  cy="15"
                  rx="2"
                  ry="4"
                  fill="#8a5a2e"
                  transform="rotate(25 13 15)"
                />
                <path
                  d="M9 16 L11 6 M10.5 9 L6 4 M10.5 9 L15 3 M14 16 L18 7 M16.5 10.5 L21 7"
                  fill="none"
                  stroke="#6b4527"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="4" cy="19.5" r="1.3" fill="#1e2a25" />
                <path d="M8 32 L17 28" stroke="#b88a43" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            </g>
          ))}
          <g className="santa-flight__sleigh">
            <ellipse cx="368" cy="38" rx="16" ry="18" fill="#285b48" />
            <rect x="356" y="14" width="12" height="10" rx="1.5" fill="#b88a43" />
            <rect x="368" y="10" width="10" height="13" rx="1.5" fill="#a33c38" />
            <path d="M362 14 V24 M356 19 H368 M373 10 V23" stroke="#fffdf8" strokeWidth="1.4" />
            <ellipse cx="334" cy="54" rx="17" ry="15" fill="#c8342c" />
            <path d="M330 41 Q 334 66 340 41 Z" fill="#fffdf8" />
            <circle cx="325" cy="34" r="8.5" fill="#f2c9a5" />
            <path d="M316 36 Q 318 52 326 52 Q 334 50 333 37 Q 325 41 316 36 Z" fill="#fffdf8" />
            <circle cx="321" cy="33" r="1.2" fill="#1e2a25" />
            <path d="M316 28 Q 326 12 344 20 L 334 29 Z" fill="#c8342c" />
            <rect x="315" y="26" width="20" height="5" rx="2.5" fill="#fffdf8" />
            <circle cx="345" cy="20" r="3.4" fill="#fffdf8" />
            <path className="santa-flight__wave" d="M326 50 L 306 38" stroke="#c8342c" strokeWidth="6" strokeLinecap="round" />
            <circle cx="304" cy="37" r="4" fill="#fffdf8" />
            <path
              d="M292 60 L384 60 Q 394 60 394 48 L 394 42 L 384 42 L 380 54 Q 300 56 296 60 Z"
              fill="#a33c38"
            />
            <path
              d="M290 60 Q 286 84 306 86 L 376 86 Q 392 86 394 60 Z"
              fill="#c8342c"
              stroke="#b88a43"
              strokeWidth="2.5"
            />
            <path d="M312 72 Q 340 64 368 72" fill="none" stroke="#ead49b" strokeWidth="2" />
            <path
              d="M308 86 V96 M372 86 V96 M276 96 Q 268 96 270 88 Q 272 84 278 86 M276 96 H 384 Q 396 96 396 88"
              fill="none"
              stroke="#b88a43"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <g className="santa-flight__trail" fill="#ead49b">
            <circle cx="402" cy="70" r="2.4" />
            <circle cx="412" cy="62" r="1.6" />
            <circle cx="408" cy="80" r="1.8" />
            <circle cx="417" cy="73" r="1.2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export function Brand() {
  return (
    <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <span className="brand-mark">
        <Icon name="spark" size={18} />
      </span>
      <span>
        <strong>Ид шидийн өртөө</strong>
        <small>Жижигхэн нууц. Томхон догдлол.</small>
      </span>
    </button>
  );
}

export function SantaVillage() {
  const santaRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  // Сантагийн нүд (мөн толгой нь бага зэрэг) хулганы заагчийг дагаж харна.
  useEffect(() => {
    let frame = 0;
    let point: { x: number; y: number } | null = null;
    const apply = () => {
      frame = 0;
      const svg = santaRef.current;
      const ctm = svg?.getScreenCTM();
      if (!svg || !ctm || !eyesRef.current || !headRef.current) return;
      let dx = 0,
        dy = 0;
      if (point) {
        const cx = ctm.a * 115 + ctm.c * 102 + ctm.e;
        const cy = ctm.b * 115 + ctm.d * 102 + ctm.f;
        const vx = point.x - cx,
          vy = point.y - cy;
        const dist = Math.hypot(vx, vy) || 1;
        const reach = Math.min(1, dist / 220);
        dx = (vx / dist) * reach;
        dy = (vy / dist) * reach;
      }
      eyesRef.current.style.transform = `translate(${dx * 3.6}px, ${dy * 3.6}px)`;
      headRef.current.style.transform = `translate(${dx * 3}px, ${dy * 2.2}px)`;
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const move = (e: PointerEvent) => {
      point = { x: e.clientX, y: e.clientY };
      queue();
    };
    const leave = () => {
      point = null;
      queue();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);
  return (
    <div className="village-art" aria-label="Өвлийн баярын тосгон">
      <span className="ornament ornament-a" />
      <span className="ornament ornament-b" />
      <span className="ornament ornament-c" />
      <svg className="hero-tree" viewBox="0 0 230 350" role="img" aria-label="Гэрэлт гацуур мод">
        <defs>
          <linearGradient id="treeG" x1="0" x2="1">
            <stop stopColor="#123f31" />
            <stop offset="1" stopColor="#2d654f" />
          </linearGradient>
          <linearGradient id="goldG" x1="0" x2="1">
            <stop stopColor="#9d7130" />
            <stop offset=".5" stopColor="#f6df9d" />
            <stop offset="1" stopColor="#ad7b32" />
          </linearGradient>
        </defs>
        <path d="m115 23 15 31-15-6-15 6z" fill="url(#goldG)" />
        <path d="M115 44 55 145h34L37 224h44l-61 83h190l-61-83h44l-52-79h34z" fill="url(#treeG)" />
        <path
          d="M53 166c41 23 85 21 126-1M47 245c47 21 95 21 138 0"
          fill="none"
          stroke="#d5b46d"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {[
          ["78", "135"],
          ["132", "107"],
          ["111", "179"],
          ["157", "190"],
          ["69", "234"],
          ["132", "257"],
          ["173", "276"],
          ["99", "292"],
        ].map(([cx, cy], i) => (
          <g key={i} className={`tree-light light-${i}`}>
            <circle cx={cx} cy={cy} r="6" fill={i % 3 === 0 ? "#b6433c" : "#f8d778"} />
            <circle cx={cx} cy={cy} r="13" fill="#f8d778" opacity=".14" />
          </g>
        ))}
        <path d="M92 307h46v35H92z" fill="#81582f" />
        <ellipse cx="115" cy="340" rx="94" ry="12" fill="#fffaf0" />
      </svg>
      <svg
        ref={santaRef}
        className="santa"
        viewBox="0 0 230 310"
        role="img"
        aria-label="Гараа даллаж буй өвлийн өвгөн"
      >
        <ellipse cx="116" cy="292" rx="78" ry="12" fill="#d9d0bd" opacity=".55" />
        <path d="M72 150c-25 20-35 75-29 131h143c5-65-10-117-44-137z" fill="#9f312f" />
        <path d="M90 151v130h28V157" fill="#f5ecdc" opacity=".92" />
        <path d="M44 221c-18-10-28 1-25 13 4 14 19 17 30 7" fill="#f2c5a5" />
        <g className="santa-arm">
          <path
            d="M153 165c25-7 33-30 42-50"
            fill="none"
            stroke="#9f312f"
            strokeWidth="29"
            strokeLinecap="round"
          />
          <path
            d="M195 116c-4-17 5-32 16-30 12 2 9 16 2 23 10-3 15 5 9 12-8 10-19 9-27-5z"
            fill="#f2c5a5"
          />
        </g>
        <g ref={headRef} className="santa-head">
          <circle cx="115" cy="108" r="49" fill="#f2c5a5" />
          <path
            d="M67 104c4 45 22 70 48 71 27 0 45-26 48-70-9 15-22 18-31 9-7 11-23 11-31 0-10 9-24 5-34-10z"
            fill="#fffaf0"
          />
          <path d="M78 76c9-47 50-60 80-24l17 23-98 4z" fill="#a43431" />
          <circle cx="176" cy="76" r="15" fill="#fffaf0" />
          <ellipse cx="99" cy="101" rx="7.5" ry="8" fill="#fffdf8" />
          <ellipse cx="131" cy="101" rx="7.5" ry="8" fill="#fffdf8" />
          <g ref={eyesRef} className="santa-pupils" fill="#23352d">
            <circle cx="99" cy="102" r="3.8" />
            <circle cx="131" cy="102" r="3.8" />
            <circle cx="100.3" cy="100.6" r="1.1" fill="#fffdf8" />
            <circle cx="132.3" cy="100.6" r="1.1" fill="#fffdf8" />
          </g>
          <path
            d="M106 121c7 5 14 5 20 0"
            fill="none"
            stroke="#9d4f43"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <path d="M41 278h57v16H37zM132 278h57l5 16h-62z" fill="#302c29" />
      </svg>
      <svg
        className="snowman"
        viewBox="0 0 150 230"
        role="img"
        aria-label="Инээмсэглэсэн цасан хүн"
      >
        <ellipse cx="75" cy="217" rx="62" ry="9" fill="#d9d0bd" opacity=".55" />
        <circle cx="75" cy="161" r="55" fill="#fffdf8" />
        <circle cx="75" cy="80" r="39" fill="#fffdf8" />
        <path
          d="M46 56h58M55 51l5-35h34l6 35"
          fill="#25483c"
          stroke="#25483c"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <g className="snowman-eyes">
          <circle cx="63" cy="75" r="3.5" fill="#26372f" />
          <circle cx="87" cy="75" r="3.5" fill="#26372f" />
        </g>
        <path d="m75 81 20 6-20 4z" fill="#d9893e" />
        <path
          d="M64 98c8 6 16 6 23 0"
          fill="none"
          stroke="#26372f"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M40 112c24 13 48 14 72 0l-7 18c-21 9-41 7-60-3z" fill="#a73b37" />
        <circle cx="75" cy="151" r="4" fill="#af813b" />
        <circle cx="75" cy="173" r="4" fill="#af813b" />
      </svg>
      <div className="snowbank" />
    </div>
  );
}
