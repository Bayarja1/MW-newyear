import type React from "react";
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

export function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} style={{ "--i": i } as React.CSSProperties} />
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
        <circle cx="115" cy="108" r="49" fill="#f2c5a5" />
        <path
          d="M67 104c4 45 22 70 48 71 27 0 45-26 48-70-9 15-22 18-31 9-7 11-23 11-31 0-10 9-24 5-34-10z"
          fill="#fffaf0"
        />
        <path d="M78 76c9-47 50-60 80-24l17 23-98 4z" fill="#a43431" />
        <circle cx="176" cy="76" r="15" fill="#fffaf0" />
        <circle cx="99" cy="102" r="3.5" fill="#23352d" />
        <circle cx="131" cy="102" r="3.5" fill="#23352d" />
        <path
          d="M106 121c7 5 14 5 20 0"
          fill="none"
          stroke="#9d4f43"
          strokeWidth="3"
          strokeLinecap="round"
        />
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
