# W2O — Product Requirements & Design Specification

**Version:** 1.0 (handoff build)
**Stack:** Vite + React + TypeScript, deployed as a PWA (desktop + mobile)

---

## 1. Overview

W2O ("Weather → Outfit") shows the user a single, complete outfit for the
current weather: one accessory, one outer, one top, one bottom, one pair of
footwear. The user can flip through alternative combinations with a tactile
dial. Weather is auto-detected by GPS, searched by city, or set manually.

## 2. Product principles (do not violate)

1. **One item per slot, no layering.** Each outfit has exactly one item per
   category. Accessory and outer may be "none". This is a deliberate UX choice
   for clarity — *not* a simplification to be "fixed" later.
2. **Deterministic, transparent engine.** Warmth is a simple additive score; no
   hidden weighting, decay, or ML. Logic is pure and lives in `engine.ts`.
3. **Always show something.** Every temperature × condition in range yields at
   least one outfit (verified). A nearest-temperature fallback guards the edges.
4. **Minimal visual language.** Lowercase outfit text, generous type, four flat
   weather colors, a single dial control.

## 3. Recommendation engine (`src/engine.ts`)

### 3.1 Warmth target

```
targetWarmth(t) = max(8, min(210, 120 − 5·t))     // t = apparent °C
```

The clamps encode principle #1. The upper clamp **210** is the warmth of the
warmest *single-item-per-slot* outfit that actually exists (≈216), so below
~−18 °C the target converges there instead of chasing an unreachable number.
The lower clamp **8** is the lightest possible outfit (tank top 3 + sport shorts
3 + sandals 2), so above ~22 °C it converges to the lightest combination.

### 3.2 Selection rules

- **Wearability gate:** an item is eligible if `t ≥ lo − SLACK` and
  `t ≤ hi + SLACK`, with `SLACK = 3`. A `lo` of **−99** means *no lower bound*
  (the item only has an upper limit — you can always wear it when it's colder).
- **Proximity:** an outfit is valid if `|Σwarmth − target| ≤ TOL`, `TOL = 30`.
- **Single accessory:** exactly one accessory (or none). Warmth must never sum
  multiple accessories.
- **Rain:** outer must be waterproof (or none); umbrella is the forced
  accessory; footwear excludes only `canvas` material.
- **Snow:** footwear excludes only `canvas` material.
- **Deck:** all valid outfits are generated (cartesian product across slots),
  Fisher-Yates shuffled, capped at `MAX_DECK = 50`. If a point is ever empty,
  fall back to the nearest temperature that has combinations.

### 3.3 Catalog (49 items)

Columns: warmth · valid range (°C). `−99` = no lower bound.

**Accessory (9)** — single, "none" allowed except rain
| item | warmth | range | note |
|---|---|---|---|
| beanie | 8 | −40…6 | cold (≤6°) |
| muffler | 10 | −40…6 | cold (≤6°) |
| gloves | 6 | −40…0 | cold (≤0°) |
| balaclava | 12 | −40…−2 | deep cold (≤−2°) |
| scarf | 0 | −40…40 | deco (sunny) |
| sunglasses | 0 | −40…40 | deco (sunny) |
| cap | 0 | −40…40 | deco (sunny) |
| bucket hat | 0 | −40…40 | deco (sunny) |
| umbrella | 0 | −40…40 | rain (forced) |

**Outer (10)** — single, "none" allowed
| item | warmth | range | note |
|---|---|---|---|
| overshirt | 18 | 0…20 | |
| hardshell | 25 | −5…22 | waterproof |
| denim jacket | 26 | 10…20 | |
| puffer vest | 32 | −10…14 | |
| trench coat | 38 | 0…18 | |
| light down | 45 | −5…12 | |
| leather jacket | 49 | 0…15 | |
| baseball jacket | 49 | 0…15 | |
| wool coat | 56 | −99…8 | no lower bound |
| down parka | 113 | −99…5 | waterproof, no lower bound |

**Top (13)** — exactly one
| item | warmth | range |
|---|---|---|
| tank top | 3 | 22…48 |
| linen shirt | 5 | 20…46 |
| basic tee | 6 | 10…46 |
| polo shirt | 6 | 10…46 |
| long sleeve | 14 | −99…22 |
| casual shirt | 17 | −99…25 |
| sweatshirt | 23 | −99…22 |
| cardigan | 23 | −99…20 |
| hoodie | 24 | −99…22 |
| knit sweater | 28 | −99…18 |
| fleece | 30 | −99…15 |
| turtleneck | 34 | −99…12 |
| heavy knit | 41 | −99…10 |

**Bottom (10)** — exactly one
| item | warmth | range |
|---|---|---|
| sport shorts | 3 | 24…48 |
| shorts | 5 | 22…46 |
| linen pants | 7 | 20…44 |
| slacks | 11 | 10…28 |
| jeans | 14 | 0…25 |
| corduroy | 17 | 0…20 |
| sweatpants | 19 | −5…18 |
| fleece leggings | 22 | −99…12 |
| wool trousers | 26 | −99…10 |
| down pants | 40 | −99…5 |

**Footwear (6)** — exactly one
| item | warmth | range | note |
|---|---|---|---|
| sandals | 2 | 24…48 | |
| sneakers | 4 | −99…46 | |
| loafers | 4 | −99…35 | |
| chelsea boots | 6 | −99…18 | |
| leather boots | 6 | −99…15 | leather |
| winter boots | 10 | −99…5 | waterproof |

### 3.4 Validation (must stay green)

Across **−35 °C…45 °C (1° steps) × {sunny, cloudy, rainy, snowy} = 324 points**,
every point yields **≥ 1** outfit. Sparsest point is 24 (39 °C / cloudy). Any
catalog or formula change should be re-checked against this sweep (a few lines of
Node reproduce it: build the deck for each point and assert non-empty).

## 4. Design system

### 4.1 Layout — four zones, top to bottom

```
[ 1. System menu ]   setting · location
[ 2. Weather area ]  rounded card, fixed height, weather-colored
[ 3. Content area ]  rounded card, the outfit (fills remaining height)
[ 4. Controller ]    the dial
```

- **Screen padding:** 20px on all sides. **Gap between zones:** 20px.
- Weather Area is a **fixed-height** rounded card. Content Area is a rounded card
  that fills the remaining height; its five rows hold fixed vertical positions so
  the layout never shifts between outfits.

### 4.2 Type system

All text: **Helvetica Neue, Regular (400), letter-spacing −2% (−0.02em)**.

| token | size | usage | color |
|---|---|---|---|
| H1 | 52px | city name (weather area) | black |
| H2 | 48px | outfit items; location search results | black / white |
| H3 | 32px | system menu; weather + temperature sub-text | black |

- **Weather Area** text is **sentence case** (`Seoul`, `Sunny`, `24°C 75°F`),
  left- and top-aligned, all black. City name **auto-shrinks** to stay on one
  line within the fixed card.
- **Content Area** outfit text is **lowercase**, left-aligned, 48px fixed.
- **Empty slots** (no accessory / no outer) render as **blank space** — the row
  keeps its position; there is no black bar.

### 4.3 Color tokens

| token | value | use |
|---|---|---|
| Sunny | `#FF8101` | weather area / pill |
| Cloudy | `#5E8CA4` | weather area / pill |
| Rainy | `#A49C5E` | weather area / pill |
| Snowy | `#B4D0DF` | weather area / pill |
| Content bg | `#E9E9E9` | content card |
| Sheet bg | `#000000` | setting / location pages |
| Accent red | `#FF2D2D` | slider thumb, "current location" |
| Ink | `#000000` | primary text |

### 4.4 Controller — the dial

A flat arc of grey dots over an invisible circle; the center is intentionally
empty. Behavior (must be preserved):

- Dots sit at half-offset positions on a circle (`SP = 30°` spacing). **30
  divides 360 evenly (12 ticks)** — this is required; a spacing that doesn't
  divide 360 creates a seam and breaks the left-right symmetry.
- Dragging rotates the wheel; dots flow along the arc, larger/darker toward the
  center and fading at the edges. **One interaction = one notch (30°) = one
  card.** Release snaps to the next notch with a slight ease-out-back detent;
  small drags cancel back to the current notch.
- **Tap:** left half → next, right half → previous. Arrow keys and a body swipe
  do the same. Card text cross-fades 210ms on each change.

## 5. Pages

### 5.1 Home
The four zones above. Weather area shows city / condition / temperature.
Content area shows the current outfit. Dial flips outfits.

### 5.2 Setting (black sheet)
- `temperature` (H1) · current `°C °F` (H3) · manual slider (−35…45, white track,
  red thumb).
- `weather` (H1) · four full-width pills (Sunny / Cloudy / Rainy / Snowy) in their
  colors; the selected one carries a 3px white inset ring.
- `done` (white pill) → home. Tapping `setting` in the top menu again also → home.

### 5.3 Location (black sheet)
- `location` (H1) · search field (underline + magnifier). Typing searches the
  built-in city dataset instantly and merges online (Nominatim) results when
  available. Results render as **H2, white**, tappable → sets that city's weather.
- `current location` (red pill) → GPS. On failure, an English error appears
  **centered, directly above** the button.
- `done` (white pill) → home. Tapping `location` in the top menu again also → home.

## 6. Architecture & tech

- **Vite + React + TypeScript.** UI in `App.tsx`; pure engine + types in
  `engine.ts` (no React/DOM imports — reusable on React Native, etc.).
- **PWA** via `vite-plugin-pwa` (manifest + auto-update service worker).
- **APIs (keyless):** Open-Meteo (weather), Nominatim (geocoding) with a local
  city fallback. Geolocation and PWA install need **HTTPS**.
- Mobile-first; desktop shows a centered phone-width frame.

## 7. Decisions to preserve (no re-invention)

When extending W2O, keep these — they are the result of deliberate iteration and
full-range verification, and "improving" them silently will regress the product:

1. **One item per slot / no layering**, single accessory only.
2. **Warmth clamps 8 / 210** in `targetWarmth` (they encode the no-layering
   philosophy, not arbitrary numbers).
3. **`lo = −99` = no lower bound** for cold-weather items (parka, wool coat, the
   `−99` tops, wool trousers, down pants, winter/leather/chelsea boots, etc.).
   This keeps the warmest pieces available at extreme cold.
4. **Rain/snow footwear rule = exclude `canvas` only** (not "waterproof only"),
   which prevents No-Match on warm rainy days.
5. **Dial spacing must divide 360** (currently 30° / 12 ticks) for a seamless,
   symmetric arc.
6. **Full-range validation** (−35…45 × 4 conditions, all ≥ 1) is the gate for any
   catalog/formula change.

## 8. Possible next steps (optional, not yet built)

- Enrich hot, cloudy/rainy 32–45 °C variety (currently ~18–36 combos) with a few
  more summer items if richer flipping is desired.
- Persist last city/weather; add a real geocoder for production scale.
- Additional app states/screens beyond Default State (to be specified).
