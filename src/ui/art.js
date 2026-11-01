// Line art for the lab cards, after the style of the SMART Lab's Methodical card game (UA-SMARTLab/methodical-card-game,
// tools/art.py): light lines on a dark art box of 200 × 150, white ink for the main figure, amber for what to look at,
// rose for harm or loss, sky blue for a second quantity; strokes 3 for main lines and 2 for detail, round ends; one
// idea per picture, 10 units clear of the edge. Each lab draws its own picture with these; they return SVG text.

export const INK = "#F8FAFC", DIM = "rgba(248,250,252,.38)", ACC = "#FCD34D", HOT = "#FB7185", COOL = "#7DD3FC";

const f = v => Number(v.toFixed(1));
const stroke = (c, w, dash) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ""}`;

export const line = (pts, c = INK, w = 3, dash) => `<polyline points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" ${stroke(c, w, dash)}/>`;
export const path = (d, c = INK, w = 3, dash) => `<path d="${d}" ${stroke(c, w, dash)}/>`;
export const rect = (x, y, w, h, c = INK, sw = 3, fill = "none") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="3" fill="${fill}" stroke="${c}" stroke-width="${sw}"/>`;
export const circle = (x, y, r, c = INK, sw = 3, fill = "none") => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${c}" stroke-width="${sw}"/>`;
export const text = (x, y, s, size = 16, c = INK, anchor = "middle") =>
  `<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${c}" text-anchor="${anchor}" font-weight="700" font-family="'Arial Narrow', 'Roboto Condensed', sans-serif">${s}</text>`;
export function arrow(x1, y1, x2, y2, c = INK, w = 3, head = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = s => [x2 - head * Math.cos(a + s), y2 - head * Math.sin(a + s)];
  return line([[x1, y1], [x2 - head * 0.7 * Math.cos(a), y2 - head * 0.7 * Math.sin(a)]], c, w) +
    `<polygon points="${[p(-0.45), [x2, y2], p(0.45)].map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
}
/** A resistor (IEC rectangle) centred at x, y, horizontal or vertical. */
export const resistor = (x, y, vertical = false, c = INK) => vertical ? rect(x - 7, y - 16, 14, 32, c) : rect(x - 16, y - 7, 32, 14, c);
/** A DC source, vertical, centred at x, y: long plate on top is +. */
export const cell = (x, y, c = INK) => line([[x - 14, y - 5], [x + 14, y - 5]], c, 3) + line([[x - 7, y + 5], [x + 7, y + 5]], c, 5);

/** The whole picture, ready to put on a card; the label is read out by screen readers. */
export const picture = (label, body) =>
  `<svg viewBox="0 0 200 150" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="150" fill="#0F172A"/>${body}</svg>`;
