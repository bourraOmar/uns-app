export interface ChapterMeta {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
  start_page: number;
  end_page: number;
}

export const QURAN_CHAPTERS: ChapterMeta[] = [
  {
    "id": 1,
    "name_arabic": "الفاتحة",
    "name_simple": "Al-Fatihah",
    "verses_count": 7,
    "revelation_place": "makkah",
    "bismillah_pre": false,
    "start_page": 1,
    "end_page": 1
  },
  {
    "id": 2,
    "name_arabic": "البقرة",
    "name_simple": "Al-Baqarah",
    "verses_count": 286,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 2,
    "end_page": 49
  },
  {
    "id": 3,
    "name_arabic": "آل عمران",
    "name_simple": "Ali 'Imran",
    "verses_count": 200,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 50,
    "end_page": 76
  },
  {
    "id": 4,
    "name_arabic": "النساء",
    "name_simple": "An-Nisa",
    "verses_count": 176,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 77,
    "end_page": 106
  },
  {
    "id": 5,
    "name_arabic": "المائدة",
    "name_simple": "Al-Ma'idah",
    "verses_count": 120,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 106,
    "end_page": 127
  },
  {
    "id": 6,
    "name_arabic": "الأنعام",
    "name_simple": "Al-An'am",
    "verses_count": 165,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 128,
    "end_page": 150
  },
  {
    "id": 7,
    "name_arabic": "الأعراف",
    "name_simple": "Al-A'raf",
    "verses_count": 206,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 151,
    "end_page": 176
  },
  {
    "id": 8,
    "name_arabic": "الأنفال",
    "name_simple": "Al-Anfal",
    "verses_count": 75,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 177,
    "end_page": 186
  },
  {
    "id": 9,
    "name_arabic": "التوبة",
    "name_simple": "At-Tawbah",
    "verses_count": 129,
    "revelation_place": "madinah",
    "bismillah_pre": false,
    "start_page": 187,
    "end_page": 207
  },
  {
    "id": 10,
    "name_arabic": "يونس",
    "name_simple": "Yunus",
    "verses_count": 109,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 208,
    "end_page": 221
  },
  {
    "id": 11,
    "name_arabic": "هود",
    "name_simple": "Hud",
    "verses_count": 123,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 221,
    "end_page": 235
  },
  {
    "id": 12,
    "name_arabic": "يوسف",
    "name_simple": "Yusuf",
    "verses_count": 111,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 235,
    "end_page": 248
  },
  {
    "id": 13,
    "name_arabic": "الرعد",
    "name_simple": "Ar-Ra'd",
    "verses_count": 43,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 249,
    "end_page": 255
  },
  {
    "id": 14,
    "name_arabic": "ابراهيم",
    "name_simple": "Ibrahim",
    "verses_count": 52,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 255,
    "end_page": 261
  },
  {
    "id": 15,
    "name_arabic": "الحجر",
    "name_simple": "Al-Hijr",
    "verses_count": 99,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 262,
    "end_page": 267
  },
  {
    "id": 16,
    "name_arabic": "النحل",
    "name_simple": "An-Nahl",
    "verses_count": 128,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 267,
    "end_page": 281
  },
  {
    "id": 17,
    "name_arabic": "الإسراء",
    "name_simple": "Al-Isra",
    "verses_count": 111,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 282,
    "end_page": 293
  },
  {
    "id": 18,
    "name_arabic": "الكهف",
    "name_simple": "Al-Kahf",
    "verses_count": 110,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 293,
    "end_page": 304
  },
  {
    "id": 19,
    "name_arabic": "مريم",
    "name_simple": "Maryam",
    "verses_count": 98,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 305,
    "end_page": 312
  },
  {
    "id": 20,
    "name_arabic": "طه",
    "name_simple": "Taha",
    "verses_count": 135,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 312,
    "end_page": 321
  },
  {
    "id": 21,
    "name_arabic": "الأنبياء",
    "name_simple": "Al-Anbya",
    "verses_count": 112,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 322,
    "end_page": 331
  },
  {
    "id": 22,
    "name_arabic": "الحج",
    "name_simple": "Al-Hajj",
    "verses_count": 78,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 332,
    "end_page": 341
  },
  {
    "id": 23,
    "name_arabic": "المؤمنون",
    "name_simple": "Al-Mu'minun",
    "verses_count": 118,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 342,
    "end_page": 349
  },
  {
    "id": 24,
    "name_arabic": "النور",
    "name_simple": "An-Nur",
    "verses_count": 64,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 350,
    "end_page": 359
  },
  {
    "id": 25,
    "name_arabic": "الفرقان",
    "name_simple": "Al-Furqan",
    "verses_count": 77,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 359,
    "end_page": 366
  },
  {
    "id": 26,
    "name_arabic": "الشعراء",
    "name_simple": "Ash-Shu'ara",
    "verses_count": 227,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 367,
    "end_page": 376
  },
  {
    "id": 27,
    "name_arabic": "النمل",
    "name_simple": "An-Naml",
    "verses_count": 93,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 377,
    "end_page": 385
  },
  {
    "id": 28,
    "name_arabic": "القصص",
    "name_simple": "Al-Qasas",
    "verses_count": 88,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 385,
    "end_page": 396
  },
  {
    "id": 29,
    "name_arabic": "العنكبوت",
    "name_simple": "Al-'Ankabut",
    "verses_count": 69,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 396,
    "end_page": 404
  },
  {
    "id": 30,
    "name_arabic": "الروم",
    "name_simple": "Ar-Rum",
    "verses_count": 60,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 404,
    "end_page": 410
  },
  {
    "id": 31,
    "name_arabic": "لقمان",
    "name_simple": "Luqman",
    "verses_count": 34,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 411,
    "end_page": 414
  },
  {
    "id": 32,
    "name_arabic": "السجدة",
    "name_simple": "As-Sajdah",
    "verses_count": 30,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 415,
    "end_page": 417
  },
  {
    "id": 33,
    "name_arabic": "الأحزاب",
    "name_simple": "Al-Ahzab",
    "verses_count": 73,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 418,
    "end_page": 427
  },
  {
    "id": 34,
    "name_arabic": "سبإ",
    "name_simple": "Saba",
    "verses_count": 54,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 428,
    "end_page": 434
  },
  {
    "id": 35,
    "name_arabic": "فاطر",
    "name_simple": "Fatir",
    "verses_count": 45,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 434,
    "end_page": 440
  },
  {
    "id": 36,
    "name_arabic": "يس",
    "name_simple": "Ya-Sin",
    "verses_count": 83,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 440,
    "end_page": 445
  },
  {
    "id": 37,
    "name_arabic": "الصافات",
    "name_simple": "As-Saffat",
    "verses_count": 182,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 446,
    "end_page": 452
  },
  {
    "id": 38,
    "name_arabic": "ص",
    "name_simple": "Sad",
    "verses_count": 88,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 453,
    "end_page": 458
  },
  {
    "id": 39,
    "name_arabic": "الزمر",
    "name_simple": "Az-Zumar",
    "verses_count": 75,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 458,
    "end_page": 467
  },
  {
    "id": 40,
    "name_arabic": "غافر",
    "name_simple": "Ghafir",
    "verses_count": 85,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 467,
    "end_page": 476
  },
  {
    "id": 41,
    "name_arabic": "فصلت",
    "name_simple": "Fussilat",
    "verses_count": 54,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 477,
    "end_page": 482
  },
  {
    "id": 42,
    "name_arabic": "الشورى",
    "name_simple": "Ash-Shuraa",
    "verses_count": 53,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 483,
    "end_page": 489
  },
  {
    "id": 43,
    "name_arabic": "الزخرف",
    "name_simple": "Az-Zukhruf",
    "verses_count": 89,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 489,
    "end_page": 495
  },
  {
    "id": 44,
    "name_arabic": "الدخان",
    "name_simple": "Ad-Dukhan",
    "verses_count": 59,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 496,
    "end_page": 498
  },
  {
    "id": 45,
    "name_arabic": "الجاثية",
    "name_simple": "Al-Jathiyah",
    "verses_count": 37,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 499,
    "end_page": 502
  },
  {
    "id": 46,
    "name_arabic": "الأحقاف",
    "name_simple": "Al-Ahqaf",
    "verses_count": 35,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 502,
    "end_page": 506
  },
  {
    "id": 47,
    "name_arabic": "محمد",
    "name_simple": "Muhammad",
    "verses_count": 38,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 507,
    "end_page": 510
  },
  {
    "id": 48,
    "name_arabic": "الفتح",
    "name_simple": "Al-Fath",
    "verses_count": 29,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 511,
    "end_page": 515
  },
  {
    "id": 49,
    "name_arabic": "الحجرات",
    "name_simple": "Al-Hujurat",
    "verses_count": 18,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 515,
    "end_page": 517
  },
  {
    "id": 50,
    "name_arabic": "ق",
    "name_simple": "Qaf",
    "verses_count": 45,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 518,
    "end_page": 520
  },
  {
    "id": 51,
    "name_arabic": "الذاريات",
    "name_simple": "Adh-Dhariyat",
    "verses_count": 60,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 520,
    "end_page": 523
  },
  {
    "id": 52,
    "name_arabic": "الطور",
    "name_simple": "At-Tur",
    "verses_count": 49,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 523,
    "end_page": 525
  },
  {
    "id": 53,
    "name_arabic": "النجم",
    "name_simple": "An-Najm",
    "verses_count": 62,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 526,
    "end_page": 528
  },
  {
    "id": 54,
    "name_arabic": "القمر",
    "name_simple": "Al-Qamar",
    "verses_count": 55,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 528,
    "end_page": 531
  },
  {
    "id": 55,
    "name_arabic": "الرحمن",
    "name_simple": "Ar-Rahman",
    "verses_count": 78,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 531,
    "end_page": 534
  },
  {
    "id": 56,
    "name_arabic": "الواقعة",
    "name_simple": "Al-Waqi'ah",
    "verses_count": 96,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 534,
    "end_page": 537
  },
  {
    "id": 57,
    "name_arabic": "الحديد",
    "name_simple": "Al-Hadid",
    "verses_count": 29,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 537,
    "end_page": 541
  },
  {
    "id": 58,
    "name_arabic": "المجادلة",
    "name_simple": "Al-Mujadila",
    "verses_count": 22,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 542,
    "end_page": 545
  },
  {
    "id": 59,
    "name_arabic": "الحشر",
    "name_simple": "Al-Hashr",
    "verses_count": 24,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 545,
    "end_page": 548
  },
  {
    "id": 60,
    "name_arabic": "الممتحنة",
    "name_simple": "Al-Mumtahanah",
    "verses_count": 13,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 549,
    "end_page": 551
  },
  {
    "id": 61,
    "name_arabic": "الصف",
    "name_simple": "As-Saf",
    "verses_count": 14,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 551,
    "end_page": 552
  },
  {
    "id": 62,
    "name_arabic": "الجمعة",
    "name_simple": "Al-Jumu'ah",
    "verses_count": 11,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 553,
    "end_page": 554
  },
  {
    "id": 63,
    "name_arabic": "المنافقون",
    "name_simple": "Al-Munafiqun",
    "verses_count": 11,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 554,
    "end_page": 555
  },
  {
    "id": 64,
    "name_arabic": "التغابن",
    "name_simple": "At-Taghabun",
    "verses_count": 18,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 556,
    "end_page": 557
  },
  {
    "id": 65,
    "name_arabic": "الطلاق",
    "name_simple": "At-Talaq",
    "verses_count": 12,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 558,
    "end_page": 559
  },
  {
    "id": 66,
    "name_arabic": "التحريم",
    "name_simple": "At-Tahrim",
    "verses_count": 12,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 560,
    "end_page": 561
  },
  {
    "id": 67,
    "name_arabic": "الملك",
    "name_simple": "Al-Mulk",
    "verses_count": 30,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 562,
    "end_page": 564
  },
  {
    "id": 68,
    "name_arabic": "القلم",
    "name_simple": "Al-Qalam",
    "verses_count": 52,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 564,
    "end_page": 566
  },
  {
    "id": 69,
    "name_arabic": "الحاقة",
    "name_simple": "Al-Haqqah",
    "verses_count": 52,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 566,
    "end_page": 568
  },
  {
    "id": 70,
    "name_arabic": "المعارج",
    "name_simple": "Al-Ma'arij",
    "verses_count": 44,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 568,
    "end_page": 570
  },
  {
    "id": 71,
    "name_arabic": "نوح",
    "name_simple": "Nuh",
    "verses_count": 28,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 570,
    "end_page": 571
  },
  {
    "id": 72,
    "name_arabic": "الجن",
    "name_simple": "Al-Jinn",
    "verses_count": 28,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 572,
    "end_page": 573
  },
  {
    "id": 73,
    "name_arabic": "المزمل",
    "name_simple": "Al-Muzzammil",
    "verses_count": 20,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 574,
    "end_page": 575
  },
  {
    "id": 74,
    "name_arabic": "المدثر",
    "name_simple": "Al-Muddaththir",
    "verses_count": 56,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 575,
    "end_page": 577
  },
  {
    "id": 75,
    "name_arabic": "القيامة",
    "name_simple": "Al-Qiyamah",
    "verses_count": 40,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 577,
    "end_page": 578
  },
  {
    "id": 76,
    "name_arabic": "الانسان",
    "name_simple": "Al-Insan",
    "verses_count": 31,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 578,
    "end_page": 580
  },
  {
    "id": 77,
    "name_arabic": "المرسلات",
    "name_simple": "Al-Mursalat",
    "verses_count": 50,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 580,
    "end_page": 581
  },
  {
    "id": 78,
    "name_arabic": "النبإ",
    "name_simple": "An-Naba",
    "verses_count": 40,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 582,
    "end_page": 583
  },
  {
    "id": 79,
    "name_arabic": "النازعات",
    "name_simple": "An-Nazi'at",
    "verses_count": 46,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 583,
    "end_page": 584
  },
  {
    "id": 80,
    "name_arabic": "عبس",
    "name_simple": "'Abasa",
    "verses_count": 42,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 585,
    "end_page": 585
  },
  {
    "id": 81,
    "name_arabic": "التكوير",
    "name_simple": "At-Takwir",
    "verses_count": 29,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 586,
    "end_page": 586
  },
  {
    "id": 82,
    "name_arabic": "الإنفطار",
    "name_simple": "Al-Infitar",
    "verses_count": 19,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 587,
    "end_page": 587
  },
  {
    "id": 83,
    "name_arabic": "المطففين",
    "name_simple": "Al-Mutaffifin",
    "verses_count": 36,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 587,
    "end_page": 589
  },
  {
    "id": 84,
    "name_arabic": "الإنشقاق",
    "name_simple": "Al-Inshiqaq",
    "verses_count": 25,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 589,
    "end_page": 589
  },
  {
    "id": 85,
    "name_arabic": "البروج",
    "name_simple": "Al-Buruj",
    "verses_count": 22,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 590,
    "end_page": 590
  },
  {
    "id": 86,
    "name_arabic": "الطارق",
    "name_simple": "At-Tariq",
    "verses_count": 17,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 591,
    "end_page": 591
  },
  {
    "id": 87,
    "name_arabic": "الأعلى",
    "name_simple": "Al-A'la",
    "verses_count": 19,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 591,
    "end_page": 592
  },
  {
    "id": 88,
    "name_arabic": "الغاشية",
    "name_simple": "Al-Ghashiyah",
    "verses_count": 26,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 592,
    "end_page": 592
  },
  {
    "id": 89,
    "name_arabic": "الفجر",
    "name_simple": "Al-Fajr",
    "verses_count": 30,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 593,
    "end_page": 594
  },
  {
    "id": 90,
    "name_arabic": "البلد",
    "name_simple": "Al-Balad",
    "verses_count": 20,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 594,
    "end_page": 594
  },
  {
    "id": 91,
    "name_arabic": "الشمس",
    "name_simple": "Ash-Shams",
    "verses_count": 15,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 595,
    "end_page": 595
  },
  {
    "id": 92,
    "name_arabic": "الليل",
    "name_simple": "Al-Layl",
    "verses_count": 21,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 595,
    "end_page": 596
  },
  {
    "id": 93,
    "name_arabic": "الضحى",
    "name_simple": "Ad-Duhaa",
    "verses_count": 11,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 596,
    "end_page": 596
  },
  {
    "id": 94,
    "name_arabic": "الشرح",
    "name_simple": "Ash-Sharh",
    "verses_count": 8,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 596,
    "end_page": 596
  },
  {
    "id": 95,
    "name_arabic": "التين",
    "name_simple": "At-Tin",
    "verses_count": 8,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 597,
    "end_page": 597
  },
  {
    "id": 96,
    "name_arabic": "العلق",
    "name_simple": "Al-'Alaq",
    "verses_count": 19,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 597,
    "end_page": 597
  },
  {
    "id": 97,
    "name_arabic": "القدر",
    "name_simple": "Al-Qadr",
    "verses_count": 5,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 598,
    "end_page": 598
  },
  {
    "id": 98,
    "name_arabic": "البينة",
    "name_simple": "Al-Bayyinah",
    "verses_count": 8,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 598,
    "end_page": 599
  },
  {
    "id": 99,
    "name_arabic": "الزلزلة",
    "name_simple": "Az-Zalzalah",
    "verses_count": 8,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 599,
    "end_page": 599
  },
  {
    "id": 100,
    "name_arabic": "العاديات",
    "name_simple": "Al-'Adiyat",
    "verses_count": 11,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 599,
    "end_page": 600
  },
  {
    "id": 101,
    "name_arabic": "القارعة",
    "name_simple": "Al-Qari'ah",
    "verses_count": 11,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 600,
    "end_page": 600
  },
  {
    "id": 102,
    "name_arabic": "التكاثر",
    "name_simple": "At-Takathur",
    "verses_count": 8,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 600,
    "end_page": 600
  },
  {
    "id": 103,
    "name_arabic": "العصر",
    "name_simple": "Al-'Asr",
    "verses_count": 3,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 601,
    "end_page": 601
  },
  {
    "id": 104,
    "name_arabic": "الهمزة",
    "name_simple": "Al-Humazah",
    "verses_count": 9,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 601,
    "end_page": 601
  },
  {
    "id": 105,
    "name_arabic": "الفيل",
    "name_simple": "Al-Fil",
    "verses_count": 5,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 601,
    "end_page": 601
  },
  {
    "id": 106,
    "name_arabic": "قريش",
    "name_simple": "Quraysh",
    "verses_count": 4,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 602,
    "end_page": 602
  },
  {
    "id": 107,
    "name_arabic": "الماعون",
    "name_simple": "Al-Ma'un",
    "verses_count": 7,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 602,
    "end_page": 602
  },
  {
    "id": 108,
    "name_arabic": "الكوثر",
    "name_simple": "Al-Kawthar",
    "verses_count": 3,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 602,
    "end_page": 602
  },
  {
    "id": 109,
    "name_arabic": "الكافرون",
    "name_simple": "Al-Kafirun",
    "verses_count": 6,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 603,
    "end_page": 603
  },
  {
    "id": 110,
    "name_arabic": "النصر",
    "name_simple": "An-Nasr",
    "verses_count": 3,
    "revelation_place": "madinah",
    "bismillah_pre": true,
    "start_page": 603,
    "end_page": 603
  },
  {
    "id": 111,
    "name_arabic": "المسد",
    "name_simple": "Al-Masad",
    "verses_count": 5,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 603,
    "end_page": 603
  },
  {
    "id": 112,
    "name_arabic": "الإخلاص",
    "name_simple": "Al-Ikhlas",
    "verses_count": 4,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 604,
    "end_page": 604
  },
  {
    "id": 113,
    "name_arabic": "الفلق",
    "name_simple": "Al-Falaq",
    "verses_count": 5,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 604,
    "end_page": 604
  },
  {
    "id": 114,
    "name_arabic": "الناس",
    "name_simple": "An-Nas",
    "verses_count": 6,
    "revelation_place": "makkah",
    "bismillah_pre": true,
    "start_page": 604,
    "end_page": 604
  }
];

export interface JuzMeta {
  juz: number;
  name: string;
  start_page: number;
}

export const QURAN_JUZS: JuzMeta[] = [
  {
    "juz": 1,
    "name": "الم",
    "start_page": 1
  },
  {
    "juz": 2,
    "name": "سَيَقُولُ",
    "start_page": 22
  },
  {
    "juz": 3,
    "name": "تِلْكَ الرُّسُلُ",
    "start_page": 42
  },
  {
    "juz": 4,
    "name": "لَنْ تَنَالُوا",
    "start_page": 62
  },
  {
    "juz": 5,
    "name": "وَالْمُحْصَنَاتُ",
    "start_page": 82
  },
  {
    "juz": 6,
    "name": "لَا يُحِبُّ اللَّهُ",
    "start_page": 102
  },
  {
    "juz": 7,
    "name": "وَإِذَا سَمِعُوا",
    "start_page": 121
  },
  {
    "juz": 8,
    "name": "وَلَوْ أَنَّنَا",
    "start_page": 142
  },
  {
    "juz": 9,
    "name": "قَالَ الْمَلَأُ",
    "start_page": 162
  },
  {
    "juz": 10,
    "name": "وَاعْلَمُوا",
    "start_page": 182
  },
  {
    "juz": 11,
    "name": "يَعْتَذِرُونَ إِلَيْكُمْ",
    "start_page": 201
  },
  {
    "juz": 12,
    "name": "وَمَا مِنْ دَابَّةٍ",
    "start_page": 222
  },
  {
    "juz": 13,
    "name": "وَمَا أُبَرِّئُ نَفْسِي",
    "start_page": 242
  },
  {
    "juz": 14,
    "name": "رُبَمَا يَوَدُّ",
    "start_page": 262
  },
  {
    "juz": 15,
    "name": "سُبْحَانَ الَّذِي",
    "start_page": 282
  },
  {
    "juz": 16,
    "name": "قَالَ أَلَمْ أَقُلْ لَكَ",
    "start_page": 302
  },
  {
    "juz": 17,
    "name": "اقْتَرَبَ لِلنَّاسِ",
    "start_page": 322
  },
  {
    "juz": 18,
    "name": "قَدْ أَفْلَحَ الْمُؤْمِنُونَ",
    "start_page": 342
  },
  {
    "juz": 19,
    "name": "وَقَالَ الَّذِينَ لَا يَرْجُونَ",
    "start_page": 362
  },
  {
    "juz": 20,
    "name": "فَمَا كَانَ جَوَابَ قَوْمِهِ",
    "start_page": 382
  },
  {
    "juz": 21,
    "name": "وَلَا تُجَادِلُوا",
    "start_page": 402
  },
  {
    "juz": 22,
    "name": "وَمَنْ يَقْنُتْ",
    "start_page": 422
  },
  {
    "juz": 23,
    "name": "وَمَا أَنْزَلْنَا",
    "start_page": 442
  },
  {
    "juz": 24,
    "name": "فَمَنْ أَظْلَمُ",
    "start_page": 462
  },
  {
    "juz": 25,
    "name": "إِلَيْهِ يُرَدُّ",
    "start_page": 482
  },
  {
    "juz": 26,
    "name": "حم",
    "start_page": 502
  },
  {
    "juz": 27,
    "name": "قَالَ فَمَا خَطْبُكُمْ",
    "start_page": 522
  },
  {
    "juz": 28,
    "name": "قَدْ سَمِعَ اللَّهُ",
    "start_page": 542
  },
  {
    "juz": 29,
    "name": "تَبَارَكَ الَّذِي",
    "start_page": 562
  },
  {
    "juz": 30,
    "name": "عَمَّ يَتَسَاءَلُونَ",
    "start_page": 582
  }
];
