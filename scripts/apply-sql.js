import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const mode = process.argv[2] || "--all";
const files = {
  database: "db/sql/000_create_database.sql",
  schema: "db/sql/001_create_schema.sql",
  seed: "db/sql/002_seed_dev.sql",
};

async function runFile(file, config) {
  const sql = await fs.readFile(path.join(root, file), "utf8");
  const connection = await mysql.createConnection({ ...config, multipleStatements: true });
  try {
    await connection.query(sql);
    console.log(`OK ${file}`);
  } finally {
    await connection.end();
  }
}

const base = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3307),
};

const appConfig = {
  ...base,
  user: process.env.DB_USER || "app_user",
  password: process.env.DB_PASSWORD || "",
};

const adminConfig = {
  ...base,
  user: process.env.DB_ADMIN_USER || process.env.DB_USER || "root",
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? "",
};

if (!base.host) {
  console.error("Defina DB_HOST no .env antes de executar npm run db:apply.");
  process.exit(1);
}

try {
  if (mode === "--all" || mode === "--database") {
    await runFile(files.database, adminConfig);
  }
} catch (error) {
  console.warn(`AVISO ${files.database} falhou: ${error.message}`);
  console.warn("Continuando com 001/002. Se o banco e o app_user ja existem, isso e esperado.");
}

if (mode === "--all" || mode === "--schema") {
  await runFile(files.schema, appConfig);
}

if (mode === "--all" || mode === "--seed") {
  await runFile(files.seed, { ...appConfig, database: process.env.DB_NAME || "fleet_control" });
}
