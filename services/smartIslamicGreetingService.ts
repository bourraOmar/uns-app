export interface SmartGreeting {
  title: string;
  icon: string;
  buttonText: string;
  route: string | { pathname: string; params?: Record<string, string> };
}

interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
}

/**
 * Returns accurate Hijri day, month (1-12), and year numbers using Umm al-Qura calendar
 */
export function getHijriNumericDate(now: Date = new Date()): HijriDateInfo {
  let day = 1;
  let month = 1;
  let year = 1448;

  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    parts.forEach((p) => {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') month = parseInt(p.value, 10) || 1;
      if (p.type === 'year') year = parseInt(p.value, 10) || 1448;
    });
  } catch {
    // Fallback if Intl is unavailable
  }

  return { day, month, year };
}

/**
 * Resolves smart context-aware Islamic message, greeting, and suggested action
 * based on current hour, weekday, upcoming prayer, and annual Hijri events.
 */
export function getSmartIslamicGreeting(
  now: Date = new Date(),
  upcomingPrayer: string = 'Dhuhr',
  hijriDate?: HijriDateInfo
): SmartGreeting {
  const hDate = hijriDate || getHijriNumericDate(now);
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hMonth = hDate.month;
  const hDay = hDate.day;

  // =========================================================================
  // 1. High-Priority Annual Islamic Events (المناسبات الإسلامية السنوية الكبرى)
  // =========================================================================

  // --- شهر رمضان المبارك (Month 9 - Ramadan) ---
  if (hMonth === 9) {
    // العشر الأواخر (21 إلى 30 رمضان)
    if (hDay >= 21) {
      // الليالي الوترية (21, 23, 25, 27, 29) في الليل
      const isOddNight = [21, 23, 25, 27, 29].includes(hDay);
      if (isOddNight && (hour >= 20 || hour < 5)) {
        return {
          title: 'تحروا ليلة القدر',
          icon: '🌟',
          buttonText: 'دعاء ليلة القدر والقيام',
          route: '/duas',
        };
      }
      return {
        title: 'العشر الأواخر',
        icon: '🌟',
        buttonText: 'الاستغفار والقيام',
        route: '/tasbih',
      };
    }

    // نهار رمضان (صيام وذكر)
    if (hour >= 5 && hour < 18) {
      return {
        title: 'رمضان مبارك',
        icon: '🌙',
        buttonText: 'سنن وأدعية الصائم',
        route: '/dhikr/ramadan',
      };
    }

    // ليل رمضان (تراويح وقرآن)
    return {
      title: 'شهر القرآن والقيام',
      icon: '✨',
      buttonText: 'متابعة ختمة القرآن',
      route: '/quran',
    };
  }

  // --- عيد الفطر (شوال 1-3) ---
  if (hMonth === 10 && hDay <= 3) {
    return {
      title: 'عيد فطر مبارك',
      icon: '🎉',
      buttonText: 'تكبيرات وأدعية العيد',
      route: '/duas',
    };
  }

  // --- صيام الست من شوال (شوال 4-30) في نهار الإثنين والخميس ---
  if (hMonth === 10 && hDay >= 4 && (dayOfWeek === 1 || dayOfWeek === 4) && hour < 15) {
    return {
      title: 'صيام الست من شوال',
      icon: '🌿',
      buttonText: 'فضل الصيام والذكر',
      route: '/duas',
    };
  }

  // --- عشر ذي الحجة (1 إلى 8 ذو الحجة) ---
  if (hMonth === 12 && hDay >= 1 && hDay <= 8) {
    return {
      title: 'أفضل أيام الدنيا',
      icon: '🕋',
      buttonText: 'كبّر وهلّل واذكر الله',
      route: '/tasbih',
    };
  }

  // --- يوم عرفة (9 ذو الحجة) ---
  if (hMonth === 12 && hDay === 9) {
    return {
      title: 'خير الدعاء دعاء عرفة',
      icon: '🤲',
      buttonText: 'أدعية يوم عرفة',
      route: '/duas',
    };
  }

  // --- عيد الأضحى وأيام التشريق (10 إلى 13 ذو الحجة) ---
  if (hMonth === 12 && hDay >= 10 && hDay <= 13) {
    return {
      title: 'عيد أضحى مبارك',
      icon: '🐑',
      buttonText: 'تكبيرات العيد والذكر',
      route: '/tasbih',
    };
  }

  // --- رأس السنة الهجرية (1 محرم) ---
  if (hMonth === 1 && hDay === 1) {
    return {
      title: 'عام هجري مبارك',
      icon: '🌙',
      buttonText: 'دعاء بداية العام',
      route: '/duas',
    };
  }

  // --- يوم عاشوراء وتاسوعاء (9 و 10 محرم) ---
  if (hMonth === 1 && (hDay === 9 || hDay === 10)) {
    return {
      title: 'صيام يوم عاشوراء',
      icon: '🕊️',
      buttonText: 'فضل صيام عاشوراء',
      route: '/duas',
    };
  }

  // --- ليلة النصف من شعبان (14-15 شعبان) ---
  if (hMonth === 8 && (hDay === 14 || hDay === 15)) {
    return {
      title: 'ليلة النصف من شعبان',
      icon: '✨',
      buttonText: 'الاستغفار والدعاء',
      route: '/duas',
    };
  }

  // --- الأيام البيض (13، 14، 15 من كل شهر هجري عدا أيام النهي) ---
  if ([13, 14, 15].includes(hDay) && hour >= 6 && hour < 16) {
    return {
      title: 'الأيام البيض المباركة',
      icon: '🌕',
      buttonText: 'فضل صيام الأيام البيض',
      route: '/duas',
    };
  }

  // =========================================================================
  // 2. Weekly Islamic Events (المناسبات الأسبوعية)
  // =========================================================================

  // --- يوم الجمعة (Friday - `dayOfWeek === 5`) ---
  if (dayOfWeek === 5) {
    // عصر الجمعة إلى الغروب (ساعة الاستجابة)
    if (hour >= 15 && hour < 19) {
      return {
        title: 'ساعة استجابة الجمعة',
        icon: '🤲',
        buttonText: 'تضرّع بالدعاء والذكر',
        route: '/duas',
      };
    }
    // صباح وظهر الجمعة (سورة الكهف والصلاة على النبي)
    if (hour >= 5 && hour < 15) {
      return {
        title: 'جمعة مباركة',
        icon: '🕌',
        buttonText: 'اقرأ سورة الكهف',
        route: { pathname: '/surah/[id]', params: { id: '18' } },
      };
    }
  }

  // --- ليلة الجمعة (مساء الخميس بعد المغرب) ---
  if (dayOfWeek === 4 && hour >= 18) {
    return {
      title: 'ليلة الجمعة الفضيلة',
      icon: '✨',
      buttonText: 'أكثر من الصلاة على النبي',
      route: '/dhikr/fadael_salawat',
    };
  }

  // --- يومي الاثنين والخميس (سنة الصيام الأسبوعي وعرض الأعمال) ---
  if ((dayOfWeek === 1 || dayOfWeek === 4) && hour >= 6 && hour < 12) {
    return {
      title: 'تُعرض الأعمال اليوم',
      icon: '🍃',
      buttonText: 'أدعية مأثورة وذكر',
      route: '/duas',
    };
  }

  // =========================================================================
  // 3. Time-of-Day Contextual Messages (أوقات اليوم - كالمعروضة في لقطات الشاشة)
  // =========================================================================

  // وقت السحر والمغفرة (الثلث الأخير من الليل: من 2 صباحاً إلى الفجر)
  if (hour >= 2 && hour < 5) {
    return {
      title: 'وقت السحر والمغفرة',
      icon: '📿',
      buttonText: 'الاستغفار والقيام',
      route: '/tasbih',
    };
  }

  // الصباح الباكر والضحى (من الفجر إلى الظهر 5:00 - 12:00) -> Screen 2: صباح الخير ☀️
  if (hour >= 5 && hour < 12) {
    return {
      title: 'صباح الخير',
      icon: '☀️',
      buttonText: 'اقرأ أذكار الصباح',
      route: '/dhikr/morning',
    };
  }

  // الظهيرة وما بعد الظهر (12:00 - 15:30) -> Screen 1: وقت مبارك 📿
  if (hour >= 12 && hour < 15 || (hour === 15 && now.getMinutes() < 30)) {
    return {
      title: 'وقت مبارك',
      icon: '📿',
      buttonText: 'لتسبح الله',
      route: '/tasbih',
    };
  }

  // العصر والمساء (15:30 - 18:30) -> Screen 3: حبينا نذكرك 🌤️
  if (hour >= 15 && hour < 19) {
    return {
      title: 'حبينا نذكرك',
      icon: '🌤️',
      buttonText: 'اقرأ أذكار المساء',
      route: '/dhikr/evening',
    };
  }

  // المغرب وأول الليل (19:00 - 21:30)
  if (hour >= 19 && hour < 22) {
    return {
      title: 'مساء الخير والسكينة',
      icon: '🌆',
      buttonText: 'لتسبح الله',
      route: '/tasbih',
    };
  }

  // وقت النوم (من 22:00 إلى 02:00)
  return {
    title: 'قبل أن تنام',
    icon: '🌙',
    buttonText: 'اقرأ أذكار النوم',
    route: '/dhikr/sleep',
  };
}
