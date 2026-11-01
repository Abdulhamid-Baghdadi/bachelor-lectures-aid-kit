// Every source this project cites, "Author (Year)" or "(Author Year)", in its documents, pages, help and code, is in the
// design rules' bibliography (UA-SMARTLab/design-rules), whose check reads each citation's authors and year against
// it; .citation-ignore lists the guideline names and the research data it skips. Not to be confused with
// bin/check-citations.js, which links papers in a review's library.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CHECK = process.env.DESIGN_RULES_CHECK
  ?? join(homedir(), ".claude", "skills", "web-app-design", "scripts", "check_citations.py");

test("every source the project cites is in the design rules' bibliography", (t) => {
  if (!existsSync(CHECK)) {
    t.skip(`the design rules are not installed here (${CHECK}): run python install.py in the design-rules repository`);
    return;
  }
  const run = spawnSync("python", [CHECK, ROOT], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (run.error) {
    t.skip(`Python could not be started (${run.error.message}): install Python 3 to run the citation check`);
    return;
  }
  assert.equal(run.status, 0, run.stdout + run.stderr);
});
