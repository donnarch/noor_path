import type { Lesson, Step } from "./schema";

/* Every lesson is marked "needs_review" and has no sources yet. A qualified reviewer must check and
   reference each one before it is marked approved. Do not publish unreviewed religious content as final. */
const S = (title: string, body: string, say?: string): Step => ({ title, body, say });
const lesson = (id: string, title: string, topic: string, summary: string, steps: Step[]): Lesson =>
  ({ id, title, topic, summary, status: "needs_review", schools: "all", sources: [], steps });

export const lessons: Lesson[] = [
  lesson("wudu", "Wudu: washing before prayer", "Purification", "The order of wudu, step by step.", [
    S("Start with intention", "Intend in your heart to purify yourself for prayer, and say Bismillah (In the name of God)."),
    S("Wash your hands", "Wash both hands up to the wrists, three times."),
    S("Rinse your mouth", "Take water into your mouth and rinse, three times."),
    S("Clean your nose", "Sniff a little water into your nose and blow it out, three times."),
    S("Wash your face", "Wash your whole face from hairline to chin, three times."),
    S("Wash your arms", "Wash the right arm up to the elbow, then the left, three times each."),
    S("Wipe your head", "Wipe over your head once with wet hands."),
    S("Wipe your ears", "Wipe the inside and back of your ears once."),
    S("Wash your feet", "Wash the right foot up to the ankle, then the left, three times each."),
  ]),
  lesson("salah-positions", "Salah: the prayer positions", "Prayer", "Nine steps for one cycle of prayer.", [
    S("Intention", "Decide in your heart which prayer you are about to perform. Nothing needs to be said aloud."),
    S("Opening takbir", "Raise your hands to your ears or shoulders.", "Allahu Akbar (God is the Greatest)"),
    S("Standing (qiyam)", "Fold your hands and recite Al-Fatiha and another short surah."),
    S("Bowing (ruku)", "Bow with your back level and your hands on your knees.", "Subhana Rabbiyal ‘Azim, three times (Glory to my Lord, the Mighty)"),
    S("Rising", "Stand up straight again.", "Sami‘a Allahu liman hamidah (Allah hears those who praise Him)"),
    S("Prostration (sujood)", "Place forehead, nose, both palms, both knees and toes on the ground.", "Subhana Rabbiyal A‘la, three times (Glory to my Lord, the Most High)"),
    S("Sitting (jalsa)", "Rise from sujood with takbir, sit calmly, then do a second sujood.", "Allahu Akbar"),
    S("Final sitting (tashahhud)", "After the last rak‘ah, sit and recite the tashahhud and prayers upon the Prophet."),
    S("Salam", "Turn your head to the right, then to the left.", "As-salamu ‘alaykum wa rahmatullah"),
  ]),
  lesson("daily-prayers", "The five daily prayers", "Prayer", "Names, times of day and number of rak‘ahs.", [
    S("Fajr", "The dawn prayer. Two rak‘ahs."), S("Dhuhr", "The midday prayer. Four rak‘ahs."), S("Asr", "The afternoon prayer. Four rak‘ahs."),
    S("Maghrib", "The prayer just after sunset. Three rak‘ahs."), S("Isha", "The night prayer. Four rak‘ahs."),
    S("A note on times", "Exact times change with your location and the season. Use the prayer times tool and your local mosque."),
  ]),
  lesson("pillars", "The five pillars of Islam", "Basics", "The core acts of worship.", [
    S("Shahada", "Declaring that there is no god but God and that Muhammad is His messenger. This is how a person enters Islam.", "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasul Allah"),
    S("Salah", "The five daily prayers."), S("Zakat", "Giving a fixed share of qualifying wealth to people in need."),
    S("Sawm", "Fasting in the month of Ramadan."), S("Hajj", "The pilgrimage to Makkah, once in a lifetime for those who are able."),
  ]),
  lesson("faith", "The six articles of faith", "Basics", "What Muslims believe.", [
    S("Belief in God", "God is One, with no partners, the Creator and Sustainer of everything."),
    S("Belief in the angels", "Angels are beings created from light who obey God. Jibril (Gabriel) brought revelation to the prophets."),
    S("Belief in the revealed books", "God sent guidance through the prophets, including the Tawrah (Torah), Zabur (Psalms), Injil (Gospel) and the Quran."),
    S("Belief in the prophets", "God sent messengers to every people. Muslims honour them all and believe Muhammad was the last."),
    S("Belief in the Last Day", "Every person will be resurrected and held to account for their deeds."),
    S("Belief in divine decree", "Nothing happens outside God’s knowledge. People still choose their actions and are responsible for them."),
  ]),
  lesson("ramadan", "Ramadan and fasting", "Worship", "What fasting is and who may be excused.", [
    S("What fasting means", "From dawn (Fajr) until sunset (Maghrib), a Muslim avoids food, drink and marital relations, and also guards the tongue, eyes and behaviour."),
    S("Suhoor and iftar", "The fast begins with the intention, often after a pre-dawn meal (suhoor), and is broken at sunset with iftar."),
    S("Who may be excused", "The sick, travellers, women during menstruation or postnatal bleeding, and sometimes those who are pregnant or nursing. Missed days are usually made up later. Ask a scholar about your case."),
    S("Special nights", "Laylat al-Qadr, the Night of Power, is sought in the last ten nights. Many Muslims pray extra night prayers (Taraweeh)."),
    S("Eid al-Fitr", "The month ends with Eid. Zakat al-Fitr is given before the Eid prayer."),
  ]),
  lesson("zakat", "Zakat: obligatory charity", "Worship", "Who gives, how much and who receives.", [
    S("What it is", "Muslims whose savings stay above a minimum amount (the nisab) for one lunar year give 2.5% of those savings."),
    S("The nisab", "It is based on the value of gold or silver, so check the current figure with a trusted source."),
    S("Who can receive it", "The poor, the needy, those who collect zakat, those whose hearts are to be reconciled, freeing captives, those in debt, in the cause of God, and travellers in need."),
    S("Try the calculator", "The Tools page has a zakat estimator. It is a guide, not a ruling."),
  ]),
  lesson("hajj", "Hajj and Umrah", "Worship", "The steps of the pilgrimage.", [
    S("Enter ihram", "Make the intention and wear the simple ihram clothing at the meeting point (miqat)."),
    S("Tawaf", "Walk seven times around the Kaaba."), S("Sa‘i", "Walk seven times between the hills of Safa and Marwa."),
    S("Arafah", "On the 9th of Dhul Hijjah, stand in prayer and supplication on the plain of Arafah (Hajj only)."),
    S("Muzdalifah and Mina", "Gather pebbles at Muzdalifah, then throw them at the pillars in Mina (Hajj only)."),
    S("Sacrifice and shaving", "Offer the sacrifice, then shave or trim the hair."), S("Farewell tawaf", "Circle the Kaaba one last time before leaving Makkah."),
    S("Umrah", "Umrah is the shorter pilgrimage: ihram, tawaf, sa‘i, then shaving or trimming. It can be done at any time of year."),
  ]),
  lesson("seerah", "The life of Prophet Muhammad ﷺ", "History", "A short timeline. Dates are approximate (CE).", [
    S("570", "Born in Makkah."), S("610", "The first revelation comes in the Cave of Hira."), S("613", "He begins to call people openly to Islam."),
    S("622", "The Hijra: migration to Madinah. The Islamic calendar begins here."), S("624", "The Battle of Badr."), S("628", "The Treaty of Hudaybiyyah."),
    S("630", "Makkah opens peacefully to the Muslims."), S("632", "The Farewell Pilgrimage, and his passing in Madinah."),
  ]),
  lesson("manners", "Islamic manners", "Character", "Everyday character and etiquette.", [
    S("Truthfulness", "Be honest in speech and business, and keep your promises."), S("Parents and family", "Honour your parents, be kind to relatives and keep family ties."),
    S("Neighbours and guests", "Treat neighbours well and welcome guests generously."), S("Words", "Avoid backbiting, mockery and harsh speech. Greet others with “As-salamu ‘alaykum”."),
    S("Cleanliness", "Keep your body, clothes and surroundings clean."), S("Eating and drinking", "Say Bismillah, eat with your right hand and avoid waste."),
  ]),
];

export const getLesson = (id: string) => lessons.find((l) => l.id === id);