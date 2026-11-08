"use client";
import { useEffect, useState } from "react";
import { getHijriOffset, hijriDate } from "@/lib/hijri";

export function Welcome() {
  const [d, setD] = useState<{ g: string; h: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    setD({ g: now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), h: hijriDate(now, getHijriOffset()) });
  }, []);
  return (
    <p className="min-h-[1.5rem] text-sm text-muted">{d ? <>{d.g}{d.h && <> · {d.h} AH</>}</> : "\u00a0"}</p>
  );
}
