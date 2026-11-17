# Hero metal CTA implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the hero's "Try For Free" button in a metal-fx ring, switchable between gold, silver and chromatic for comparison.

**Architecture:** `MetalRing` loads metal-fx in an effect and renders its child bare until the module arrives. Theme comes from next-themes and pause from `useReducedMotionSafe`. The hero reads a temporary `?cta=` parameter on mount to choose the tone.

**Tech stack:** Next 16, React 19, metal-fx 2.0.11, next-themes, Vitest with jsdom and Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-17-hero-metal-cta-design.md`

## Global constraints

- Button stays `variant="default" size="default"`. No edits to `components/ui/`.
- Label is exactly `Try For Free`. Href `/dashboard`. Event `dashboard_cta_clicked` with `{ location: 'hero_section' }`.
- Tones are `'gold' | 'silver' | 'chromatic'`, default `'gold'`.
- No hex values or palette colours in components.

## Review focus

- No WebGL2, which includes jsdom. Expect the plain button to render and stay clickable. Covered in Task 1.
- An unknown `?cta=` value, like `?cta=blue`. Expect gold. Covered in Task 1.
- The site theme differs from the OS theme. Expect the ring to follow the site toggle. Checked in Task 2.
- Reduced motion. Expect a visible but still ring. Checked in Task 2.
- Layout shift when metal-fx mounts. Expect the button not to move. Checked in Task 2.

---

### Task 1: MetalRing wrapper and tone parsing

**Files:**
- Create: `components/motion/metal-ring.tsx`
- Modify: `components/motion/index.ts` (export)
- Test: `components/motion/metal-ring.test.tsx`

**Interfaces:**
- Produces: `type MetalTone = 'gold' | 'silver' | 'chromatic'`, `parseMetalTone(search: string): MetalTone`, `MetalRing({ tone, children }: { tone: MetalTone; children: React.ReactElement })`.

- [ ] **Step 1: Install** `npm install metal-fx@2.0.11`
- [ ] **Step 2: Write failing tests**
  - `parseMetalTone('?cta=silver')` returns `'silver'`, `parseMetalTone('?cta=chromatic')` returns `'chromatic'`, and `''`, `'?cta=blue'` and `'?x=1'` return `'gold'`.
  - `render(<MetalRing tone="gold"><a href="/dashboard">Try For Free</a></MetalRing>)` puts a link named "Try For Free" with href `/dashboard` in the document.
- [ ] **Step 3: Run** `npx vitest run components/motion/metal-ring.test.tsx`. Expect FAIL, module not found.
- [ ] **Step 4: Implement** `metal-ring.tsx` as a client component. Dynamic `import('metal-fx')` in `useEffect`, keeping the `MetalFx` component in state. Skip it if `isMetalFxSupported()` is false. Render `children` until it loads, then `<MetalFx variant="button" preset={tone} theme={resolvedTheme === 'dark' ? 'dark' : 'light'} paused={reduced}>`.
- [ ] **Step 5: Run** the same command. Expect PASS.
- [ ] **Step 6: Commit** "Add MetalRing wrapper for metal-fx"

### Task 2: Hero CTA

**Files:**
- Modify: `components/landing/hero.tsx:24-36`

**Interfaces:**
- Consumes: `MetalRing`, `parseMetalTone`, `MetalTone` from Task 1.

- [ ] **Step 1:** Add `tone` state, default `'gold'`, set from `parseMetalTone(window.location.search)` in an effect. Wrap the primary `Button` in `<MetalRing tone={tone}>`, change its label to `Try For Free`, and change the helper line to `No account needed.`
- [ ] **Step 2: Run** `npm run lint && npm run test && npm run build`. Expect all to pass.
- [ ] **Step 3: Browser check** with playwright-cli. Screenshot `/`, `/?cta=silver` and `/?cta=chromatic` in light and dark. Confirm the button box size and position match before and after metal-fx mounts. Confirm the site toggle changes the ring theme. Check one tone with reduced motion emulated.
- [ ] **Step 4: Commit** "Add metal ring to hero CTA with temporary tone switch"

### Task 3 (after the owner picks): remove the switch

- [ ] Hard-code the chosen tone in `hero.tsx`, delete the `?cta=` effect, and keep `parseMetalTone` only if something still uses it. Lint, test, commit.
