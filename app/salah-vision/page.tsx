import type { Metadata } from "next";
import SalahVision from "@/features/salah-vision/SalahVision";
export const metadata: Metadata = { title: "Salah Vision", description: "Practise prayer positions with a live skeleton and review moments afterwards." };
export default function Page() { return <SalahVision />; }
