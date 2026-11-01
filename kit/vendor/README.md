# Vendored libraries

Copied in once, served from here; nothing is fetched from a CDN, so the labs work offline. Never edit these files:
replace them with a newer release and update this record.

| File | What | Version | Source | Licence |
|---|---|---|---|---|
| `temml.mjs` | Temml browser module (`dist/temml.mjs`): LaTeX to MathML | 0.14.0, released 8 Oct 2026 | npm, `https://registry.npmjs.org/temml/-/temml-0.14.0.tgz` | MIT, `temml.LICENSE` |
| `Temml-Local.css` | Temml's stylesheet for system math fonts (`dist/Temml-Local.css`) | 0.14.0 | same package | MIT |
| `Temml.woff2` | Script capitals for `\mathscr`, the only font the stylesheet names | 0.14.0 | same package | MIT |

Fetched 1 Nov 2026. The tarball's SHA-512 matched the registry's `dist.integrity`
(`sha512-tz1LW/5IZpThK8c7ZpdTSH/n56eAj+ThirLieErtKxYC3EKCIiB4sKdRUehAgH+fQmvIKqMfP3gqTLBdLpy9zw==`).
Upstream: https://github.com/ronkok/Temml. Only `../ui/math.js` imports Temml; why it is here: `../ARCHITECTURE.md`.
