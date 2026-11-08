"use client";
import { useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, type Progress } from "./schema";
import { idbClear } from "./idb";

const KEY = "noorpath:progress";
const EMPTY = emptyProgress();
let cache: Progress | null = null;
const subs = new Set<() => void>();

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = parseProgress(JSON.parse(raw)); if (p) return p; }
  } catch { /* storage unavailable or corrupted: start fresh */ }
  return emptyProgress();
}
export const getProgress = (): Progress => (cache ??= load());
const emit = () => subs.forEach((f) => f());

function commit(next: Progress) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore quota errors */ }
  emit();
}
export function updateProgress(fn: (p: Progress) => Progress) { commit(fn(getProgress())); }
export const useProgress = (): Progress =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getProgress, () => EMPTY);

export const markLast = (id: string, title: string) => updateProgress((p) => ({ ...p, last: { id, title, at: Date.now() } }));
export function toggleComplete(id: string) {
  updateProgress((p) => {
    const completed = { ...p.completed };
    if (completed[id]) delete completed[id]; else completed[id] = Date.now();
    return { ...p, completed };
  });
}
export const exportProgress = () => JSON.stringify(getProgress(), null, 2);
export function importProgress(text: string): boolean {
  try { const p = parseProgress(JSON.parse(text)); if (!p) return false; commit(p); return true; } catch { return false; }
}
export const resetProgress = () => commit(emptyProgress());
/** Deletes progress, saved recordings and preferences from this browser. */
export async function deleteAllData() {
  commit(emptyProgress());
  try { await idbClear(); } catch { /* no IndexedDB */ }
  try { localStorage.removeItem("noorpath:hijriOffset"); localStorage.removeItem("noorpath:theme"); } catch { /* ignore */ }
}
