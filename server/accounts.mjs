import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { openDatabase } from "./database.mjs";
import { hashPassword } from "./app.mjs";

// RFC 4180-style CSV including quoted commas, escaped quotes and multiline cells.
export function parseCsv(input) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!cell || quoted) quoted = !quoted;
      else throw Error("CSV ишлэл буруу.");
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV ишлэл хаагдаагүй.");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
const quote = (s) => '"' + String(s).replaceAll('"', '""') + '"';
const dir = process.env.DATA_DIR || "./data";
const { db, one, run, transaction } = openDatabase(dir);
try {
  if (process.argv[2] === "import") {
    const source = process.argv[3],
      destination = process.argv[4];
    if (!source || !destination)
      throw Error("pnpm accounts:import employees.csv private-access.csv");
    const [headers, ...rows] = parseCsv(readFileSync(source, "utf8").replace(/^\uFEFF/, ""));
    if (!headers || !["name", "email"].every((h) => headers.includes(h)))
      throw Error("CSV толгой: name,email,department");
    if (one("SELECT prepared FROM settings WHERE id=1").prepared)
      throw Error("Тоглоом бэлтгэгдсэн тул шинэ ажилтан нэмэхгүй.");
    if (one("SELECT COUNT(*) AS n FROM partners").n)
      throw Error("Захианы оноолт үүссэн тул шинэ ажилтан нэмэхгүй.");
    const records = [];
    const usernames = new Set();
    for (const cells of rows) {
      const r = Object.fromEntries(headers.map((h, i) => [h, cells[i]?.trim() || ""]));
      const email = r.email.toLowerCase();
      if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email) || r.name.length < 2)
        throw Error("Нэр / имэйл буруу: " + r.name);
      if (usernames.has(email)) throw Error("Давхардсан имэйл: " + email);
      usernames.add(email);
      if (one("SELECT id FROM users WHERE username=?", email)) continue;
      const password = randomBytes(12).toString("base64url");
      records.push({
        id: randomUUID(),
        email,
        name: r.name,
        department: r.department || "—",
        password,
        hash: await hashPassword(password),
      });
    }
    if (one("SELECT COUNT(*) AS n FROM users WHERE role='employee'").n + records.length > 30)
      throw Error("Нийт ажилтан 30-аас их болохгүй.");
    // Write private delivery list before committing accounts. Never overwrite an existing list.
    const csv =
      "name,email,department,password\n" +
      records
        .map((r) => [r.name, r.email, r.department, r.password].map(quote).join(","))
        .join("\n") +
      "\n";
    writeFileSync(destination, csv, { mode: 0o600, flag: "wx" });
    chmodSync(destination, 0o600);
    transaction(() => {
      for (const r of records)
        run(
          "INSERT INTO users(id,username,name,department,role,password) VALUES(?,?,?,?,'employee',?)",
          r.id,
          r.email,
          r.name,
          r.department,
          r.hash,
        );
    });
    console.log(
      `${records.length} эрх үүсгэлээ. Нэвтрэх мэдээлэл зөвхөн таны заасан хувийн CSV-д хадгалагдлаа. Имэйл илгээгээгүй.`,
    );
  } else {
    if (one("SELECT id FROM users WHERE role='admin'")) throw Error("Админ аль хэдийн байна.");
    let muted = false;
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk);
        callback();
      },
    });
    const prompt = createInterface({ input: process.stdin, output, terminal: true });
    try {
      const username = (await prompt.question("Админы нэвтрэх нэр (латин): ")).trim().toLowerCase();
      const name = (await prompt.question("Админы нэр: ")).trim();
      process.stdout.write("Нууц үг (10+ тэмдэгт): ");
      muted = true;
      const password = await prompt.question("");
      muted = false;
      process.stdout.write("\n");
      if (
        !/^[a-z0-9._@-]{3,80}$/.test(username) ||
        name.length < 2 ||
        password.length < 10 ||
        password.length > 128
      )
        throw Error("Нэр эсвэл нууц үгийн шаардлага хангаагүй.");
      run(
        "INSERT INTO users(id,username,name,role,password) VALUES(?,?,?,'admin',?)",
        randomUUID(),
        username,
        name,
        await hashPassword(password),
      );
      console.log("Админ үүсгэлээ. Вебийн нэвтрэх цонхоор орно уу.");
    } finally {
      prompt.close();
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  db.close();
}
