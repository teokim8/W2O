/* ============================================================
   W2O Engine — pure logic & types (no React, no DOM)
   The recommendation core. Keep this framework-agnostic so it
   can be reused on web, React Native, etc.
   ============================================================ */

export type Slot = "accessory" | "outer" | "top" | "bottom" | "footwear";
export type Condition = "clear" | "cloudy" | "rain" | "snow";

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  warmth: number; // warmth score (additive)
  lo: number;     // lowest valid apparent temp (°C). -99 == "no lower bound"
  hi: number;     // highest valid apparent temp (°C)
  kind?: "warm" | "deco" | "rain";
  material?: "cotton" | "synthetic" | "down" | "leather" | "wool" | "canvas";
  waterproof?: boolean;
}

export interface Outfit {
  items: Item[];
  sum: number; // total warmth
}

export interface Flags {
  clear?: boolean;
  rain?: boolean;
  snow?: boolean;
}

export type Gender = "men" | "women";

export interface City {
  name: string;
  lat: number;
  lon: number;
}

const I = (
  id: string, name: string, slot: Slot, warmth: number, lo: number, hi: number,
  opt: Partial<Item> = {}
): Item => ({ id, name, slot, warmth, lo, hi, ...opt });

/* ------------------------------------------------------------
   CATALOGS — verified for -35°C..45°C × 4 conditions.
   Both catalogs share identical warmth scores and temperature
   ranges so the engine logic works without modification.
   ------------------------------------------------------------ */
export const MEN_CATALOG: Item[] = [
  // accessory (9) — one per outfit, "none" allowed
  I("bn_1", "BEANIE", "accessory", 8, -40, 6, { kind: "warm" }),
  I("mf_1", "MUFFLER", "accessory", 10, -40, 6, { kind: "warm" }),
  I("gl_1", "GLOVES", "accessory", 6, -40, 0, { kind: "warm" }),
  I("ba_1", "BALACLAVA", "accessory", 12, -40, -2, { kind: "warm" }),
  I("sc_1", "SCARF", "accessory", 0, -40, 40, { kind: "deco" }),
  I("sg_1", "SUNGLASSES", "accessory", 0, -40, 40, { kind: "deco" }),
  I("cp_1", "CAP", "accessory", 0, -40, 40, { kind: "deco" }),
  I("bh_1", "BUCKET HAT", "accessory", 0, -40, 40, { kind: "deco" }),
  I("um_1", "UMBRELLA", "accessory", 0, -40, 40, { kind: "rain" }),
  // outer (10) — one per outfit, "none" allowed
  I("so_1", "OVERSHIRT", "outer", 18, 0, 20, { material: "cotton" }),
  I("hs_1", "HARDSHELL", "outer", 25, -5, 22, { material: "synthetic", waterproof: true }),
  I("dj_1", "DENIM JACKET", "outer", 26, 10, 20, { material: "cotton" }),
  I("pv_1", "PUFFER VEST", "outer", 32, -10, 14, { material: "synthetic" }),
  I("tc_1", "TRENCH COAT", "outer", 38, 0, 18, { material: "cotton" }),
  I("ld_1", "LIGHT DOWN", "outer", 45, -5, 12, { material: "down" }),
  I("lj_1", "LEATHER JACKET", "outer", 49, 0, 15, { material: "leather" }),
  I("bj_1", "BASEBALL JACKET", "outer", 49, 0, 15, { material: "synthetic" }),
  I("wc_1", "WOOL COAT", "outer", 56, -99, 8, { material: "wool" }),
  I("hd_1", "DOWN PARKA", "outer", 113, -99, 5, { material: "down", waterproof: true }),
  // top (13) — exactly one per outfit
  I("tk_1", "SLEEVELESS TEE", "top", 3, 22, 48),
  I("li_1", "LINEN SHIRT", "top", 5, 20, 46),
  I("ts_1", "BASIC TEE", "top", 6, 10, 46),
  I("pl_1", "POLO SHIRT", "top", 6, 10, 46),
  I("ls_1", "LONG SLEEVE", "top", 14, -99, 22),
  I("bu_1", "CASUAL SHIRT", "top", 17, -99, 25),
  I("sw_1", "SWEATSHIRT", "top", 23, -99, 22),
  I("cd_1", "CARDIGAN", "top", 23, -99, 20),
  I("hz_1", "HOODIE", "top", 24, -99, 22),
  I("kn_1", "KNIT SWEATER", "top", 28, -99, 18),
  I("fl_1", "FLEECE", "top", 30, -99, 15),
  I("tt_1", "TURTLENECK", "top", 34, -99, 12),
  I("hk_1", "HEAVY KNIT", "top", 41, -99, 10),
  // bottom (10) — exactly one per outfit
  I("ss_1", "SPORT SHORTS", "bottom", 3, 24, 48),
  I("sh_1", "SHORTS", "bottom", 5, 22, 46),
  I("ln_1", "LINEN PANTS", "bottom", 7, 20, 44),
  I("sl_1", "SLACKS", "bottom", 11, 10, 28),
  I("jn_1", "JEANS", "bottom", 14, 0, 25),
  I("co_1", "CORDUROY", "bottom", 17, 0, 20),
  I("sp_1", "SWEATPANTS", "bottom", 19, -5, 18),
  I("le_1", "FLEECE LEGGINGS", "bottom", 22, -99, 12),
  I("wl_1", "WOOL TROUSERS", "bottom", 26, -99, 10),
  I("dp_1", "DOWN PANTS", "bottom", 40, -99, 5),
  // footwear (6) — exactly one per outfit
  I("sd_1", "SANDALS", "footwear", 2, 24, 48),
  I("sn_1", "SNEAKERS", "footwear", 4, -99, 46),
  I("lf_1", "LOAFERS", "footwear", 4, -99, 35),
  I("cb_1", "CHELSEA BOOTS", "footwear", 6, -99, 18),
  I("lb_1", "LEATHER BOOTS", "footwear", 6, -99, 15, { material: "leather" }),
  I("wt_1", "WINTER BOOTS", "footwear", 10, -99, 5, { waterproof: true }),
];

// Backward-compatible alias — internal code uses MEN_CATALOG directly.
export const CATALOG = MEN_CATALOG;

export const WOMEN_CATALOG: Item[] = [
  // accessory (9) — gender-neutral; identical structure to men's
  I("wbn_1", "BEANIE",      "accessory",  8, -40,   6, { kind: "warm" }),
  I("wmf_1", "MUFFLER",     "accessory", 10, -40,   6, { kind: "warm" }),
  I("wgl_1", "GLOVES",      "accessory",  6, -40,   0, { kind: "warm" }),
  I("wba_1", "BALACLAVA",   "accessory", 12, -40,  -2, { kind: "warm" }),
  I("wsc_1", "SCARF",       "accessory",  0, -40,  40, { kind: "deco" }),
  I("wsg_1", "SUNGLASSES",  "accessory",  0, -40,  40, { kind: "deco" }),
  I("wcp_1", "CAP",         "accessory",  0, -40,  40, { kind: "deco" }),
  I("wbh_1", "BUCKET HAT",  "accessory",  0, -40,  40, { kind: "deco" }),
  I("wum_1", "UMBRELLA",    "accessory",  0, -40,  40, { kind: "rain" }),
  // outer (11)
  I("wso_1", "BLAZER",         "outer",  18,   0,  20, { material: "cotton" }),
  I("wov_1", "OVERSHIRT",      "outer",  22,   0,  22, { material: "cotton" }),
  I("whs_1", "HARDSHELL",      "outer",  25,  -5,  22, { material: "synthetic", waterproof: true }),
  I("wdj_1", "DENIM JACKET",   "outer",  26,  10,  20, { material: "cotton" }),
  I("wpv_1", "PUFFER VEST",    "outer",  32, -10,  14, { material: "synthetic" }),
  I("wtc_1", "TRENCH COAT",    "outer",  38,   0,  18, { material: "cotton" }),
  I("wld_1", "QUILTED JACKET", "outer",  45,  -5,  12, { material: "down" }),
  I("wlj_1", "LEATHER JACKET", "outer",  49,   0,  15, { material: "leather" }),
  I("wbj_1", "CROPPED BOMBER", "outer",  49,   0,  15, { material: "synthetic" }),
  I("wwc_1", "WOOL COAT",      "outer",  56, -99,   8, { material: "wool" }),
  I("whd_1", "DOWN PARKA",     "outer", 113, -99,   5, { material: "down", waterproof: true }),
  // top (16)
  I("wct_1", "CROP TOP",      "top",  2,  25, 48),
  I("wtk_1", "TANK TOP",      "top",  3,  22, 48),
  I("wli_1", "LINEN BLOUSE",  "top",  5,  20, 46),
  I("wts_1", "BASIC TEE",     "top",  6,  10, 46),
  I("wpl_1", "COTTON TOP",    "top",  6,  10, 46),
  I("wbs_1", "BODYSUIT",      "top",  6,  15, 40),
  I("wls_1", "LONG SLEEVE",   "top", 14, -99, 22),
  I("wbu_1", "CASUAL BLOUSE", "top", 17, -99, 25),
  I("wkv_1", "KNIT VEST",     "top", 17,   5, 25),
  I("wsw_1", "SWEATSHIRT",    "top", 23, -99, 22),
  I("wcd_1", "CARDIGAN",      "top", 23, -99, 20),
  I("whz_1", "HOODIE",        "top", 24, -99, 22),
  I("wkn_1", "KNIT SWEATER",  "top", 28, -99, 18),
  I("wfl_1", "FLEECE",        "top", 30, -99, 15),
  I("wtt_1", "TURTLENECK",    "top", 34, -99, 12),
  I("whk_1", "CHUNKY KNIT",   "top", 41, -99, 10),
  // bottom (15)
  I("wss_1", "SPORT SHORTS",   "bottom",  3,  24, 48),
  I("wsh_1", "SHORTS",         "bottom",  5,  22, 46),
  I("wms_1", "MINI SKIRT",     "bottom",  6,  20, 44),
  I("wln_1", "LINEN TROUSERS", "bottom",  7,  20, 44),
  I("wps_1", "PLEATED SKIRT",  "bottom",  9,  10, 35),
  I("wsl_1", "TAILORED PANTS", "bottom", 11,  10, 28),
  I("wxs_1", "MAXI SKIRT",     "bottom", 13,   5, 30),
  I("wwp_1", "WIDE LEG PANTS", "bottom", 13,   5, 28),
  I("wjn_1", "JEANS",          "bottom", 14,   0, 25),
  I("wlg_1", "LEGGINGS",       "bottom", 16,  -5, 28),
  I("wco_1", "MIDI SKIRT",     "bottom", 17,   0, 20),
  I("wsp_1", "JOGGERS",        "bottom", 19,  -5, 18),
  I("wle_1", "FLEECE LEGGINGS","bottom", 22, -99, 12),
  I("wwl_1", "WOOL SKIRT",     "bottom", 26, -99, 10),
  I("wdp_1", "DOWN PANTS",     "bottom", 40, -99,  5),
  // footwear (10)
  I("wsd_1", "SANDALS",        "footwear",  2,  24, 48),
  I("wmu_1", "MULES",          "footwear",  3,  18, 42),
  I("wbf_1", "BALLET FLATS",   "footwear",  3,  15, 38),
  I("wsn_1", "SNEAKERS",       "footwear",  4, -99, 46),
  I("wlf_1", "LOAFERS",        "footwear",  4, -99, 35),
  I("wmj_1", "MARY JANES",     "footwear",  4,  10, 35),
  I("wcb_1", "CHELSEA BOOTS",  "footwear",  6, -99, 18),
  I("wlb_1", "ANKLE BOOTS",    "footwear",  6, -99, 15, { material: "leather" }),
  I("wkb_1", "Tall BOOTS","footwear",  8,  -5, 18, { material: "leather" }),
  I("wwt_1", "WINTER BOOTS",   "footwear", 10, -99,  5, { waterproof: true }),
];

/** Returns the item catalog for the given gender profile. */
export function getCatalog(gender: Gender): Item[] {
  return gender === "women" ? WOMEN_CATALOG : MEN_CATALOG;
}

/* ------------------------------------------------------------
   Tuning constants (locked after full-range verification)
   ------------------------------------------------------------ */
export const SLACK = 3;     // wearability gate softness (±°C)
export const TOL = 30;      // warmth proximity tolerance
export const MAX_DECK = 50; // shuffled deck cap shown to the user

/** Target warmth for a given apparent temperature.
 *  Clamped both ends to reflect the "single item per slot, no layering"
 *  philosophy: below ~-18°C and above ~22°C the target converges to the
 *  warmest / lightest single-item combination that actually exists. */
export const targetWarmth = (t: number): number =>
  Math.max(8, Math.min(210, 120 - t * 5));

const inSeason = (t: number, it: Item): boolean =>
  t >= it.lo - SLACK && t <= it.hi + SLACK;

/** Accessory candidates (single accessory only, "none" allowed except rain).
 *  Uses item.kind and item.hi — no hardcoded IDs — so any catalog works. */
export function accessoryOptions(t: number, flags: Flags, catalog: Item[]): (Item | null)[] {
  const accs = catalog.filter(i => i.slot === "accessory");
  if (flags.rain) {
    const umbrella = accs.find(i => i.kind === "rain");
    return umbrella ? [umbrella] : [];
  }
  const opts: (Item | null)[] = [null];
  if (flags.clear) opts.push(...accs.filter(i => i.kind === "deco"));
  // warm accessories: use item's own hi (no SLACK) — matches original threshold logic
  opts.push(...accs.filter(i => i.kind === "warm" && t <= i.hi));
  return opts;
}

/** Generate all valid outfits (one item per slot) within TOL of the target. */
export function makeOutfits(temp: number, flags: Flags, catalog: Item[] = MEN_CATALOG): { out: Outfit[]; target: number } {
  const pool = catalog.filter((i) => i.slot !== "accessory" && inSeason(temp, i));
  const tops = pool.filter((i) => i.slot === "top");
  const bottoms = pool.filter((i) => i.slot === "bottom");
  let shoes = pool.filter((i) => i.slot === "footwear");
  let outers = pool.filter((i) => i.slot === "outer");

  if (flags.rain) {
    outers = outers.filter((o) => o.waterproof);          // rain → waterproof jacket (or none)
    shoes = shoes.filter((s) => s.material !== "canvas");  // rain → exclude canvas only
  } else if (flags.snow) {
    shoes = shoes.filter((s) => s.material !== "canvas");
  }

  const accOptions = accessoryOptions(temp, flags, catalog);
  const outerOptions: (Item | null)[] = [null, ...outers];
  const target = targetWarmth(temp);
  const out: Outfit[] = [];

  for (const acc of accOptions)
    for (const top of tops)
      for (const outer of outerOptions)
        for (const bottom of bottoms)
          for (const shoe of shoes) {
            const items = [acc, top, outer, bottom, shoe].filter(Boolean) as Item[];
            const sum = items.reduce((s, i) => s + i.warmth, 0);
            if (Math.abs(sum - target) <= TOL) out.push({ items, sum });
          }

  return { out, target };
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the shuffled deck. Falls back to the nearest temperature with
 *  combinations if a point ever comes up empty (safety net; verified none
 *  exist in -35..45 across all four conditions). */
export function buildDeck(temp: number, flags: Flags, catalog: Item[] = MEN_CATALOG): { deck: Outfit[] } {
  let res = makeOutfits(temp, flags, catalog);
  if (res.out.length === 0) {
    for (let d = 1; d <= 80 && res.out.length === 0; d++) {
      for (const cand of [temp - d, temp + d]) {
        const r = makeOutfits(cand, flags, catalog);
        if (r.out.length) { res = r; break; }
      }
    }
  }
  return { deck: shuffle(res.out).slice(0, MAX_DECK) };
}

/** Map an Open-Meteo WMO weather code to our 4 conditions. */
export function codeToCondition(code: number): Condition {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (code === 0 || code === 1) return "clear";
  return "cloudy";
}

export const SLOT_ORDER: Slot[] = ["accessory", "outer", "top", "bottom", "footwear"];

/* ------------------------------------------------------------
   Local city dataset — instant search fallback.
   Online search (Nominatim) augments this when network is available.
   ------------------------------------------------------------ */
export const CITIES: City[] = [
  { name: "Seoul", lat: 37.5665, lon: 126.978 }, { name: "Busan", lat: 35.1796, lon: 129.0756 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 }, { name: "Osaka", lat: 34.6937, lon: 135.5023 },
  { name: "Sapporo", lat: 43.0618, lon: 141.3545 }, { name: "Beijing", lat: 39.9042, lon: 116.4074 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737 }, { name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  { name: "Taipei", lat: 25.033, lon: 121.5654 }, { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Bangkok", lat: 13.7563, lon: 100.5018 }, { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 }, { name: "Delhi", lat: 28.7041, lon: 77.1025 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 }, { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
  { name: "Moscow", lat: 55.7558, lon: 37.6173 }, { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 }, { name: "Berlin", lat: 52.52, lon: 13.405 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038 }, { name: "Barcelona", lat: 41.3851, lon: 2.1734 },
  { name: "Rome", lat: 41.9028, lon: 12.4964 }, { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Zurich", lat: 47.3769, lon: 8.5417 }, { name: "Vienna", lat: 48.2082, lon: 16.3738 },
  { name: "Stockholm", lat: 59.3293, lon: 18.0686 }, { name: "Oslo", lat: 59.9139, lon: 10.7522 },
  { name: "Helsinki", lat: 60.1699, lon: 24.9384 }, { name: "Reykjavik", lat: 64.1466, lon: -21.9426 },
  { name: "Dublin", lat: 53.3498, lon: -6.2603 }, { name: "Lisbon", lat: 38.7223, lon: -9.1393 },
  { name: "Athens", lat: 37.9838, lon: 23.7275 }, { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "Cape Town", lat: -33.9249, lon: 18.4241 }, { name: "Nairobi", lat: -1.2921, lon: 36.8219 },
  { name: "New York", lat: 40.7128, lon: -74.006 }, { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194 }, { name: "Chicago", lat: 41.8781, lon: -87.6298 },
  { name: "Miami", lat: 25.7617, lon: -80.1918 }, { name: "Phoenix", lat: 33.4484, lon: -112.074 },
  { name: "Honolulu", lat: 21.3069, lon: -157.8583 }, { name: "Toronto", lat: 43.6532, lon: -79.3832 },
  { name: "Vancouver", lat: 49.2827, lon: -123.1207 }, { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
  { name: "Bogota", lat: 4.711, lon: -74.0721 }, { name: "Lima", lat: -12.0464, lon: -77.0428 },
  { name: "Santiago", lat: -33.4489, lon: -70.6693 }, { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
  { name: "Sao Paulo", lat: -23.5505, lon: -46.6333 }, { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 }, { name: "Melbourne", lat: -37.8136, lon: 144.9631 },
  { name: "Auckland", lat: -36.8485, lon: 174.7633 },
];
