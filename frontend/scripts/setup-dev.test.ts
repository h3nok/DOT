import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "../scripts/setup-dev.sh");

function runSetup(body: string, environment: Record<string, string> = {}) {
  const result = spawnSync(
    "bash",
    ["-c", 'source "$1"\n' + body, "test-setup", script],
    {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        INSTALL_GCLOUD: "0",
        SKIP_SYSTEM_PACKAGES: "0",
        ...environment,
      },
    },
  );
  if (result.error) throw result.error;
  return result;
}

const mockCommands = `
GCLOUD_INSTALLED=0
command_exists() {
  case "$1" in
    gcloud) [ "$GCLOUD_INSTALLED" = "1" ] ;;
    apt-get | brew) return 0 ;;
    *) return 1 ;;
  esac
}
gcloud() {
  [ "$*" = "--version" ] || fail "Unexpected cloud operation: $*"
  printf 'Google Cloud CLI test version\\n'
}
run_sudo() {
  printf '%s\\n' "$*" >&2
  case "$1" in
    gpg | tee) cat >/dev/null ;;
  esac
  if [ "$*" = "apt-get install -y google-cloud-cli" ]; then
    GCLOUD_INSTALLED=1
  fi
}
curl() {
  printf 'test signing key'
}
`;

describe("optional cloud setup", () => {
  it("can be sourced without starting setup or installing anything", () => {
    const result = runSetup("printf 'helpers only'");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("helpers only");
  });

  it("does not require or install cloud tools for normal local development", () => {
    const result = runSetup(`
      command_exists() { fail "Cloud tools should not be checked"; }
      ensure_gcloud
    `);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("checks an existing CLI without installing or authenticating", () => {
    const result = runSetup(
      `${mockCommands}
      GCLOUD_INSTALLED=1
      run_sudo() { fail "No install expected"; }
      ensure_gcloud`,
      { INSTALL_GCLOUD: "1" },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Google Cloud CLI test version");
    expect(result.stdout).toContain("Authenticate manually");
    expect(result.stderr).toBe("");
  });

  it("honors the no-system-installs flag instead of pretending setup succeeded", () => {
    const result = runSetup(`${mockCommands}\nensure_gcloud`, {
      INSTALL_GCLOUD: "1",
      SKIP_SYSTEM_PACKAGES: "1",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("gcloud is missing and SKIP_SYSTEM_PACKAGES=1");
    expect(result.stderr).not.toContain("apt-get");
  });

  it("installs from the signed Google apt repository on Debian/Ubuntu", () => {
    const result = runSetup(
      `${mockCommands}
      uname() { printf 'Linux'; }
      ensure_gcloud`,
      { INSTALL_GCLOUD: "1" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("gpg --dearmor --yes -o /usr/share/keyrings/cloud.google.gpg");
    expect(result.stderr).toContain("tee /etc/apt/sources.list.d/google-cloud-sdk.list");
    expect(result.stderr).toContain("apt-get install -y google-cloud-cli");
    expect(result.stdout).toContain("Google Cloud CLI test version");
  });

  it("uses the current Homebrew cask on macOS", () => {
    const result = runSetup(
      `${mockCommands}
      uname() { printf 'Darwin'; }
      load_homebrew() { :; }
      brew() {
        printf '%s\\n' "$*" >&2
        GCLOUD_INSTALLED=1
      }
      ensure_gcloud`,
      { INSTALL_GCLOUD: "1" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("install --cask gcloud-cli");
    expect(result.stderr).not.toContain("apt-get");
  });

  it("fails explicitly on unsupported package managers", () => {
    const result = runSetup(
      `${mockCommands}
      uname() { printf 'Linux'; }
      command_exists() { return 1; }
      ensure_gcloud`,
      { INSTALL_GCLOUD: "1" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("install the Google Cloud CLI manually");
  });

  it("reports a broken CLI rather than declaring it ready", () => {
    const result = runSetup(
      `${mockCommands}
      GCLOUD_INSTALLED=1
      gcloud() { return 1; }
      ensure_gcloud`,
      { INSTALL_GCLOUD: "1" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Google Cloud CLI is installed but could not run");
  });
});
