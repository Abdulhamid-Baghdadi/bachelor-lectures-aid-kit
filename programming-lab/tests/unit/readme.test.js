// Every picture the README shows is in the repository and has alt text (WCAG 1.1.1), and the animation stays under
// 5 seconds (WCAG 2.2.2) by its frame count at the recording's 10 frames per second.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
const readme = readFileSync(new URL("README.md", ROOT), "utf8");

test("every README image exists and has alt text", () => {
  const imgs = [...readme.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  assert.ok(imgs.length >= 3);
  for (const img of imgs) {
    const src = img.match(/src="([^"]+)"/)[1];
    assert.ok(existsSync(new URL(src, ROOT)), `${src} is not there`);
    assert.match(img, /alt="[^"]{20,}"/, `${src} needs alt text that says what it shows`);
  }
  for (const [, src] of readme.matchAll(/srcset="([^"]+)"/g)) assert.ok(existsSync(new URL(src, ROOT)), `${src} is not there`);
});

test("the animations play once and stop within 5 seconds", () => {
  for (const name of ["docs/sorting-light.gif", "docs/sorting-dark.gif"]) {
    const gif = readFileSync(new URL(name, ROOT));
    // Each frame starts with a graphic control extension (21 F9 04); its delay is in hundredths of a second.
    let total = 0, loops = false;
    for (let i = 0; i < gif.length - 6; i++) {
      if (gif[i] === 0x21 && gif[i + 1] === 0xf9 && gif[i + 2] === 0x04) total += gif[i + 4] | (gif[i + 5] << 8);
      if (gif[i] === 0x21 && gif[i + 1] === 0xff && gif.toString("latin1", i + 3, i + 14) === "NETSCAPE2.0") loops = true;
    }
    assert.ok(total > 0 && total <= 500, `${name} runs ${total / 100} s`);
    assert.equal(loops, false, `${name} must play once: no NETSCAPE loop block`);
  }
});
