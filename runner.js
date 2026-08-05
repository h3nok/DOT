const { spawn } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

// Starts the two processes that make up DOT: the FastAPI orchestrator (the only
// backend, ADR-0009) and the Vite frontend.

function runCommand(cmd, args, options = {}) {
  const proc = spawn(cmd, args, { stdio: "inherit", shell: true, ...options });
  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`Process ${cmd} exited with code ${code}`);
    }
  });
  return proc;
}

const ORCHESTRATOR_DIR = path.join(__dirname, "backend", "orchestrator");
const FRONTEND_DIR = path.join(__dirname, "frontend");

function installBackendDeps() {
  if (existsSync(path.join(ORCHESTRATOR_DIR, "requirements.txt"))) {
    console.log("Installing orchestrator dependencies...");
    return runCommand(
      "python3",
      ["-m", "pip", "install", "-r", "requirements.txt"],
      {
        cwd: ORCHESTRATOR_DIR,
      },
    );
  }
}

function installFrontendDeps() {
  if (existsSync(path.join(FRONTEND_DIR, "package.json"))) {
    console.log("Installing frontend dependencies...");
    return runCommand("pnpm", ["install"], { cwd: FRONTEND_DIR });
  }
}

function startBackend() {
  console.log("Starting orchestrator (FastAPI) on :8000...");
  return runCommand(
    "python3",
    ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
    { cwd: ORCHESTRATOR_DIR },
  );
}

function startFrontend() {
  console.log("Starting frontend (Vite)...");
  return runCommand("pnpm", ["run", "dev"], { cwd: FRONTEND_DIR });
}

async function main() {
  installBackendDeps();
  installFrontendDeps();

  startBackend();
  startFrontend();
}

main();
