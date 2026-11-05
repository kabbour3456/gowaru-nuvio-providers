import express from "express";
import fs from "node:fs";

const app = express();
const SECRET = process.env.RESOLVER_TOKEN;

const providers = fs.readdirSync("./src", { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== "utils")
  .map(d => d.name);

app.get("/ping", (_req, res) => res.send("ok"));

app.get("/stream", async (req, res) => {
if ((req.headers["x-token"] ?? req.query.token) !== SECRET) return res.status(401).end();
  const { tmdbId, type, season, episode } = req.query;

  const taches = providers.map(async (p) => {
    try {
      const m = await import(`./src/${p}/index.js?t=${Date.now()}`);
      return (await m.getStreams(tmdbId, type, season, episode)) ?? [];
    } catch { return []; }
  });

  const tous = (await Promise.allSettled(taches))
    .flatMap(r => r.status === "fulfilled" ? r.value : []);

  const vf = tous.filter(s => /vf|multi/i.test(s.language ?? ""));
  res.json({ streams: (vf.length ? vf : tous).slice(0, 8) });
});

app.listen(process.env.PORT ?? 3000);



















