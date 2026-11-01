// The [7,4] Hamming code (Goiser 2016, set 6, slides 84–99): pick four data bits, flip any bit of the codeword on the
// way, and watch the syndrome name the bit to flip back. Buttons, so every bit is reachable by keyboard.
import { encode, decodeHamming, H } from "../core/index.js";
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const NAMES = ["I1", "I2", "I3", "I4", "P1", "P2", "P3"];

export default {
  id: "hamming",
  art: () => a.picture("Seven bit boxes, one flipped, and an arrow from the syndrome to it",
    Array.from({ length: 7 }, (_, k) => a.rect(14 + k * 25, 40, 22, 30, k === 4 ? a.HOT : k > 3 ? a.COOL : a.INK, 2)).join("") +
      a.rect(70, 105, 60, 30, a.ACC, 3) + a.arrow(115, 103, 125, 74, a.ACC, 2)),
  mount(root) {
    const d = [1, 0, 1, 1], flip = Array(7).fill(0);
    const dataRow = h("div", { class: "bits" }), wireRow = h("div", { class: "bits" }), out = h("div", { class: "decode" });
    // The buttons are made once and only relabelled, so a keyboard user's focus stays on the bit just pressed.
    const bitButton = (label, onClick) => {
      const value = h("span", { class: "bit-value" });
      const el = h("button", { type: "button", class: "bit", onclick: onClick }, h("span", { class: "bit-name" }, label), value);
      return { el, set(v, pressed, flipped = false) {
        value.textContent = String(v); el.setAttribute("aria-pressed", String(pressed)); el.setAttribute("aria-label", `${label}: ${v}`);
        el.classList.toggle("flipped", flipped);
      } };
    };
    const dataBits = d.map((_, k) => bitButton(NAMES[k], () => { d[k] ^= 1; update(); }));
    const wireBits = NAMES.map((name, k) => bitButton(name, () => { flip[k] ^= 1; update(); }));
    dataRow.append(...dataBits.map(b => b.el));
    wireRow.append(...wireBits.map(b => b.el));
    const update = () => {
      const c = encode(d), r = c.map((b, k) => b ^ flip[k]), res = decodeHamming(r), errors = flip.reduce((s, v) => s + v, 0);
      d.forEach((b, k) => dataBits[k].set(b, b === 1));
      r.forEach((b, k) => wireBits[k].set(b, flip[k] === 1, flip[k] === 1));
      const ok = res.d.every((b, k) => b === d[k]);
      out.replaceChildren(
        h("p", {}, `Sent codeword c = ${c.join("")}; received r = ${r.join("")}.`),
        h("p", {}, `Syndrome s = H r = ${res.s.join("")}: `, res.pos ? `column ${res.pos} of H, so flip ${NAMES[res.pos - 1]}.` : "zero, so r is taken as a codeword."),
        h("p", { class: "readout", role: "status", "data-tone": ok ? "" : "danger" },
          h("span", { class: "label" }, "Decoded data"), h("span", { class: "value" }, res.d.join("")),
          h("span", { class: "note" }, ok ? (errors ? `${errors} error corrected` : "no error") : `wrong: ${errors} errors are more than the code corrects`)),
        h("table", { class: "eqs" }, h("caption", {}, "Parity-check matrix H (slide 86); its columns are the syndromes"),
          h("tbody", {}, H.map(row => h("tr", {}, row.map((v, j) => h("td", { class: res.pos === j + 1 ? "hit" : "" }, String(v))))))));
    };
    root.append(h("div", { class: "stage" }, out, h("div", { class: "controls" },
      h("p", {}, "Data bits (press to change):"), dataRow,
      h("p", {}, "Received word (press a bit to flip it on the way):"), wireRow,
      h("p", { class: "hint" }, "Any two codewords differ in at least three bits (dmin = 3, slide 94), so one error is always corrected. Flip two bits: the syndrome points at a third, and the decoder makes things worse. The slides' example: r = 1001101 gives s = 100, bit 5 (slides 98–99)."))));
    update();
  },
};
