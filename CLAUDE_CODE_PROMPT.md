# Starter prompt for Claude Code

Copy the text below into Claude Code from inside the unzipped `w2o/` folder.

---

This is W2O, a finished, verified Vite + React + TypeScript prototype. The
recommendation engine, catalog, design system, and interactions are already
decided and validated — see **PRD.md**. Your job is to set it up and extend it,
**not to redesign or "simplify" it**.

Please:

1. Run `npm install` and `npm run dev`, confirm it builds and runs.
2. Read `PRD.md` fully, especially **§7 "Decisions to preserve"**. Do not change
   the warmth clamps (8 / 210), the single-item-per-slot / single-accessory
   rules, the `lo = −99` no-lower-bound convention, the rain/snow "exclude canvas
   only" footwear rule, or the dial's 30° (360-divisible) spacing without asking.
3. Keep `src/engine.ts` pure (no React/DOM) and the UI in `src/App.tsx`.
4. After any change to the catalog or formula, run `npx tsx scripts/verify.ts`
   and ensure all 324 points still yield ≥ 1 outfit.

Then I'll give you the next screens to build beyond the Default / Setting /
Location states.
