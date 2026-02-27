import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const DUMP_PATH = path.resolve(process.cwd(), "migrations", "production_full_dump.sql");

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
};

const parseDumpSchema = (dumpSql: string) => {
  const tableMap = new Map<string, Set<string>>();
  const createTableRegex = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;

  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(dumpSql))) {
    const tableName = match[1];
    const body = match[2];
    const columns = new Set<string>();

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("`")) continue;
      const columnMatch = /^`([^`]+)`\s+/.exec(trimmed);
      if (columnMatch) columns.add(columnMatch[1]);
    }

    tableMap.set(tableName, columns);
  }

  return tableMap;
};

const resolveDbConfig = () => {
  const databaseUrl = readEnv("DATABASE_URL");
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
    };
  }

  const host = readEnv("DB_HOST");
  const user = readEnv("DB_USER");
  const database = readEnv("DB_NAME");
  if (!host || !user || !database) {
    throw new Error(
      "Missing DB config. Set DATABASE_URL or DB_HOST/DB_USER/DB_NAME (and password/port when required).",
    );
  }

  return {
    host,
    port: Number(readEnv("DB_PORT") || "3306"),
    user,
    password: readEnv("DB_PASSWORD") || "",
    database,
  };
};

const main = async () => {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`Dump file not found: ${DUMP_PATH}`);
  }

  const dumpSql = fs.readFileSync(DUMP_PATH, "utf8");
  const dumpSchema = parseDumpSchema(dumpSql);
  const config = resolveDbConfig();

  const connection = await mysql.createConnection(config);
  try {
    const [rows] = await connection.query<
      Array<{ table_name: string; column_name: string }>
    >(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = ?
       ORDER BY table_name, ordinal_position`,
      [config.database],
    );

    const dbSchema = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!dbSchema.has(row.table_name)) dbSchema.set(row.table_name, new Set());
      dbSchema.get(row.table_name)!.add(row.column_name);
    }

    const issues: string[] = [];

    for (const [tableName, dumpColumns] of dumpSchema.entries()) {
      const dbColumns = dbSchema.get(tableName);
      if (!dbColumns) {
        issues.push(`- Table missing in DB: ${tableName}`);
        continue;
      }

      for (const column of dumpColumns) {
        if (!dbColumns.has(column)) {
          issues.push(`- Column missing in DB: ${tableName}.${column}`);
        }
      }
    }

    for (const [tableName, dbColumns] of dbSchema.entries()) {
      const dumpColumns = dumpSchema.get(tableName);
      if (!dumpColumns) {
        issues.push(`- Table missing in dump: ${tableName}`);
        continue;
      }

      for (const column of dbColumns) {
        if (!dumpColumns.has(column)) {
          issues.push(`- Column missing in dump: ${tableName}.${column}`);
        }
      }
    }

    console.log(`# Schema parity audit`);
    console.log(`- Database: ${config.database}`);
    console.log(`- Dump: ${path.relative(process.cwd(), DUMP_PATH)}`);
    console.log(`- Tables in dump: ${dumpSchema.size}`);
    console.log(`- Tables in DB: ${dbSchema.size}`);

    if (issues.length === 0) {
      console.log("\nStatus: PASS (no schema drift detected)");
      process.exit(0);
    }

    console.log("\nStatus: FAIL (schema drift detected)");
    for (const issue of issues) {
      console.log(issue);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error("Schema parity audit failed:", error.message || error);
  process.exit(1);
});
