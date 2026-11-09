import type { Metadata } from "next";
import ArabicStudio from "@/features/arabic/ArabicStudio";
export const metadata: Metadata = { title: "Arabic Studio", description: "Learn the Arabic letters, their forms and vowel marks, and test yourself." };
export default function Page() { return <ArabicStudio />; }