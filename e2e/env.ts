import fs from "fs";
import path from "path";

export const loadEnvFile = (filePath?: string) => {
  const envPath = filePath || path.resolve(process.cwd(), ".env");
  const env: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    return env;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [key, ...rest] = line.split("=");
    if (!key) continue;
    const value = rest.join("=").trim();
    env[key.trim()] = value.replace(/^["']|["']$/g, "");
  }

  return env;
};
