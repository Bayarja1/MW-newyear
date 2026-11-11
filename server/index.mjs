import { createApp } from "./app.mjs";
const port = Number(process.env.PORT || 3001);
if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN)
  throw new Error("APP_ORIGIN is required in production");
const { server, store } = createApp();
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Ид шидийн өртөө: http://${process.env.HOST || "127.0.0.1"}:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => {
      store.db.close();
      process.exit(0);
    });
    server.closeIdleConnections();
  });
