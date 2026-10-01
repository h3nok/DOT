import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const importerRoot = resolve(process.cwd(), "../scripts");

function releaseMath(raw: string): { body: string; equations: number } {
  const result = spawnSync("python3", ["-c", `
import json, sys
sys.path.insert(0, sys.argv[1])
from import_dot_book import SECTIONS, clean_markdown, display_equation_count
body = clean_markdown(json.load(sys.stdin), SECTIONS[0])
print(json.dumps({"body": body, "equations": display_equation_count(body)}))
`, importerRoot], {
    input: JSON.stringify(raw),
    encoding: "utf8",
    timeout: 10_000,
  });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

describe("Word equation release across Pandoc writers", () => {
  it.each([
    { name: "fenced math", math: "``` math\nx + y = z\n```" },
    { name: "single-line display math", math: "$$x + y = z$$" },
    { name: "separate display delimiters", math: "$$\nx + y = z\n$$" },
    {
      name: "multiline TeX with attached display delimiters",
      math: "$$\\begin{array}{r}\nx + y = z \\\\\n\\text{directional hypothesis}\n\\end{array}$$",
    },
  ])("preserves and counts $name", ({ math }) => {
    const released = releaseMath(`Before the equation.\n\n${math}\n\nAfter the equation.`);
    const tex = math.startsWith("``` math")
      ? math.slice("``` math\n".length, -"\n```".length)
      : math.slice(2, -2).trim();
    expect(released.body).toBe(`Before the equation.\n\n$$\n${tex}\n$$\n\nAfter the equation.\n`);
    expect(released.equations).toBe(1);
  });

  it("keeps neighbouring display equations separate", () => {
    const released = releaseMath("$$x = 1$$\n\n$$\\begin{array}{r}\ny = 2\n\\end{array}$$");
    expect(released.equations).toBe(2);
    expect(released.body).toBe("$$\nx = 1\n$$\n\n$$\n\\begin{array}{r}\ny = 2\n\\end{array}\n$$\n");
  });
});
