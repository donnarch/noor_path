import type { Lesson } from "./schema";

/* Phase 1 content. Every lesson is marked "needs_review" and has no sources yet:
   a qualified reviewer must check and reference it before it is marked approved. */
export const lessons: Lesson[] = [
  {
    id: "wudu",
    title: "Wudu: washing before prayer",
    topic: "Purification",
    summary: "The order of wudu, step by step.",
    status: "needs_review",
    schools: "all",
    sources: [],
    steps: [
      { title: "Start with intention", body: "Intend in your heart to purify yourself for prayer, and say Bismillah (In the name of God)." },
      { title: "Wash your hands", body: "Wash both hands up to the wrists, three times." },
      { title: "Rinse your mouth", body: "Take water into your mouth and rinse, three times." },
      { title: "Clean your nose", body: "Sniff a little water into your nose and blow it out, three times." },
      { title: "Wash your face", body: "Wash your whole face from hairline to chin, three times." },
      { title: "Wash your arms", body: "Wash the right arm up to the elbow, then the left, three times each." },
      { title: "Wipe your head", body: "Wipe over your head once with wet hands." },
      { title: "Wipe your ears", body: "Wipe the inside and back of your ears once." },
      { title: "Wash your feet", body: "Wash the right foot up to the ankle, then the left, three times each." },
    ],
  },
  {
    id: "salah-positions",
    title: "Salah: the prayer positions",
    topic: "Prayer",
    summary: "Nine steps for one cycle of prayer.",
    status: "needs_review",
    schools: "all",
    sources: [],
    steps: [
      { title: "Intention", body: "Decide in your heart which prayer you are about to perform. Nothing needs to be said aloud." },
      { title: "Opening takbir", body: "Raise your hands to your ears or shoulders.", say: "Allahu Akbar (God is the Greatest)" },
      { title: "Standing (qiyam)", body: "Fold your hands and recite Al-Fatiha and another short surah." },
      { title: "Bowing (ruku)", body: "Bow with your back level and your hands on your knees.", say: "Subhana Rabbiyal ‘Azim, three times (Glory to my Lord, the Mighty)" },
      { title: "Rising", body: "Stand up straight again.", say: "Sami‘a Allahu liman hamidah (Allah hears those who praise Him)" },
      { title: "Prostration (sujood)", body: "Place forehead, nose, both palms, both knees and toes on the ground.", say: "Subhana Rabbiyal A‘la, three times (Glory to my Lord, the Most High)" },
      { title: "Sitting (jalsa)", body: "Rise from sujood with takbir, sit calmly, then do a second sujood.", say: "Allahu Akbar" },
      { title: "Final sitting (tashahhud)", body: "After the last rak‘ah, sit and recite the tashahhud and prayers upon the Prophet." },
      { title: "Salam", body: "Turn your head to the right, then to the left.", say: "As-salamu ‘alaykum wa rahmatullah" },
    ],
  },
];

export const getLesson = (id: string) => lessons.find((l) => l.id === id);
