import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  api,
  ApiError,
  type AppState,
  type AdminData,
  type Gift,
  type LiveQuiz,
  type Question,
  type Scores,
  type TaskKey,
} from "./api";
import { Brand, SantaVillage, Snowfall, Celebration, Icon } from "./components/Festive";
import "./backend.css";
type Page = "home" | "mystery" | "hunt" | "letters" | "quiz" | "leaderboard" | "admin" | "profile";
const nav: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Миний долоо хоног", icon: "⌂" },
  { id: "mystery", label: "Энэ хэн бэ?", icon: "?" },
  { id: "hunt", label: "Бэлгийн эрэл", icon: "◇" },
  { id: "letters", label: "Нууц захиа", icon: "✉" },
  { id: "quiz", label: "Сорил", icon: "◆" },
  { id: "leaderboard", label: "Оноо", icon: "♛" },
  { id: "admin", label: "Удирдлага", icon: "⚙" },
];
const total = (s: Scores) => s.mystery + s.gift + s.letters + s.quiz;
const tasks: { id: TaskKey; label: string; detail: string; points: string }[] = [
  {
    id: "mystery",
    label: "Энэ хэн бэ?",
    detail: "Гурван баримт · 10 хамтрагч",
    points: "100 хүртэл оноо",
  },
  {
    id: "hunt",
    label: "Бэлгийн эрэл",
    detail: "Хүрдээ эргүүл · Бэлгээ ол",
    points: "100 хүртэл оноо",
  },
  {
    id: "letters",
    label: "Нууц захиа",
    detail: "Хоёр хүнд сайхан үгээ бичээрэй",
    points: "100 хүртэл оноо",
  },
  {
    id: "quiz",
    label: "Шинэ жилийн сорил",
    detail: "Хамтдаа тоглох шууд сорил",
    points: "100 хүртэл оноо",
  },
  {
    id: "leaderboard",
    label: "Ид шидийн тайлал",
    detail: "Захиа унших · Онооны самбар",
    points: "Нийт 400 оноо",
  },
];
const taskOpen = (state: AppState, key: TaskKey) =>
  state.access.some((a) => a.task === key && a.open);
const visiblePage = (state: AppState, page: Page) =>
  page === "home" ||
  page === "profile" ||
  (page === "admin"
    ? state.me.role === "admin"
    : state.me.role === "admin" ||
      taskOpen(state, page as TaskKey) ||
      (page === "letters" && state.released));
function Header({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <header className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <section className="panel empty-state">{children}</section>;
}
function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}
function ErrorNote({ message }: { message: string }) {
  return message ? (
    <p className="feedback error" role="alert">
      {message}
    </p>
  ) : null;
}
function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const { busy, error, run } = useAction();
  return (
    <main className="login-layout">
      <section>
        <Brand />
        <h1>
          Ид шидийн өртөөндөө
          <br />
          <em>тавтай морил.</em>
        </h1>
        <p>Хамт олны баярын долоо хоног.</p>
        <SantaVillage />
      </section>
      <form
        className="panel login-panel"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run(async () => {
            await api("/auth/login", "POST", Object.fromEntries(f));
            await onLogin();
          });
        }}
      >
        <span className="eyebrow">Зөвхөн ажилтнуудад</span>
        <h2>Нэвтрэх</h2>
        <label>
          Нэвтрэх нэр
          <input name="username" autoComplete="username" required maxLength={80} />
        </label>
        <label>
          Нууц үг
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </label>
        <ErrorNote message={error} />
        <button className="primary wide" disabled={busy}>
          {busy ? "Нэвтэрч байна…" : "Нэвтрэх →"}
        </button>
        <p>Нэвтрэх эрхээ зохион байгуулагчаас авна уу.</p>
      </form>
    </main>
  );
}
function Community({ state }: { state: AppState }) {
  const count = state.employees.length;
  return (
    <section className="community-card panel">
      <div>
        <span className="eyebrow">Хамтын ид шид</span>
        <h2>
          {count} захиа — {count} гэрэл
        </h2>
        <p>Хүн бүрийн анхны битүүмжилсэн захиа гацуурын нэг чимгийг асаана.</p>
        <div className="progress-label">
          <strong>
            {state.community} / {count} хүн захиагаа бичсэн
          </strong>
        </div>
        <div className="progress">
          <i style={{ width: `${count ? (state.community / count) * 100 : 0}%` }} />
        </div>
        {count > 0 && state.community === count && (
          <div className="success-note">Бүх гэрэл аслаа. Хамтын зорилго биеллээ!</div>
        )}
      </div>
      <div className="community-stars">
        {state.employees.map((p, i) => (
          <span key={p.id} className={i < state.community ? "lit" : ""}>
            ✦
          </span>
        ))}
      </div>
    </section>
  );
}
function Home({ state, navigate }: { state: AppState; navigate: (p: Page) => void }) {
  const available = tasks.filter((t) => taskOpen(state, t.id));
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
          <p className="hero-greeting">Сайн уу, {state.me.name}!</p>
          <div className="hero-stats">
            <div className="stat">
              <small>Миний оноо</small>
              <strong>{total(state.scores)} / 400</strong>
            </div>
            <div className="stat">
              <small>Оролцогчид</small>
              <strong>{state.employees.length} хамтрагч</strong>
            </div>
            <div className="stat">
              <small>Нээлттэй таск</small>
              <strong>{available.length} үйл ажиллагаа</strong>
            </div>
          </div>
          {available.length > 0 && (
            <button className="primary" onClick={() => navigate(available[0].id)}>
              Миний үйл ажиллагаа <Icon name="arrow" />
            </button>
          )}
        </div>
        <SantaVillage />
      </section>
      <section className="section-wrap">
        <Header
          eyebrow="Ид шидийн өртөө"
          title="Нээлттэй үйл ажиллагаанууд"
          intro="Зохион байгуулагчийн нээсэн таскуудад оролцоорой."
        />
        {!available.length && (
          <Empty>Одоогоор нээлттэй таск алга. Зохион байгуулагчийн нээлтийг хүлээнэ үү.</Empty>
        )}
        <div className="doors">
          {available.map((t, i) => (
            <div className="door current" key={t.id}>
              <span className="door-day">НЭЭЛТТЭЙ</span>
              <b className="door-date">0{i + 1}</b>
              <span className="door-copy">
                <strong>{t.label}</strong>
                <small>{t.detail}</small>
              </span>
              <button className="secondary" onClick={() => navigate(t.id)}>
                Орох →
              </button>
              <span className="door-points">{t.points}</span>
            </div>
          ))}
        </div>
        <Community state={state} />
      </section>
    </main>
  );
}
function Mystery({ state, refresh }: { state: AppState; refresh: () => Promise<void> }) {
  const [query, setQuery] = useState(""),
    [chosen, setChosen] = useState(""),
    [result, setResult] = useState<boolean | null>(null);
  const { busy, error, run } = useAction();
  const [activeId, setActiveId] = useState(() => state.mystery.find((q) => q.chosen === null)?.id);
  const current = state.mystery.find((q) => q.id === activeId);
  const answered = state.mystery.filter((q) => q.chosen !== null).length;
  if (!state.mystery.length)
    return <Empty>Зохион байгуулагч ажилтнуудын баримтыг бэлдэж байна.</Empty>;
  if (!current)
    return (
      <Empty>
        <h2>Бүх 10 асуултаа дуусгалаа!</h2>
        <p>Таны оноо: {state.scores.mystery} / 100</p>
      </Empty>
    );
  return (
    <main className="page-shell">
      <Header
        eyebrow="100 хүртэл оноо"
        title="Энэ хэн бэ?"
        intro="Гурван баримтын эзнийг нийт хамтрагчдаасаа сонгоорой."
      />
      <div className="game-layout">
        <section className="mystery-card">
          <div className="card-top">
            <span>Асуулт {current.position + 1} / 10</span>
            <span>Зөв бүрд 10 оноо</span>
          </div>
          <div className="detective">
            <div className="silhouette">
              <span>?</span>
            </div>
            <h2>Би хэн бэ?</h2>
          </div>
          <ol className="facts">
            {current.facts.map((f, i) => (
              <li key={i}>
                <b>0{i + 1}</b>
                <span>{f}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="answer-panel panel">
          <div className="progress-label">
            <strong>{answered} / 10 хариулсан</strong>
            <span>{state.scores.mystery} оноо</span>
          </div>
          <input
            placeholder="Ажилтан хайх"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="employee-list">
            {state.employees
              .filter(
                (p) => p.id !== state.me.id && p.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((p) => (
                <button
                  key={p.id}
                  className={chosen === p.id ? "selected" : ""}
                  onClick={() => setChosen(p.id)}
                  disabled={busy || result !== null}
                >
                  <span className="avatar">{p.name[0]}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.department}</small>
                  </span>
                </button>
              ))}
          </div>
          <ErrorNote message={error} />
          {result !== null ? (
            <>
              <p className={`feedback ${result ? "success" : "error"}`}>
                {result ? "Зөв хариуллаа! +10 оноо" : "Энэ удаа таарсангүй."}
              </p>
              <button
                className="primary"
                onClick={() =>
                  void run(async () => {
                    setActiveId(
                      state.mystery.find((q) => q.chosen === null && q.id !== activeId)?.id,
                    );
                    await refresh();
                    setChosen("");
                    setQuery("");
                    setResult(null);
                  })
                }
              >
                Дараагийн асуулт →
              </button>
            </>
          ) : (
            <button
              className="primary wide"
              disabled={!chosen || busy || !taskOpen(state, "mystery")}
              onClick={() =>
                void run(async () => {
                  const r = await api<{ correct: boolean }>("/mystery/answer", "POST", {
                    id: current.id,
                    chosen,
                  });
                  setResult(r.correct);
                })
              }
            >
              Хариултаа илгээх
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
function Hunt({ state, refresh }: { state: AppState; refresh: () => Promise<void> }) {
  const [spinning, setSpinning] = useState(false),
    [second, setSecond] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState("");
  const { busy, error, run } = useAction();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const gift = state.gift;
  return (
    <main className="page-shell">
      <Header
        eyebrow="100 хүртэл оноо"
        title="Нуугдсан бэлгийн эрэл"
        intro="Хүн бүрт давтагдашгүй нэг бэлэг, нэг сэжүүр."
      />
      <div className="hunt-layout">
        <section className="wheel-wrap panel">
          <div className="wheel-pointer" />
          <div className={`wheel ${spinning ? "spinning" : ""}`}>
            <div className="wheel-lines" />
            <div className="wheel-center">
              <Icon name="spark" size={28} />
              <span>Ид шидийн өртөө</span>
            </div>
          </div>
          <button
            className="primary"
            disabled={busy || !!gift || !taskOpen(state, "hunt")}
            onClick={() =>
              void run(async () => {
                setSpinning(true);
                try {
                  await api("/gifts/spin", "POST", {});
                  await new Promise((r) => setTimeout(r, 3300));
                  await refresh();
                } finally {
                  setSpinning(false);
                }
              })
            }
          >
            {spinning ? "Сэжүүр сонгож байна…" : gift ? "Эрх ашиглагдсан" : "Хүрдийг эргүүлэх"}
          </button>
          <small>Хүн бүр нэг бэлэгтэй үлдэнэ.</small>
        </section>
        <section className="clue-card panel">
          <ErrorNote message={error} />
          {!gift ? (
            <div className="empty-clue">
              <h2>Таны сэжүүр энд нээгдэнэ</h2>
              <p>Хүрдээ эргүүлсний дараа бэлгээ хайгаарай.</p>
            </div>
          ) : (
            <>
              <span className="eyebrow">{gift.label}</span>
              <h2>“{gift.clue}”</h2>
              <button className="secondary" onClick={() => setSecond(true)} disabled={second}>
                Хоёр дахь сэжүүр авах
              </button>
              {second && <p className="second-clue">{gift.second_clue}</p>}
              <p className="no-penalty">Нэмэлт сэжүүр авахад оноо хасагдахгүй.</p>
              {(preview || gift.photo) && (
                <div className="photo-preview">
                  <img src={preview || gift.photo!} alt="Бэлгийн нотлох зураг" />
                </div>
              )}
              {["clue", "retry"].includes(gift.status) && (
                <>
                  <button className="upload-box" onClick={() => input.current?.click()}>
                    <Icon name="camera" size={28} />
                    <strong>{file ? "Зургаа солих" : "Бэлгээ олсон зургаа нэмэх"}</strong>
                    <small>JPG, PNG, WebP · 5 MB хүртэл</small>
                  </button>
                  <input
                    ref={input}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    className="primary wide"
                    disabled={!file || busy || !taskOpen(state, "hunt")}
                    onClick={() =>
                      void run(async () => {
                        if (file) {
                          await api(`/gifts/${gift.id}/photo`, "POST", file);
                          setFile(null);
                          await refresh();
                        }
                      })
                    }
                  >
                    Зургаа илгээх
                  </button>
                </>
              )}
              {gift.status === "pending" && (
                <p className="feedback pending">
                  Зургийг шалгаж байна. Баталсны дараа 100 оноо нэмэгдэнэ.
                </p>
              )}
              {gift.status === "approved" && (
                <p className="feedback success">Бэлэг баталгаажлаа! +100 оноо</p>
              )}
              {gift.status === "retry" && (
                <p className="feedback error">Дахин зураг хүссэн: {gift.note}</p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
function Letters({ state, refresh }: { state: AppState; refresh: () => Promise<void> }) {
  const [recipient, setRecipient] = useState(
      state.sent.length ? state.draft?.recipient || "" : state.partner || "",
    ),
    [message, setMessage] = useState(state.draft?.message || ""),
    [opened, setOpened] = useState<{ id: string; message: string } | null>(null),
    [saved, setSaved] = useState("");
  const { busy, error, run } = useAction();
  const saving = useRef(false);
  const dirty = useRef(false);
  const draftVersion = useRef(0);
  useEffect(() => {
    if (!dirty.current || !taskOpen(state, "letters")) return;
    const v = ++draftVersion.current;
    const timer = setTimeout(async () => {
      if (!dirty.current || v !== draftVersion.current) return;
      saving.current = true;
      try {
        await api("/letters/draft", "PUT", { recipient, message });
        if (v === draftVersion.current) setSaved("Ноорог хадгалагдсан");
      } catch {
        setSaved("Ноорог хадгалагдсангүй. Дахин бичиж эсвэл илгээнэ үү.");
      } finally {
        saving.current = false;
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [recipient, message, taskOpen(state, "letters")]);
  return (
    <main className="page-shell letters-page">
      <Header
        eyebrow="100 хүртэл оноо"
        title="Чамд хэлэх нэг сайхан үг"
        intro="Хоёр өөр хүнд бичсэн эхний хоёр захиа тус бүр 50 оноо. Нэмэлт захианд оноо нэмэхгүй."
      />
      <div className="letter-layout">
        <section className="stationery">
          <div className="paper-top">
            <span>
              {state.sent.length === 0
                ? "Системээс оноосон эхний хүн"
                : "Өөрийн сонгох хүлээн авагч"}
            </span>
            <span>{state.scores.letters} / 100 оноо</span>
          </div>
          <label>
            Хүлээн авагч
            <select
              value={recipient}
              disabled={!state.sent.length || busy || !taskOpen(state, "letters")}
              onChange={(e) => {
                dirty.current = true;
                setRecipient(e.target.value);
              }}
            >
              <option value="">Хүлээн авагч сонгох</option>
              {state.employees
                .filter(
                  (p) => p.id !== state.me.id && !state.sent.some((l) => l.recipient === p.id),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Таны сайхан үг
            <textarea
              value={message}
              minLength={10}
              maxLength={2000}
              disabled={!taskOpen(state, "letters") || busy}
              onChange={(e) => {
                dirty.current = true;
                setMessage(e.target.value);
              }}
              placeholder="Талархлаа эсвэл шинэ оны ерөөлөө бичээрэй…"
            />
          </label>
          <div className="paper-actions">
            <span>{saved}</span>
            <span>{message.length} / 2000</span>
          </div>
          <ErrorNote message={error} />
          <button
            className="seal-button"
            disabled={
              busy || !recipient || message.trim().length < 10 || !taskOpen(state, "letters")
            }
            onClick={() =>
              void run(async () => {
                if (saving.current) throw new Error("Ноорог хадгалахыг түр хүлээнэ үү.");
                dirty.current = false;
                draftVersion.current++;
                await api("/letters", "POST", { recipient, message });
                setMessage("");
                setRecipient("");
                setSaved("");
                await refresh();
              })
            }
          >
            <i>Д</i>
            <span>Захиагаа битүүмжлэх</span>
          </button>
        </section>
        <aside className="letters-side">
          <section className="panel letter-progress">
            <h3>Миний захианууд · {state.sent.length}</h3>
            {state.sent.map((l) => (
              <div className="letter-row" key={l.id}>
                <span className="sealed-mail">✉</span>
                <span>
                  {l.name}
                  <small>Битүүмжилсэн</small>
                </span>
              </div>
            ))}
            {!state.sent.length && <p>Бичсэн захиа хараахан алга.</p>}
            <p className="privacy">
              Зохион байгуулагч нээх хүртэл захиа нууц. Зөвхөн хүлээн авагч нь уншина.
            </p>
          </section>
          <section className="panel letter-progress">
            <h3>Танд ирсэн захиа · {state.inbox.length}</h3>
            {!state.inbox.length && <p>Ирсэн захиа хараахан алга.</p>}
            {state.inbox.map((l, i) => (
              <button
                className="secondary wide"
                key={l.id}
                disabled={!state.released || busy}
                onClick={() =>
                  void run(async () => {
                    setOpened({
                      id: l.id,
                      ...(await api<{ message: string }>(`/letters/${l.id}`)),
                    });
                  })
                }
              >
                ✉ Захиа {i + 1} · {state.released ? "Унших" : "Зохион байгуулагч нээхийг хүлээнэ"}
              </button>
            ))}
            {opened && state.released && (
              <article className="opened-letter">
                <h3>{state.me.name},</h3>
                <p>{opened.message}</p>
                <em>— Нууц хамтрагчаас</em>
                <button className="text-button" onClick={() => setOpened(null)}>
                  Хаах
                </button>
              </article>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
function Quiz({ isAdmin }: { isAdmin: boolean }) {
  const [quiz, setQuiz] = useState<LiveQuiz | null>(null),
    [seconds, setSeconds] = useState(0);
  const [joined, setJoined] = useState(false);
  const { busy, error, run } = useAction();
  const refresh = useCallback(async () => {
    setQuiz(await api<LiveQuiz>("/quiz"));
  }, []);
  useEffect(() => {
    let live = true;
    const update = async () => {
      try {
        const q = await api<LiveQuiz>("/quiz");
        if (live) {
          setQuiz(q);
          setSeconds(Math.max(0, Math.ceil((q.deadline - q.serverNow) / 1000)));
        }
      } catch {
        /* surface request errors on user actions */
      }
    };
    void update();
    const timer = setInterval(() => void update(), 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!joined) return;
    const heartbeat = setInterval(
      () => void api("/quiz/join", "POST", {}).catch(() => setJoined(false)),
      8000,
    );
    return () => clearInterval(heartbeat);
  }, [joined]);
  if (!quiz) return <Empty>Сорилын төлөвийг ачаалж байна…</Empty>;
  const q = quiz.question;
  return (
    <main className="quiz-shell">
      <Header
        eyebrow="100 хүртэл оноо"
        title="Ид шидийн өртөө · Шууд сорил"
        intro="Бүгд нэг асуултад нэгэн зэрэг хариулна. Зөв бүрд 10 оноо."
      />
      <ErrorNote message={error} />
      {!quiz.open && <p className="feedback pending">Сорил одоогоор хаалттай байна.</p>}
      <div className="quiz-top">
        <span>{quiz.players} хүн холбогдсон</span>
        <span>{quiz.answered} хариулт</span>
        <span>
          {quiz.stage === "question"
            ? `${seconds} секунд`
            : quiz.stage === "lobby"
              ? "Эхлэхийг хүлээж байна"
              : quiz.stage === "final"
                ? "Дууссан"
                : "Хариулт нээгдсэн"}
        </span>
      </div>
      {!isAdmin && !joined && (
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await api("/quiz/join", "POST", {});
              setJoined(true);
              await refresh();
            })
          }
        >
          Сорилд нэгдэх
        </button>
      )}
      {q && quiz.stage !== "final" && (
        <>
          <section className="question-card">
            <span className="eyebrow">
              Асуулт {quiz.position + 1} / {quiz.total}
            </span>
            <h1>{q.question}</h1>
          </section>
          <div className="answers">
            {q.answers.map((a, i) => (
              <button
                key={i}
                disabled={
                  busy ||
                  isAdmin ||
                  !joined ||
                  !quiz.open ||
                  quiz.stage !== "question" ||
                  quiz.answer !== null ||
                  seconds <= 0
                }
                className={`${quiz.answer === i ? "chosen" : ""} ${quiz.stage === "reveal" && q.correct === i ? "correct" : ""}`}
                onClick={() =>
                  void run(async () => {
                    await api("/quiz/answer", "POST", { id: q.id, choice: i });
                    await refresh();
                  })
                }
              >
                <b>{["А", "Б", "В", "Г"][i]}</b>
                <span>{a}</span>
              </button>
            ))}
          </div>
          {quiz.stage === "reveal" && (
            <section className="explanation">
              <strong>{q.answers[q.correct!]}</strong>
              <p>{q.explanation}</p>
            </section>
          )}
        </>
      )}
      {quiz.stage === "final" && (
        <Empty>
          <h2>Сорил дууслаа!</h2>
          <p>Таны оноо: {quiz.score} / 100</p>
        </Empty>
      )}
      {isAdmin && (
        <div className="quiz-controls">
          {[
            ...(quiz.stage === "lobby" ? [["start", "Эхлүүлэх"]] : []),
            ...(quiz.stage === "question" ? [["reveal", "Хариулт нээх"]] : []),
            ...(quiz.stage === "reveal"
              ? [["next", quiz.position + 1 === quiz.total ? "Дуусгах" : "Дараагийн асуулт"]]
              : []),
            ...(["question", "reveal"].includes(quiz.stage)
              ? [["finish", "Сорилыг эрт дуусгах"]]
              : []),
          ].map(([action, label]) => (
            <button
              className="primary"
              key={action}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api("/admin/quiz/control", "POST", { action });
                  await refresh();
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
function Leaderboard({ state }: { state: AppState }) {
  const [rows, setRows] = useState<
      (Scores & { id: string; name: string; department: string; total: number })[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (!state.released) return;
    api<{ rows: typeof rows }>("/leaderboard")
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }, [state.released]);
  if (!state.released)
    return (
      <Empty>
        <h2>Онооны самбарыг зохион байгуулагч нээнэ.</h2>
        <p>Таны одоогийн оноо: {total(state.scores)} / 400</p>
      </Empty>
    );
  return (
    <main className="page-shell">
      <Header
        eyebrow="Нууц тайлагдлаа"
        title="Хамтдаа бүтээсэн догдлол"
        intro="Нийт 400 онооноос · Ижил оноотой ажилтнууд ижил байр эзэлнэ."
      />
      <ErrorNote message={error} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {["Байр", "Ажилтан", "Энэ хэн бэ?", "Бэлэг", "Захиа", "Сорил", "Нийт"].map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={r.id === state.me.id ? "mine" : ""}>
                <td>{rows.findIndex((x) => x.total === r.total) + 1}</td>
                <td>{r.name}</td>
                <td>{r.mystery}</td>
                <td>{r.gift}</td>
                <td>{r.letters}</td>
                <td>{r.quiz}</td>
                <td>
                  <b>{r.total} / 400</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !error && <Empty>Оролцогч бүртгэгдээгүй байна.</Empty>}
    </main>
  );
}
function Admin({
  refreshApp,
  openQuiz,
}: {
  refreshApp: () => Promise<void>;
  openQuiz: () => void;
}) {
  const [data, setData] = useState<AdminData | null>(null),
    [tab, setTab] = useState("Тойм"),
    [editing, setEditing] = useState<{
      type: "employee" | "facts" | "gift" | "question" | "password";
      id?: string;
    } | null>(null),
    [notice, setNotice] = useState("");
  const { busy, error, run } = useAction();
  const load = useCallback(async () => {
    setData(await api<AdminData>("/admin/data"));
  }, []);
  useEffect(() => {
    void run(load);
  }, [load]);
  const reload = async () => {
    await load();
    await refreshApp();
  };
  if (!data)
    return (
      <Empty>
        <ErrorNote message={error} />
        <p>Удирдлагыг ачаалж байна…</p>
      </Empty>
    );
  const people = data.employees.filter((p) => p.role === "employee");
  const chosen = editing?.id;
  const employee = people.find((p) => p.id === chosen);
  const gift = data.gifts.find((p) => p.id === chosen);
  const question = data.questions.find((p) => p.id === chosen);
  const pending = data.gifts.filter((g) => g.status === "pending");
  function formSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    void run(async () => {
      if (!editing) return;
      if (editing.type === "employee") await api("/admin/employees", "POST", f);
      if (editing.type === "facts")
        await api("/admin/employees/" + chosen, "PUT", {
          ...f,
          facts: [f.fact0, f.fact1, f.fact2],
        });
      if (editing.type === "password") {
        await api("/admin/employees/" + chosen + "/password", "POST", f);
        setNotice("Нууц үг шинэчлэгдлээ. Ажилтанд хувиар дамжуулна уу.");
      }
      if (editing.type === "gift")
        await api("/admin/gifts" + (chosen ? "/" + chosen : ""), chosen ? "PUT" : "POST", f);
      if (editing.type === "question")
        await api("/admin/questions" + (chosen ? "/" + chosen : ""), chosen ? "PUT" : "POST", {
          ...f,
          answers: [f.answer0, f.answer1, f.answer2, f.answer3],
          seconds: Number(f.seconds),
          correct: Number(f.correct),
        });
      setEditing(null);
      await reload();
    });
  }
  return (
    <main className="admin-shell">
      <Header
        eyebrow="Зохион байгуулагч"
        title="Баярын удирдлага"
        intro="Бодит ажилтнууд, контент, оноо болон баталгаажуулалтыг удирдана."
      />
      <div className="admin-tabs">
        {["Тойм", "Ажилтнууд", "Сорил", "Бэлгүүд", "Нээлт"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => {
              setTab(t);
              setEditing(null);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <ErrorNote message={error} />
      {notice && (
        <p className="feedback success" role="status">
          {notice}
        </p>
      )}
      {editing && (
        <section className="panel admin-card">
          <div className="card-title">
            <h2>
              {editing.type === "employee"
                ? "Ажилтан нэмэх"
                : editing.type === "facts"
                  ? "Нэр, хэлтэс, 3 баримт"
                  : editing.type === "password"
                    ? "Нууц үг шинэчлэх"
                    : editing.type === "gift"
                      ? "Бэлэг ба сэжүүр"
                      : "Сорилын асуулт"}
            </h2>
            <button className="secondary" onClick={() => setEditing(null)}>
              Хаах
            </button>
          </div>
          <form key={editing.type + chosen} className="question-form" onSubmit={formSave}>
            {editing.type === "employee" && (
              <>
                <label>
                  Нэр
                  <input name="name" required minLength={2} maxLength={100} />
                </label>
                <label>
                  Хэлтэс
                  <input name="department" maxLength={100} />
                </label>
                <label>
                  Нэвтрэх нэр
                  <input name="username" required minLength={3} maxLength={80} />
                </label>
                <label>
                  Эхний нууц үг
                  <input
                    name="password"
                    type="password"
                    minLength={10}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </>
            )}
            {editing.type === "facts" && (
              <>
                <label>
                  Нэр
                  <input
                    name="name"
                    defaultValue={employee?.name}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  Хэлтэс
                  <input name="department" defaultValue={employee?.department} maxLength={100} />
                </label>
                {[0, 1, 2].map((i) => (
                  <label key={i}>
                    Баримт {i + 1}
                    <textarea
                      name={"fact" + i}
                      defaultValue={employee?.facts[i] || ""}
                      required
                      minLength={5}
                      maxLength={300}
                    />
                  </label>
                ))}
              </>
            )}
            {editing.type === "password" && (
              <label>
                Шинэ нууц үг
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                />
              </label>
            )}
            {editing.type === "gift" && (
              <>
                <label>
                  Бэлгийн дугаар / нэр
                  <input name="label" defaultValue={gift?.label} required maxLength={100} />
                </label>
                <label>
                  Эхний сэжүүр
                  <textarea
                    name="clue"
                    defaultValue={gift?.clue}
                    required
                    minLength={5}
                    maxLength={500}
                  />
                </label>
                <label>
                  Хоёр дахь сэжүүр
                  <textarea
                    name="second_clue"
                    defaultValue={gift?.second_clue}
                    required
                    minLength={5}
                    maxLength={500}
                  />
                </label>
              </>
            )}
            {editing.type === "question" && (
              <>
                <label>
                  Асуулт
                  <textarea
                    name="question"
                    defaultValue={question?.question}
                    required
                    minLength={5}
                    maxLength={500}
                  />
                </label>
                <label>
                  Ангилал
                  <select name="category" defaultValue={question?.category || "newyear"}>
                    <option value="newyear">Шинэ жилийн мэдлэг</option>
                    <option value="company">Компанийн дурсамж</option>
                  </select>
                </label>
                <div className="option-grid">
                  {[0, 1, 2, 3].map((i) => (
                    <label key={i}>
                      Сонголт {i + 1}
                      <input
                        name={"answer" + i}
                        defaultValue={question?.answers[i]}
                        required
                        maxLength={200}
                      />
                    </label>
                  ))}
                </div>
                <div className="option-grid">
                  <label>
                    Зөв хариулт
                    <select name="correct" defaultValue={question?.correct ?? 0}>
                      {[0, 1, 2, 3].map((i) => (
                        <option key={i} value={i}>
                          Сонголт {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Хугацаа (секунд)
                    <input
                      name="seconds"
                      type="number"
                      min={10}
                      max={120}
                      defaultValue={question?.seconds || 20}
                      required
                    />
                  </label>
                </div>
                <label>
                  Тайлбар
                  <textarea
                    name="explanation"
                    defaultValue={question?.explanation}
                    maxLength={1000}
                  />
                </label>
              </>
            )}
            <button className="primary" disabled={busy}>
              Хадгалах
            </button>
          </form>
        </section>
      )}
      {tab === "Тойм" && (
        <>
          <div className="admin-stats">
            <div className="stat">
              <small>Нийт ажилтан</small>
              <strong>{people.length}</strong>
            </div>
            <div className="stat">
              <small>3 баримт бүрэн</small>
              <strong>
                {people.filter((p) => p.facts.length === 3).length} / {people.length}
              </strong>
            </div>
            <div className="stat">
              <small>Шалгах зураг</small>
              <strong>{pending.length}</strong>
            </div>
            <div className="stat">
              <small>Quiz асуулт</small>
              <strong>{data.questions.length} / 10</strong>
            </div>
          </div>
          <section className="panel admin-card">
            <h2>Тоглоомоо бэлдэх</h2>
            <p>
              Ажилтан бүрийн 3 баримт, ажилтны тоогоор бэлэг, эхлэх огноог эхлээд оруулна.
              Бэлтгэсний дараа хүн бүрт өөрөөс нь бусад 10 хүний асуулт болон эхний захианы хүлээн
              авагч оноогдоно.
            </p>
            <p>Бэлтгэсний дараа оролцогч, баримтыг өөрчлөхгүй.</p>
            <button
              className="primary"
              disabled={busy || data.settings.prepared}
              onClick={() =>
                void run(async () => {
                  if (!confirm("Ажилтнууд болон баримтууд бэлэн үү? Оноолтыг буцаахгүй.")) return;
                  await api("/admin/prepare", "POST", {});
                  await reload();
                })
              }
            >
              {data.settings.prepared ? "Тоглоом бэлтгэгдсэн" : "Оноолтыг үүсгэж бэлдэх"}
            </button>
          </section>
          <section className="panel admin-card">
            <h2>Зураг баталгаажуулах</h2>
            {!pending.length && <p>Шалгах зураг алга.</p>}
            {pending.map((g) => (
              <Review
                key={g.id}
                gift={g}
                name={people.find((p) => p.id === g.assigned)?.name || ""}
                refresh={reload}
              />
            ))}
          </section>
        </>
      )}
      {tab === "Ажилтнууд" && (
        <section className="panel admin-card">
          <div className="card-title">
            <h2>Ажилтан · {people.length}</h2>
            <button
              className="primary"
              disabled={data.settings.prepared}
              onClick={() => setEditing({ type: "employee" })}
            >
              Ажилтан нэмэх
            </button>
          </div>
          <div className="simple-list">
            {people.map((p) => (
              <div key={p.id}>
                <span className="avatar">{p.name[0]}</span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.username} · {p.department} · {p.facts.length}/3 баримт
                  </small>
                </span>
                <button
                  disabled={data.settings.prepared}
                  onClick={() => setEditing({ type: "facts", id: p.id })}
                >
                  Нэр / Баримт
                </button>
                <button onClick={() => setEditing({ type: "password", id: p.id })}>Нууц үг</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "Бэлгүүд" && (
        <section className="panel admin-card">
          <div className="card-title">
            <h2>Бэлэг · {data.gifts.length}</h2>
            <button className="primary" onClick={() => setEditing({ type: "gift" })}>
              Бэлэг нэмэх
            </button>
          </div>
          {!data.gifts.length && <p>Хүн бүрт нэг бэлэг, хоёр сэжүүр нэмнэ үү.</p>}
          <div className="gift-admin">
            {data.gifts.map((g) => (
              <div key={g.id}>
                <span>
                  <strong>{g.label}</strong>
                  <small>{g.clue}</small>
                  <small>{g.second_clue}</small>
                  <small>
                    {g.assigned ? "Оноогдсон" : "Сул"} · {g.status}
                  </small>
                </span>
                <button
                  disabled={!!g.assigned}
                  onClick={() => setEditing({ type: "gift", id: g.id })}
                >
                  Засах
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "Сорил" && (
        <section className="panel admin-card">
          <div className="card-title">
            <h2>Сорил · {data.questions.length} / 10</h2>
            <button
              className="primary"
              disabled={data.quiz.stage !== "lobby" || data.questions.length >= 10}
              onClick={() => setEditing({ type: "question" })}
            >
              Асуулт нэмэх
            </button>
          </div>
          <p>
            Шинэ жилийн {data.questions.filter((q) => q.category === "newyear").length}/5 ·
            Компанийн {data.questions.filter((q) => q.category === "company").length}/5
          </p>
          <div className="question-list">
            {data.questions.map((q, i) => (
              <div key={q.id}>
                <b>{i + 1}</b>
                <span>
                  <strong>{q.question}</strong>
                  <small>
                    {q.seconds} секунд · 10 оноо · Зөв: {q.answers[q.correct!]}
                  </small>
                </span>
                <button
                  disabled={data.quiz.stage !== "lobby"}
                  onClick={() => setEditing({ type: "question", id: q.id })}
                >
                  Засах
                </button>
                <button
                  disabled={busy || data.quiz.stage !== "lobby" || i === 0}
                  onClick={() =>
                    void run(async () => {
                      const ids = data.questions.map((q) => q.id);
                      [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                      await api("/admin/questions/reorder", "PATCH", { ids });
                      await load();
                    })
                  }
                >
                  ↑
                </button>
                <button
                  disabled={busy || data.quiz.stage !== "lobby"}
                  onClick={() =>
                    void run(async () => {
                      if (confirm("Асуултыг устгах уу?")) {
                        await api("/admin/questions/" + q.id, "DELETE");
                        await load();
                      }
                    })
                  }
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
          <button className="primary" onClick={openQuiz}>
            Шууд сорил / Том дэлгэц →
          </button>
          <p>Сорилыг дуусгасны дараа дахин эхлүүлэхгүй.</p>
        </section>
      )}
      {tab === "Нээлт" && (
        <section className="panel admin-card">
          <h2>Таск нээх / хаах</h2>
          <p>
            Огноо, гарагаас үл хамааран таск бүрийг тусад нь удирдана. Ажилтнууд зөвхөн нээлттэй
            таскуудыг харна.
          </p>
          <div className="day-controls">
            {tasks.map((t) => {
              const opened = data.access.some((a) => a.task === t.id && a.open);
              return (
                <div className="day-control" key={t.id}>
                  <div>
                    <strong>{t.label}</strong>
                    <small>{t.detail}</small>
                    <b>{opened ? "НЭЭЛТТЭЙ" : "ХААЛТТАЙ"}</b>
                  </div>
                  <button
                    className={opened ? "secondary" : "primary"}
                    disabled={busy}
                    aria-pressed={opened}
                    onClick={() =>
                      void run(async () => {
                        if (
                          t.id === "leaderboard" &&
                          !opened &&
                          !confirm("Захиа болон нийт онооны самбарыг одоо нээх үү?")
                        )
                          return;
                        await api("/admin/tasks", "PUT", { task: t.id, open: !opened });
                        await reload();
                        setNotice(t.label + (opened ? " хаагдлаа." : " нээгдлээ."));
                      })
                    }
                  >
                    {opened ? "Хаах" : "Нээх"}
                  </button>
                </div>
              );
            })}
          </div>
          <p>
            Хаахад оноо, илгээсэн мэдээлэл устахгүй. Өмнө нь уншсан захиаг буцаан нууцлах боломжгүй.
          </p>
          <p>Нууц захианы агуулга админд харагдахгүй.</p>
        </section>
      )}
    </main>
  );
}
function Review({
  gift,
  name,
  refresh,
}: {
  gift: Gift;
  name: string;
  refresh: () => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const { busy, error, run } = useAction();
  return (
    <article className="review-item">
      <img src={`/api/gifts/${gift.id}/photo`} alt={`${name} · ${gift.label}`} />
      <div>
        <h3>
          {name} · {gift.label}
        </h3>
        <p>{gift.clue}</p>
        <label>
          Дахин зураг хүсэх шалтгаан
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </label>
        <div className="button-row">
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api(`/admin/gifts/${gift.id}/review`, "POST", { status: "approved" });
                await refresh();
              })
            }
          >
            Батлах · +100
          </button>
          <button
            className="secondary"
            disabled={busy || note.trim().length < 5}
            onClick={() =>
              void run(async () => {
                await api(`/admin/gifts/${gift.id}/review`, "POST", { status: "retry", note });
                await refresh();
              })
            }
          >
            Дахин зураг хүсэх
          </button>
        </div>
        <ErrorNote message={error} />
      </div>
    </article>
  );
}
function Profile() {
  const { busy, error, run } = useAction();
  const [done, setDone] = useState(false);
  return (
    <main className="page-shell">
      <Header
        eyebrow="Миний бүртгэл"
        title="Нууц үг солих"
        intro="Анхны нууц үгээ зөвхөн өөрийн мэдэх нууц үгээр солино уу."
      />
      <form
        className="panel login-panel"
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const fields = Object.fromEntries(new FormData(f));
          void run(async () => {
            await api("/auth/password", "POST", fields);
            setDone(true);
            f.reset();
          });
        }}
      >
        <label>
          Одоогийн нууц үг
          <input name="current" type="password" autoComplete="current-password" required />
        </label>
        <label>
          Шинэ нууц үг
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
          />
        </label>
        <ErrorNote message={error} />
        {done && <p className="feedback success">Нууц үг солигдлоо.</p>}
        <button className="primary" disabled={busy}>
          Хадгалах
        </button>
      </form>
    </main>
  );
}
export default function App() {
  const [state, setState] = useState<AppState | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState<Page>("home"),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [celebrate, setCelebrate] = useState(false);
  const previous = useRef<AppState | null>(null);
  const refresh = useCallback(async () => {
    try {
      const value = await api<AppState>("/state");
      setState(value);
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState(null);
        previous.current = null;
      } else setError(e instanceof Error ? e.message : "Серверт холбогдсонгүй.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!state) return;
    const id = setInterval(() => void refresh(), 10000);
    return () => clearInterval(id);
  }, [!!state, refresh, page]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const old = previous.current;
    if (
      state &&
      old &&
      old.me.id === state.me.id &&
      (state.scores.gift > old.scores.gift ||
        (!old.released && state.released) ||
        (old.community < state.employees.length && state.community === state.employees.length))
    ) {
      setCelebrate(true);
      timer = setTimeout(() => setCelebrate(false), 1800);
    }
    previous.current = state;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state]);
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };
  const admin = state?.me.role === "admin";
  let content: ReactNode;
  if (loading) content = <Empty>Ачаалж байна…</Empty>;
  else if (!state) content = <Login onLogin={refresh} />;
  else if (page === "admin" && admin)
    content = <Admin refreshApp={refresh} openQuiz={() => navigate("quiz")} />;
  else if (page === "profile") content = <Profile />;
  else if (page === "home") content = <Home state={state} navigate={navigate} />;
  else if (!visiblePage(state, page)) content = <Empty>Энэ таск хаалттай байна.</Empty>;
  else if (page === "leaderboard") content = <Leaderboard state={state} />;
  else if (page === "quiz") content = <Quiz isAdmin={!!admin} />;
  else if (!state.settings.prepared)
    content = <Empty>Зохион байгуулагч тоглоомыг бэлдэж байна.</Empty>;
  else if (page === "mystery") content = <Mystery state={state} refresh={refresh} />;
  else if (page === "hunt") content = <Hunt state={state} refresh={refresh} />;
  else content = <Letters state={state} refresh={refresh} />;
  return (
    <div className={`app ${reduced ? "reduce-motion" : ""}`}>
      {!reduced && <Snowfall />}
      <Celebration active={!reduced && celebrate} />
      {state && (
        <header className="topbar">
          <Brand />
          <nav>
            {nav
              .filter((n) => visiblePage(state, n.id))
              .map((n) => (
                <button
                  key={n.id}
                  className={n.id === page ? "active" : ""}
                  onClick={() => navigate(n.id)}
                >
                  {n.label}
                </button>
              ))}
          </nav>
          <div className="header-actions">
            <button
              className="motion-toggle"
              onClick={() => setReduced(!reduced)}
              aria-pressed={reduced}
            >
              Хөдөлгөөн {reduced ? "асаах" : "багасгах"}
            </button>
            <button
              className="profile"
              aria-label="Миний бүртгэл"
              onClick={() => navigate("profile")}
            >
              {state.me.name.slice(0, 2)}
            </button>
            <button
              className="text-button"
              onClick={() =>
                void api("/auth/logout", "POST", {})
                  .then(() => {
                    setState(null);
                    navigate("home");
                  })
                  .catch((e) => setError(e.message))
              }
            >
              Гарах
            </button>
          </div>
        </header>
      )}
      <ErrorNote message={error} />
      {content}
      {state && (
        <nav className="mobile-nav">
          {nav
            .filter((n) => visiblePage(state, n.id))
            .map((n) => (
              <button
                key={n.id}
                className={n.id === page ? "active" : ""}
                onClick={() => navigate(n.id)}
              >
                <span>{n.icon}</span>
                <small>{n.label}</small>
              </button>
            ))}
        </nav>
      )}
      <footer>
        <Brand />
        <p>Ид шидийг хамтдаа бүтээе.</p>
      </footer>
    </div>
  );
}
