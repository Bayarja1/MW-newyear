import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

export function openDatabase(directory) {
  const dir = resolve(directory);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const keyFile = resolve(dir, "letters.key");
  const dbFile = resolve(dir, "dogdlol.sqlite");
  // Never silently replace the key of an existing database.
  if (!existsSync(keyFile) && existsSync(dbFile))
    throw new Error("letters.key missing: restore it from your backup.");
  if (!existsSync(keyFile)) writeFileSync(keyFile, randomBytes(32), { mode: 0o600, flag: "wx" });
  const key = readFileSync(keyFile);
  if (key.length !== 32) throw new Error("Invalid letters.key");
  const db = new DatabaseSync(dbFile);
  chmodSync(dbFile, 0o600);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;`);
  if (db.prepare("PRAGMA user_version").get().user_version === 0) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT '', role TEXT NOT NULL CHECK(role IN ('admin','employee')),
        password TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, facts TEXT NOT NULL DEFAULT '[]');
      CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
      CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), start_date TEXT NOT NULL DEFAULT '',
        opening_time TEXT NOT NULL DEFAULT '09:00', friday_time TEXT NOT NULL DEFAULT '16:00', prepared INTEGER NOT NULL DEFAULT 0,
        released INTEGER NOT NULL DEFAULT 0);
      INSERT INTO settings(id) VALUES(1);
      CREATE TABLE mystery (id TEXT PRIMARY KEY, player TEXT NOT NULL REFERENCES users(id), target TEXT NOT NULL REFERENCES users(id),
        position INTEGER NOT NULL, chosen TEXT REFERENCES users(id), correct INTEGER, UNIQUE(player,target), UNIQUE(player,position));
      CREATE TABLE partners (sender TEXT PRIMARY KEY REFERENCES users(id), recipient TEXT NOT NULL UNIQUE REFERENCES users(id));
      CREATE TABLE letters (id TEXT PRIMARY KEY, sender TEXT NOT NULL REFERENCES users(id), recipient TEXT NOT NULL REFERENCES users(id),
        body TEXT NOT NULL, created INTEGER NOT NULL, UNIQUE(sender,recipient), CHECK(sender<>recipient));
      CREATE TABLE drafts (sender TEXT PRIMARY KEY REFERENCES users(id), body TEXT NOT NULL, recipient TEXT NOT NULL DEFAULT '');
      CREATE TABLE gifts (id TEXT PRIMARY KEY, label TEXT NOT NULL, clue TEXT NOT NULL, second_clue TEXT NOT NULL,
        assigned TEXT UNIQUE REFERENCES users(id), status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','clue','pending','approved','retry')),
        photo BLOB, mime TEXT, note TEXT NOT NULL DEFAULT '');
      CREATE TABLE questions (id TEXT PRIMARY KEY, question TEXT NOT NULL, answers TEXT NOT NULL, correct INTEGER NOT NULL CHECK(correct BETWEEN 0 AND 3),
        explanation TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('newyear','company')), seconds INTEGER NOT NULL CHECK(seconds BETWEEN 10 AND 120), position INTEGER NOT NULL);
      CREATE TABLE quiz (id INTEGER PRIMARY KEY CHECK(id=1), stage TEXT NOT NULL DEFAULT 'lobby' CHECK(stage IN ('lobby','question','reveal','final')),
        position INTEGER NOT NULL DEFAULT 0, deadline INTEGER NOT NULL DEFAULT 0, question_ids TEXT NOT NULL DEFAULT '[]');
      INSERT INTO quiz(id) VALUES(1);
      CREATE TABLE quiz_players (user_id TEXT PRIMARY KEY REFERENCES users(id), seen INTEGER NOT NULL);
      CREATE TABLE quiz_answers (user_id TEXT NOT NULL REFERENCES users(id), question_id TEXT NOT NULL REFERENCES questions(id),
        choice INTEGER NOT NULL, correct INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(user_id,question_id));
      PRAGMA user_version=1; COMMIT;`);
  }
  if (db.prepare("PRAGMA user_version").get().user_version < 2) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE day_controls (day INTEGER PRIMARY KEY CHECK(day BETWEEN 0 AND 4), mode TEXT NOT NULL DEFAULT 'auto' CHECK(mode IN ('auto','open','closed')));
      INSERT INTO day_controls(day) VALUES(0),(1),(2),(3),(4);
      PRAGMA user_version=2; COMMIT;`);
  }
  if (db.prepare("PRAGMA user_version").get().user_version < 3) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE task_controls (task TEXT PRIMARY KEY CHECK(task IN ('mystery','hunt','letters','quiz','leaderboard')), opened INTEGER NOT NULL DEFAULT 0 CHECK(opened IN (0,1)));
      INSERT INTO task_controls SELECT 'mystery',mode='open' FROM day_controls WHERE day=0;
      INSERT INTO task_controls SELECT 'hunt',mode='open' FROM day_controls WHERE day=0;
      INSERT INTO task_controls SELECT 'letters',mode='open' FROM day_controls WHERE day=1;
      INSERT INTO task_controls SELECT 'quiz',mode='open' FROM day_controls WHERE day=2;
      INSERT INTO task_controls SELECT 'leaderboard',mode='open' FROM day_controls WHERE day=4;
      PRAGMA user_version=3; COMMIT;`);
  }
  const one = (sql, ...params) => db.prepare(sql).get(...params);
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const run = (sql, ...params) => db.prepare(sql).run(...params);
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  function encrypt(text) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
  }
  function decrypt(text) {
    const bytes = Buffer.from(text, "base64");
    const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8");
  }
  return { db, one, all, run, transaction, encrypt, decrypt };
}
