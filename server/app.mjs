import { createServer } from "node:http";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { openDatabase } from "./database.mjs";
const scrypt = promisify(scryptCb);
const sha = (s) => createHash("sha256").update(s).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + Buffer.from(await scrypt(password, salt, 64)).toString("hex");
}
async function verify(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};
function str(value, min = 1, max = 200) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max)
    fail(400, "Талбарын утга буруу байна.");
  return value.trim();
}
function int(v, min, max) {
  if (!Number.isInteger(v) || v < min || v > max) fail(400, "Тоон утга буруу байна.");
  return v;
}
function shuffle(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const n = randomBytes(4).readUInt32BE(0) % (i + 1);
    [a[i], a[n]] = [a[n], a[i]];
  }
  return a;
}
async function body(req, limit = 32768) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) fail(413, "Файл эсвэл хүсэлт хэт том байна.");
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
async function jsonBody(req) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    fail(415, "JSON хүсэлт шаардлагатай.");
  try {
    return JSON.parse((await body(req)).toString());
  } catch (e) {
    if (e.status) throw e;
    fail(400, "JSON утга буруу байна.");
  }
}
function dateStage(config, now) {
  if (!config.start_date) return -1;
  const opening = Date.parse(config.start_date + "T" + config.opening_time + ":00+08:00");
  if (now < opening) return -1;
  const day = Math.floor((now - Date.parse(config.start_date + "T00:00:00+08:00")) / 86400000);
  return day;
}

export function createApp({
  dataDir = process.env.DATA_DIR || "./data",
  now = () => Date.now(),
  origin = process.env.APP_ORIGIN,
  secure = process.env.NODE_ENV === "production",
  dist = resolve("dist"),
} = {}) {
  const store = openDatabase(dataDir);
  const { one, all, run, transaction, encrypt, decrypt } = store;
  const attempts = new Map();
  const settings = () => one("SELECT * FROM settings WHERE id=1");
  const taskAccess = () =>
    all("SELECT task,opened FROM task_controls").map((r) => ({ task: r.task, open: !!r.opened }));
  const isOpen = (task) => !!one("SELECT opened FROM task_controls WHERE task=?", task)?.opened;
  const released = () => isOpen("leaderboard");
  const employees = () =>
    all("SELECT id,name,department FROM users WHERE active=1 AND role='employee' ORDER BY name");
  function gate(kind) {
    if (!isOpen(kind)) fail(403, "Энэ таскийг зохион байгуулагч хаасан байна.");
    if (!settings().prepared) fail(409, "Зохион байгуулагч тоглоомыг бэлдээгүй байна.");
  }
  function score(id) {
    return {
      mystery: Number(
        one("SELECT COALESCE(SUM(correct),0)*10 AS n FROM mystery WHERE player=?", id).n,
      ),
      gift: one("SELECT COUNT(*) AS n FROM gifts WHERE assigned=? AND status='approved'", id).n
        ? 100
        : 0,
      letters: Math.min(
        100,
        Number(one("SELECT COUNT(*) AS n FROM letters WHERE sender=?", id).n) * 50,
      ),
      quiz: Number(
        one("SELECT COALESCE(SUM(correct),0)*10 AS n FROM quiz_answers WHERE user_id=?", id).n,
      ),
    };
  }
  function quizState(user) {
    let q = one("SELECT * FROM quiz WHERE id=1");
    if (q.stage === "question" && now() >= q.deadline) {
      run("UPDATE quiz SET stage='reveal' WHERE id=1 AND stage='question'");
      q = one("SELECT * FROM quiz WHERE id=1");
    }
    const ids = JSON.parse(q.question_ids);
    const question = ids[q.position]
      ? one("SELECT * FROM questions WHERE id=?", ids[q.position])
      : null;
    let safe = null;
    if (question) {
      safe = {
        id: question.id,
        question: question.question,
        answers: JSON.parse(question.answers),
        category: question.category,
        seconds: question.seconds,
      };
      if (q.stage === "reveal" || q.stage === "final") {
        safe.correct = question.correct;
        safe.explanation = question.explanation;
      }
    }
    return {
      stage: q.stage,
      open: isOpen("quiz"),
      position: q.position,
      total: ids.length,
      deadline: q.deadline,
      serverNow: now(),
      question: isOpen("quiz") || user.role === "admin" ? safe : null,
      answer: question
        ? (one(
            "SELECT choice FROM quiz_answers WHERE user_id=? AND question_id=?",
            user.id,
            question.id,
          )?.choice ?? null)
        : null,
      players: Number(one("SELECT COUNT(*) AS n FROM quiz_players WHERE seen>?", now() - 20000).n),
      answered: question
        ? Number(one("SELECT COUNT(*) AS n FROM quiz_answers WHERE question_id=?", question.id).n)
        : 0,
      score: score(user.id).quiz,
    };
  }
  function state(user) {
    const c = settings();
    const list = employees();
    const partner = one("SELECT recipient FROM partners WHERE sender=?", user.id);
    const sent = all(
      "SELECT l.id,l.recipient,u.name,l.created FROM letters l JOIN users u ON u.id=l.recipient WHERE l.sender=? ORDER BY l.created,l.rowid",
      user.id,
    );
    const inbox = all("SELECT id,created FROM letters WHERE recipient=? ORDER BY created", user.id);
    const gift = one(
      "SELECT id,label,clue,second_clue,status,note,photo IS NOT NULL AS hasPhoto FROM gifts WHERE assigned=?",
      user.id,
    );
    const mystery = all(
      "SELECT m.id,m.position,m.chosen,m.correct,u.facts FROM mystery m JOIN users u ON u.id=m.target WHERE m.player=? ORDER BY m.position",
      user.id,
    ).map((q) => ({
      id: q.id,
      position: q.position,
      chosen: q.chosen,
      correct: q.correct,
      facts: JSON.parse(q.facts),
    }));
    return {
      me: {
        id: user.id,
        name: user.name,
        username: user.username,
        department: user.department,
        role: user.role,
      },
      settings: {
        start_date: c.start_date,
        opening_time: c.opening_time,
        friday_time: c.friday_time,
        prepared: !!c.prepared,
      },
      stage: dateStage(c, now()),
      access: taskAccess(),
      released: released(),
      scores: score(user.id),
      employees: list,
      community: Number(one("SELECT COUNT(DISTINCT sender) AS n FROM letters").n),
      partner: partner?.recipient || null,
      sent,
      inbox,
      gift:
        isOpen("hunt") && gift
          ? { ...gift, photo: gift.hasPhoto ? "/api/gifts/" + gift.id + "/photo" : null }
          : null,
      mystery: isOpen("mystery") ? mystery : [],
      draft: (() => {
        const d = one("SELECT body,recipient FROM drafts WHERE sender=?", user.id);
        return d ? { message: decrypt(d.body), recipient: d.recipient } : null;
      })(),
    };
  }
  const reply = (res, data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
  };
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Frame-Options", "DENY");
    const path = new URL(req.url, "http://localhost").pathname;
    const method = req.method;
    try {
      if (path === "/api/health") return reply(res, { ok: true });
      if (path.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(method)) {
          if (req.headers["x-requested-with"] !== "Dogdlol") fail(403, "Хүсэлт зөвшөөрөгдөөгүй.");
          const expected = origin || `http://${req.headers.host}`;
          if (req.headers.origin && req.headers.origin !== expected)
            fail(403, "Өөр домэйноос хүсэлт илгээх боломжгүй.");
        }
        if (method === "POST" && path === "/api/auth/login") {
          const b = await jsonBody(req);
          const username = str(b.username, 1, 80).toLowerCase();
          const password = str(b.password, 1, 256);
          const key = req.socket.remoteAddress + ":" + username;
          const prior = attempts.get(key);
          if (prior && prior.until > now() && prior.count >= 8)
            fail(429, "Олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу.");
          if (attempts.size > 5000)
            for (const [k, v] of attempts) if (v.until < now()) attempts.delete(k);
          const user = one("SELECT * FROM users WHERE username=? AND active=1", username);
          const dummy = "00000000000000000000000000000000:" + "00".repeat(64);
          if (!(await verify(password, user?.password || dummy)) || !user) {
            attempts.set(key, {
              count: (prior && prior.until > now() ? prior.count : 0) + 1,
              until: now() + 900000,
            });
            fail(401, "Нэвтрэх нэр эсвэл нууц үг буруу байна.");
          }
          attempts.delete(key);
          const token = randomBytes(32).toString("hex");
          run("DELETE FROM sessions WHERE expires<?", now());
          run("INSERT INTO sessions VALUES(?,?,?)", sha(token), user.id, now() + 12 * 3600000);
          res.setHeader(
            "Set-Cookie",
            `dogdlol_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? "; Secure" : ""}`,
          );
          return reply(res, { ok: true });
        }
        const token = req.headers.cookie?.match(
          /(?:^|;\s*)dogdlol_session=([a-f0-9]{64})(?:;|$)/,
        )?.[1];
        const user = token
          ? one(
              "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1",
              sha(token),
              now(),
            )
          : null;
        if (!user) fail(401, "Эхлээд нэвтэрнэ үү.");
        if (method === "POST" && path === "/api/auth/logout") {
          run("DELETE FROM sessions WHERE token=?", sha(token));
          res.setHeader(
            "Set-Cookie",
            "dogdlol_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
          );
          return reply(res, { ok: true });
        }
        if (method === "POST" && path === "/api/auth/password") {
          const b = await jsonBody(req);
          if (!(await verify(str(b.current, 1, 256), user.password)))
            fail(400, "Одоогийн нууц үг буруу.");
          const hash = await hashPassword(str(b.password, 10, 128));
          run("UPDATE users SET password=? WHERE id=?", hash, user.id);
          run("DELETE FROM sessions WHERE user_id=? AND token<>?", user.id, sha(token));
          return reply(res, { ok: true });
        }
        if (method === "GET" && path === "/api/state") return reply(res, state(user));
        if (method === "GET" && path === "/api/leaderboard") {
          if (!released()) fail(403, "Онооны самбарыг зохион байгуулагч нээнэ.");
          const rows = employees()
            .map((u) => {
              const s = score(u.id);
              return { ...u, ...s, total: Object.values(s).reduce((a, b) => a + b, 0) };
            })
            .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
          return reply(res, { rows });
        }
        if (
          user.role !== "employee" &&
          ((method !== "GET" &&
            (path.startsWith("/api/letters") ||
              path.startsWith("/api/gifts") ||
              path.startsWith("/api/mystery"))) ||
            path === "/api/quiz/answer")
        )
          fail(403, "Ажилтны эрх шаардлагатай.");
        if (method === "POST" && path === "/api/mystery/answer") {
          gate("mystery");
          const b = await jsonBody(req);
          const q = one("SELECT * FROM mystery WHERE id=? AND player=?", str(b.id), user.id);
          if (!q) fail(404, "Асуулт олдсонгүй.");
          if (q.chosen) fail(409, "Энэ асуултад хариулсан байна.");
          if (
            b.chosen === user.id ||
            !one("SELECT id FROM users WHERE id=? AND active=1 AND role='employee'", str(b.chosen))
          )
            fail(400, "Ажилтан сонгоно уу.");
          run(
            "UPDATE mystery SET chosen=?,correct=? WHERE id=? AND chosen IS NULL",
            b.chosen,
            Number(q.target === b.chosen),
            q.id,
          );
          return reply(res, { correct: q.target === b.chosen });
        }
        if (method === "POST" && path === "/api/gifts/spin") {
          gate("hunt");
          const gift = transaction(() => {
            let g = one("SELECT id FROM gifts WHERE assigned=?", user.id);
            if (g) return g;
            g = one("SELECT id FROM gifts WHERE assigned IS NULL ORDER BY RANDOM() LIMIT 1");
            if (!g) fail(409, "Сул бэлэг үлдээгүй байна.");
            run(
              "UPDATE gifts SET assigned=?,status='clue' WHERE id=? AND assigned IS NULL",
              user.id,
              g.id,
            );
            return g;
          });
          return reply(res, { id: gift.id });
        }
        const photoPath = path.match(/^\/api\/gifts\/([^/]+)\/photo$/);
        if (photoPath) {
          const g = one("SELECT * FROM gifts WHERE id=?", photoPath[1]);
          if (!g || (g.assigned !== user.id && user.role !== "admin"))
            fail(404, "Бэлэг олдсонгүй.");
          if (method === "GET") {
            if (user.role !== "admin" && !isOpen("hunt")) fail(403, "Бэлгийн эрэл хаалттай байна.");
            if (!g.photo) fail(404, "Зураг байхгүй.");
            res.writeHead(200, {
              "Content-Type": g.mime,
              "Content-Disposition": 'inline; filename="gift-proof"',
            });
            return res.end(Buffer.from(g.photo));
          }
          if (method === "POST") {
            gate("hunt");
            if (g.assigned !== user.id || !["clue", "retry"].includes(g.status))
              fail(409, "Одоо зураг солих боломжгүй.");
            const bytes = await body(req, 5 * 1024 * 1024);
            const jpg =
              bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
            const png =
              bytes.length > 8 &&
              bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            const webp =
              bytes.length > 12 &&
              bytes.subarray(0, 4).toString() === "RIFF" &&
              bytes.subarray(8, 12).toString() === "WEBP";
            if (!jpg && !png && !webp) fail(415, "JPG, PNG эсвэл WebP зураг оруулна уу.");
            run(
              "UPDATE gifts SET photo=?,mime=?,status='pending',note='' WHERE id=?",
              bytes,
              jpg ? "image/jpeg" : png ? "image/png" : "image/webp",
              g.id,
            );
            return reply(res, { ok: true });
          }
        }
        if (path === "/api/letters/draft" && method === "PUT") {
          gate("letters");
          const b = await jsonBody(req);
          const message = typeof b.message === "string" ? b.message : "";
          if (message.length > 2000) fail(400, "2000 хүртэл тэмдэгт бичнэ үү.");
          run(
            "INSERT INTO drafts(sender,body,recipient) VALUES(?,?,?) ON CONFLICT(sender) DO UPDATE SET body=excluded.body,recipient=excluded.recipient",
            user.id,
            encrypt(message),
            typeof b.recipient === "string" ? b.recipient : "",
          );
          return reply(res, { ok: true });
        }
        if (path === "/api/letters" && method === "POST") {
          gate("letters");
          const b = await jsonBody(req);
          const message = str(b.message, 10, 2000);
          const recipient = str(b.recipient);
          transaction(() => {
            if (
              recipient === user.id ||
              !one("SELECT id FROM users WHERE id=? AND active=1 AND role='employee'", recipient)
            )
              fail(400, "Өөр ажилтан сонгоно уу.");
            const count = one("SELECT COUNT(*) AS n FROM letters WHERE sender=?", user.id).n;
            const partner = one("SELECT recipient FROM partners WHERE sender=?", user.id);
            if (!count && recipient !== partner?.recipient)
              fail(400, "Эхний захиаг системээс оноосон хүнд бичнэ үү.");
            if (one("SELECT id FROM letters WHERE sender=? AND recipient=?", user.id, recipient))
              fail(409, "Энэ хүнд захиа бичсэн байна.");
            run(
              "INSERT INTO letters VALUES(?,?,?,?,?)",
              randomUUID(),
              user.id,
              recipient,
              encrypt(message),
              now(),
            );
            run("DELETE FROM drafts WHERE sender=?", user.id);
          });
          return reply(res, { ok: true });
        }
        const letterPath = path.match(/^\/api\/letters\/([^/]+)$/);
        if (letterPath && method === "GET") {
          if (!released()) fail(403, "Захиа унших хэсгийг зохион байгуулагч нээнэ.");
          const letter = one(
            "SELECT body FROM letters WHERE id=? AND recipient=?",
            letterPath[1],
            user.id,
          );
          if (!letter) fail(404, "Захиа олдсонгүй.");
          return reply(res, { message: decrypt(letter.body) });
        }
        if (path === "/api/quiz" && method === "GET") {
          if (user.role !== "admin" && !isOpen("quiz")) fail(403, "Сорил хаалттай байна.");
          return reply(res, quizState(user));
        }
        if (path === "/api/quiz/join" && method === "POST") {
          gate("quiz");
          if (user.role !== "employee") fail(403, "Ажилтны эрхээр оролцоно уу.");
          run(
            "INSERT INTO quiz_players VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET seen=excluded.seen",
            user.id,
            now(),
          );
          return reply(res, quizState(user));
        }
        if (path === "/api/quiz/answer" && method === "POST") {
          gate("quiz");
          const b = await jsonBody(req);
          const q = quizState(user);
          if (q.stage !== "question" || now() >= q.deadline) fail(409, "Хариулах хугацаа дууссан.");
          if (!q.question || b.id !== q.question.id) fail(409, "Асуулт солигдсон байна.");
          const choice = int(b.choice, 0, 3);
          if (!one("SELECT user_id FROM quiz_players WHERE user_id=?", user.id))
            fail(403, "Сорилд эхлээд нэгдэнэ үү.");
          if (
            one("SELECT choice FROM quiz_answers WHERE user_id=? AND question_id=?", user.id, b.id)
          )
            fail(409, "Хариултаа илгээсэн байна.");
          const answer = one("SELECT correct FROM questions WHERE id=?", b.id);
          run(
            "INSERT INTO quiz_answers VALUES(?,?,?,?,?)",
            user.id,
            b.id,
            choice,
            Number(answer.correct === choice),
            now(),
          );
          return reply(res, { ok: true });
        }
        // Everything under /admin requires server-side admin authorization.
        if (path.startsWith("/api/admin/")) {
          if (user.role !== "admin") fail(403, "Зохион байгуулагчийн эрх шаардлагатай.");
          if (method === "GET" && path === "/api/admin/data") {
            return reply(res, {
              settings: settings(),
              access: taskAccess(),
              employees: all(
                "SELECT id,username,name,department,role,active,facts FROM users ORDER BY name",
              ).map((u) => ({ ...u, facts: JSON.parse(u.facts) })),
              gifts: all(
                "SELECT id,label,clue,second_clue,assigned,status,note,photo IS NOT NULL AS hasPhoto FROM gifts ORDER BY label",
              ),
              questions: all("SELECT * FROM questions ORDER BY position").map((q) => ({
                ...q,
                answers: JSON.parse(q.answers),
              })),
              quiz: quizState(user),
            });
          }
          if (method === "POST" && path === "/api/admin/employees") {
            if (settings().prepared) fail(409, "Тоглоом бэлтгэсний дараа ажилтан нэмж болохгүй.");
            if (employees().length >= 100) fail(400, "100 ажилтан бүртгэгдсэн байна.");
            const b = await jsonBody(req);
            const username = str(b.username, 3, 80).toLowerCase();
            if (!/^[a-z0-9._@-]+$/.test(username))
              fail(400, "Нэвтрэх нэрийг латин үсгээр оруулна уу.");
            if (one("SELECT id FROM users WHERE username=?", username))
              fail(409, "Нэвтрэх нэр давхардсан.");
            const hash = await hashPassword(str(b.password, 10, 128));
            run(
              "INSERT INTO users(id,username,name,department,role,password) VALUES(?,?,?,?,'employee',?)",
              randomUUID(),
              username,
              str(b.name, 2, 100),
              str(b.department || "—", 1, 100),
              hash,
            );
            return reply(res, { ok: true }, 201);
          }
          const ep = path.match(/^\/api\/admin\/employees\/([^/]+)$/);
          if (ep && method === "PUT") {
            const b = await jsonBody(req);
            const target = one("SELECT * FROM users WHERE id=?", ep[1]);
            if (!target) fail(404, "Ажилтан байхгүй.");
            const facts = b.facts;
            if (!Array.isArray(facts) || facts.length !== 3) fail(400, "Гурван баримт оруулна уу.");
            const safeFacts = facts.map((f) => str(f, 5, 300));
            if (settings().prepared) fail(409, "Тоглоом эхэлсэн тул баримт өөрчлөхгүй.");
            run(
              "UPDATE users SET name=?,department=?,facts=? WHERE id=?",
              str(b.name, 2, 100),
              str(b.department || "—", 1, 100),
              JSON.stringify(safeFacts),
              target.id,
            );
            return reply(res, { ok: true });
          }
          const reset = path.match(/^\/api\/admin\/employees\/([^/]+)\/password$/);
          if (reset && method === "POST") {
            const b = await jsonBody(req);
            if (!one("SELECT id FROM users WHERE id=? AND role='employee'", reset[1]))
              fail(404, "Ажилтан олдсонгүй.");
            const hash = await hashPassword(str(b.password, 10, 128));
            run("UPDATE users SET password=? WHERE id=?", hash, reset[1]);
            run("DELETE FROM sessions WHERE user_id=?", reset[1]);
            return reply(res, { ok: true });
          }
          if (path === "/api/admin/prepare" && method === "POST") {
            transaction(() => {
              if (settings().prepared) fail(409, "Тоглоом аль хэдийн бэлэн.");
              const people = all("SELECT id,facts FROM users WHERE active=1 AND role='employee'");
              if (people.length < 11)
                fail(400, "10 өөр хүн таахын тулд дор хаяж 11 ажилтан шаардлагатай.");
              if (people.some((p) => JSON.parse(p.facts).length !== 3))
                fail(400, "Ажилтан бүрийн гурван баримтыг бөглөнө үү.");
              if (one("SELECT COUNT(*) AS n FROM gifts").n < people.length)
                fail(400, "Ажилтны тоогоор бэлгээ нэмнэ үү.");
              const players = shuffle(people);
              players.forEach((p, i) => {
                run("INSERT INTO partners VALUES(?,?)", p.id, players[(i + 1) % players.length].id);
                for (let n = 1; n <= 10; n++)
                  run(
                    "INSERT INTO mystery(id,player,target,position) VALUES(?,?,?,?)",
                    randomUUID(),
                    p.id,
                    players[(i + n) % players.length].id,
                    n - 1,
                  );
              });
              run("UPDATE settings SET prepared=1 WHERE id=1");
            });
            return reply(res, { ok: true });
          }
          if (path === "/api/admin/settings" && method === "PUT") {
            const b = await jsonBody(req);
            const date = str(b.start_date, 10, 10);
            if (!Number.isFinite(Date.parse(date + "T00:00:00Z"))) fail(400, "Огноо буруу.");
            if (
              !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
              new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date ||
              new Date(date + "T00:00:00Z").getUTCDay() !== 1
            )
              fail(400, "Эхлэх огноо даваа гараг байх ёстой.");
            for (const t of [b.opening_time, b.friday_time])
              if (typeof t !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))
                fail(400, "Цагийн утга буруу.");
            if (
              settings().prepared &&
              one("SELECT COUNT(*) AS n FROM mystery WHERE chosen IS NOT NULL").n > 0 &&
              date !== settings().start_date
            )
              fail(409, "Хариулт ирсэн тул долоо хоногийг өөрчлөхгүй.");
            run(
              "UPDATE settings SET start_date=?,opening_time=?,friday_time=? WHERE id=1",
              date,
              b.opening_time,
              b.friday_time,
            );
            return reply(res, { ok: true });
          }
          if (path === "/api/admin/tasks" && method === "PUT") {
            const b = await jsonBody(req);
            if (
              !["mystery", "hunt", "letters", "quiz", "leaderboard"].includes(b.task) ||
              typeof b.open !== "boolean"
            )
              fail(400, "Таск эсвэл төлөв буруу.");
            run("UPDATE task_controls SET opened=? WHERE task=?", Number(b.open), b.task);
            return reply(res, { access: taskAccess() });
          }
          if (path === "/api/admin/gifts" && method === "POST") {
            if (one("SELECT COUNT(*) AS n FROM gifts").n >= 100)
              fail(400, "100 бэлэг бүртгэгдсэн байна.");
            const b = await jsonBody(req);
            run(
              "INSERT INTO gifts(id,label,clue,second_clue) VALUES(?,?,?,?)",
              randomUUID(),
              str(b.label, 1, 100),
              str(b.clue, 5, 500),
              str(b.second_clue, 5, 500),
            );
            return reply(res, { ok: true }, 201);
          }
          const gp = path.match(/^\/api\/admin\/gifts\/([^/]+)$/);
          if (gp && method === "PUT") {
            const b = await jsonBody(req);
            const g = one("SELECT * FROM gifts WHERE id=?", gp[1]);
            if (!g) fail(404, "Бэлэг байхгүй.");
            if (g.assigned) fail(409, "Оноогдсон бэлгийн сэжүүрийг өөрчлөхгүй.");
            run(
              "UPDATE gifts SET label=?,clue=?,second_clue=? WHERE id=?",
              str(b.label, 1, 100),
              str(b.clue, 5, 500),
              str(b.second_clue, 5, 500),
              g.id,
            );
            return reply(res, { ok: true });
          }
          const review = path.match(/^\/api\/admin\/gifts\/([^/]+)\/review$/);
          if (review && method === "POST") {
            const b = await jsonBody(req);
            if (!["approved", "retry"].includes(b.status)) fail(400, "Төлөв буруу.");
            const g = one("SELECT status FROM gifts WHERE id=?", review[1]);
            if (g?.status !== "pending") fail(409, "Шалгах зураг байхгүй.");
            run(
              "UPDATE gifts SET status=?,note=? WHERE id=?",
              b.status,
              b.status === "retry" ? str(b.note, 5, 500) : "",
              review[1],
            );
            return reply(res, { ok: true });
          }
          const qp = path.match(/^\/api\/admin\/questions(?:\/([^/]+))?$/);
          if (qp && ["POST", "PUT", "DELETE"].includes(method)) {
            const quiz = one("SELECT * FROM quiz WHERE id=1");
            if (quiz.stage !== "lobby") fail(409, "Сорил эхэлсэн тул асуултыг өөрчлөхгүй.");
            if (qp[1] && !one("SELECT id FROM questions WHERE id=?", qp[1]))
              fail(404, "Асуулт байхгүй.");
            if (method === "DELETE") {
              run("DELETE FROM questions WHERE id=?", qp[1]);
              return reply(res, { ok: true });
            }
            const b = await jsonBody(req);
            if (!Array.isArray(b.answers) || b.answers.length !== 4)
              fail(400, "Дөрвөн хариулт оруулна уу.");
            const answers = b.answers.map((a) => str(a, 1, 200));
            if (new Set(answers).size !== 4) fail(400, "Хариултууд ялгаатай байх ёстой.");
            const question = str(b.question, 5, 500),
              correct = int(b.correct, 0, 3),
              seconds = int(b.seconds, 10, 120),
              explanation = str(b.explanation, 0, 1000);
            if (!["newyear", "company"].includes(b.category)) fail(400, "Ангилал сонгоно уу.");
            if (method === "PUT")
              run(
                "UPDATE questions SET question=?,answers=?,correct=?,seconds=?,explanation=?,category=? WHERE id=?",
                question,
                JSON.stringify(answers),
                correct,
                seconds,
                explanation,
                b.category,
                qp[1],
              );
            else {
              if (one("SELECT COUNT(*) AS n FROM questions").n >= 10)
                fail(400, "10 асуулт бүртгэгдсэн байна.");
              run(
                "INSERT INTO questions VALUES(?,?,?,?,?,?,?,?)",
                randomUUID(),
                question,
                JSON.stringify(answers),
                correct,
                explanation,
                b.category,
                seconds,
                Number(one("SELECT COALESCE(MAX(position),-1)+1 AS n FROM questions").n),
              );
            }
            return reply(res, { ok: true });
          }
          if (path === "/api/admin/questions/reorder" && method === "PATCH") {
            const b = await jsonBody(req);
            const rows = all("SELECT id FROM questions");
            if (
              !Array.isArray(b.ids) ||
              b.ids.length !== rows.length ||
              new Set(b.ids).size !== rows.length ||
              b.ids.some((id) => !rows.some((q) => q.id === id))
            )
              fail(400, "Асуултын дараалал буруу.");
            if (one("SELECT stage FROM quiz WHERE id=1").stage !== "lobby")
              fail(409, "Сорил эхэлсэн.");
            transaction(() =>
              b.ids.forEach((id, i) => run("UPDATE questions SET position=? WHERE id=?", i, id)),
            );
            return reply(res, { ok: true });
          }
          if (path === "/api/admin/quiz/control" && method === "POST") {
            gate("quiz");
            const b = await jsonBody(req);
            const current = quizState(user);
            if (b.action === "start") {
              if (current.stage !== "lobby") fail(409, "Сорил аль хэдийн эхэлсэн.");
              const qs = all("SELECT * FROM questions ORDER BY position");
              if (
                qs.length !== 10 ||
                qs.filter((q) => q.category === "newyear").length !== 5 ||
                qs.filter((q) => q.category === "company").length !== 5
              )
                fail(400, "Шинэ жилийн 5, компанийн 5 асуулт бэлдэнэ үү.");
              run(
                "UPDATE quiz SET stage='question',position=0,deadline=?,question_ids=? WHERE id=1",
                now() + qs[0].seconds * 1000,
                JSON.stringify(qs.map((q) => q.id)),
              );
            } else if (b.action === "reveal") {
              if (current.stage !== "question") fail(409, "Идэвхтэй асуулт байхгүй.");
              run("UPDATE quiz SET stage='reveal' WHERE id=1");
            } else if (b.action === "next") {
              if (current.stage !== "reveal") fail(409, "Эхлээд хариултыг нээнэ үү.");
              const qs = JSON.parse(one("SELECT question_ids FROM quiz WHERE id=1").question_ids);
              if (current.position + 1 >= qs.length)
                run("UPDATE quiz SET stage='final' WHERE id=1");
              else {
                const next = one(
                  "SELECT seconds FROM questions WHERE id=?",
                  qs[current.position + 1],
                );
                run(
                  "UPDATE quiz SET stage='question',position=position+1,deadline=? WHERE id=1",
                  now() + next.seconds * 1000,
                );
              }
            } else if (b.action === "finish") {
              if (!["question", "reveal"].includes(current.stage))
                fail(409, "Сорил эхлээгүй эсвэл дууссан байна.");
              run("UPDATE quiz SET stage='final' WHERE id=1");
            } else fail(400, "Үйлдэл буруу.");
            return reply(res, quizState(user));
          }
        }
        fail(404, "Хүсэлт олдсонгүй.");
      }
      if (!["GET", "HEAD"].includes(method)) fail(405, "Зөвшөөрөгдөөгүй үйлдэл.");
      const file = resolve(dist, "." + decodeURIComponent(path));
      if (file !== resolve(dist) && !file.startsWith(resolve(dist) + sep)) fail(404, "Олдсонгүй.");
      let target = file;
      try {
        if (!(await stat(target)).isFile()) target = resolve(dist, "index.html");
      } catch {
        if (extname(path)) fail(404, "Файл олдсонгүй.");
        target = resolve(dist, "index.html");
      }
      const data = await readFile(target);
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".woff2": "font/woff2",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(target)] || "application/octet-stream",
        "Cache-Control": extname(target) === ".html" ? "no-cache" : "public, max-age=3600",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
      });
      res.end(method === "HEAD" ? undefined : data);
    } catch (e) {
      if (!res.headersSent)
        reply(res, { error: e.status ? e.message : "Серверийн алдаа гарлаа." }, e.status || 500);
      else res.end();
      if (!e.status) console.error("Request failed:", e.message);
    }
  });
  return { server, store, score };
}
