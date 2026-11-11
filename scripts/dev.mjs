import { spawn } from "node:child_process";
const jobs = [
  spawn(process.execPath, ["--watch", "server/index.mjs"], {
    stdio: "inherit",
    env: { ...process.env, PORT: process.env.API_PORT || "3001" },
  }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], { stdio: "inherit" }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const j of jobs) j.kill("SIGTERM");
  process.exitCode = code;
}
for (const j of jobs) {
  j.on("error", () => stop(1));
  j.on("exit", (code) => stop(code || 0));
}
for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => stop());
