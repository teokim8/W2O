import React, { useState, useMemo, useEffect, useRef } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import {
  buildDeck, getCatalog, codeToCondition, CITIES, SLOT_ORDER,
  type Condition, type Gender, type City, type Item,
} from "./engine";
import Man01Url from "../design_assets/System/Man_01.svg?url";
import Man02Url from "../design_assets/System/Man_02.svg?url";
import Man03Url from "../design_assets/System/Man_03.svg?url";
import Man04Url from "../design_assets/System/Man_04.svg?url";
import Woman01Url from "../design_assets/System/Woman_01.svg?url";
import Woman02Url from "../design_assets/System/Woman_02.svg?url";
import Woman03Url from "../design_assets/System/Woman_03.svg?url";
import Woman04Url from "../design_assets/System/Woman_04.svg?url";
import LogoUrl from "../design_assets/System/logo.svg?url";
import LogoAltUrl from "../design_assets/System/logo_alt.svg?url";

/* ============================================================
   Design tokens
   ============================================================ */
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const INK = "#000";
const PAD = 20;
const WX_BG: Record<Condition, string> = { clear: "#FF8101", cloudy: "#5E8CA4", rain: "#A49C5E", snow: "#B4D0DF" };
const WX_LABEL: Record<Condition, string> = { clear: "Sunny", cloudy: "Cloudy", rain: "Rainy", snow: "Snowy" };
const PAGE_BG: Record<Condition, string> = { clear: "#FFDD00", cloudy: "#5DC6FF", rain: "#C4B862", snow: "#D9D9D9" };
const CONTENT_BG = "#E9E9E9", SHEET_BG = "#000", RED = "#FF2D2D";

// Type system: Helvetica Neue Regular · letter-spacing -2% · color per use
const typo = (size: number, color: string = INK) => ({
  fontFamily: FONT, fontWeight: 400 as const, fontSize: size,
  letterSpacing: "-0.02em", color, lineHeight: 1,
});
const CITY_W = 302;
const cityFit = (name: string) => Math.max(28, Math.min(52, Math.floor(CITY_W / (name.length * 0.55))));

/* Dial geometry */
const SP = 30, DETENT = SP, VIS = 88, R = 120, CX = 115, CCY = -32;
const TICK_N = Math.round(360 / SP);
const norm = (d: number) => { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; };
function tickStyle(alpha: number) {
  const f = 1 - Math.abs(alpha) / VIS;
  const rad = (alpha * Math.PI) / 180;
  const x = CX + R * Math.sin(rad), y = CCY + R * Math.cos(rad);
  const s = 6 + 12 * f, op = Math.max(0, Math.min(1, f * 1.35));
  const g = Math.round(0x3a + (0xd6 - 0x3a) * (1 - f));
  return { x, y, s, op, color: `rgb(${g},${g},${g})` };
}

type Page = "home" | "setting" | "location";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [temp, setTemp] = useState(24);
  const [condition, setCondition] = useState<Condition>("clear");
  const [gender, setGender] = useState<Gender>("men");
  const [city, setCity] = useState("Seoul");
  const [isManual, setIsManual] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);

  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(true);
  const busy = useRef(false);
  const wheelLock = useRef(false);

  const [angle, setAngle] = useState(0);
  const [infoHover, setInfoHover] = useState(false);
  const [infoLocked, setInfoLocked] = useState(false);
  const [showDialHint, setShowDialHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowDialHint(false), 2400); return () => clearTimeout(t); }, []);
  const cur = useRef(0); const committed = useRef(0); const raf = useRef(0);
  const drag = useRef({ active: false, startX: 0, dx: 0 });
  const setBoth = (v: number) => { cur.current = v; setAngle(v); };

  const flags = { clear: condition === "clear", rain: condition === "rain", snow: condition === "snow" };
  const { deck } = useMemo(() => buildDeck(temp, flags, getCatalog(gender)), [temp, condition, gender]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setShown(0); setVisible(true); }, [temp, condition, gender]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const total = deck.length;
  function go(step: number) {
    if (!total || busy.current) return;
    busy.current = true; setVisible(false);
    setTimeout(() => { setShown((s) => (s + step + total) % total); setVisible(true); busy.current = false; }, 210);
  }
  function animateTo(target: number) {
    cancelAnimationFrame(raf.current);
    const from = cur.current, t0 = performance.now(), dur = 420, c1 = 1.70158, c3 = c1 + 1;
    const ease = (p: number) => 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    const stepf = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setBoth(from + (target - from) * ease(p));
      if (p < 1) raf.current = requestAnimationFrame(stepf);
    };
    raf.current = requestAnimationFrame(stepf);
  }
  function rotateOne(dir: number) { committed.current += dir * DETENT; animateTo(committed.current); go(dir); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (page !== "home") return;
      if (e.key === "ArrowRight") rotateOne(1);
      if (e.key === "ArrowLeft") rotateOne(-1);
    };
    const onWheel = (e: WheelEvent) => {
      if (page !== "home") return;
      if (wheelLock.current) return;
      wheelLock.current = true;
      rotateOne(e.deltaY > 0 ? 1 : -1);
      setTimeout(() => { wheelLock.current = false; }, 500);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [total, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    cancelAnimationFrame(raf.current);
    drag.current = { active: true, startX: e.clientX, dx: 0 };
  }
  function onMove(e: RPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.dx = dx;
    setBoth(committed.current + Math.max(-DETENT, Math.min(DETENT, dx * 0.5)));
  }
  function onUp(e: RPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = drag.current.dx; drag.current.active = false;
    if (Math.abs(dx) > 20) rotateOne(dx > 0 ? 1 : -1);
    else if (Math.abs(dx) < 6) {
      const r = e.currentTarget.getBoundingClientRect();
      rotateOne(e.clientX < r.left + r.width / 2 ? 1 : -1);
    } else animateTo(committed.current);
  }

  // City search: instant local dataset + online (Nominatim) merge
  useEffect(() => {
    if (page !== "location") return;
    const q = query.trim().toLowerCase();
    if (q.length < 2) { setResults([]); return; }
    const local = CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
    setResults(local);
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=12&accept-language=en&q=${encodeURIComponent(query.trim())}`);
        const arr: Array<{ display_name: string; lat: string; lon: string; class: string; type: string }> = await r.json();
        const seen = new Set(local.map((c) => c.name.toLowerCase()));
        const merged: City[] = [...local];
        for (const it of arr) {
          if (it.class !== "place" || !["city", "town", "municipality"].includes(it.type)) continue;
          const name = it.display_name.split(",")[0].trim();
          if (seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          merged.push({ name, lat: parseFloat(it.lat), lon: parseFloat(it.lon) });
          if (merged.length >= 6) break;
        }
        setResults(merged);
      } catch { /* keep local results offline / when blocked */ }
      setSearching(false);
    }, 400);
    return () => clearTimeout(id);
  }, [query, page]);

  async function fetchWeatherFor(lat: number, lon: number, name?: string) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=apparent_temperature,weather_code&timezone=auto`);
      const c = (await r.json()).current;
      setTemp(Math.max(-35, Math.min(45, Math.round(c.apparent_temperature))));
      setCondition(codeToCondition(c.weather_code));
    } catch { /* keep current weather if fetch fails */ }
    if (name) setCity(name);
    setIsManual(false);
  }
  async function selectCity(c: City) {
    await fetchWeatherFor(c.lat, c.lon, c.name);
    setQuery(""); setResults([]); setPage("home");
  }
  async function useCurrentLocation() {
    setNotice(null);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      const { latitude, longitude } = pos.coords;
      let name = "Current";
      try {
        const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
        const a = (await g.json()).address || {};
        name = a.city || a.town || a.county || a.state || "Current";
      } catch { /* fall back to "Current" */ }
      await fetchWeatherFor(latitude, longitude, name);
      setPage("home");
    } catch { setNotice("Unable to access your current location."); }
  }

  // Auto-request GPS on first load; fall through to location page on failure.
  useEffect(() => {
    if (!navigator.geolocation) {
      setNotice("Geolocation is not supported by your browser.");
      setPage("location");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = "Current";
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
          const a = (await g.json()).address || {};
          name = a.city || a.town || a.county || a.state || "Current";
        } catch { /* keep "Current" if reverse-geocode fails */ }
        await fetchWeatherFor(latitude, longitude, name);
        setLoading(false);
      },
      () => {
        setNotice("Enable location or search for a city.");
        setPage("location");
        setLoading(false);
      },
      { timeout: 8000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const outfit = deck[shown];
  const fahrenheit = Math.round((temp * 9) / 5 + 32);
  const h3 = typo(32);
  const menuBtn = { ...h3, background: "none", border: "none", padding: 0, cursor: "pointer" } as const;
  const pill = (bg: string, color: string) => ({
    height: 56, borderRadius: 28, border: "none", cursor: "pointer", background: bg, width: "100%", ...typo(28, color),
  });

  // Shared style for both slide-up sheets. Positioned to sit exactly over the
  // home content area (below the menu row). The phone's overflow:hidden clips
  // the translation so the exit feels like it drops back into the frame.
  const sheetBase = (active: boolean): React.CSSProperties => ({
    position: "absolute",
    top: "var(--sheet-top)", left: PAD, right: PAD, bottom: "var(--sheet-bottom)",
    borderRadius: 24,
    background: SHEET_BG,
    padding: "30px 22px 26px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
    transform: active ? "translateY(0)" : "translateY(110%)",
    transition: "transform 380ms cubic-bezier(0.4,0,0.2,1)",
    pointerEvents: active ? "auto" : "none",
  });

  return (
    <div className="page" style={{ "--page-bg": loading ? "#d6d6d6" : PAGE_BG[condition] } as React.CSSProperties}>
      {gender === "men" ? (
        <>
          <img src={Man01Url} className="bg-figure bg-figure--man01" alt="" draggable={false} />
          <img src={Man02Url} className="bg-figure bg-figure--man02" alt="" draggable={false} />
          <img src={Man03Url} className="bg-figure bg-figure--man03" alt="" draggable={false} />
          <img src={Man04Url} className="bg-figure bg-figure--man04" alt="" draggable={false} />
        </>
      ) : (
        <>
          <img src={Woman01Url} className="bg-figure bg-figure--woman01" alt="" draggable={false} />
          <img src={Woman02Url} className="bg-figure bg-figure--woman02" alt="" draggable={false} />
          <img src={Woman03Url} className="bg-figure bg-figure--woman03" alt="" draggable={false} />
          <img src={Woman04Url} className="bg-figure bg-figure--woman04" alt="" draggable={false} />
        </>
      )}
      {/* Info panel — desktop only */}
      <div
        className={`info-panel${(infoHover || infoLocked) ? " info-panel--open" : ""}`}
        onMouseEnter={() => setInfoHover(true)}
        onMouseLeave={() => setInfoHover(false)}
        onClick={() => setInfoLocked(l => !l)}
      >
        <div className="info-panel__upper">
          <img src={LogoAltUrl} className="info-panel__sublogo" alt="" draggable={false} />
          <p className="info-panel__desc">
            W2O reads the current weather based on the location and hands you complete outfits, from accessories and outer layers to tops, bottoms, and shoes. It's for anyone deciding what to wear or unsure how to dress for the weather.
          </p>
          <a href="https://teokim.xyz/" className="info-panel__link" target="_blank" rel="noopener noreferrer">more info</a>
        </div>
        <div className="info-panel__logobar">
          <img src={LogoUrl} alt="W:O" draggable={false} />
        </div>
      </div>

      {/* Desktop gender toggle — top right, desktop only */}
      <div className="desktop-toggle">
        <div style={{ position: "relative", display: "flex", background: "#111", borderRadius: 28, padding: 4, height: 50, width: 220 }}>
          <div style={{
            position: "absolute", top: 4, bottom: 4,
            left: gender === "men" ? 4 : "50%",
            width: "calc(50% - 4px)",
            background: "#fff", borderRadius: 24,
            transition: "left 280ms cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
          }} />
          {(["men", "women"] as Gender[]).map((g) => (
            <button key={g} onClick={() => setGender(g)} className="desktop-toggle__btn" style={{
              flex: 1, border: "none", background: "transparent", cursor: "pointer",
              fontFamily: FONT, letterSpacing: "-0.02em", lineHeight: 1,
              color: gender === g ? "#000" : "#777",
              position: "relative", zIndex: 1, borderRadius: 24,
            }}>
              {g === "men" ? "Men's" : "Women's"}
            </button>
          ))}
        </div>
      </div>

      <div className="phone">

        {/* Main flex column — menu + home content, always rendered */}
        <div className="home-col" style={{ height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: PAD }}>

          {/* 1. System menu (shared) */}
          <div style={{ height: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <button style={menuBtn} onClick={() => setPage((p) => (p === "setting" ? "home" : "setting"))}>setting</button>
            <button style={menuBtn} onClick={() => setPage((p) => (p === "location" ? "home" : "location"))}>location</button>
          </div>

          {/* HOME — always rendered; sheets slide over it */}
          <div style={{ height: 170, flexShrink: 0, borderRadius: 24, background: loading ? "#C8C8C8" : WX_BG[condition], padding: "22px 24px", display: "flex", flexDirection: "column", alignItems: "flex-start", boxSizing: "border-box" }}>
            {loading ? (
              <div style={{ ...h3, opacity: 0.45 }}>locating…</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                  <div style={{ ...typo(cityFit(isManual ? "My Place" : city)), whiteSpace: "nowrap" }}>
                    {isManual ? "My Place" : city}
                  </div>
                  {isManual && (
                    <button onClick={useCurrentLocation} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="#000">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div style={{ ...h3, marginTop: 10 }}>{WX_LABEL[condition]}</div>
                <div style={{ ...h3, marginTop: 4 }}>{temp}°C {fahrenheit}°F</div>
              </>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, borderRadius: 24, background: CONTENT_BG, padding: "0 24px", overflow: "hidden", boxSizing: "border-box" }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", opacity: visible ? 1 : 0, transition: "opacity 210ms ease" }}>
              {SLOT_ORDER.map((slot) => {
                const item: Item | undefined = (!loading && outfit) ? outfit.items.find((i) => i.slot === slot) : undefined;
                return (
                  <div key={slot} style={{ height: 66, display: "flex", alignItems: "center" }}>
                    {item && <span style={{ ...typo(48), whiteSpace: "nowrap" }}>{item.name.toLowerCase()}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: 108, flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            {showDialHint && (
              <>
                <div className="dial-hint dial-hint--left" aria-hidden="true">
                  <svg width="36" height="56" viewBox="0 0 36 56" fill="none">
                    <path d="M 30 52 C 14 52 4 44 4 28 C 4 12 8 6 8 6" stroke="#1e1e1e" strokeWidth="5.5" strokeLinecap="round"/>
                    <path d="M 1 16 L 8 2 L 15 16" stroke="#1e1e1e" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="dial-hint dial-hint--right" aria-hidden="true">
                  <svg width="36" height="56" viewBox="0 0 36 56" fill="none">
                    <path d="M 6 52 C 22 52 32 44 32 28 C 32 12 28 6 28 6" stroke="#1e1e1e" strokeWidth="5.5" strokeLinecap="round"/>
                    <path d="M 35 16 L 28 2 L 21 16" stroke="#1e1e1e" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </>
            )}
            <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              style={{ position: "relative", width: 230, height: 100, touchAction: "none", cursor: "grab", userSelect: "none" }}>
              {Array.from({ length: TICK_N }).map((_, k) => {
                const a = norm((k + 0.5) * SP + angle);
                if (Math.abs(a) > VIS) return null;
                const st = tickStyle(a);
                return <div key={k} style={{ position: "absolute", left: st.x - st.s / 2, top: st.y - st.s / 2, width: st.s, height: st.s, background: st.color, opacity: st.op, borderRadius: "50%" }} />;
              })}
            </div>
          </div>
        </div>

        {/* SETTING sheet — slides up over home content */}
        <div style={sheetBase(page === "setting")}>
          <div style={{ position: "relative", display: "flex", background: "#222", borderRadius: 26, padding: 4, marginBottom: "var(--set-toggle-mb)", height: 52, boxSizing: "border-box" }}>
            <div style={{
              position: "absolute", top: 4, bottom: 4,
              left: gender === "men" ? 4 : "50%",
              width: "calc(50% - 4px)",
              background: "#fff", borderRadius: 22,
              transition: "left 280ms cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "none",
            }} />
            {(["men", "women"] as Gender[]).map((g) => (
              <button key={g} onClick={() => setGender(g)} style={{
                flex: 1, position: "relative", zIndex: 1,
                border: "none", background: "transparent", cursor: "pointer",
                ...typo(24, gender === g ? "#000" : "#666"),
                transition: "color 280ms ease",
              }}>
                {g === "men" ? "Men's" : "Women's"}
              </button>
            ))}
          </div>

          <div style={{ ...typo(52, "#fff"), textAlign: "center" }}>temperature</div>
          <div style={{ ...typo(32, "#fff"), textAlign: "center", marginTop: "var(--set-temp-gap)" }}>{temp}°C {fahrenheit}°F</div>
          <input className="setrange" type="range" min={-35} max={45} value={temp} onChange={(e) => { setTemp(+e.target.value); setIsManual(true); }} style={{ marginTop: "var(--set-slider-gap)" }} />

          <div style={{ ...typo(52, "#fff"), textAlign: "center", marginTop: "var(--set-section-gap)" }}>weather</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--set-wx-gap)", marginTop: "var(--set-wx-top)" }}>
            {(Object.keys(WX_LABEL) as Condition[]).map((k) => (
              <button key={k} onClick={() => { setCondition(k); setIsManual(true); }}
                style={{ height: 54, borderRadius: 27, border: "none", cursor: "pointer", background: WX_BG[k], boxShadow: condition === k ? "inset 0 0 0 3px #fff" : "none", ...typo(32, "#000") }}>
                {WX_LABEL[k]}
              </button>
            ))}
          </div>

          <button onClick={() => setPage("home")} style={{ ...pill("#fff", "#000"), marginTop: "auto" }}>done</button>
        </div>

        {/* LOCATION sheet — slides up over home content */}
        <div style={sheetBase(page === "location")}>
          <div style={{ ...typo(52, "#fff"), textAlign: "center" }}>location</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #fff", marginTop: 24, paddingBottom: 10 }}>
            <input className="locsearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", ...typo(40, "#fff") }} />
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="7" /><line x1="15.8" y1="15.8" x2="21" y2="21" /></svg>
          </div>

          <div className="results" style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 6 }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => selectCity(r)} style={{ ...typo(48, "#fff"), padding: "12px 0", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
            ))}
            {!results.length && query.trim().length >= 2 && !searching && (
              <div style={{ ...typo(20, "#8a8a8a"), padding: "12px 0" }}>No results</div>
            )}
          </div>

          {notice && <div style={{ ...typo(16, RED), marginBottom: 12, textAlign: "center" }}>{notice}</div>}
          <button onClick={useCurrentLocation} style={{ ...pill(RED, "#fff"), marginBottom: 12 }}>current location</button>
          <button onClick={() => setPage("home")} style={pill("#fff", "#000")}>done</button>
        </div>

      </div>
    </div>
  );
}
