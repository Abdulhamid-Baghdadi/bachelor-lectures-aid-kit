// This lab keeps the layers of its architecture.json, the kit (../kit) two of them, by the kit's architecture check
// (kit/scripts/check-architecture.js, whose own tests are kit/tests/architecture.test.js). Right result by definition:
// no finding.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { check } from "../../../kit/scripts/check-architecture.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

test("this lab keeps the layers of its architecture.json, the kit beneath it", () => {
  const { findings, uses } = check(ROOT);
  assert.deepEqual(findings.map(f => f.text), []);
  assert.ok(uses.some(u => u.target.startsWith("../kit/ui/")), "a lab draws with the shared kit");
  assert.ok(uses.some(u => u.target.startsWith("../kit/core/")), "the core uses the shared kit core");
});
