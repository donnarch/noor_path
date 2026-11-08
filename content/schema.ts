export type ReviewStatus = "draft" | "needs_review" | "reviewed" | "approved";
export interface Step { title: string; body: string; say?: string }
export interface Source { label: string; url?: string }
export interface Lesson {
  id: string;
  title: string;
  topic: string;
  summary: string;
  status: ReviewStatus;
  schools: "all" | string[];
  sources: Source[];
  lastReviewed?: string;
  steps: Step[];
}
export const STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: "Draft",
  needs_review: "Awaiting scholarly review",
  reviewed: "Reviewed",
  approved: "Approved",
};
