import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd();
const repositoryRoot = resolve(frontendRoot, "..");
const frontend: { packageManager: string } = JSON.parse(
  readFileSync(resolve(frontendRoot, "package.json"), "utf8"),
);
const root: { packageManager: string; dependencies: { pnpm: string } } = JSON.parse(
  readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
);
const lock: {
  packages: Record<string, { version?: string; dependencies?: { pnpm: string } }>;
} = JSON.parse(readFileSync(resolve(repositoryRoot, "package-lock.json"), "utf8"));
const version = frontend.packageManager.split("@")[1].split("+")[0];

describe("package-manager selection", () => {
  it("pins the same verified pnpm release at the repository root and frontend", () => {
    expect(root.packageManager).toBe(frontend.packageManager);
  });

  it("keeps the npm-run pnpm binary and its lockfile aligned with Corepack", () => {
    expect(root.dependencies.pnpm).toBe(version);
    expect(lock.packages[""].dependencies?.pnpm).toBe(version);
    expect(lock.packages["node_modules/pnpm"].version).toBe(version);
  });

  it.each([
    { name: "repository root", cwd: repositoryRoot, args: ["--version"] },
    { name: "root with --dir frontend", cwd: repositoryRoot, args: ["--dir", "frontend", "--version"] },
    { name: "frontend", cwd: frontendRoot, args: ["--version"] },
  ])("uses the pinned version from $name", ({ cwd, args }) => {
    const result = spawnSync("pnpm", args, {
      cwd,
      encoding: "utf8",
      timeout: 30_000,
    });
    if (result.error) throw result.error;
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(version);
  });
});
