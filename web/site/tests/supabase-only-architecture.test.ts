import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCAN_ROOTS = [
  "app",
  "components",
  "hooks",
  "lib",
  "models",
  "repositories",
  "scripts",
  "services",
  "tests",
  "types",
];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md"]);
const LEGACY_MONGO = /mongodb|mongoose|MongoClient|ObjectId|MONGODB_URI|MONGO_URI|GridFS|connectDB/i;

function collectFiles(path: string): string[] {
  const absolute = resolve(ROOT, path);
  const stat = statSync(absolute);
  if (stat.isFile()) return TEXT_EXTENSIONS.has(extname(absolute)) ? [absolute] : [];

  return readdirSync(absolute).flatMap((entry) => {
    if (["node_modules", ".next", "coverage"].includes(entry)) return [];
    return collectFiles(join(absolute, entry));
  });
}

function mongoOccurrences() {
  return SCAN_ROOTS.flatMap(collectFiles)
    .filter((path) => !path.endsWith("supabase-only-architecture.test.ts"))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return LEGACY_MONGO.test(source) ? [relative(ROOT, path)] : [];
    });
}

describe("Supabase-only Web architecture", () => {
  it("contains no legacy Mongo runtime, models, repositories, scripts, tests, or mocks", () => {
    expect(mongoOccurrences()).toEqual([]);
  });

  it("does not declare direct Mongo dependencies", () => {
    const packageJson = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
    expect(packageJson.dependencies?.mongodb).toBeUndefined();
    expect(packageJson.dependencies?.mongoose).toBeUndefined();
    expect(packageJson.devDependencies?.["mongodb-memory-server"]).toBeUndefined();
  });

  it("does not inject legacy Mongo configuration into Vitest", () => {
    const config = readFileSync(resolve(ROOT, "vitest.config.mjs"), "utf8");
    expect(config).not.toMatch(/MONGODB_URI|MONGO_URI/i);
  });
});
