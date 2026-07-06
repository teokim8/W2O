import { makeOutfits, MEN_CATALOG, WOMEN_CATALOG, type Flags, type Item } from "../src/engine";
import { writeFileSync } from "fs";
import { resolve } from "path";

const conds: [string, Flags][] = [
  ["Sunny",  { clear: true }],
  ["Cloudy", {}],
  ["Rainy",  { rain: true }],
  ["Snowy",  { snow: true }],
];

// ─── 1. Full comparison table ────────────────────────────────────────────────
console.log("\n━━━ OUTFIT COUNT : Menswear (M) vs Womenswear (W) ━━━");
console.log("Temp  │ Sunny M/W  │ Cloudy M/W │ Rainy M/W  │ Snowy M/W  │");
console.log("──────┼────────────┼────────────┼────────────┼────────────┤");

const gapRows: string[] = [];

for (let t = -35; t <= 45; t++) {
  const cells: string[] = [`${String(t).padStart(4)}°C`];
  let rowHasGap = false;
  for (const [, f] of conds) {
    const m = makeOutfits(t, f, MEN_CATALOG).out.length;
    const w = makeOutfits(t, f, WOMEN_CATALOG).out.length;
    const diff = w - m;
    const tag = diff !== 0 ? `(${diff > 0 ? "+" : ""}${diff})` : "   ";
    cells.push(`${String(m).padStart(3)}/${String(w).padStart(3)} ${tag}`);
    if (diff !== 0) rowHasGap = true;
  }
  if (rowHasGap) gapRows.push(`${t}°C`);
  if (t % 5 === 0 || rowHasGap) console.log(cells.join(" │ ") + " │");
}

console.log("──────┴────────────┴────────────┴────────────┴────────────┘");
if (gapRows.length === 0)
  console.log("\n✅  All 324 points match perfectly — no gaps in Womenswear.\n");
else
  console.log(`\n⚠  Differences at: ${gapRows.join(", ")}\n`);

// ─── 2. Sparsest points (bottom 12) ─────────────────────────────────────────
console.log("━━━ SPARSEST POINTS — Womenswear (lowest outfit count) ━━━");
const sparse: { t: number; cond: string; n: number }[] = [];
for (let t = -35; t <= 45; t++)
  for (const [name, f] of conds)
    sparse.push({ t, cond: name, n: makeOutfits(t, f, WOMEN_CATALOG).out.length });
sparse.sort((a, b) => a.n - b.n);
for (const { t, cond, n } of sparse.slice(0, 12))
  console.log(`  ${String(t).padStart(4)}°C / ${cond.padEnd(6)} → ${n} outfits`);

// ─── 3. Generate CSV ─────────────────────────────────────────────────────────
const MEN_EQUIV: Record<string, string> = {
  wbn_1:"Beanie",       wmf_1:"Muffler",        wgl_1:"Gloves",
  wba_1:"Balaclava",    wsc_1:"Scarf",           wsg_1:"Sunglasses",
  wcp_1:"Cap",          wbh_1:"Bucket Hat",      wum_1:"Umbrella",
  wso_1:"Overshirt",    whs_1:"Hardshell",       wdj_1:"Denim Jacket",
  wpv_1:"Puffer Vest",  wtc_1:"Trench Coat",     wld_1:"Light Down",
  wlj_1:"Leather Jacket", wbj_1:"Baseball Jacket",
  wwc_1:"Wool Coat",    whd_1:"Down Parka",
  wtk_1:"Tank Top",     wli_1:"Linen Shirt",     wts_1:"Basic Tee",
  wpl_1:"Polo Shirt",   wls_1:"Long Sleeve",     wbu_1:"Casual Shirt",
  wsw_1:"Sweatshirt",   wcd_1:"Cardigan",        whz_1:"Hoodie",
  wkn_1:"Knit Sweater", wfl_1:"Fleece",          wtt_1:"Turtleneck",
  whk_1:"Heavy Knit",
  wss_1:"Sport Shorts", wsh_1:"Shorts",          wln_1:"Linen Pants",
  wsl_1:"Slacks",       wjn_1:"Jeans",           wco_1:"Corduroy",
  wsp_1:"Sweatpants",   wle_1:"Fleece Leggings", wwl_1:"Wool Trousers",
  wdp_1:"Down Pants",
  wsd_1:"Sandals",      wsn_1:"Sneakers",        wlf_1:"Loafers",
  wcb_1:"Chelsea Boots",wlb_1:"Leather Boots",   wwt_1:"Winter Boots",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const SLOT_ORDER = ["accessory","outer","top","bottom","footwear"] as const;

const csvRows: string[] = [
  "Category,Item Name (Women),Warmth Score,Min Temp (°C),Max Temp (°C),Men's Equivalent,Name Changed?"
];
for (const slot of SLOT_ORDER) {
  for (const item of WOMEN_CATALOG.filter(i => i.slot === slot)) {
    const equiv = MEN_EQUIV[item.id] ?? "";
    const changed = item.name.toUpperCase() !== equiv.toUpperCase() ? "Yes" : "";
    const lo = item.lo === -99 ? "no lower bound" : String(item.lo);
    csvRows.push([
      cap(slot),
      cap(item.name),
      item.warmth,
      lo,
      item.hi,
      equiv,
      changed
    ].join(","));
  }
}

const csvPath = resolve(__dirname, "../women-catalog.csv");
writeFileSync(csvPath, "﻿" + csvRows.join("\n"), "utf8"); // BOM for Excel
console.log(`\n📄  Saved: women-catalog.csv (${csvRows.length - 1} items)\n`);
