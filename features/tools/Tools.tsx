"use client";
import { useEffect, useMemo, useState } from "react";
import { getHijriOffset } from "@/lib/hijri";

type Tab = "tasbih" | "times" | "qibla" | "zakat" | "calendar";
const TABS: { id: Tab; label: string; ar: string }[] = [
  { id: "tasbih", label: "Tasbih", ar: "تسبيح" }, { id: "times", label: "Prayer times", ar: "مواقيت" },
  { id: "qibla", label: "Qibla", ar: "قبلة" }, { id: "zakat", label: "Zakat", ar: "زكاة" }, { id: "calendar", label: "Calendar", ar: "تقويم" },
];

function useStored<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState(init);
  useEffect(() => { try { const r = localStorage.getItem(key); if (r) setV(JSON.parse(r)); } catch { /* ignore */ } }, [key]);
  const set = (n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ } };
  return [v, set];
}
const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5";

export default function Tools() {
  const [tab, setTab] = useState<Tab>("tasbih");
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="h-display">Daily <span className="text-gradient">tools</span></h1>
      <p className="mt-4 max-w-prose text-lg text-muted">Small tools for everyday worship. Your settings are saved on this device only.</p>
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Tools">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "border-blue bg-blue text-white shadow-soft" : "border-line bg-surface/70 text-muted hover:text-ink"}`}>
            {t.label} <span className="font-arabic opacity-70">{t.ar}</span>
          </button>
        ))}
      </div>
      <div className="mt-8" role="tabpanel">
        {tab === "tasbih" && <Tasbih />}{tab === "times" && <PrayerTimes />}{tab === "qibla" && <Qibla />}
        {tab === "zakat" && <Zakat />}{tab === "calendar" && <CalendarTool />}
      </div>
    </div>
  );
}

/* ---------- Tasbih ---------- */
const DHIKR = [
  { ar: "سبحان الله", tr: "Subhanallah", en: "Glory be to God" },
  { ar: "الحمد لله", tr: "Alhamdulillah", en: "All praise belongs to God" },
  { ar: "الله أكبر", tr: "Allahu Akbar", en: "God is the Greatest" },
  { ar: "", tr: "Free count", en: "Count any dhikr you like" },
];
function Tasbih() {
  const [s, set] = useStored("noorpath:tasbih", { c: 0, t: 33, r: 0, all: 0, d: 0 });
  const tap = () => {
    let c = s.c + 1, r = s.r;
    if (c >= s.t) { c = 0; r++; try { navigator.vibrate?.(150); } catch { /* ignore */ } }
    set({ ...s, c, r, all: s.all + 1 });
  };
  const d = DHIKR[s.d];
  return (
    <div className="card text-center">
      <div className="flex flex-wrap justify-center gap-2">
        {DHIKR.map((x, i) => <button key={x.tr} onClick={() => set({ ...s, d: i })} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${s.d === i ? "border-emerald bg-emerald/15 text-emerald" : "border-line text-muted"}`}>{x.tr}</button>)}
      </div>
      <p className="mt-6 min-h-[3.5rem] font-arabic text-4xl">{d.ar}</p>
      <p className="text-sm text-muted">{d.en}</p>
      <button onClick={tap} aria-label={`Count. Currently ${s.c} of ${s.t}`} className="mx-auto mt-6 grid h-52 w-52 place-items-center rounded-full border-8 border-blue bg-surface text-6xl font-extrabold shadow-glow transition-transform active:scale-95">{s.c}</button>
      <p className="mt-5 text-sm text-muted">Round {s.r + 1} · {s.t} per round · {s.all} counted in total</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {[33, 99, 100].map((n) => <button key={n} onClick={() => set({ ...s, t: n, c: 0 })} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${s.t === n ? "border-blue bg-blue text-white" : "border-line"}`}>{n}</button>)}
        <label className="text-sm">Custom <input type="number" min={1} max={10000} className="ml-2 w-24 rounded-xl border border-line bg-surface px-2 py-1" value={s.t} onChange={(e) => set({ ...s, t: Math.max(1, Math.min(10000, +e.target.value || 1)), c: 0 })} /></label>
        <button className="btn btn-ghost !py-1.5" onClick={() => set({ ...s, c: 0, r: 0, all: 0 })}>Reset</button>
      </div>
    </div>
  );
}

/* ---------- Prayer times (AlAdhan API) ---------- */
const METHODS = [
  { id: 3, n: "Muslim World League" }, { id: 2, n: "ISNA (North America)" }, { id: 4, n: "Umm al-Qura (Makkah)" },
  { id: 5, n: "Egyptian General Authority" }, { id: 1, n: "University of Islamic Sciences, Karachi" }, { id: 13, n: "Diyanet (Turkey)" },
];
const ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type Times = Record<(typeof ORDER)[number], string>;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function PrayerTimes() {
  const [place, setPlace] = useStored("noorpath:place", { city: "", country: "" });
  const [opt, setOpt] = useStored("noorpath:method", { m: 3, hanafi: false });
  const [data, setData] = useState<{ t: Times; tz: string; label: string } | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);

  const load = async (coords?: { lat: number; lon: number }) => {
    setErr(""); setBusy(true);
    try {
      if (!coords && (!place.city || !place.country)) throw new Error("Enter your city and country, or use your location.");
      const d = new Date(), date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      const base = coords ? `https://api.aladhan.com/v1/timings/${date}?latitude=${coords.lat}&longitude=${coords.lon}`
        : `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(place.city)}&country=${encodeURIComponent(place.country)}`;
      const res = await fetch(`${base}&method=${opt.m}&school=${opt.hanafi ? 1 : 0}`);
      const j = await res.json();
      if (!res.ok || j.code !== 200) throw new Error(typeof j.data === "string" ? j.data : "The prayer time service did not accept this request.");
      const t = j.data.timings, c = (s: string) => String(s).slice(0, 5);
      setData({ t: { Fajr: c(t.Fajr), Sunrise: c(t.Sunrise), Dhuhr: c(t.Dhuhr), Asr: c(t.Asr), Maghrib: c(t.Maghrib), Isha: c(t.Isha) }, tz: j.data.meta?.timezone ?? "", label: coords ? "your location" : `${place.city}, ${place.country}` });
    } catch (e) { setErr((e as Error).message || "Could not load prayer times. Check your connection."); setData(null); }
    finally { setBusy(false); }
  };
  const locate = () => {
    if (!navigator.geolocation) { setErr("Location isn’t available. Enter your city and country."); return; }
    navigator.geolocation.getCurrentPosition((p) => load({ lat: p.coords.latitude, lon: p.coords.longitude }), () => setErr("Location is blocked. Enter your city and country instead."));
  };

  const next = useMemo(() => {
    if (!data) return null;
    let nowMin = 0;
    try {
      const p = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: data.tz || undefined }).formatToParts(new Date(now));
      nowMin = +p.find((x) => x.type === "hour")!.value * 60 + +p.find((x) => x.type === "minute")!.value;
    } catch { const d = new Date(now); nowMin = d.getHours() * 60 + d.getMinutes(); }
    const list = (["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((n) => ({ n, m: toMin(data.t[n]) }));
    const f = list.find((x) => x.m > nowMin);
    const diff = f ? f.m - nowMin : toMin(data.t.Fajr) + 1440 - nowMin;
    return { name: f ? f.n : "Fajr", h: Math.floor(diff / 60), m: diff % 60, tomorrow: !f };
  }, [data, now]);

  return (
    <div className="grid gap-5">
      <div className="card grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">City<input className={field + " mt-1 font-normal"} value={place.city} onChange={(e) => setPlace({ ...place, city: e.target.value })} placeholder="e.g. London" /></label>
          <label className="text-sm font-semibold">Country<input className={field + " mt-1 font-normal"} value={place.country} onChange={(e) => setPlace({ ...place, country: e.target.value })} placeholder="e.g. United Kingdom" /></label>
        </div>
        <label className="text-sm font-semibold">Calculation method
          <select className={field + " mt-1 font-normal"} value={opt.m} onChange={(e) => setOpt({ ...opt, m: +e.target.value })}>{METHODS.map((m) => <option key={m.id} value={m.id}>{m.n}</option>)}</select>
        </label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={opt.hanafi} onChange={(e) => setOpt({ ...opt, hanafi: e.target.checked })} />Use the Hanafi way of calculating Asr (later Asr time)</label>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={() => load()} disabled={busy}>{busy ? "Loading…" : "Show times"}</button>
          <button className="btn btn-ghost" onClick={locate} disabled={busy}>Use my location</button>
        </div>
        {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
      </div>
      {data && (
        <div className="card">
          {next && <p className="text-lg font-bold">Next: {next.name}{next.tomorrow ? " (tomorrow)" : ""} in {next.h > 0 ? `${next.h} h ` : ""}{next.m} min</p>}
          <p className="mt-1 text-sm text-muted">Times for {data.label}{data.tz ? ` (${data.tz})` : ""}</p>
          <ul className="mt-4 grid gap-2">
            {ORDER.map((n) => <li key={n} className={`flex justify-between rounded-xl border px-4 py-3 ${next?.name === n ? "border-blue bg-blue/10 font-bold" : "border-line"}`}><span>{n}</span><span className="tabular-nums">{data.t[n]}</span></li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted">Times come from the AlAdhan service using the method you choose. Different methods give slightly different times, so follow your local mosque if it differs. Noor Path does not make up times: if the service is unavailable, nothing is shown.</p>
    </div>
  );
}

/* ---------- Qibla ---------- */
const KAABA = { lat: 21.4225, lon: 39.8262 };
function bearingTo(lat: number, lon: number) {
  const R = Math.PI / 180, k1 = KAABA.lat * R, k2 = KAABA.lon * R, p = lat * R, dl = k2 - lon * R;
  return (Math.atan2(Math.sin(dl) * Math.cos(k1), Math.cos(p) * Math.sin(k1) - Math.sin(p) * Math.cos(k1) * Math.cos(dl)) / R + 360) % 360;
}
function distanceKm(lat: number, lon: number) {
  const R = Math.PI / 180, a = Math.sin(((KAABA.lat - lat) * R) / 2) ** 2 + Math.cos(lat * R) * Math.cos(KAABA.lat * R) * Math.sin(((KAABA.lon - lon) * R) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}
const WINDS = ["north", "north-northeast", "northeast", "east-northeast", "east", "east-southeast", "southeast", "south-southeast", "south", "south-southwest", "southwest", "west-southwest", "west", "west-northwest", "northwest", "north-northwest"];

function Qibla() {
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [manual, setManual] = useState({ lat: "", lon: "" });
  const [heading, setHeading] = useState<number | null>(null);
  const [compass, setCompass] = useState(false);
  const [msg, setMsg] = useState("");
  const bearing = pos ? bearingTo(pos.lat, pos.lon) : null;

  useEffect(() => {
    if (!compass) return;
    const on = (e: Event) => {
      const o = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      const h = typeof o.webkitCompassHeading === "number" ? o.webkitCompassHeading : o.absolute && o.alpha != null ? (360 - o.alpha) % 360 : null;
      if (h !== null) setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", on, true);
    window.addEventListener("deviceorientation", on, true);
    return () => { window.removeEventListener("deviceorientationabsolute", on, true); window.removeEventListener("deviceorientation", on, true); };
  }, [compass]);

  const locate = () => {
    if (!navigator.geolocation) { setMsg("Location isn’t available. Enter it by hand."); return; }
    navigator.geolocation.getCurrentPosition((p) => { setPos({ lat: p.coords.latitude, lon: p.coords.longitude }); setMsg(""); }, () => setMsg("Location is blocked. Enter your latitude and longitude by hand."));
  };
  const useManual = () => {
    const lat = parseFloat(manual.lat), lon = parseFloat(manual.lon);
    if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setMsg("Enter a latitude between -90 and 90 and a longitude between -180 and 180."); return; }
    setPos({ lat, lon }); setMsg("");
  };
  const enableCompass = async () => {
    try {
      const DO = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DO.requestPermission === "function" && (await DO.requestPermission()) !== "granted") { setMsg("Compass permission was denied."); return; }
      setCompass(true); setMsg("Compass on. Hold your phone flat and move it in a figure of eight to calibrate.");
      setTimeout(() => setHeading((h) => { if (h === null) setMsg("No compass reading yet. This device may not have a compass sensor, so use the direction in degrees with another compass."); return h; }), 3000);
    } catch { setMsg("This device has no compass sensor. Use the direction in degrees with another compass."); }
  };
  const rotation = bearing === null ? 0 : bearing - (heading ?? 0);

  return (
    <div className="card grid gap-6 md:grid-cols-2">
      <div className="grid place-items-center">
        <svg viewBox="0 0 200 200" className="w-full max-w-xs" role="img" aria-label="Qibla compass">
          <circle cx="100" cy="100" r="92" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="3" />
          {["N", "E", "S", "W"].map((l, i) => <text key={l} x={100 + Math.sin((i * Math.PI) / 2) * 76} y={105 - Math.cos((i * Math.PI) / 2) * 76} textAnchor="middle" fontSize="13" fill="rgb(var(--muted))">{l}</text>)}
          <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "100px 100px", transition: "transform .3s" }} opacity={bearing === null ? 0.2 : 1}>
            <path d="M100 28L114 104L100 94L86 104Z" fill="rgb(var(--gold))" />
          </g>
          <circle cx="100" cy="100" r="5" fill="rgb(var(--blue))" />
        </svg>
        <p className="mt-2 text-xs text-muted">{heading === null ? "Arrow points to the Kaaba from north (top)." : "Compass on: turn until the arrow points up."}</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={locate}>Use my location</button>
          <button className="btn btn-ghost" onClick={enableCompass}>Turn on compass</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">Latitude<input className={field + " mt-1 font-normal"} inputMode="decimal" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} placeholder="35.5" /></label>
          <label className="text-sm font-semibold">Longitude<input className={field + " mt-1 font-normal"} inputMode="decimal" value={manual.lon} onChange={(e) => setManual({ ...manual, lon: e.target.value })} placeholder="129.0" /></label>
        </div>
        <button className="btn btn-ghost" onClick={useManual}>Calculate from these numbers</button>
        {bearing !== null && pos && <p className="text-lg font-bold" aria-live="polite">Qibla is {Math.round(bearing)}° from north ({WINDS[Math.round(bearing / 22.5) % 16]}). About {Math.round(distanceKm(pos.lat, pos.lon)).toLocaleString()} km to the Kaaba.</p>}
        {msg && <p className="text-sm text-muted" role="status">{msg}</p>}
        <p className="text-xs text-muted">Phone compasses are often not well calibrated, especially indoors or near metal. Treat the direction as a guide and, if you can, check it against a known qibla in your mosque.</p>
      </div>
    </div>
  );
}

/* ---------- Zakat ---------- */
function Zakat() {
  const [v, setV] = useState({ cash: "", gold: "", silver: "", invest: "", goods: "", other: "", debts: "", nisab: "" });
  const n = (k: keyof typeof v) => Math.max(0, parseFloat(v[k]) || 0);
  const assets = n("cash") + n("gold") + n("silver") + n("invest") + n("goods") + n("other");
  const net = Math.max(0, assets - n("debts")), nisab = n("nisab");
  const due = nisab > 0 && net >= nisab;
  const rows: [keyof typeof v, string][] = [["cash", "Cash and savings"], ["gold", "Gold (current value)"], ["silver", "Silver (current value)"], ["invest", "Investments and shares"], ["goods", "Business goods for sale"], ["other", "Money owed to you that you expect back"], ["debts", "Debts you must pay soon"]];
  return (
    <div className="card grid gap-5">
      <p className="text-muted">An estimate to help you think it through. Use one currency for every box. Zakat is generally due on wealth held for a full lunar year that stays above the nisab.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([k, l]) => <label key={k} className="text-sm font-semibold">{l}<input type="number" min={0} inputMode="decimal" className={field + " mt-1 font-normal"} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></label>)}
        <label className="text-sm font-semibold sm:col-span-2">Nisab value today (look up the current value of 85 g of gold or 595 g of silver)
          <input type="number" min={0} inputMode="decimal" className={field + " mt-1 font-normal"} value={v.nisab} onChange={(e) => setV({ ...v, nisab: e.target.value })} /></label>
      </div>
      <div className="rounded-2xl border border-line bg-bg/60 p-5" aria-live="polite">
        <p>Total assets: <strong>{assets.toLocaleString()}</strong> · Debts: <strong>{n("debts").toLocaleString()}</strong> · Net: <strong>{net.toLocaleString()}</strong></p>
        {nisab === 0 ? <p className="mt-2 text-muted">Enter the current nisab value to see the result.</p>
          : due ? <p className="mt-2 text-xl font-bold">Estimated zakat: {(net * 0.025).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted">(2.5% of {net.toLocaleString()})</span></p>
          : <p className="mt-2 text-lg font-bold">Your net wealth is below the nisab, so zakat is not estimated as due.</p>}
      </div>
      <p className="text-xs text-muted">This is an educational estimate, not a ruling. Scholars differ on some items (for example jewellery and retirement funds), and your situation may need a qualified person’s advice. Noor Path does not collect zakat. See the <a className="underline" href="/donate">donation page</a> for links to organisations.</p>
    </div>
  );
}

/* ---------- Islamic calendar ---------- */
const MONTHS = ["Muharram", "Safar", "Rabi‘ al-Awwal", "Rabi‘ al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha‘ban", "Ramadan", "Shawwal", "Dhul Qa‘dah", "Dhul Hijjah"];
const EVENTS = [
  { n: "Islamic New Year", m: 1, d: 1 }, { n: "Day of Ashura", m: 1, d: 10 }, { n: "Start of Ramadan", m: 9, d: 1 },
  { n: "Eid al-Fitr", m: 10, d: 1 }, { n: "Day of Arafah", m: 12, d: 9 }, { n: "Eid al-Adha", m: 12, d: 10 },
];
function CalendarTool() {
  const [off] = useState(() => (typeof window === "undefined" ? 0 : getHijriOffset()));
  const info = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" });
    const parts = (d: Date) => {
      const p = fmt.formatToParts(new Date(d.getTime() + off * 86_400_000));
      const g = (t: string) => parseInt(p.find((x) => x.type === t)?.value ?? "0", 10);
      return { d: g("day"), m: g("month"), y: g("year") || g("relatedYear") };
    };
    const now = new Date(), today = parts(now);
    const upcoming = EVENTS.map((e) => {
      for (let i = 0; i < 400; i++) { const day = new Date(now.getTime() + i * 86_400_000), p = parts(day); if (p.m === e.m && p.d === e.d) return { ...e, date: day, in: i }; }
      return { ...e, date: null as Date | null, in: -1 };
    }).sort((a, b) => (a.in < 0 ? 999 : a.in) - (b.in < 0 ? 999 : b.in));
    return { now, today, upcoming };
  }, [off]);
  return (
    <div className="grid gap-5">
      <div className="card">
        <p className="text-sm text-muted">Today</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{info.today.d} {MONTHS[info.today.m - 1]} {info.today.y} AH</p>
        <p className="mt-1 text-muted">{info.now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        {off !== 0 && <p className="mt-2 text-sm text-gold">Adjusted by {off > 0 ? "+" : ""}{off} day(s). Change this on the My progress page.</p>}
      </div>
      <div className="card">
        <h2 className="text-xl font-bold">Coming up</h2>
        <ul className="mt-4 grid gap-2">
          {info.upcoming.map((e) => (
            <li key={e.n} className="flex flex-wrap justify-between gap-2 rounded-xl border border-line px-4 py-3">
              <span className="font-semibold">{e.n}</span>
              <span className="text-muted">{e.date ? `${e.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${e.in === 0 ? "today" : `in ${e.in} days`}` : "—"}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">Dates follow the Umm al-Qura calendar. Many places start months by moon sighting, so the date in your country may differ by a day. Use the adjustment on the My progress page to match your community. Never assume every country’s dates are identical.</p>
    </div>
  );
}