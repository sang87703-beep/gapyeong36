function formatDateYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function cleanMealText(text) {
  return text
    .split("<br/>")
    .map(item => item.replace(/\([^)]*\)/g, "").trim())
    .filter(Boolean);
}

function getSavedProfile() {
  try {
    const saved = localStorage.getItem("gapyeong36ProfileABC");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("프로필 불러오기 실패", e);
    return null;
  }
}

function normalizeSubjectText(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/Ⅱ/g, "2")
    .replace(/·/g, "")
    .trim();
}

function getSelectionMap(profile) {
  const selections = profile?.selections || {};
  return {
    A: selections["선택과목A"] || "",
    B: selections["선택과목B"] || "",
    C: selections["선택과목C"] || "",
    LANG: selections["언어"] || "",
    SCI_GEO: selections["생과or여지"] || "",
    HEALTH_ENV: selections["보건or환경"] || ""
  };
}

function applyProfileToSubject(subjectText, profile) {
  const original = String(subjectText || "").trim();
  if (!original) return original;

  const normalized = normalizeSubjectText(original);
  const selectionMap = getSelectionMap(profile);

  const replaceIfExists = (value, fallback = original) => value || fallback;

  // 선택과목 A
  if (
    normalized === "선택과목A" ||
    normalized === "선택A" ||
    normalized === "A"
  ) {
    return replaceIfExists(selectionMap.A, original);
  }

  // 선택과목 B
  if (
    normalized === "선택과목B" ||
    normalized === "선택B" ||
    normalized === "B"
  ) {
    return replaceIfExists(selectionMap.B, original);
  }

  // 선택과목 C
  if (
    normalized === "선택과목C" ||
    normalized === "선택C" ||
    normalized === "C"
  ) {
    return replaceIfExists(selectionMap.C, original);
  }

  // 언어
  if (
    normalized.includes("언어") ||
    normalized.includes("제2외국어") ||
    normalized.includes("일중프") ||
    normalized === "외국어"
  ) {
    return replaceIfExists(selectionMap.LANG, original);
  }

  // 생과 or 여지
  if (
    normalized.includes("생과or여지") ||
    normalized.includes("생과/여지") ||
    normalized.includes("생명과학여행지리") ||
    normalized.includes("여행지리") && original.includes("or") ||
    normalized.includes("생명과학") && original.includes("or")
  ) {
    return replaceIfExists(selectionMap.SCI_GEO, original);
  }

  // 보건 or 환경
  if (
    normalized.includes("보건or환경") ||
    normalized.includes("보건/환경") ||
    normalized.includes("보건환경")
  ) {
    return replaceIfExists(selectionMap.HEALTH_ENV, original);
  }

  return original;
}

async function fetchMealData(date = new Date()) {
  const mlsvYmd = formatDateYYYYMMDD(date);
  const url =
    `https://open.neis.go.kr/hub/mealServiceDietInfo` +
    `?KEY=${CONFIG.neis.key}` +
    `&Type=json` +
    `&pIndex=1&pSize=10` +
    `&ATPT_OFCDC_SC_CODE=${CONFIG.neis.officeCode}` +
    `&SD_SCHUL_CODE=${CONFIG.neis.schoolCode}` +
    `&MLSV_YMD=${mlsvYmd}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("급식 API 요청 실패");
  const data = await res.json();

  if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) return [];
  const rows = data.mealServiceDietInfo[1].row || [];
  if (!rows.length) return [];

  const lunch = rows.find(item => item.MMEAL_SC_CODE === "2") || rows[0];
  return cleanMealText(lunch.DDISH_NM || "");
}

async function fetchTimetableData(date = new Date()) {
  const year = getCurrentYear();
  const dateStr = formatDateYYYYMMDD(date);
  const profile = getSavedProfile();

  const url =
    `https://open.neis.go.kr/hub/hisTimetable` +
    `?KEY=${CONFIG.neis.key}` +
    `&Type=json` +
    `&pIndex=1&pSize=100` +
    `&ATPT_OFCDC_SC_CODE=${CONFIG.neis.officeCode}` +
    `&SD_SCHUL_CODE=${CONFIG.neis.schoolCode}` +
    `&AY=${year}` +
    `&GRADE=${CONFIG.school.grade}` +
    `&CLASS_NM=${CONFIG.school.classNo}` +
    `&ALL_TI_YMD=${dateStr}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("시간표 API 요청 실패");
  const data = await res.json();

  if (!data.hisTimetable || data.hisTimetable.length < 2) return [];
  const rows = data.hisTimetable[1].row || [];

  return rows
    .sort((a, b) => Number(a.PERIO) - Number(b.PERIO))
    .map(row => {
      const rawSubject = row.ITRT_CNTNT || "";
      const appliedSubject = applyProfileToSubject(rawSubject, profile);

      return {
        period: row.PERIO,
        subject: appliedSubject,
        room: row.CLRM_NM || "교실 정보 없음"
      };
    });
}

function getWeatherBaseDateTime(now = new Date()) {
  const base = new Date(now);
  if (base.getMinutes() < 40) base.setHours(base.getHours() - 1);

  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  const hh = String(base.getHours()).padStart(2, "0");

  return {
    base_date: `${y}${m}${d}`,
    base_time: `${hh}00`
  };
}

function weatherTextFromPTY(pty, rain1h) {
  const p = String(pty ?? "");
  if (p === "1") return "비";
  if (p === "2") return "비/눈";
  if (p === "3") return "눈";
  if (p === "4") return "소나기";
  if (rain1h && rain1h !== "0" && rain1h !== "강수없음") return "비";
  return "맑음";
}

function weatherEmojiFromText(text) {
  if (text.includes("눈")) return "❄️";
  if (text.includes("비")) return "🌧️";
  if (text.includes("소나기")) return "🌦️";
  return "☀️";
}

async function fetchWeatherNow() {
  const { base_date, base_time } = getWeatherBaseDateTime();
  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst` +
    `?serviceKey=${encodeURIComponent(CONFIG.weather.key)}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${base_date}` +
    `&base_time=${base_time}` +
    `&nx=${CONFIG.weather.nx}` +
    `&ny=${CONFIG.weather.ny}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("날씨 API 요청 실패");

  const data = await res.json();
  const items = data?.response?.body?.items?.item || [];
  if (!items.length) {
    const code = data?.response?.header?.resultCode;
    const msg = data?.response?.header?.resultMsg;
    throw new Error(`날씨 데이터 없음: ${code || ""} ${msg || ""}`.trim());
  }

  const valueOf = (category) => items.find(item => item.category === category)?.obsrValue ?? null;
  const temp = valueOf("T1H");
  const humidity = valueOf("REH");
  const windSpeed = valueOf("WSD");
  const rain1h = valueOf("RN1");
  const pty = valueOf("PTY");
  const status = weatherTextFromPTY(pty, rain1h);

  return {
    temp,
    humidity,
    windSpeed,
    rain1h,
    status,
    emoji: weatherEmojiFromText(status),
    locationName: CONFIG.weather.locationName
  };
}
