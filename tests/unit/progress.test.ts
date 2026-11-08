import { describe, expect, it } from "vitest";
import { emptyProgress, parseProgress } from "@/lib/storage/schema";
import { hijriDate } from "@/lib/hijri";

describe("progress schema", () => {
  it("accepts an empty progress object", () => expect(parseProgress(emptyProgress())).toEqual(emptyProgress()));
  it("accepts a populated backup", () => {
    const p = { ...emptyProgress(), completed: { wudu: 1 }, last: { id: "wudu", title: "Wudu", at: 2 } };
    expect(parseProgress(p)).toEqual(p);
  });
  it("rejects wrong versions and malformed data", () => {
    expect(parseProgress({ ...emptyProgress(), version: 2 })).toBeNull();
    expect(parseProgress({ completed: "x" })).toBeNull();
    expect(parseProgress(null)).toBeNull();
  });
});

describe("hijriDate", () => {
  it("applies the day offset", () => {
    const d = new Date("2026-03-01T12:00:00Z");
    expect(hijriDate(d, 0)).not.toEqual(hijriDate(d, 2));
    expect(hijriDate(d, 0)).toMatch(/\d{4}/);
  });
});
