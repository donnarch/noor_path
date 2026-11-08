import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="h-display">Privacy</h1>
      <div className="mt-8 grid gap-6 text-lg">
        <section><h2 className="text-xl font-bold">What is stored</h2><p className="mt-1 text-muted">Your completed lessons, the lesson you opened last, your theme and your Hijri date adjustment.</p></section>
        <section><h2 className="text-xl font-bold">Where it is stored</h2><p className="mt-1 text-muted">Only in this browser, on this device. There are no accounts and no cloud database. Clearing your browser data removes it.</p></section>
        <section><h2 className="text-xl font-bold">Camera and recordings</h2><p className="mt-1 text-muted">Salah Vision uses your camera only after you turn it on. Frames are analysed on your device and are never uploaded. Photos and video of a session stay in your browser’s memory, are not saved unless you download them, and are deleted when you finish or leave. The camera turns off when you finish or leave the page. The pose model is a file that is downloaded to your device; no images are sent with it.</p></section>
        <section><h2 className="text-xl font-bold">Deleting your information</h2><p className="mt-1 text-muted">Use “My progress” to export a backup, reset progress or delete all data from this browser.</p></section>
        <section><h2 className="text-xl font-bold">Tracking</h2><p className="mt-1 text-muted">Noor Path uses no analytics or third-party tracking.</p></section>
      </div>
    </div>
  );
}
