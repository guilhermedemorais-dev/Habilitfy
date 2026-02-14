const { build: esbuild } = require("esbuild");
const { build: viteBuild } = require("vite");
const { rm, readFile } = require("fs/promises");
const { existsSync } = require("fs");

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-mysql-session",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "mysql2",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // Only delete client build output — preserve pre-built server bundle
  // (needed for Hostinger where esbuild native binary can't execute)
  await rm("dist/public", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  try {
    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });
  } catch (err) {
    // Hostinger shared hosting blocks native binaries (noexec).
    // Fall back to pre-built dist/index.cjs committed in the repo.
    if (existsSync("dist/index.cjs")) {
      console.log("⚠️  esbuild failed, using pre-built dist/index.cjs");
    } else {
      throw err;
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
