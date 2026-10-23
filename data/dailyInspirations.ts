export interface DailyAyah {
  surahId: number;
  surahName: string;
  verseNumber: number;
  arabicVerseNumber: string;
  text: string;
  reference: string;
}

export interface DailyHadith {
  text: string;
  source: string;
}

export interface DailyDua {
  text: string;
  source: string;
}

export interface DailyInspirationSet {
  ayah: DailyAyah;
  hadith: DailyHadith;
  dua: DailyDua;
}

export const DAILY_AYAHS: DailyAyah[] = [
  {
    surahId: 39,
    surahName: 'الزمر',
    verseNumber: 53,
    arabicVerseNumber: '٥٣',
    text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
    reference: 'الزمر: 53',
  },
  {
    surahId: 2,
    surahName: 'البقرة',
    verseNumber: 152,
    arabicVerseNumber: '١٥٢',
    text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    reference: 'البقرة: 152',
  },
  {
    surahId: 2,
    surahName: 'البقرة',
    verseNumber: 186,
    arabicVerseNumber: '١٨٦',
    text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    reference: 'البقرة: 186',
  },
  {
    surahId: 65,
    surahName: 'الطلاق',
    verseNumber: 3,
    arabicVerseNumber: '٣',
    text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
    reference: 'الطلاق: 3',
  },
  {
    surahId: 94,
    surahName: 'الشرح',
    verseNumber: 6,
    arabicVerseNumber: '٦',
    text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    reference: 'الشرح: 6',
  },
  {
    surahId: 13,
    surahName: 'الرعد',
    verseNumber: 28,
    arabicVerseNumber: '٢٨',
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    reference: 'الرعد: 28',
  },
  {
    surahId: 3,
    surahName: 'آل عمران',
    verseNumber: 159,
    arabicVerseNumber: '١٥٩',
    text: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ',
    reference: 'آل عمران: 159',
  },
  {
    surahId: 14,
    surahName: 'إبراهيم',
    verseNumber: 7,
    arabicVerseNumber: '٧',
    text: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    reference: 'إبراهيم: 7',
  },
  {
    surahId: 21,
    surahName: 'الأنبياء',
    verseNumber: 87,
    arabicVerseNumber: '٨٧',
    text: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    reference: 'الأنبياء: 87',
  },
  {
    surahId: 9,
    surahName: 'التوبة',
    verseNumber: 129,
    arabicVerseNumber: '١٢٩',
    text: 'فَإِن تَوَلَّوْا فَقُلْ حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    reference: 'التوبة: 129',
  },
];

export const DAILY_HADITHS: DailyHadith[] = [
  {
    text: 'قَالَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: «يَسِّرُوا وَلَا تُعَسِّرُوا، وَسَكِّنُوا وَلَا تُنَفِّرُوا».',
    source: 'صحيح البخاري',
  },
  {
    text: 'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ».',
    source: 'صحيح مسلم',
  },
  {
    text: 'قَالَ النَّبِيُّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ».',
    source: 'صحيح البخاري',
  },
  {
    text: 'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «كَلِمَتَانِ حَبِيبَتَانِ إِلَى الرَّحْمَنِ، خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ».',
    source: 'متفق عليه',
  },
  {
    text: 'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ».',
    source: 'سنن الترمذي',
  },
  {
    text: 'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى».',
    source: 'متفق عليه',
  },
  {
    text: 'قَالَ النَّبِيُّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ تَعَالَى أَدْوَمُهَا وَإِنْ قَلَّ».',
    source: 'صحيح مسلم',
  },
  {
    text: 'قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ».',
    source: 'صحيح مسلم',
  },
];

export const DAILY_DUAS: DailyDua[] = [
  {
    text: 'رَبِّ أَسْأَلُكَ تَوْبَةً تَجُبُّ مَا قَبْلَهَا مِنَ الذُّنُوبِ، وَتُصْلِحُ مَا بَعْدَهَا مِنَ الأَعْمَالِ.',
    source: 'دعاء مأثور',
  },
  {
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.',
    source: 'سنن ابن ماجه',
  },
  {
    text: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ.',
    source: 'سنن الترمذي',
  },
  {
    text: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.',
    source: 'جامع الترمذي',
  },
  {
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
    source: 'سورة البقرة: 201',
  },
  {
    text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ.',
    source: 'سنن أبي داود',
  },
  {
    text: 'رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي.',
    source: 'سورة طه: 25-28',
  },
  {
    text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ.',
    source: 'صحيح البخاري',
  },
];

/**
 * Returns today's dynamic inspiration set deterministically based on date
 */
export function getDailyInspirations(date: Date = new Date()): DailyInspirationSet {
  // Calculate day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const ayahIndex = dayOfYear % DAILY_AYAHS.length;
  const hadithIndex = dayOfYear % DAILY_HADITHS.length;
  const duaIndex = dayOfYear % DAILY_DUAS.length;

  return {
    ayah: DAILY_AYAHS[ayahIndex],
    hadith: DAILY_HADITHS[hadithIndex],
    dua: DAILY_DUAS[duaIndex],
  };
}
