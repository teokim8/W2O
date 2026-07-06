/* Full-range coverage check. Run: npx tsx scripts/verify.ts
   Asserts every temperature × condition yields >= 1 outfit for both catalogs. */
import { makeOutfits, MEN_CATALOG, WOMEN_CATALOG, type Flags, type Item } from "../src/engine";

const conds: Record<string, Flags> = {
  sunny: { clear: true }, cloudy: {}, rainy: { rain: true }, snowy: { snow: true },
};

function verifyCatalog(catalog: Item[], label: string): boolean {
  const zeros: string[] = [];
  let min = { n: Infinity, at: "" };
  for (let t = -35; t <= 45; t++) {
    for (const [name, f] of Object.entries(conds)) {
      const n = makeOutfits(t, f, catalog).out.length;
      if (n === 0) zeros.push(`${t}°/${name}`);
      if (n < min.n) min = { n, at: `${t}°/${name}` };
    }
  }
  console.log(`\n── ${label} ──`);
  console.log(`Checked 324 points (-35..45 × 4 conditions)`);
  console.log(`Empty points: ${zeros.length ? zeros.join(", ") : "none ✅"}`);
  console.log(`Sparsest: ${min.n} at ${min.at}`);
  return zeros.length === 0;
}

const menOk   = verifyCatalog(MEN_CATALOG,   "Menswear");
const womenOk = verifyCatalog(WOMEN_CATALOG, "Womenswear");
if (!menOk || !womenOk) process.exitCode = 1;
