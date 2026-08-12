# @tawf/verify-landing

Marketing landing page for `tawf-verify`. Built to the Tawf Islamic Foundation design system,
not a one-off look: same color tokens, font pairing, spacing scale, and component patterns as
[`tawf-foundation`](https://tawf.foundation) and its own written spec in
`tawf-did/DESIGN_GUIDELINES.md`, so this page reads as one ecosystem rather than a disconnected
product site.

- **Stack:** Vite + React 19 + Tailwind CSS v4 (`@theme` tokens) + `motion` + `lucide-react`,
  matching `tawf-foundation`'s stack exactly.
- **Tokens:** `src/styles/index.css` copies `tawf-green` / `tawf-gold` / `tawf-sand` / `tawf-ink`
  / `tawf-muted` and the Inter + Cormorant Garamond pairing verbatim. Do not introduce a second
  palette or font here.
- **Content:** every claim on this page traces back to `prd.md` at the repo root; nothing here
  should say something the spec does not already say.

## Develop

```bash
pnpm --filter @tawf/verify-landing dev
```

## Build

```bash
pnpm --filter @tawf/verify-landing build
```
