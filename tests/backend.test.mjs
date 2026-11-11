import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createApp, hashPassword } from "../server/app.mjs";
test("real HTTP flow: authorization, scoring, privacy, gifts and synchronized quiz", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dogdlol-test-"));
  let clock = Date.parse("2026-12-14T10:00:00+08:00");
  const app = createApp({ dataDir: dir, now: () => clock });
  const { one, all, run } = app.store;
  const password = "integration-test-only";
  const hash = await hashPassword(password);
  const admin = randomUUID();
  run(
    "INSERT INTO users(id,username,name,role,password) VALUES(?,? ,?,'admin',?)",
    admin,
    "organizer",
    "Organizer",
    hash,
  );
  const people = [];
  for (let i = 0; i < 18; i++) {
    const id = randomUUID();
    people.push(id);
    run(
      "INSERT INTO users(id,username,name,role,password,facts) VALUES(?,?,?,'employee',?,?)",
      id,
      "person" + i,
      "Person " + i,
      hash,
      JSON.stringify(["Fact number one", "Fact number two", "Fact number three"]),
    );
  }
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + app.server.address().port;
  let cookie = "";
  async function request(path, method = "GET", data, as = cookie) {
    const upload = data instanceof Uint8Array;
    const response = await fetch(base + "/api" + path, {
      method,
      headers: {
        cookie: as,
        "X-Requested-With": "Dogdlol",
        "Content-Type": upload ? "image/png" : "application/json",
      },
      body: data === undefined ? undefined : upload ? data : JSON.stringify(data),
    });
    const result = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.arrayBuffer();
    return {
      status: response.status,
      data: result,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function ok(path, method = "GET", data) {
    const r = await request(path, method, data);
    assert.ok(r.status < 300, JSON.stringify(r));
    return r.data;
  }
  try {
    assert.equal((await request("/state")).status, 401);
    const a = await request("/auth/login", "POST", { username: "organizer", password });
    assert.equal(a.status, 200);
    let adminCookie = a.cookie;
    cookie = adminCookie;
    await ok("/admin/settings", "PUT", {
      start_date: "2026-12-14",
      opening_time: "09:00",
      friday_time: "16:00",
    });
    for (let i = 0; i < 18; i++)
      await ok("/admin/gifts", "POST", {
        label: "Gift " + i,
        clue: "The first clue " + i,
        second_clue: "The second clue " + i,
      });
    // Захиа бэлтгэлээс өмнө нээгдэхэд оноолт үүсч, дараа нь бэлтгэл түүнийг ашиглана.
    await ok("/admin/tasks", "PUT", { task: "letters", open: true });
    assert.equal(one("SELECT COUNT(*) AS n FROM partners").n, 18);
    const earlyPartners = all("SELECT * FROM partners ORDER BY sender");
    await ok("/admin/prepare", "POST", {});
    assert.deepEqual(all("SELECT * FROM partners ORDER BY sender"), earlyPartners);
    await ok("/admin/tasks", "PUT", { task: "letters", open: false });
    await ok("/admin/tasks", "PUT", { task: "mystery", open: true });
    assert.equal(all("SELECT * FROM mystery").length, 90);
    assert.equal(one("SELECT COUNT(DISTINCT recipient) AS n FROM partners").n, 18);
    assert.equal(one("SELECT COUNT(*) AS n FROM partners WHERE sender=recipient").n, 0);
    assert.equal(one("SELECT COUNT(*) AS n FROM mystery WHERE player=target").n, 0);
    assert.equal(
      one("SELECT COUNT(*) AS n FROM partners p JOIN mystery m ON m.player=p.sender AND m.target=p.recipient").n,
      0,
    );
    const login = await request("/auth/login", "POST", { username: "person0", password });
    cookie = login.cookie;
    let employeeCookie = cookie;
    assert.equal((await request("/admin/data")).status, 403);
    const s = await ok("/state");
    assert.equal(
      Object.values(s.scores).reduce((a, b) => a + b),
      0,
    );
    assert.equal(s.employees.length, 18);
    assert.ok(!JSON.stringify(s).includes("password"));
    assert.equal((await request("/leaderboard")).status, 403);
    assert.equal(
      (await request("/letters", "POST", { recipient: people[1], message: "A warm letter to you" }))
        .status,
      403,
    );
    assert.equal(s.mystery.length, 5);
    for (const q of s.mystery) {
      const target = one("SELECT target FROM mystery WHERE id=?", q.id).target;
      await ok("/mystery/answer", "POST", { id: q.id, chosen: target });
      assert.equal(
        (await request("/mystery/answer", "POST", { id: q.id, chosen: target })).status,
        409,
      );
    }
    assert.equal((await ok("/state")).scores.mystery, 100);
    assert.equal((await request("/gifts/spin", "POST", {})).status, 403);
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "hunt", open: true });
    cookie = employeeCookie;
    const spin = await ok("/gifts/spin", "POST", {});
    assert.equal((await ok("/gifts/spin", "POST", {})).id, spin.id);
    assert.equal(
      (await request("/gifts/" + spin.id + "/photo", "POST", new Uint8Array([1, 2, 3]))).status,
      415,
    );
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    await ok("/gifts/" + spin.id + "/photo", "POST", png);
    assert.equal((await ok("/state")).scores.gift, 0);
    cookie = adminCookie;
    await ok("/admin/gifts/" + spin.id + "/review", "POST", { status: "approved" });
    assert.equal(
      (await request("/admin/gifts/" + spin.id + "/review", "POST", { status: "approved" })).status,
      409,
    );
    cookie = employeeCookie;
    assert.equal((await ok("/state")).scores.gift, 100);
    clock = Date.parse("2026-12-15T10:00:00+08:00");
    adminCookie = (await request("/auth/login", "POST", { username: "organizer", password }))
      .cookie;
    employeeCookie = (await request("/auth/login", "POST", { username: "person0", password }))
      .cookie;
    cookie = employeeCookie;
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "letters", open: true });
    cookie = employeeCookie;
    const partner = one("SELECT recipient FROM partners WHERE sender=?", people[0]).recipient;
    await ok("/letters/draft", "PUT", { recipient: partner, message: "private draft text" });
    assert.equal((await ok("/state")).draft.message, "private draft text");
    assert.ok(!one("SELECT body FROM drafts").body.includes("private draft"));
    await ok("/letters", "POST", { recipient: partner, message: "A very private first letter" });
    assert.equal(
      (
        await request("/letters", "POST", {
          recipient: partner,
          message: "Another duplicate letter",
        })
      ).status,
      409,
    );
    const second = people.find((id) => id !== people[0] && id !== partner);
    await ok("/letters", "POST", { recipient: second, message: "A second warm private letter" });
    const third = people.find((id) => ![people[0], partner, second].includes(id));
    await ok("/letters", "POST", {
      recipient: third,
      message: "An additional warm private letter",
    });
    assert.equal((await ok("/state")).scores.letters, 100);
    const letter = one("SELECT * FROM letters WHERE sender=? AND recipient=?", people[0], partner);
    assert.ok(!letter.body.includes("private"));
    assert.equal((await request("/letters/" + letter.id)).status, 403);
    clock = Date.parse("2026-12-16T10:00:00+08:00");
    adminCookie = (await request("/auth/login", "POST", { username: "organizer", password }))
      .cookie;
    employeeCookie = (await request("/auth/login", "POST", { username: "person0", password }))
      .cookie;
    cookie = employeeCookie;
    cookie = adminCookie;
    for (let i = 0; i < 10; i++)
      await ok("/admin/questions", "POST", {
        question: "Question number " + i,
        answers: ["One", "Two", "Three", "Four"],
        correct: 0,
        explanation: "The explanation",
        category: i < 5 ? "newyear" : "company",
        seconds: 20,
      });
    await ok("/admin/tasks", "PUT", { task: "quiz", open: true });
    await ok("/admin/quiz/control", "POST", { action: "start" });
    cookie = employeeCookie;
    await ok("/quiz/join", "POST", {});
    for (let i = 0; i < 10; i++) {
      const q = await ok("/quiz");
      assert.equal(q.question.correct, undefined);
      await ok("/quiz/answer", "POST", { id: q.question.id, choice: 0 });
      assert.equal(
        (await request("/quiz/answer", "POST", { id: q.question.id, choice: 0 })).status,
        409,
      );
      cookie = adminCookie;
      await ok("/admin/quiz/control", "POST", { action: "reveal" });
      cookie = employeeCookie;
      assert.equal((await ok("/quiz")).question.correct, 0);
      cookie = adminCookie;
      await ok("/admin/quiz/control", "POST", { action: "next" });
      cookie = employeeCookie;
    }
    assert.equal((await ok("/quiz")).score, 100);
    assert.equal((await ok("/quiz")).stage, "final");
    assert.equal(
      Object.values((await ok("/state")).scores).reduce((a, b) => a + b),
      400,
    );
    clock = Date.parse("2026-12-17T10:00:00+08:00");
    adminCookie = (await request("/auth/login", "POST", { username: "organizer", password }))
      .cookie;
    employeeCookie = (await request("/auth/login", "POST", { username: "person0", password }))
      .cookie;
    cookie = employeeCookie;
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "hunt", open: false });
    cookie = employeeCookie;
    assert.equal((await request("/gifts/spin", "POST", {})).status, 403);
    clock = Date.parse("2026-12-18T16:01:00+08:00");
    adminCookie = (await request("/auth/login", "POST", { username: "organizer", password }))
      .cookie;
    employeeCookie = (await request("/auth/login", "POST", { username: "person0", password }))
      .cookie;
    cookie = employeeCookie;
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "leaderboard", open: true });
    cookie = employeeCookie;
    assert.equal((await ok("/leaderboard")).rows[0].total, 400);
    assert.equal((await request("/letters/" + letter.id)).status, 404);
    cookie = adminCookie;
    assert.equal((await request("/letters/" + letter.id)).status, 404);
    const recipient = one("SELECT username FROM users WHERE id=?", partner).username;
    cookie = (await request("/auth/login", "POST", { username: recipient, password })).cookie;
    assert.equal((await ok("/letters/" + letter.id)).message, "A very private first letter");
    const cross = await fetch(base + "/api/auth/logout", {
      method: "POST",
      headers: { cookie, "X-Requested-With": "Dogdlol", Origin: "https://evil.example" },
    });
    assert.equal(cross.status, 403);
    const recipientCookie = cookie;
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "leaderboard", open: false });
    cookie = recipientCookie;
    assert.equal((await request("/letters/" + letter.id)).status, 403);
    assert.equal((await request("/leaderboard")).status, 403);
    assert.equal((await request("/admin/tasks", "PUT", { task: "hunt", open: true })).status, 403);
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "hunt", open: true });
    cookie = employeeCookie;
    assert.equal((await ok("/state")).access.find((a) => a.task === "hunt").open, true);
    // Friday calendar time does not prevent a manual Monday re-opening.
    await ok("/gifts/spin", "POST", {});
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "hunt", open: false });
    cookie = employeeCookie;
    assert.equal((await request("/gifts/spin", "POST", {})).status, 403);
    cookie = adminCookie;
    await ok("/admin/tasks", "PUT", { task: "leaderboard", open: true });
    cookie = recipientCookie;
    assert.equal((await ok("/letters/" + letter.id)).message, "A very private first letter");
    await ok("/auth/logout", "POST", {});
    assert.equal((await request("/state")).status, 401);
  } finally {
    await new Promise((r) => {
      app.server.close(r);
      app.server.closeAllConnections();
    });
    app.store.db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('existing ten-person assignments migrate to five without deleting answers',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'dogdlol-migration-'));
  let app=createApp({dataDir:dir});
  try{
    const s=app.store;
    for(let i=0;i<11;i++)s.run("INSERT INTO users(id,username,name,role,password) VALUES(?,?,?,'employee','unused')",'u'+i,'u'+i,'Name '+i);
    s.db.exec('ALTER TABLE mystery DROP COLUMN active; PRAGMA user_version=3');
    for(let i=0;i<10;i++)s.run('INSERT INTO mystery(id,player,target,position,chosen,correct) VALUES(?,?,?,?,?,?)','q'+i,'u0','u'+(i+1),i,i>=8?'u'+(i+1):null,i>=8?1:null);
    s.db.close();app=createApp({dataDir:dir});
    assert.equal(app.store.all('SELECT * FROM mystery').length,10);
    assert.equal(app.store.all('SELECT * FROM mystery WHERE active=1').length,5);
    assert.equal(app.store.one('SELECT COUNT(*) AS n FROM mystery WHERE active=1 AND chosen IS NOT NULL').n,2);
    assert.equal(app.score('u0').mystery,40);
  }finally{app.store.db.close();rmSync(dir,{recursive:true,force:true});}
});
