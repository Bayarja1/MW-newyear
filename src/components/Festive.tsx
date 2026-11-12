import type React from "react";
import { useEffect, useRef } from "react";
import santaFace from "../assets/santa-face.png";

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

const NEW_YEAR_GREETINGS = [
  { lang: "mn", top: "Шинэ жилийн", main: "мэнд хүргэе!" },
  { lang: "en", top: "Wishing you a", main: "Happy New Year!" },
  { lang: "ja", top: "あけまして", main: "おめでとう!" },
  { lang: "ko", top: "새해", main: "복 많이 받으세요!" },
  { lang: "zh", top: "恭贺", main: "新年快乐!" },
  { lang: "ru", top: "Поздравляем", main: "С Новым годом!" },
  { lang: "es", top: "Te deseamos", main: "¡Feliz Año Nuevo!" },
  { lang: "fr", top: "Nous vous souhaitons", main: "Bonne année !" },
  { lang: "de", top: "Wir wünschen", main: "Frohes neues Jahr!" },
  { lang: "it", top: "Tanti auguri", main: "Buon anno!" },
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
    let greetingIndex = 0;
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
      const greeting = NEW_YEAR_GREETINGS[greetingIndex % NEW_YEAR_GREETINGS.length];
      greetingIndex++;
      el.lang = greeting.lang;
      const main = document.createElement("strong");
      main.textContent = `${greeting.top} ${greeting.main}`;
      el.append(main);
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";
      const fall = Math.max(320, window.innerHeight - s.y + 100);
      el.animate(
        [
          { transform: "translate(-50%, 0) scale(.35) rotate(-14deg)", opacity: 0 },
          { transform: `translate(-50%, ${fall * 0.12}px) scale(.88) rotate(10deg)`, opacity: 1, offset: 0.14 },
          { transform: `translate(-34%, ${fall * 0.38}px) scale(1) rotate(-8deg)`, opacity: 1, offset: 0.38 },
          { transform: `translate(-66%, ${fall * 0.68}px) scale(1) rotate(6deg)`, opacity: 0.95, offset: 0.68 },
          { transform: `translate(-45%, ${fall * 0.9}px) scale(.96) rotate(-3deg)`, opacity: 0.35, offset: 0.9 },
          { transform: `translate(-50%, ${fall}px) scale(.9) rotate(2deg)`, opacity: 0 },
        ],
        { duration: 6200, easing: "cubic-bezier(.28,.1,.55,1)" },
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

// ===== Сэвсгэр, чимэглэлтэй гацуур (процедурээр үүсгэнэ, нэг удаа тооцно) =====
const TREE = (() => {
  let seed = 20261231;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const CX = 115;
  // [дээд y, доод y, дээд хагас өргөн, доод хагас өргөн]
  const tiers = [
    [44, 100, 3, 44],
    [84, 152, 20, 64],
    [134, 208, 32, 84],
    [190, 264, 42, 100],
    [246, 310, 52, 110],
  ];
  const widthAt = (t: number[], y: number) => t[2] + ((y - t[0]) / (t[1] - t[0])) * (t[3] - t[2]);
  const needles = ["", "", "", ""]; // хар, дунд, цайвар, гэрэлтсэн
  const bases: string[] = [];
  for (const t of tiers) {
    bases.push(
      `M${CX - t[2]} ${t[0] + 4}L${CX} ${t[0] - 6}L${CX + t[2]} ${t[0] + 4}L${CX + t[3] - 6} ${t[1] - 4}Q${CX} ${t[1] + 6} ${CX - t[3] + 6} ${t[1] - 4}Z`,
    );
    for (let y = t[0]; y <= t[1]; y += 6.5) {
      const w = widthAt(t, y);
      const skirt = y > t[1] - 13;
      for (let x = -w; x <= w + 0.1; x += 8.5) {
        const px = CX + x + (rand() - 0.5) * 5;
        const py = y + (rand() - 0.5) * 3;
        const side = w ? x / w : 0;
        const dir = 90 - side * 55;
        const count = skirt ? 9 : 7;
        for (let k = 0; k < count; k++) {
          const a = ((dir + (rand() - 0.5) * 150) * Math.PI) / 180;
          const len = (skirt ? 10 : 7) + rand() * 6;
          const dx = (Math.cos(a) * len).toFixed(1);
          const dy = (Math.sin(a) * len * 0.85 + (skirt ? 2.5 : 1)).toFixed(1);
          const light = rand() - side * 0.18 - (skirt ? 0.12 : 0);
          const shade = light < 0.3 ? 0 : light < 0.68 ? 1 : light < 0.93 ? 2 : 3;
          needles[shade] += `M${px.toFixed(1)} ${py.toFixed(1)}l${dx} ${dy}`;
        }
      }
    }
  }
  // Чимэглэлүүд: давхарга бүрт тэнцүү тараана.
  const kinds = ["red", "gold", "bow", "candy", "blue", "ginger", "silver", "flake", "red", "bow"];
  const items: { kind: string; x: number; y: number; s: number }[] = [];
  let n = 0;
  tiers.forEach((t, ti) => {
    const per = [2, 3, 4, 5, 6][ti];
    for (let i = 0; i < per; i++) {
      const y = t[0] + (t[1] - t[0]) * (0.45 + rand() * 0.45);
      const w = widthAt(t, y) * 0.78;
      const x = CX - w + ((i + 0.5) / per) * 2 * w + (rand() - 0.5) * 8;
      items.push({ kind: kinds[n++ % kinds.length], x, y, s: 0.9 + rand() * 0.35 });
    }
  });
  const garlands = tiers.slice(1).map((t, i) => {
    const y1 = t[0] + (t[1] - t[0]) * 0.35;
    const y2 = t[0] + (t[1] - t[0]) * 0.62;
    const w1 = widthAt(t, y1) * 0.92;
    const w2 = widthAt(t, y2) * 0.92;
    const flip = i % 2 === 0;
    const [ax, ay, bx, by] = flip
      ? [CX - w1, y1, CX + w2, y2]
      : [CX + w1, y1, CX - w2, y2];
    return `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${CX} ${((ay + by) / 2 + 16).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  });
  const sparkles = Array.from({ length: 26 }, () => {
    const t = tiers[Math.floor(rand() * tiers.length)];
    const y = t[0] + 8 + rand() * (t[1] - t[0] - 10);
    const w = widthAt(t, y) * 0.9;
    const dur = 1.4 + rand() * 2.2;
    return { x: CX + (rand() * 2 - 1) * w, y, s: 0.6 + rand() * 0.8, d: -rand() * dur, dur };
  });
  return { needles, bases, items, garlands, sparkles };
})();

const STAR_PATH = (() => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 7 : 17;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(115 + Math.cos(a) * r).toFixed(1)} ${(30 + Math.sin(a) * r).toFixed(1)}`;
  });
  return "M" + pts.join("L") + "Z";
})();

function TreeItem({ kind, x, y, s }: { kind: string; x: number; y: number; s: number }) {
  const at = `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`;
  if (kind === "candy")
    return (
      <g transform={at + " rotate(-12)"}>
        <path d="M0 9V-2a3.5 3.5 0 0 1 7 0" fill="none" stroke="#fffdf8" strokeWidth="2.8" strokeLinecap="round" />
        <path
          d="M0 9V-2a3.5 3.5 0 0 1 7 0"
          fill="none"
          stroke="#c8342c"
          strokeWidth="2.8"
          strokeDasharray="2.2 2.2"
        />
      </g>
    );
  if (kind === "ginger")
    return (
      <g transform={at}>
        <path
          d="M-5 -1H5M0 -3V4M0 4L-3.5 9M0 4L3.5 9"
          stroke="#b5702f"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cy="-5.5" r="3.4" fill="#b5702f" />
        <path d="M-4.5 -1H-3M3 -1H4.5" stroke="#fffdf8" strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="0" cy="0.8" r="0.7" fill="#fffdf8" />
        <circle cx="0" cy="2.8" r="0.7" fill="#c8342c" />
      </g>
    );
  if (kind === "flake")
    return (
      <g transform={at} stroke="#f5fbff" strokeWidth="1.3" strokeLinecap="round">
        <path d="M0 -7V7M-6 -3.5L6 3.5M-6 3.5L6 -3.5" />
        <path d="M-2 -5.5L0 -4L2 -5.5M-2 5.5L0 4L2 5.5" fill="none" />
      </g>
    );
  const color = kind === "bow" ? "red" : kind;
  return (
    <g transform={at}>
      <line x1="0" y1="-11" x2="0" y2="-7" stroke="#c9a14f" strokeWidth="0.8" />
      <rect x="-2.2" y="-8.6" width="4.4" height="2.8" rx="0.8" fill="#d8b25c" />
      <circle r="6.6" fill={`url(#lt-${color})`} />
      <ellipse cx="-2.2" cy="-2.4" rx="1.9" ry="1.2" fill="#fff" opacity="0.75" />
      {kind === "bow" && (
        <g transform="translate(0 -9)">
          <path d="M0 0C-6 -5 -9 1 -3 2Z M0 0C6 -5 9 1 3 2Z" fill="#d63a33" />
          <path d="M-1 1L-4 7M1 1L4 7" stroke="#d63a33" strokeWidth="1.8" strokeLinecap="round" />
          <circle r="1.6" fill="#a8261f" />
        </g>
      )}
    </g>
  );
}

function LushTree() {
  return (
    <svg className="hero-tree" viewBox="0 0 230 350" role="img" aria-label="Чимэглэсэн гацуур мод">
      <defs>
        <radialGradient id="lt-red" cx="35%" cy="30%" r="75%">
          <stop stopColor="#ff8a7a" />
          <stop offset=".45" stopColor="#d63a33" />
          <stop offset="1" stopColor="#7d1714" />
        </radialGradient>
        <radialGradient id="lt-gold" cx="35%" cy="30%" r="75%">
          <stop stopColor="#fff3c4" />
          <stop offset=".45" stopColor="#e2b44a" />
          <stop offset="1" stopColor="#8a5f1c" />
        </radialGradient>
        <radialGradient id="lt-blue" cx="35%" cy="30%" r="75%">
          <stop stopColor="#d6ecff" />
          <stop offset=".45" stopColor="#4d8fc4" />
          <stop offset="1" stopColor="#1d4466" />
        </radialGradient>
        <radialGradient id="lt-silver" cx="35%" cy="30%" r="75%">
          <stop stopColor="#ffffff" />
          <stop offset=".5" stopColor="#c9d3da" />
          <stop offset="1" stopColor="#7d8a93" />
        </radialGradient>
        <linearGradient id="lt-star" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff6c8" />
          <stop offset=".5" stopColor="#f2c23d" />
          <stop offset="1" stopColor="#b07a12" />
        </linearGradient>
        <radialGradient id="lt-glow">
          <stop stopColor="#fff3b0" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lt-trunk" x1="0" x2="1">
          <stop stopColor="#5e3b1e" />
          <stop offset=".5" stopColor="#8a5a2e" />
          <stop offset="1" stopColor="#5e3b1e" />
        </linearGradient>
      </defs>
      <ellipse cx="115" cy="336" rx="100" ry="13" fill="#6b5a3a" opacity=".18" />
      <rect x="103" y="300" width="24" height="34" rx="2" fill="url(#lt-trunk)" />
      {TREE.bases.map((d, i) => (
        <path key={i} d={d} fill="#0e4528" />
      ))}
      <g fill="none" strokeLinecap="round">
        <path d={TREE.needles[0]} stroke="#0d4a2a" strokeWidth="2.3" />
        <path d={TREE.needles[1]} stroke="#1c7a3c" strokeWidth="1.9" />
        <path d={TREE.needles[2]} stroke="#36a04c" strokeWidth="1.5" />
        <path d={TREE.needles[3]} stroke="#86d27a" strokeWidth="1.1" />
      </g>
      <g fill="none" strokeLinecap="round">
        {TREE.garlands.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#e8eef3" strokeWidth="1.4" strokeDasharray="2.5 1.8" opacity=".9" />
            <path
              d={d}
              stroke={i % 2 ? "#d63a33" : "#f2c23d"}
              strokeWidth="3.4"
              strokeDasharray="0 5.5"
              transform="translate(0 3)"
            />
          </g>
        ))}
      </g>
      {TREE.items.map((it, i) => (
        <TreeItem key={i} {...it} />
      ))}
      {TREE.sparkles.map((p, i) => (
        <g
          key={i}
          transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(2)})`}
        >
          <g
            className="tree-sparkle"
            style={{ animationDelay: `${p.d.toFixed(2)}s`, animationDuration: `${p.dur.toFixed(2)}s` }}
          >
            <circle r="9" fill="url(#lt-glow)" />
            <path
              d="M0 -7L1.2 -1.2L7 0L1.2 1.2L0 7L-1.2 1.2L-7 0L-1.2 -1.2Z"
              fill={i % 3 ? "#fffbe0" : "#ffe27a"}
            />
          </g>
        </g>
      ))}
      <g className="tree-star">
        <circle cx="115" cy="30" r="30" fill="url(#lt-glow)" />
        <path
          d="M115 2V58M87 30H143M95 10L135 50M135 10L95 50"
          stroke="#fff3b0"
          strokeWidth="1"
          opacity=".6"
        />
        <path d={STAR_PATH} fill="url(#lt-star)" stroke="#b07a12" strokeWidth="0.8" />
        <path d="M115 16L118 27L111 25Z" fill="#fff" opacity=".55" />
      </g>
      <ellipse cx="115" cy="340" rx="94" ry="12" fill="#fffaf0" />
    </svg>
  );
}

export function SantaVillage() {
  return (
    <div className="village-art" aria-label="Өвлийн баярын тосгон">
      <span className="ornament ornament-a" />
      <span className="ornament ornament-b" />
      <span className="ornament ornament-c" />
      <LushTree />
      <img
        className="santa santa-photo"
        src="/santa-main-character.png?v=5"
        alt="Гараа даллаж буй Санта"
        draggable={false}
      />
      <svg
        className="santa santa-original"
        viewBox="0 0 230 310"
        role="img"
        aria-label="Гараа даллаж буй өвлийн өвгөн"
      >
        <defs>
          <linearGradient id="sv-coat" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ef4a3c" />
            <stop offset=".55" stopColor="#d1302a" />
            <stop offset="1" stopColor="#9c1d1a" />
          </linearGradient>
          <linearGradient id="sv-boot" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#4a4a4f" />
            <stop offset="1" stopColor="#1d1d20" />
          </linearGradient>
          <clipPath id="sv-face">
            <ellipse cx="115" cy="106" rx="26" ry="34" />
          </clipPath>
        </defs>
        <ellipse cx="116" cy="297" rx="80" ry="11" fill="#d9d0bd" opacity=".55" />
        {/* Гутал, өмд */}
        <path d="M106 266H72v14l-11 3a6 6 0 0 0 2 11h37a6 6 0 0 0 6-6z" fill="url(#sv-boot)" />
        <path d="M124 266h34v14l11 3a6 6 0 0 1-2 11h-37a6 6 0 0 1-6-6z" fill="url(#sv-boot)" />
        <path d="M66 288h30M134 288h30" stroke="#6a6a70" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="76" y="236" width="28" height="30" fill="#c42a25" />
        <rect x="126" y="236" width="28" height="30" fill="#c42a25" />
        <rect x="70" y="258" width="40" height="12" rx="6" fill="#fffaf0" />
        <rect x="120" y="258" width="40" height="12" rx="6" fill="#fffaf0" />
        {/* Доош унжсан гар */}
        <path
          d="M72 176C58 192 50 212 46 232"
          fill="none"
          stroke="url(#sv-coat)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <ellipse cx="45" cy="238" rx="15" ry="9" fill="#fffaf0" transform="rotate(-12 45 238)" />
        <path d="M34 244c-4 8 0 18 9 19 9 1 15-5 13-13-1-6-6-9-11-8l-3-4z" fill="#f2c5a5" />
        {/* Цув */}
        <path
          d="M68 164C52 190 48 228 56 258Q115 278 174 258C182 228 178 190 162 164Q115 148 68 164Z"
          fill="url(#sv-coat)"
        />
        <path
          d="M55 250Q115 270 175 250L177 264Q115 288 53 264Z"
          fill="#fffaf0"
          stroke="#fffaf0"
          strokeWidth="6"
          strokeDasharray="0.1 7"
          strokeLinecap="round"
        />
        <rect x="105" y="168" width="20" height="92" rx="9" fill="#fffaf0" />
        {/* Бүс, алтан горхи */}
        <path d="M55 212Q115 228 175 212L176 230Q115 247 54 230Z" fill="#26262a" />
        <rect x="99" y="214" width="32" height="26" rx="4" fill="none" stroke="#d9a647" strokeWidth="5" />
        <rect x="111" y="222" width="14" height="10" rx="1.5" fill="#d9a647" />
        <ellipse cx="115" cy="164" rx="46" ry="11" fill="#fffaf0" />
        {/* Даллаж буй гар */}
        <g className="santa-arm">
          <path
            d="M158 174C182 168 192 146 197 124"
            fill="none"
            stroke="url(#sv-coat)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <ellipse
            cx="198"
            cy="120"
            rx="15"
            ry="9"
            fill="#fffaf0"
            transform="rotate(-70 198 120)"
          />
          <path
            d="M195 116c-4-17 5-32 16-30 12 2 9 16 2 23 10-3 15 5 9 12-8 10-19 9-27-5z"
            fill="#f2c5a5"
          />
        </g>
        {/* Толгой: сахал, зураг дээрх нүүр, малгай */}
        <g className="santa-head">
          <path
            d="M80 96C70 132 80 172 115 182C150 172 160 132 150 96Q115 152 80 96Z"
            fill="#fffaf0"
            stroke="#fffaf0"
            strokeWidth="11"
            strokeDasharray="0.1 9"
            strokeLinecap="round"
          />
          <ellipse cx="115" cy="106" rx="28" ry="36" fill="#f2c5a5" />
          <image
            href={santaFace}
            x="66.4"
            y="34.7"
            width="97"
            height="138"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#sv-face)"
          />
          <path
            d="M82 68C86 30 128 14 154 30C170 40 178 58 184 76L172 80C166 64 158 54 150 60L148 66Q115 54 82 68Z"
            fill="url(#sv-coat)"
          />
          <path
            d="M80 82Q115 66 150 82L152 69Q115 52 78 69Z"
            fill="#fffaf0"
            stroke="#fffaf0"
            strokeWidth="9"
            strokeDasharray="0.1 7"
            strokeLinecap="round"
          />
          <circle
            cx="180"
            cy="84"
            r="10"
            fill="#fffaf0"
            stroke="#fffaf0"
            strokeWidth="6"
            strokeDasharray="0.1 5"
            strokeLinecap="round"
          />
        </g>
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
