import fastify from "fastify";
import Database from "better-sqlite3";
import { prepareDatabase } from "./src/prepareDatabase.js";
import randomString from "crypto-random-string";

const PORT = process.env.PORT || 3030;
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) throw new Error("BASE_URL env-var is required");

const app = fastify();
const db = new Database("app.db");
prepareDatabase(db);

/// GET
const getById = db.prepare("SELECT * from links WHERE id = ?");
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
      url: { type: "string" },
    },
  },
  async handler(req) {
    const id = await generate();
    const params = { id, url: req.body.url };
    create.run(params);
    return params;
  },
});

app.listen(PORT, "0.0.0.0").then(() => console.log("On", PORT));
