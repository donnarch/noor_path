/** Hijri date via the browser's Umm al-Qura calendar, with a manual offset in days (-2..+2). */
export function hijriDate(d: Date = new Date(), offsetDays = 0, locale = "en"): string {
  const x = new Date(d.getTime() + offsetDays * 86_400_000);
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { day: "numeric", month: "long", year: "numeric" }).format(x);
  } catch { return ""; }
}
const K = "noorpath:hijriOffset";
export const getHijriOffset = (): number => { try { return Math.max(-2, Math.min(2, parseInt(localStorage.getItem(K) ?? "0", 10) || 0)); } catch { return 0; } };
export const setHijriOffset = (n: number) => { try { localStorage.setItem(K, String(n)); } catch { /* ignore */ } };
