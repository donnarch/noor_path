import type { Metadata } from "next";
import Tools from "@/features/tools/Tools";
export const metadata: Metadata = { title: "Tools", description: "Prayer times, qibla, tasbih, zakat calculator and Islamic calendar." };
export default function Page() { return <Tools />; }