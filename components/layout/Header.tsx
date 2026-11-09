"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";

const NAV = [
  { href: "/", label: "Home", ar: "الرئيسية" },
  { href: "/learn", label: "Learn", ar: "تعلم" },
  { href: "/arabic", label: "Arabic", ar: "العربية" },
  { href: "/salah-vision", label: "Salah Vision", ar: "رؤية الصلاة" },
  { href: "/tools", label: "Tools", ar: "أدوات" },
  { href: "/donate", label: "Donate", ar: "تبرع" },
];
const DOCK = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/learn", label: "Learn", icon: "علم" },
  { href: "/salah-vision", label: "Vision", icon: "رؤية" },
  { href: "/tools", label: "Tools", icon: "أدوات" },
  { href: "/donate", label: "Donate", icon: "♥" },
];
const MORE = [...NAV, { href: "/progress", label: "My progress", ar: "تقدمي" }, { href: "/privacy", label: "Privacy", ar: "الخصوصية" }];

export function Header() {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [ind, setInd] = useState({ x: 0, w: 0, show: false });
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  const activeHref = NAV.find((n) => isActive(n.href))?.href;

  const measure = () => {
    const el = activeHref ? refs.current[activeHref] : null;
    if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth, show: true }); else setInd((i) => ({ ...i, show: false }));
  };
  useLayoutEffect(measure, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  useEffect(() => setMenu(false), [path]);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("noorpath:theme", next); } catch { /* ignore */ }
    setDark(!dark);
  };
  const themeBtn = (
    <button className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-blue/10 hover:text-ink" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? "☀" : "☾"}</button>
  );

  return (
    <>
      {/* Desktop: a floating island with a sliding highlight */}
      <header className="pointer-events-none fixed inset-x-0 top-4 z-40 hidden justify-center px-4 md:flex">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/30 bg-surface/70 p-1.5 shadow-soft backdrop-blur-2xl dark:border-white/10">
          <Link href="/" aria-label="Noor Path home" className="flex items-center gap-2 pl-1 pr-3">
            <LogoMark size={38} />
            <span className="hidden text-base font-extrabold tracking-tight xl:inline">Noor <span className="text-gradient">Path</span></span>
          </Link>
          <nav className="relative flex items-center" aria-label="Main">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue to-sky shadow-glow transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ transform: `translateX(${ind.x}px)`, width: ind.w, opacity: ind.show ? 1 : 0 }} />
            {NAV.map((n) => {
              const a = isActive(n.href), donate = n.href === "/donate";
              return (
                <Link key={n.href} href={n.href} ref={(el) => { refs.current[n.href] = el; }} aria-current={a ? "page" : undefined}
                  className={`relative z-10 flex flex-col items-center rounded-full px-4 py-1.5 leading-tight transition-colors ${a ? "text-white" : donate ? "text-gold hover:text-ink" : "text-muted hover:text-ink"}`}>
                  <span className="text-sm font-semibold">{donate && <span className="mr-1">♥</span>}{n.label}</span>
                  <span className="font-arabic text-[11px] opacity-70">{n.ar}</span>
                </Link>
              );
            })}
          </nav>
          <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
          <Link href="/progress" aria-label="My progress" title="My progress" className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-blue/10 hover:text-ink">◔</Link>
          {themeBtn}
        </div>
      </header>

      {/* Mobile: slim top pill + bottom dock */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between p-3 md:hidden">
        <Link href="/" aria-label="Noor Path home" className="flex items-center gap-2 rounded-full border border-white/30 bg-surface/70 py-1.5 pl-1.5 pr-4 shadow-soft backdrop-blur-2xl dark:border-white/10">
          <LogoMark size={34} /><span className="font-extrabold tracking-tight">Noor <span className="text-gradient">Path</span></span>
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/30 bg-surface/70 p-1 shadow-soft backdrop-blur-2xl dark:border-white/10">
          {themeBtn}
          <button className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-blue/10" onClick={() => setMenu(true)} aria-label="Open menu">☰</button>
        </div>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Quick">
        <div className="grid grid-cols-5 gap-1 rounded-3xl border border-white/30 bg-surface/80 p-1.5 shadow-soft backdrop-blur-2xl dark:border-white/10">
          {DOCK.map((d) => {
            const a = isActive(d.href);
            return (
              <Link key={d.href} href={d.href} aria-current={a ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 transition-colors ${a ? "bg-blue text-white shadow-glow" : d.href === "/donate" ? "text-gold" : "text-muted"}`}>
                <span className="font-arabic text-lg leading-none">{d.icon}</span>
                <span className="text-[10px] font-semibold">{d.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {menu && (
        <div className="fixed inset-0 z-50 bg-bg/95 p-6 backdrop-blur-xl md:hidden" role="dialog" aria-label="Menu">
          <div className="flex justify-end"><button className="grid h-11 w-11 place-items-center rounded-full border border-line" onClick={() => setMenu(false)} aria-label="Close menu">✕</button></div>
          <nav className="mt-4 grid gap-2" aria-label="All pages">
            {MORE.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center justify-between rounded-2xl border border-line px-5 py-4 text-lg font-bold ${isActive(n.href) ? "bg-blue text-white" : "bg-surface"}`}>
                {n.label}<span className="font-arabic text-base opacity-70">{n.ar}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}