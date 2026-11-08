import { z } from "zod";

export const ProgressSchema = z.object({
  version: z.literal(1),
  completed: z.record(z.string(), z.number()),
  last: z.object({ id: z.string(), title: z.string(), at: z.number() }).nullable(),
  saved: z.array(z.string()),
  sessions: z.array(z.object({ id: z.string(), kind: z.string(), at: z.number(), seconds: z.number(), note: z.string().optional() })),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const emptyProgress = (): Progress => ({ version: 1, completed: {}, last: null, saved: [], sessions: [] });

export function parseProgress(raw: unknown): Progress | null {
  const r = ProgressSchema.safeParse(raw);
  return r.success ? r.data : null;
}
