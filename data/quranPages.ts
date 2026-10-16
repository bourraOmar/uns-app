export interface VerseToken {
  type: 'text' | 'verse';
  text?: string;
  number?: number;
}

export interface QuranLine {
  tokens: VerseToken[];
}

export interface StandardVerse {
  number: number;
  text: string;
}

export interface PreloadedPage {
  pageNumber: number;
  surahId: number;
  surahName: string;
  juzNumber: number;
  hizbNumber?: number;
  hasBanner: boolean;
  bannerTitle: string;
  hasBasmalah: boolean;
  basmalahWithAyah?: number | null;
  isCustomCentered: boolean;
  lines?: QuranLine[];
  verses?: StandardVerse[];
}

export const FATIHA_LINES: QuranLine[] = [
  {
    tokens: [
      { type: 'text', text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ' },
      { type: 'verse', number: 2 },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
      { type: 'verse', number: 3 },
      { type: 'text', text: ' مَـٰلِكِ يَوْمِ ٱلدِّينِ' },
      { type: 'verse', number: 4 },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
      { type: 'verse', number: 5 },
      { type: 'text', text: ' ٱهْدِنَا' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ' },
      { type: 'verse', number: 6 },
      { type: 'text', text: ' صِرَاطَ ٱلَّذِينَ أَنْعَمْتَ' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'وَلَا ٱلضَّآلِّينَ' },
      { type: 'verse', number: 7 },
    ],
  },
];

export const BAQARAH_1_5_LINES: QuranLine[] = [
  {
    tokens: [
      { type: 'text', text: 'الۤمۤ' },
      { type: 'verse', number: 1 },
      { type: 'text', text: ' ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'لِّلْمُتَّقِينَ' },
      { type: 'verse', number: 2 },
      { type: 'text', text: ' ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ' },
      { type: 'verse', number: 3 },
      { type: 'text', text: ' وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ' },
      { type: 'verse', number: 4 },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ' },
    ],
  },
  {
    tokens: [
      { type: 'text', text: 'هُمُ ٱلْمُفْلِحُونَ' },
      { type: 'verse', number: 5 },
    ],
  },
];

export const PAGE_3_VERSES: StandardVerse[] = [
  { number: 6, text: 'إِنَّ ٱلَّذِينَ كَفَرُوا۟ سَوَآءٌ عَلَيْهِمْ ءَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ' },
  { number: 7, text: 'خَتَمَ ٱللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰٓ أَبْصَـٰرِهِمْ غِشَـٰوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ' },
  { number: 8, text: 'وَمِنَ ٱلنَّاسِ مَن يَقُولُ ءَامَنَّا بِٱللَّهِ وَبِٱلْيَوْمِ ٱلْـَٔاخِرِ وَمَا هُم بِمُؤْمِنِينَ' },
  { number: 9, text: 'يُخَـٰدِعُونَ ٱللَّهَ وَٱلَّذِينَ ءَامَنُوا۟ وَمَا يَخْدَعُونَ إِلَّآ أَنفُسَهُمْ وَمَا يَشْعُرُونَ' },
  { number: 10, text: 'فِى قُلُوبِهِم مَّرَضٌ فَزَادَهُمُ ٱللَّهُ مَرَضًا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يَكْذِبُونَ' },
  { number: 11, text: 'وَإِذَا قِيلَ لَهُمْ لَا تُفْسِدُوا۟ فِى ٱلْأَرْضِ قَالُوٓا۟ إِنَّمَا نَحْنُ مُصْلِحُونَ' },
  { number: 12, text: 'أَلَآ إِنَّهُمْ هُمُ ٱلْمُفْسِدُونَ وَلَـٰكِن لَّا يَشْعُرُونَ' },
  { number: 13, text: 'وَإِذَا قِيلَ لَهُمْ ءَامِنُوا۟ كَمَآ ءَامَنَ ٱلنَّاسُ قَالُوٓا۟ أَنُؤْمِنُ كَمَآ ءَامَنَ ٱلسُّفَهَآءُ ۗ أَلَآ إِنَّهُمْ هُمُ ٱلسُّفَهَآءُ وَلَـٰكِن لَّا يَعْلَمُونَ' },
  { number: 14, text: 'وَإِذَا لَقُوا۟ ٱلَّذِينَ ءَامَنُوا۟ قَالُوٓا۟ ءَامَنَّا وَإِذَا خَلَوْا۟ إِلَىٰ شَيَـٰطِينِهِمْ قَالُوٓا۟ إِنَّا مَعَكُمْ إِنَّمَا نَحْنُ مُسْتَهْزِءُونَ' },
  { number: 15, text: 'ٱللَّهُ يَسْتَهْزِئُ بِهِمْ وَيَمُدُّهُمْ فِى طُغْيَـٰنِهِمْ يَعْمَهُونَ' },
  { number: 16, text: 'أُو۟لَـٰٓئِكَ ٱلَّذِينَ ٱشْتَرَوُا۟ ٱلضَّلَـٰلَةَ بِٱلْهُدَىٰ فَمَا رَبِحَت تِّجَـٰرَتُهُمْ وَمَا كَانُوا۟ مُهْتَدِينَ' },
];

export const PRELOADED_PAGES: Record<number, PreloadedPage> = {
  1: {
    pageNumber: 1,
    surahId: 1,
    surahName: 'سُورَةُ الفَاتِحَةِ',
    juzNumber: 1,
    hizbNumber: 1,
    hasBanner: true,
    bannerTitle: 'سُورَةُ الفَاتِحَةِ',
    hasBasmalah: true,
    basmalahWithAyah: 1,
    isCustomCentered: true,
    lines: FATIHA_LINES,
  },
  2: {
    pageNumber: 2,
    surahId: 2,
    surahName: 'سُورَةُ البَقَرَةِ',
    juzNumber: 1,
    hizbNumber: 1,
    hasBanner: true,
    bannerTitle: 'سُورَةُ البَقَرَةِ',
    hasBasmalah: true,
    basmalahWithAyah: null,
    isCustomCentered: true,
    lines: BAQARAH_1_5_LINES,
  },
  3: {
    pageNumber: 3,
    surahId: 2,
    surahName: 'سُورَةُ البَقَرَةِ',
    juzNumber: 1,
    hizbNumber: 1,
    hasBanner: false,
    bannerTitle: '',
    hasBasmalah: false,
    basmalahWithAyah: null,
    isCustomCentered: false,
    verses: PAGE_3_VERSES,
  },
};

export const toEasternArabicNumerals = (num: number | string): string => {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => easternDigits[parseInt(d, 10)]);
};
