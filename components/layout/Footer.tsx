import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-line/70 bg-surface/40 pb-24 md:pb-0">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">Learn. Practise. Understand. Grow. Noor Path is an educational resource. It does not replace a qualified teacher or scholar.</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
          <p className="font-bold">Explore</p>
          <Link href="/learn" className="text-muted hover:text-ink">Learn</Link>
          <Link href="/arabic" className="text-muted hover:text-ink">Arabic Studio</Link>
          <Link href="/salah-vision" className="text-muted hover:text-ink">Salah Vision</Link>
          <Link href="/tools" className="text-muted hover:text-ink">Tools</Link>
        </nav>
        <nav aria-label="More" className="grid content-start gap-2 text-sm">
          <p className="font-bold">More</p>
          <Link href="/progress" className="text-muted hover:text-ink">My progress</Link>
          <Link href="/donate" className="text-muted hover:text-ink">Donate</Link>
          <Link href="/privacy" className="text-muted hover:text-ink">Privacy</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold">Your privacy</p>
          <p className="text-muted">No account. Progress stays on your device. Camera frames are never uploaded.</p>
        </div>
      </div>
    </footer>
  );
}