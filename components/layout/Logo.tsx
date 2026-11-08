export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/logo-mark.png" alt="" width={size} height={size} style={{ width: size, height: size }} className="rounded-xl object-cover ring-1 ring-line" />
  );
}
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight">Noor <span className="text-gradient">Path</span></span>
    </span>
  );
}