import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type Page = "home" | "mystery" | "hunt" | "letters" | "quiz" | "leaderboard" | "admin";
type Day = "Даваа" | "Мягмар" | "Лхагва" | "Пүрэв" | "Баасан";

const days: Day[] = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан"];
const employees = [
  ["Болор Эрдэнэ", "Бүтээгдэхүүн"],
  ["Анударь Бат", "Маркетинг"],
  ["Тэмүүлэн Ган", "Технологи"],
  ["Саруул Мөнх", "Хүний нөөц"],
  ["Номин-Эрдэнэ Дорж", "Санхүү"],
  ["Идэр Баяр", "Борлуулалт"],
  ["Мишээл Энх", "Дизайн"],
  ["Хүслэн Төгс", "Технологи"],
  ["Ариунзаяа Бат", "Үйл ажиллагаа"],
  ["Билгүүн Оргил", "Маркетинг"],
] as const;

const quizQuestions = [
  {
    question: "Шинэ жилийн анхны модыг чимэглэсэн уламжлал аль улсаас дэлгэрсэн бэ?",
    answers: ["Герман", "Франц", "Норвеги", "Итали"],
    correct: 0,
    explanation:
      "Орчин үеийн гацуур мод чимэглэх уламжлал XVI зууны Германаас дэлгэрсэн гэж үздэг.",
  },
  {
    question: "Манай хамт олон энэ жил хэдэн шинэ бүтээгдэхүүн танилцуулсан бэ?",
    answers: ["Хоёр", "Гурав", "Дөрөв", "Тав"],
    correct: 2,
    explanation: "Бид энэ жил дөрвөн шинэ бүтээгдэхүүнээ хэрэглэгчдэд хүргэсэн.",
  },
];

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Миний долоо хоног", icon: "⌂" },
  { id: "mystery", label: "Энэ хэн бэ?", icon: "?" },
  { id: "hunt", label: "Бэлгийн эрэл", icon: "◇" },
  { id: "letters", label: "Нууц захиа", icon: "✉" },
  { id: "quiz", label: "Сорил", icon: "◆" },
  { id: "leaderboard", label: "Оноо", icon: "♛" },
  { id: "admin", label: "Зохион байгуулагч", icon: "⚙" },
];

function Icon({
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

function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

function Celebration({ active }: { active: boolean }) {
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

function Brand() {
  return (
    <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <span className="brand-mark">
        <Icon name="spark" size={18} />
      </span>
      <span>
        <strong>Догдлол</strong>
        <small>Жижигхэн нууц. Томхон догдлол.</small>
      </span>
    </button>
  );
}

function SantaVillage() {
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CalendarDoors({
  day,
  setDay,
  openPage,
}: {
  day: Day;
  setDay: (d: Day) => void;
  openPage: (p: Page) => void;
}) {
  const configs = [
    {
      day: "Даваа" as Day,
      date: "30",
      title: "Хоёр нууц, хоёр адал явдал",
      detail: "Энэ хэн бэ? · Бэлгийн эрэл",
      points: "200 хүртэл оноо",
      page: "mystery" as Page,
    },
    {
      day: "Мягмар" as Day,
      date: "31",
      title: "Чамд хэлэх нэг сайхан үг",
      detail: "Хоёр нууц захиа",
      points: "100 хүртэл оноо",
      page: "letters" as Page,
    },
    {
      day: "Лхагва" as Day,
      date: "01",
      title: "Шинэ жилийн сорил",
      detail: "Хамтдаа тоглох шууд сорил",
      points: "100 хүртэл оноо",
      page: "quiz" as Page,
    },
    {
      day: "Пүрэв" as Day,
      date: "02",
      title: "Өнөөдөр түр амсхийе.",
      detail: "Маргааш нууц тайлагдана.",
      points: "Оноогүй амралт",
      page: "home" as Page,
    },
    {
      day: "Баасан" as Day,
      date: "03",
      title: "Ид шидийн тайлал",
      detail: "Захиа · Оноо · Шагнал",
      points: "Шинэ оноо нэмэгдэхгүй",
      page: "leaderboard" as Page,
    },
  ];
  const current = days.indexOf(day);
  return (
    <div className="doors">
      {configs.map((item, idx) => {
        const locked = idx > current;
        return (
          <button
            key={item.day}
            className={`door ${idx === current ? "current" : ""} ${locked ? "locked" : ""}`}
            onClick={() => (locked ? undefined : (setDay(item.day), openPage(item.page)))}
          >
            <span className="door-day">{item.day}</span>
            <b className="door-date">{item.date}</b>
            <span className="door-copy">
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
            <span className="door-points">
              {locked ? (
                <>
                  <Icon name="lock" size={14} /> {item.day} гарагт нээгдэнэ
                </>
              ) : (
                item.points
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CommunityTree({ count }: { count: number }) {
  return (
    <section className="community-card panel">
      <div>
        <span className="eyebrow">Хамтын ид шид</span>
        <h2>30 захиа — 30 гэрэл</h2>
        <p>Хүн бүрийн анхны битүүмжилсэн захиа гацуурын нэг чимгийг асаана.</p>
        <div className="progress-label">
          <strong>{count} / 30 хүн захиагаа бичсэн</strong>
          <span>{Math.round((count / 30) * 100)}%</span>
        </div>
        <div className="progress">
          <i style={{ width: `${(count / 30) * 100}%` }} />
        </div>
        {count === 30 && (
          <div className="success-note">Бүх гэрэл аслаа. Хамтын гэнэтийн бэлэг нээгдлээ!</div>
        )}
      </div>
      <svg className="mini-tree" viewBox="0 0 240 230" aria-hidden="true">
        <path d="M120 12 65 93h30l-52 75h154l-52-75h30z" fill="#174737" />
        {Array.from({ length: 30 }, (_, i) => {
          const row = Math.floor(i / 6),
            col = i % 6;
          return (
            <circle
              key={i}
              cx={77 + col * 18 + (row % 2) * 4}
              cy={77 + row * 23}
              r="5"
              className={i < count ? "lit" : ""}
            />
          );
        })}
        <path d="M104 168h32v42h-32z" fill="#8d6235" />
        <ellipse cx="120" cy="210" rx="85" ry="12" fill="#f7f2e8" />
      </svg>
    </section>
  );
}

function Home({
  day,
  setDay,
  setPage,
  score,
  letterCount,
}: {
  day: Day;
  setDay: (d: Day) => void;
  setPage: (p: Page) => void;
  score: number;
  letterCount: number;
}) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Шинэ жилийн догдлолын долоо хоног</span>
          <h1>
            Энэ долоо хоногт
            <br />
            <em>ид шидийг</em> хамтдаа бүтээе.
          </h1>
          <p className="hero-greeting">Сайн уу, Болор оо!</p>
          <div className="hero-stats">
            <Stat label="Миний оноо" value={`${score} / 400`} />
            <Stat label="Оролцогчид" value="30 хамтрагч" />
            <Stat
              label="Өнөөдөр"
              value={
                day === "Даваа"
                  ? "2 тоглоом нээлттэй"
                  : day === "Пүрэв"
                    ? "Амралтын өдөр"
                    : "1 үйл явдал"
              }
            />
          </div>
          <button
            className="primary"
            onClick={() =>
              setPage(
                day === "Даваа"
                  ? "mystery"
                  : day === "Мягмар"
                    ? "letters"
                    : day === "Лхагва"
                      ? "quiz"
                      : "leaderboard",
              )
            }
          >
            Өнөөдрийн ид шидийг нээх <Icon name="arrow" />
          </button>
        </div>
        <SantaVillage />
      </section>
      <section className="section-wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Арван хоёрдугаар сарын 30 — нэгдүгээр сарын 03</span>
            <h2>Миний баярын долоо хоног</h2>
          </div>
          <p>Хаалга бүрт шинэ дурсамж хүлээж байна.</p>
        </div>
        <CalendarDoors day={day} setDay={setDay} openPage={setPage} />
        <CommunityTree count={letterCount} />
      </section>
    </main>
  );
}

function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <header className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>
  );
}

function Mystery({ onScore }: { onScore: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<"none" | "correct" | "wrong" | "done">("none");
  const options = employees.filter((e) => e[0].toLowerCase().includes(query.toLowerCase()));
  const submit = () => {
    if (!selected || result !== "none") return;
    if (selected === "Анударь Бат") {
      setResult("correct");
      onScore();
    } else setResult("wrong");
  };
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Даваа · 100 хүртэл оноо"
        title="Энэ хэн бэ?"
        intro="Гурван сонирхолтой баримтын эзнийг таньж, хамт олноо хэр сайн мэддэгээ сориорой."
      />
      <div className="game-layout">
        <section className="mystery-card">
          <div className="card-top">
            <span>Асуулт 4 / 10</span>
            <span>Зөв хариулт бүр 10 оноо</span>
          </div>
          <div className="detective">
            <div className="silhouette">
              <span>?</span>
            </div>
            <div>
              <span className="eyebrow">Нууц хамтрагч</span>
              <h2>Би хэн бэ?</h2>
            </div>
          </div>
          <ol className="facts">
            <li>
              <b>01</b>
              <span>Ажлынхаа өмнө өглөө бүр 5 км гүйдэг.</span>
            </li>
            <li>
              <b>02</b>
              <span>Хүүхэд байхдаа төгөлдөр хуурын уралдаанд түрүүлж байсан.</span>
            </li>
            <li>
              <b>03</b>
              <span>Кофегоо сүүгүй, нэг халбага зөгийн балтай уудаг.</span>
            </li>
          </ol>
          <div className="mystery-foot">Демо мэдээлэл · Өөрийгөө сонгох боломжгүй</div>
        </section>
        <section className="answer-panel panel">
          <div className="progress-label">
            <strong>Таны явц</strong>
            <span>3 / 10 хариулсан</span>
          </div>
          <div className="progress">
            <i style={{ width: "30%" }} />
          </div>
          <label className="field-label">Хариултаа сонгох</label>
          <div className="search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ажилтан хайх"
              disabled={result !== "none"}
            />
          </div>
          <div className="employee-list">
            {options.slice(0, 6).map(([name, department]) => (
              <button
                key={name}
                className={selected === name ? "selected" : ""}
                onClick={() => result === "none" && setSelected(name)}
              >
                <span className="avatar">{name.charAt(0)}</span>
                <span>
                  <strong>{name}</strong>
                  <small>{department}</small>
                </span>
                {selected === name && <Icon name="check" />}
              </button>
            ))}
          </div>
          {result === "correct" && (
            <div className="feedback success">
              <b>Яг зөв! +10 оноо</b>
              <span>Нууц хамтрагч бол Анударь Бат байлаа.</span>
            </div>
          )}
          {result === "wrong" && (
            <div className="feedback error">
              <b>Энэ удаа таарсангүй</b>
              <span>Зөв хариулт: Анударь Бат. Илгээсэн хариултыг өөрчлөх боломжгүй.</span>
            </div>
          )}
          {result === "done" && (
            <div className="feedback success">
              <b>Бүх асуултаа дуусгалаа!</b>
              <span>Таны үр дүн: 80 / 100 оноо.</span>
            </div>
          )}
          <button
            className="primary wide"
            disabled={!selected || result !== "none"}
            onClick={submit}
          >
            {result === "none" ? "Хариултаа илгээх" : "Хариулт илгээгдсэн"} <Icon name="arrow" />
          </button>
          {result !== "none" && (
            <button className="text-button" onClick={() => setResult("done")}>
              Эцсийн үр дүнг харах
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function GiftHunt({
  state,
  setState,
  onPhoto,
}: {
  state: string;
  setState: (s: string) => void;
  onPhoto: (url: string) => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [secondClue, setSecondClue] = useState(false);
  const [preview, setPreview] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const spin = () => {
    if (spinning || state !== "ready") return;
    setSpinning(true);
    window.setTimeout(() => {
      setSpinning(false);
      setState("clue");
    }, 3300);
  };
  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onPhoto(url);
    }
  };
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Даваа · Нэг удаагийн эргэлт"
        title="Нуугдсан бэлгийн эрэл"
        intro="Хүн бүрт давтагдашгүй нэг бэлэг, нэг сэжүүр. Хурд биш, олсон нь л чухал."
      />
      <div className="hunt-layout">
        <section className="wheel-wrap panel">
          <div className="wheel-pointer" />
          <div className={`wheel ${spinning ? "spinning" : ""}`}>
            <div className="wheel-lines" />
            <div className="wheel-center">
              <Icon name="spark" size={28} />
              <span>Догдлол</span>
            </div>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
          <button className="primary" onClick={spin} disabled={spinning || state !== "ready"}>
            {spinning
              ? "Таны бэлгийг сонгож байна…"
              : state === "ready"
                ? "Хүрдийг эргүүлэх"
                : "Нэг удаагийн эрх ашиглагдсан"}
          </button>
          <small>Бэлэг бүр зөвхөн нэг хүнд оногдоно.</small>
        </section>
        <section className="clue-card panel">
          {state === "ready" ? (
            <div className="empty-clue">
              <span className="gift-box">
                <i />
              </span>
              <h2>Таны сэжүүр энд нээгдэнэ</h2>
              <p>Хүрдээ эргүүлсний дараа оффис доторх өөрийн бэлгээ хайгаарай.</p>
            </div>
          ) : (
            <>
              <span className="eyebrow">Таны бэлгийн сэжүүр</span>
              <h2>“Өглөө бүр биднийг сэрээдэг үнэрийн дэргэд…”</h2>
              <div className="clue-id">Бэлэг № 18 · Зөвхөн танд</div>
              {!secondClue ? (
                <button className="secondary" onClick={() => setSecondClue(true)}>
                  Хоёр дахь сэжүүр авах
                </button>
              ) : (
                <div className="second-clue">
                  <Icon name="spark" />
                  <span>Цагаан аягануудын зүүн талд, доод тавиурыг ажиглаарай.</span>
                </div>
              )}
              <p className="no-penalty">Нэмэлт сэжүүр авахад оноо хасагдахгүй.</p>
              {preview && (
                <div className="photo-preview">
                  <img src={preview} alt="Бэлгийн зургийн урьдчилан харах" />
                  <button onClick={() => input.current?.click()}>Зургийг солих</button>
                </div>
              )}
              {!preview && (
                <button className="upload-box" onClick={() => input.current?.click()}>
                  <span>
                    <Icon name="camera" size={28} />
                  </span>
                  <strong>Бэлгээ олсон зургаа нэмэх</strong>
                  <small>Камераар авах эсвэл сангаас сонгох</small>
                </button>
              )}
              <input
                ref={input}
                className="hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={upload}
              />
              {state === "pending" && (
                <div className="feedback pending">
                  <Icon name="clock" />
                  <span>
                    <b>Зургийг шалгаж байна</b>Зохион байгуулагч баталгаажуулсны дараа оноо
                    нэмэгдэнэ.
                  </span>
                </div>
              )}
              {state === "approved" && (
                <div className="feedback success">
                  <Icon name="check" />
                  <span>
                    <b>Бэлгээ оллоо! +100 оноо</b>Таны бэлэг баталгаажлаа.
                  </span>
                </div>
              )}
              {state === "retry" && (
                <div className="feedback error">
                  <span>
                    <b>Зураг тодорхой харагдсангүй</b>Бэлэг болон байрлалыг хамтад нь харуулж дахин
                    илгээнэ үү.
                  </span>
                </div>
              )}
              {preview && state !== "approved" && (
                <button className="primary wide" onClick={() => setState("pending")}>
                  Зургаа илгээх <Icon name="arrow" />
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Letters({
  day,
  sealed,
  setSealed,
  onSeal,
}: {
  day: Day;
  sealed: number;
  setSealed: (n: number) => void;
  onSeal: () => void;
}) {
  const [recipient, setRecipient] = useState(sealed === 0 ? "Саруул Мөнх" : "");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const seal = () => {
    if (!recipient || message.length < 10 || sealed >= 2) return;
    setSealed(sealed + 1);
    onSeal();
    setMessage("");
    setRecipient("");
  };
  const friday = day === "Баасан";
  return (
    <main className="page-shell letters-page">
      <PageHeader
        eyebrow="Мягмар · 100 хүртэл оноо"
        title="Чамд хэлэх нэг сайхан үг"
        intro="Хоёр хүнд чин сэтгэлийн үгээ бичээрэй. Битүүмжилсэн захиа бүр 50 оноо."
      />
      <div className="letter-layout">
        <section className="stationery">
          <div className="paper-top">
            <span className="eyebrow">
              {sealed === 0 ? "Системээс оноосон эхний хүн" : "Өөрийн сонгох хоёр дахь хүн"}
            </span>
            <span>
              {sealed >= 2 ? "Нэмэлт захиа · оноогүй" : `Захиа ${Math.min(sealed + 1, 2)} / 2`}
            </span>
          </div>
          <label className="field-label">Хүлээн авагч</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={sealed === 0}
          >
            <option value="">Хүлээн авагч сонгох</option>
            {employees.slice(1).map((e) => (
              <option key={e[0]}>{e[0]}</option>
            ))}
          </select>
          <label className="field-label">Таны сайхан үг</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Талархаж явдаг нэг зүйлээ, хамтдаа бүтээсэн дурсамжаа эсвэл шинэ оны ерөөлөө бичээрэй…"
          />
          <div className="paper-actions">
            <span>Ноорог автоматаар хадгалагдана</span>
            <span>{message.length} тэмдэгт</span>
          </div>
          <button
            className="seal-button"
            onClick={seal}
            disabled={!recipient || message.length < 10}
          >
            <i>Д</i>
            <span>Захиагаа битүүмжлэх</span>
          </button>
        </section>
        <aside className="letters-side">
          <div className="panel letter-progress">
            <div className="progress-label">
              <strong>Миний захианууд</strong>
              <span>{sealed} / 2 захиа</span>
            </div>
            <div className="progress">
              <i style={{ width: `${(Math.min(sealed, 2) / 2) * 100}%` }} />
            </div>
            {[0, 1].map((i) => (
              <div className="letter-row" key={i}>
                <span className={i < sealed ? "sealed-mail" : "empty-mail"}>
                  {i < sealed ? "✉" : i + 1}
                </span>
                <span>
                  <strong>
                    {i === 0 ? "Саруул Мөнх" : i < sealed ? "Анударь Бат" : "Хүлээн авагч сонгоно"}
                  </strong>
                  <small>{i < sealed ? "Битүүмжилсэн · 50 оноо" : "Ноорог"}</small>
                </span>
              </div>
            ))}
            <div className="privacy">
              <Icon name="lock" />
              <span>
                <strong>Захиа баасан гараг хүртэл нууц байна.</strong>Зөвхөн хүлээн авагч нь унших
                боломжтой.
              </span>
            </div>
          </div>
          <div className={`received panel ${opened ? "opened" : ""}`}>
            <span className="eyebrow">Танд ирсэн захиа</span>
            <h3>{friday ? "Нууц тайлагдах цаг ирлээ" : "2 битүү захиа хүлээж байна"}</h3>
            <div className="envelope" onClick={() => friday && setOpened(true)}>
              <div className="envelope-back" />
              <div className="letter-sheet">
                <b>Болор оо,</b>
                <p>
                  Чиний тайван, урам өгдөг зан манай багийг үргэлж дулаахан болгодог. Шинэ онд улам
                  ихийг хамтдаа бүтээе.
                </p>
                <em>— Нууц хамтрагчаас</em>
              </div>
              <div className="envelope-front" />
              <i className="wax">Д</i>
            </div>
            <button className="secondary wide" disabled={!friday} onClick={() => setOpened(true)}>
              {friday ? "Захиагаа нээх" : "Баасан гарагт нээгдэнэ"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Quiz({ host = false, onScore }: { host?: boolean; onScore: (correct: boolean) => void }) {
  const [stage, setStage] = useState<"lobby" | "question" | "reveal" | "final">("lobby");
  const [selected, setSelected] = useState<number | null>(null);
  const [question, setQuestion] = useState(0);
  const [hostView, setHostView] = useState(host);
  const isHost = host || hostView;
  const q = quizQuestions[question % quizQuestions.length];
  const answer = (i: number) => {
    if (selected !== null || isHost) return;
    setSelected(i);
    window.setTimeout(() => {
      setStage("reveal");
      onScore(i === q.correct);
    }, 650);
  };
  const next = () => {
    if (question >= 1) setStage("final");
    else {
      setQuestion(question + 1);
      setSelected(null);
      setStage("question");
    }
  };
  if (stage === "lobby")
    return (
      <main className={`quiz-shell ${isHost ? "host" : ""}`}>
        <div className="quiz-lights" />
        <div className="lobby-card">
          <span className="eyebrow">
            {isHost ? "Том дэлгэцийн хөтлөгчийн горим" : "Шууд шинэ жилийн сорил"}
          </span>
          <h1>Догдлолын сорил</h1>
          <p>Бүгд нэг асуултад нэгэн зэрэг хариулна. Хурд оноонд нөлөөлөхгүй.</p>
          <div className="join-code">
            <span>Нэгдэх код</span>
            <strong>2026</strong>
          </div>
          <div className="players">
            <i /> <b>28 / 30</b> тоглогч холбогдсон
          </div>
          <div className="avatar-stack">
            {employees.slice(0, 7).map((e) => (
              <span key={e[0]}>{e[0].charAt(0)}</span>
            ))}
            <span>+21</span>
          </div>
          <div className="lobby-actions">
            <button className="primary" onClick={() => setStage("question")}>
              {isHost ? "Сорилыг эхлүүлэх" : "Демо сорилд орох"} <Icon name="arrow" />
            </button>
            <button className="secondary" onClick={() => setHostView(!hostView)}>
              {isHost ? "Тоглогчийн харагдац" : "Том дэлгэцийн харагдац"}
            </button>
          </div>
          <small>Энэ нь үзүүлэнгийн загвар; бодит олон төхөөрөмжийн синк холбогдоогүй.</small>
        </div>
      </main>
    );
  if (stage === "final")
    return (
      <main className="quiz-shell">
        <div className="lobby-card result-card">
          <span className="trophy">♛</span>
          <span className="eyebrow">Хувийн үр дүн</span>
          <h1>Гайхалтай тоглолоо!</h1>
          <div className="big-score">
            80 <small>/ 100 оноо</small>
          </div>
          <p>10 асуултаас 8-д нь зөв хариуллаа.</p>
          <button className="primary" onClick={() => setStage("lobby")}>
            Танхим руу буцах
          </button>
        </div>
      </main>
    );
  return (
    <main className={`quiz-stage ${isHost ? "host" : ""}`}>
      <div className="quiz-top">
        <span>Асуулт {question + 1} / 10</span>
        <div className="timer">
          <i />
          <b>18</b> секунд
        </div>
        <span>28 тоглогч</span>
      </div>
      <section className="question-card">
        <span className="eyebrow">{question % 2 ? "Компанийн дурсамж" : "Шинэ жилийн мэдлэг"}</span>
        <h1>{q.question}</h1>
      </section>
      <div className="answers">
        {q.answers.map((a, i) => (
          <button
            key={a}
            className={`${selected === i ? "chosen" : ""} ${stage === "reveal" && i === q.correct ? "correct" : ""} ${stage === "reveal" && selected === i && i !== q.correct ? "wrong" : ""}`}
            onClick={() => answer(i)}
            disabled={stage === "reveal" || isHost}
          >
            <b>{["А", "Б", "В", "Г"][i]}</b>
            <span>{a}</span>
            {selected === i && <Icon name="lock" />}
          </button>
        ))}
      </div>
      {stage === "reveal" && (
        <div className="explanation">
          <span className="answer-check">
            <Icon name="check" />
          </span>
          <div>
            <strong>{selected === q.correct ? "Зөв хариуллаа! +10 оноо" : "Зөв хариулт"}</strong>
            <p>{q.explanation}</p>
          </div>
          <button className="primary" onClick={next}>
            Дараагийн асуулт <Icon name="arrow" />
          </button>
        </div>
      )}
    </main>
  );
}

function Leaderboard({ friday, score }: { friday: boolean; score: number }) {
  const rows = [
    ["Тэмүүлэн Ган", 100, 100, 100, 100, 400],
    ["Анударь Бат", 100, 100, 90, 100, 390],
    ["Мишээл Энх", 90, 100, 100, 90, 380],
    ["Болор Эрдэнэ", 80, 0, 0, 0, score],
    ["Идэр Баяр", 70, 100, 100, 80, 350],
    ["Саруул Мөнх", 80, 100, 90, 70, 340],
  ];
  if (!friday)
    return (
      <main className="page-shell">
        <PageHeader
          eyebrow="Баасан гарагт нээгдэнэ"
          title="Эцсийн байр"
          intro="Долоо хоногийн дөрвөн үйл ажиллагааны нийлбэр дүн энд нээгдэнэ."
        />
        <div className="locked-board panel">
          <span>
            <Icon name="lock" size={30} />
          </span>
          <h2>Эцсийн байр баасан гарагт нээгдэнэ.</h2>
          <p>Одоогоор та зөвхөн өөрийн оноогоо харах боломжтой.</p>
          <div className="my-score">
            <small>Болор Эрдэнэ · Миний оноо</small>
            <strong>
              {score} <em>/ 400</em>
            </strong>
          </div>
        </div>
      </main>
    );
  return (
    <main className="page-shell leaderboard">
      <PageHeader
        eyebrow="Баасан · Ялагчдын тайлал"
        title="Догдлолын эзэд"
        intro="Дөрвөн үйл ажиллагаа, нийт 400 боломжит оноо. Хамтдаа бүтээсэн дурсамж бүр хамгийн том шагнал."
      />
      <div className="podium">
        <div className="podium-person second">
          <span className="avatar big">А</span>
          <b>Анударь Бат</b>
          <small>390 оноо</small>
          <i>2</i>
        </div>
        <div className="podium-person first">
          <span className="crown">♛</span>
          <span className="avatar big">Т</span>
          <b>Тэмүүлэн Ган</b>
          <small>400 оноо</small>
          <i>1</i>
        </div>
        <div className="podium-person third">
          <span className="avatar big">М</span>
          <b>Мишээл Энх</b>
          <small>380 оноо</small>
          <i>3</i>
        </div>
      </div>
      <section className="ranking panel">
        <div className="ranking-head">
          <div>
            <span className="eyebrow">Эцсийн хүснэгт</span>
            <h2>30 хамтрагчийн амжилт</h2>
          </div>
          <div className="max-score">
            Дээд оноо <strong>400</strong>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Байр</th>
                <th>Хамтрагч</th>
                <th>Энэ хэн бэ?</th>
                <th>Бэлгийн эрэл</th>
                <th>Нууц захиа</th>
                <th>Шинэ жилийн сорил</th>
                <th>Нийт</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={String(r[0])} className={r[0] === "Болор Эрдэнэ" ? "me" : ""}>
                  <td>{i + 1}</td>
                  <td>
                    <span className="avatar small">{String(r[0]).charAt(0)}</span>
                    <strong>{r[0]}</strong>
                    {r[0] === "Болор Эрдэнэ" && <small>Та</small>}
                  </td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td>{r[4]}</td>
                  <td>
                    <strong>{r[5]}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="score-formula">
          100 + 100 + 100 + 100 = <strong>400</strong>
        </div>
      </section>
    </main>
  );
}

function Admin({
  giftState,
  setGiftState,
  triggerCelebrate,
  communityCount,
  completeCommunity,
}: {
  giftState: string;
  setGiftState: (s: string) => void;
  triggerCelebrate: () => void;
  communityCount: number;
  completeCommunity: () => void;
}) {
  const [tab, setTab] = useState("Тойм");
  const [questions, setQuestions] = useState(quizQuestions);
  const [adding, setAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!newQuestion) return;
    setQuestions([
      ...questions,
      {
        question: newQuestion,
        answers: ["Сонголт 1", "Сонголт 2", "Сонголт 3", "Сонголт 4"],
        correct: 0,
        explanation: "Тайлбар оруулна.",
      },
    ]);
    setNewQuestion("");
    setAdding(false);
  };
  const approve = () => {
    setGiftState("approved");
    triggerCelebrate();
  };
  return (
    <main className="admin-shell">
      <PageHeader
        eyebrow="Зохион байгуулагчийн хэсэг · Демо эрх"
        title="Баярын удирдлага"
        intro="Оролцогч, контент, баталгаажуулалт болон нээлтийн цагийг нэг дороос удирдана."
      />
      <div className="admin-tabs">
        {["Тойм", "Ажилтнууд", "Баримтууд", "Сорил", "Бэлгүүд", "Хуваарь"].map((t) => (
          <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Тойм" && (
        <>
          <div className="admin-stats">
            <Stat label="Нийт ажилтан" value="30" />
            <Stat label="Захиа бичсэн" value={`${communityCount} / 30`} />
            <Stat label="Шалгах зураг" value={giftState === "pending" ? "1 шинэ" : "0"} />
            <Stat label="Сорилын асуулт" value="10 / 10" />
          </div>
          <div className="admin-grid">
            <section className="panel admin-card">
              <div className="card-title">
                <div>
                  <span className="eyebrow">Бэлгийн зураг</span>
                  <h2>Баталгаажуулах хүсэлт</h2>
                </div>
                <span className="badge">
                  {giftState === "pending" ? "1 шинэ" : "Шинэ хүсэлтгүй"}
                </span>
              </div>
              {giftState === "pending" ? (
                <div className="review-item">
                  <div className="review-photo">
                    <Icon name="camera" size={28} />
                  </div>
                  <div>
                    <strong>Болор Эрдэнэ · Бэлэг № 18</strong>
                    <small>Кофены хэсэг · саяхан илгээсэн</small>
                    <p>Сэжүүр: “Өглөө бүр биднийг сэрээдэг үнэрийн дэргэд…”</p>
                    <div>
                      <button className="primary small-btn" onClick={approve}>
                        Батлах · +100
                      </button>
                      <button className="secondary small-btn" onClick={() => setGiftState("retry")}>
                        Дахин зураг хүсэх
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-empty">
                  <Icon name="check" />
                  <p>Одоогоор шалгах зураг алга.</p>
                </div>
              )}
            </section>
            <section className="panel admin-card">
              <div className="card-title">
                <div>
                  <span className="eyebrow">Нээлтийн удирдлага</span>
                  <h2>Өнөөдрийн төлөв</h2>
                </div>
                <span className="live-dot">Нээлттэй</span>
              </div>
              <div className="control-list">
                <div>
                  <span>Энэ хэн бэ?</span>
                  <b>24 / 30 дууссан</b>
                  <button>Харах</button>
                </div>
                <div>
                  <span>Бэлгийн эрэл</span>
                  <b>19 / 30 олсон</b>
                  <button>Харах</button>
                </div>
                <div>
                  <span>Шууд сорил</span>
                  <b>Бэлэн</b>
                  <button>Эхлүүлэх</button>
                </div>
                <div>
                  <span>Баасан гараг</span>
                  <b>Түгжээтэй</b>
                  <button onClick={triggerCelebrate}>Нээх</button>
                </div>
                <div>
                  <span>Хамтын гацуур</span>
                  <b>{communityCount} / 30 гэрэл</b>
                  <button onClick={completeCommunity}>30 / 30 болгох</button>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      {tab === "Ажилтнууд" && (
        <section className="panel admin-card">
          <div className="card-title">
            <div>
              <span className="eyebrow">30 ажилтан</span>
              <h2>Ажилтан ба хэлтэс</h2>
            </div>
            <button className="primary small-btn">Ажилтан нэмэх</button>
          </div>
          <div className="simple-list">
            {employees.map((e, i) => (
              <div key={e[0]}>
                <span className="avatar">{e[0].charAt(0)}</span>
                <span>
                  <strong>{e[0]}</strong>
                  <small>{e[1]}</small>
                </span>
                <button>Засах</button>
                <em>{i + 1}</em>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "Баримтууд" && (
        <section className="panel admin-card">
          <div className="card-title">
            <div>
              <span className="eyebrow">Энэ хэн бэ?</span>
              <h2>Ажилтан бүрийн 3 баримт</h2>
            </div>
            <span className="badge">30 / 30 бүрэн</span>
          </div>
          <div className="fact-admin">
            <select>
              <option>Анударь Бат · Маркетинг</option>
            </select>
            {[
              "Өглөө бүр 5 км гүйдэг.",
              "Төгөлдөр хуурын уралдаанд түрүүлж байсан.",
              "Кофегоо зөгийн балтай уудаг.",
            ].map((f, i) => (
              <label key={f}>
                <b>{i + 1}</b>
                <input defaultValue={f} />
              </label>
            ))}
            <button className="primary">Өөрчлөлт хадгалах</button>
          </div>
        </section>
      )}
      {tab === "Сорил" && (
        <section className="panel admin-card">
          <div className="card-title">
            <div>
              <span className="eyebrow">10 асуулт · тус бүр 10 оноо</span>
              <h2>Сорилын асуултууд</h2>
            </div>
            <button className="primary small-btn" onClick={() => setAdding(true)}>
              Асуулт нэмэх
            </button>
          </div>
          {adding && (
            <form className="question-form" onSubmit={save}>
              <label>
                Асуулт
                <input
                  autoFocus
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Асуултаа энд бичнэ үү"
                />
              </label>
              <div className="option-grid">
                {[0, 1, 2, 3].map((i) => (
                  <label key={i}>
                    Сонголт {i + 1}
                    <input placeholder={`Хариулт ${i + 1}`} />
                  </label>
                ))}
              </div>
              <div className="option-grid">
                <label>
                  Зөв хариулт
                  <select>
                    <option>Сонголт 1</option>
                    <option>Сонголт 2</option>
                  </select>
                </label>
                <label>
                  Хугацаа
                  <select>
                    <option>20 секунд</option>
                    <option>30 секунд</option>
                  </select>
                </label>
              </div>
              <label>
                Тайлбар
                <textarea placeholder="Зөв хариултын богино тайлбар" />
              </label>
              <div>
                <button className="primary" type="submit">
                  Асуулт хадгалах
                </button>
                <button className="secondary" type="button" onClick={() => setAdding(false)}>
                  Болих
                </button>
              </div>
            </form>
          )}
          <div className="question-list">
            {questions.map((q, i) => (
              <div key={i}>
                <b>{i + 1}</b>
                <span>
                  <strong>{q.question}</strong>
                  <small>
                    {i % 2 ? "Компанийн дурсамж" : "Шинэ жилийн мэдлэг"} · 20 секунд · 10 оноо
                  </small>
                </span>
                <button>Урьдчилан харах</button>
                <button>Засах</button>
                <i>↕</i>
              </div>
            ))}
          </div>
          <div className="quiz-controls">
            <strong>Шууд сорилын удирдлага</strong>
            <button>Эхлүүлэх</button>
            <button>Дараагийн асуулт</button>
            <button>Дуусгах</button>
          </div>
        </section>
      )}
      {tab === "Бэлгүүд" && (
        <section className="panel admin-card">
          <div className="card-title">
            <div>
              <span className="eyebrow">30 давтагдашгүй бэлэг</span>
              <h2>Бэлэг ба сэжүүрүүд</h2>
            </div>
            <button className="primary small-btn">Бэлэг нэмэх</button>
          </div>
          <div className="gift-admin">
            {[18, 7, 24, 11].map((n, i) => (
              <div key={n}>
                <span className="gift-box tiny">
                  <i />
                </span>
                <span>
                  <strong>Бэлэг № {n}</strong>
                  <small>
                    Сэжүүр 1:{" "}
                    {i
                      ? "Хамгийн ногоон булангийн ойролцоо…"
                      : "Өглөө бүр биднийг сэрээдэг үнэрийн дэргэд…"}
                  </small>
                  <small>Сэжүүр 2: Доод тавиурыг ажиглаарай.</small>
                </span>
                <button>Засах</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "Хуваарь" && (
        <section className="panel admin-card">
          <div className="card-title">
            <div>
              <span className="eyebrow">Өдөр бүрийн нээлт</span>
              <h2>Хуваарь ба эцсийн нээлт</h2>
            </div>
          </div>
          <div className="schedule-admin">
            {days.map((d, i) => (
              <div key={d}>
                <b>{d}</b>
                <input type="time" defaultValue={i === 4 ? "16:00" : "09:00"} />
                <span>
                  {i === 3
                    ? "Үйл ажиллагаагүй"
                    : i === 4
                      ? "Захиа ба оноо нээх"
                      : "Автоматаар нээх"}
                </span>
                <button className={i < 1 ? "on" : ""}>
                  <i />
                </button>
              </div>
            ))}
          </div>
          <div className="privacy admin-privacy">
            <Icon name="lock" />
            <span>
              <strong>Хувийн нууц хамгаалагдсан</strong>Зохион байгуулагч захианы агуулгыг харах
              боломжгүй.
            </span>
          </div>
        </section>
      )}
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [day, setDay] = useState<Day>("Даваа");
  const [reduced, setReduced] = useState(false);
  const [giftState, setGiftState] = useState("ready");
  const [sealed, setSealed] = useState(0);
  const [mysteryScore, setMysteryScore] = useState(80);
  const [giftScore, setGiftScore] = useState(0);
  const [letterScore, setLetterScore] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [communityBase, setCommunityBase] = useState(18);
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const score = mysteryScore + giftScore + letterScore + quizScore;
  const letterCount = Math.min(30, communityBase + Math.min(sealed, 2));
  const celebrateNow = () => {
    setCelebrate(false);
    window.setTimeout(() => setCelebrate(true), 20);
    window.setTimeout(() => setCelebrate(false), 1800);
  };
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };
  const chooseDay = (nextDay: Day) => {
    setDay(nextDay);
    if (nextDay === "Баасан") celebrateNow();
  };
  const content = useMemo(() => {
    if (role === "admin" || page === "admin")
      return (
        <Admin
          giftState={giftState}
          setGiftState={(s) => {
            setGiftState(s);
            if (s === "approved") setGiftScore(100);
          }}
          triggerCelebrate={celebrateNow}
          communityCount={letterCount}
          completeCommunity={() => {
            setCommunityBase(30);
            celebrateNow();
          }}
        />
      );
    if (page === "home")
      return (
        <Home
          day={day}
          setDay={chooseDay}
          setPage={navigate}
          score={score}
          letterCount={letterCount}
        />
      );
    if (page === "mystery")
      return <Mystery onScore={() => setMysteryScore(Math.min(100, mysteryScore + 10))} />;
    if (page === "hunt")
      return <GiftHunt state={giftState} setState={setGiftState} onPhoto={() => undefined} />;
    if (page === "letters")
      return (
        <Letters
          day={day}
          sealed={sealed}
          setSealed={setSealed}
          onSeal={() => setLetterScore(Math.min(100, letterScore + 50))}
        />
      );
    if (page === "quiz")
      return <Quiz onScore={(correct) => correct && setQuizScore(Math.min(100, quizScore + 10))} />;
    return <Leaderboard friday={day === "Баасан"} score={score} />;
  }, [
    page,
    day,
    role,
    reduced,
    giftState,
    sealed,
    mysteryScore,
    letterScore,
    giftScore,
    quizScore,
    score,
    letterCount,
    communityBase,
  ]);
  return (
    <div className={`app ${reduced ? "reduce-motion" : ""}`}>
      {!reduced && <Snowfall />}
      <Celebration active={celebrate} />
      <header className="topbar">
        <Brand />
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setRole(item.id === "admin" ? "admin" : "employee");
                navigate(item.id);
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="motion-toggle" onClick={() => setReduced(!reduced)}>
            <i className={reduced ? "off" : ""} />
            Хөдөлгөөн багасгах
          </button>
          <button className="profile">БЭ</button>
        </div>
      </header>
      <div className="demo-bar">
        <span>Зөвхөн демо</span>
        <b>Өдөр:</b>
        {days.map((d) => (
          <button className={day === d ? "active" : ""} onClick={() => chooseDay(d)} key={d}>
            {d}
          </button>
        ))}
        <i />
        <b>Дүр:</b>
        <button
          className={role === "employee" ? "active" : ""}
          onClick={() => {
            setRole("employee");
            navigate("home");
          }}
        >
          Ажилтан
        </button>
        <button
          className={role === "admin" ? "active" : ""}
          onClick={() => {
            setRole("admin");
            navigate("admin");
          }}
        >
          Зохион байгуулагч
        </button>
      </div>
      {content}
      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => {
              setRole("employee");
              navigate(item.id);
            }}
          >
            <span>{item.icon}</span>
            <small>{item.label.split(" ")[0]}</small>
          </button>
        ))}
      </nav>
      <footer>
        <Brand />
        <p>Демо өгөгдөл · 30 хүний шинэ жилийн баярын долоо хоног</p>
        <span>Ид шидийг хамтдаа бүтээе.</span>
      </footer>
    </div>
  );
}
