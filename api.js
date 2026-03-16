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

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/Ⅱ/g, "2")
    .replace(/Ⅰ/g, "1")
    .replace(/·/g, "")
    .replace(/회화/g, "")
    .trim();
}

function getSelectionValue(profile, key, fallback = "") {
  return profile?.selections?.[key] || fallback;
}

/*
  기본 시간표
  0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
*/
const BASE_TIMETABLE = {
  1: {
    1: "미적",
    2: "탐구C",
    3: "언어",
    4: "탐구A",
    5: "독서B",
    6: "스생"
  },
  2: {
    1: "생과or여지",
    2: "확통",
    3: "영독A",
    4: "진로",
    5: "탐구A",
    6: "독서A",
    7: "미적"
  },
  3: {
    1: "탐구C",
    2: "탐구B",
    3: "보건or환경",
    4: "미적",
    5: "영독A",
    6: "영독B",
    7: "확통"
  },
  4: {
    1: "탐구B",
    2: "생과or여지",
    3: "언어",
    4: "미적",
    5: "확통",
    6: "탐구A",
    7: "독서B"
  },
  5: {
    1: "탐구B",
    2: "탐구C",
    3: "영독B",
    4: "독서A"
  }
};

/*
  그룹별 과목-반 정보
  같은 과목이라도 그룹에 따라 반이 다를 수 있어서
  group + subject 조합으로 관리
*/
const GROUP_SUBJECT_ROOM_MAP = {
  "선택과목A": {
    "생활과윤리": "5반",
    "화학Ⅱ": "6반",
    "생명과학Ⅱ": "7반"
  },
  "선택과목B": {
    "사회·문화": "3반",
    "물리학Ⅱ": "5반",
    "지구과학Ⅱ": "7반",
    "화학Ⅱ": "6반"
  },
  "선택과목C": {
    "경제": "5반",
    "세계지리": "2반",
    "생명과학Ⅱ": "6반",
    "지구과학Ⅱ": "8반"
  },
  "언어": {
    "일본어": "역사관3층",
    "중국어": "3반",
    "프로그래밍": "6반"
  },
  "생과or여지": {
    "생활과 과학": "1반",
    "여행지리": "6반"
  },
  "보건or환경": {
    "보건": "역사관3층",
    "환경": "6반"
  }
};

/*
  공통 과목 기본 반 정보
  선택과목이 아닌 과목들 fallback
*/
const COMMON_SUBJECT_ROOM_MAP = {
  "미적": "6반",
  "확통": "6반",
  "진로": "6반",
  "독서A": "6반",
  "독서B": "6반",
  "영독A": "6반",
  "영독B": "6반",
  "스생": "6반"
};

function getGroupRoom(groupName, subject, fallback = "이동수업") {
  return GROUP_SUBJECT_ROOM_MAP[groupName]?.[subject] || fallback;
}

function getCommonRoom(subject, fallback = "6반") {
  return COMMON_SUBJECT_ROOM_MAP[subject] || fallback;
}

function replacePlaceholderSubject(baseSubject, profile) {
  switch (baseSubject) {
    case "탐구A":
      return getSelectionValue(profile, "선택과목A", "탐구A");
    case "탐구B":
      return getSelectionValue(profile, "선택과목B", "탐구B");
    case "탐구C":
      return getSelectionValue(profile, "선택과목C", "탐구C");
    case "언어":
      return getSelectionValue(profile, "언어", "언어");
    case "생과or여지":
      return getSelectionValue(profile, "생과or여지", "생과or여지");
    case "보건or환경":
      return getSelectionValue(profile, "보건or환경", "보건or환경");
    default:
      return baseSubject;
  }
}

function getRoomForBaseSlot(baseSubject, replacedSubject) {
  switch (baseSubject) {
    case "탐구A":
      return getGroupRoom("선택과목A", replacedSubject, "이동수업");
    case "탐구B":
      return getGroupRoom("선택과목B", replacedSubject, "이동수업");
    case "탐구C":
      return getGroupRoom("선택과목C", replacedSubject, "이동수업");
    case "언어":
      return getGroupRoom("언어", replacedSubject, "이동수업");
    case "생과or여지":
      return getGroupRoom("생과or여지", replacedSubject, "이동수업");
    case "보건or환경":
      return getGroupRoom("보건or환경", replacedSubject, "이동수업");
    default:
      return getCommonRoom(replacedSubject, "6반");
  }
}

function getBaseTimetableForDate(date, profile) {
  const day = date.getDay();
  const dayTable = BASE_TIMETABLE[day] || {};

  return Object.entries(dayTable)
    .map(([period, baseSubject]) => {
      const replacedSubject = replacePlaceholderSubject(baseSubject, profile);
      const room = getRoomForBaseSlot(baseSubject, replacedSubject);

      return {
        period: Number(period),
        subject: replacedSubject,
        room,
        baseSubject
      };
    })
    .sort((a, b) => a.period - b.period);
}

function shouldOverrideWithNeis(neisSubject, baseRawSubject) {
  const neis = normalizeText(neisSubject);
  const baseRaw = normalizeText(baseRawSubject);

  if (!neis) return false;

  // 언어는 항상 사용자 선택 우선
  if (baseRaw === normalizeText("언어")) {
    return false;
  }

  const placeholderSet = [
    "탐구A",
    "탐구B",
    "탐구C",
    "생과or여지",
    "보건or환경"
  ].map(normalizeText);

  const commonBaseSet = [
    "미적",
    "확통",
    "진로",
    "독서A",
    "독서B",
    "영독A",
    "영독B",
    "스생"
  ].map(normalizeText);

  if (placeholderSet.includes(baseRaw)) {
    const keepBaseIfGeneric = [
      "탐구A",
      "탐구B",
      "탐구C",
      "생활과윤리",
      "사회문화",
      "경제",
      "세계지리",
      "물리학2",
      "화학2",
      "생명과학2",
      "지구과학2",
      "일본어",
      "중국어",
      "프로그래밍",
      "생활과과학",
      "여행지리",
      "보건",
      "환경"
    ].map(normalizeText);

    if (keepBaseIfGeneric.includes(neis)) {
      return false;
    }

    return true;
  }

  if (commonBaseSet.includes(baseRaw)) {
    return neis !== baseRaw;
  }

  return neis !== baseRaw;
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

async function fetchNeisTimetableRaw(date = new Date()) {
  const year = getCurrentYear();
  const dateStr = formatDateYYYYMMDD(date);

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
    .map(row => ({
      period: Number(row.PERIO),
      subject: row.ITRT_CNTNT || "",
      room: row.CLRM_NM || "6반"
    }));
}

async function fetchTimetableData(date = new Date()) {
  const profile = getSavedProfile();
  const baseTimetable = getBaseTimetableForDate(date, profile);

  let neisRows = [];
  try {
    neisRows = await fetchNeisTimetableRaw(date);
  } catch (e) {
    console.warn("NEIS 시간표 불러오기 실패, 기본 시간표 사용", e);
  }

  if (!baseTimetable.length) {
    return neisRows;
  }

  const merged = baseTimetable.map(baseItem => {
    const neisItem = neisRows.find(item => Number(item.period) === Number(baseItem.period));

    if (!neisItem) {
      return {
        period: baseItem.period,
        subject: baseItem.subject,
        room: baseItem.room
      };
    }

    if (shouldOverrideWithNeis(neisItem.subject, baseItem.baseSubject)) {
      return {
        period: baseItem.period,
        subject: neisItem.subject || baseItem.subject,
        room: neisItem.room || baseItem.room
      };
    }

    return {
      period: baseItem.period,
      subject: baseItem.subject,
      room: baseItem.room
    };
  });

  const extraNeisRows = neisRows.filter(
    neisItem => !merged.some(baseItem => Number(baseItem.period) === Number(neisItem.period))
  );

  return [...merged, ...extraNeisRows].sort((a, b) => a.period - b.period);
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
