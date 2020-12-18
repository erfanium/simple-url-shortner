import fs from "fs";
import path from "path";
import fastify from "fastify";
import Database from "better-sqlite3";
import { prepareDatabase } from "./src/prepareDatabase.js";
import randomString from "crypto-random-string";

const dbDir = process.env.DB_DIR || '.';
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const PORT = process.env.PORT || 3030;

const app = fastify({ logger: false });
const db = new Database(path.join(dbDir, "app.db"));
prepareDatabase(db);

// COUNT LINKS
const count = db.prepare("SELECT COUNT(id) FROM links");
app.get("/count", () => count.get()["COUNT(id)"]);

/// GET
const getById = db.prepare("SELECT * FROM links WHERE id = ?");
app.get("/:id", (req, reply) => {
  const result = getById.get(req.params.id);
  if (!result) return reply.status(404).send();
  reply.redirect(301, result.url);
});

/// CREATE
const generate = () => randomString.async({ length: 6, type: "url-safe" });
const create = db.prepare("INSERT INTO links (id, url) VALUES (@id, @url)");

app.route({
  method: "POST",
  url: "/",
  schema: {
    body: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string" },
      },
    },
  },
  async handler(req) {
    const id = await generate();
    const params = { id, url: req.body.url };
    create.run(params);
    return params;
  },
});

app.addHook("onError", (request, reply, error, done) => {
  !error.statusCode || reply.statusCode >= 500
    ? console.error(error)
    : console.log(error);
  done();
});

app.listen(PORT, "0.0.0.0").then(() => console.log("On", PORT));
