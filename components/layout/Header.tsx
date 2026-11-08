"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/salah-vision", label: "Salah Vision" },
  { href: "/progress", label: "My progress" },
  { href: "/privacy", label: "Privacy" },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  useEffect(() => setOpen(false), [path]);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("noorpath:theme", next); } catch { /* ignore */ }
    setDark(!dark);
  };
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="Noor Path home"><Logo /></Link>
        <nav className="hidden items-center gap-1 rounded-full border border-line bg-surface/70 p-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active(n.href) ? "bg-blue text-white shadow-soft" : "text-muted hover:text-ink"}`}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost !h-11 !w-11 !rounded-full !p-0" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? "☀" : "☾"}</button>
          <button className="btn btn-ghost !h-11 !w-11 !rounded-full !p-0 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">{open ? "✕" : "☰"}</button>
        </div>
      </div>
      {open && (
        <nav className="container-page grid gap-1 pb-4 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-2xl px-4 py-3 font-semibold ${active(n.href) ? "bg-blue text-white" : "hover:bg-blue/10"}`}>{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}