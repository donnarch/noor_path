import type { Metadata } from "next";
import { DataControls } from "@/components/progress/DataControls";
export const metadata: Metadata = { title: "My progress" };
export default function Progress() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="h-display">My progress</h1>
      <p className="mt-3 text-lg text-muted">This is your own record. It is not a score, and nobody else can see it.</p>
      <div className="mt-8"><DataControls /></div>
    </div>
  );
}
