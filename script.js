const openMenuBtn = document.getElementById("openMenuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

const subjectModal = document.getElementById("subjectModal");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const resetProfileBtn = document.getElementById("resetProfileBtn");

const timetableList = document.getElementById("timetableList");
const mealList = document.getElementById("mealList");
const welcomeText = document.getElementById("welcomeText");
const todayDate = document.getElementById("todayDate");
const studentNameInput = document.getElementById("studentName");

const trackASelect = document.getElementById("trackA");
const trackBSelect = document.getElementById("trackB");
const trackCSelect = document.getElementById("trackC");
const trackLangSelect = document.getElementById("trackLang");
const trackSciGeoSelect = document.getElementById("trackSciGeo");
const trackHealthEnvSelect = document.getElementById("trackHealthEnv");

const selectedTracks = document.getElementById("selectedTracks");

const weatherLocation = document.getElementById("weatherLocation");
const weatherTemp = document.getElementById("weatherTemp");
const weatherStatus = document.getElementById("weatherStatus");
const weatherSub = document.getElementById("weatherSub");
const weatherEmoji = document.getElementById("weatherEmoji");
const debugText = document.getElementById("debugText");
const currentClassName = document.getElementById("currentClassName");
const currentClassRoom = document.getElementById("currentClassRoom");
const currentClassStatus = document.getElementById("currentClassStatus");
const currentClassBadge = document.getElementById("currentClassBadge");

function setTodayDate() {
  const now = new Date();
  const weekNames = ["일", "월", "화", "수", "목", "금", "토"];
  todayDate.textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 ${weekNames[now.getDay()]}요일`;
}

function getCurrentPeriod() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const periodTimes = [
    { period: 1, start: 8 * 60 + 40, end: 9 * 60 + 29 },
    { period: 2, start: 9 * 60 + 40, end: 10 * 60 + 29 },
    { period: 3, start: 10 * 60 + 40, end: 11 * 60 + 29 },
    { period: 4, start: 11 * 60 + 40, end: 12 * 60 + 29 },
    { period: 5, start: 13 * 60 + 20, end: 14 * 60 + 9 },
    { period: 6, start: 14 * 60 + 20, end: 15 * 60 + 9 },
    { period: 7, start: 15 * 60 + 20, end: 16 * 60 + 9 }
  ];
  const current = periodTimes.find(item => currentTime >= item.start && currentTime <= item.end);
  return current ? current.period : null;
}

function loadProfile() {
  const savedProfile = localStorage.getItem("gapyeong36ProfileABC");
  if (!savedProfile) {
    subjectModal.classList.remove("hidden");
    return null;
  }
  subjectModal.classList.add("hidden");
  return JSON.parse(savedProfile);
}

function saveProfile() {
  const name = studentNameInput.value.trim() || "3-6 학생";

  const profile = {
    name,
    selections: {
      선택과목A: trackASelect ? trackASelect.value : "",
      선택과목B: trackBSelect ? trackBSelect.value : "",
      선택과목C: trackCSelect ? trackCSelect.value : "",
      언어: trackLangSelect ? trackLangSelect.value : "",
      생과or여지: trackSciGeoSelect ? trackSciGeoSelect.value : "",
      보건or환경: trackHealthEnvSelect ? trackHealthEnvSelect.value : ""
    }
  };

  localStorage.setItem("gapyeong36ProfileABC", JSON.stringify(profile));
  subjectModal.classList.add("hidden");
  updateWelcome(profile);
  renderSelectionSummary(profile);
  initAppData();
}

function updateWelcome(profile) {
  welcomeText.textContent = `${profile.name}님 시간표`;
}

function renderSelectionSummary(profile) {
  selectedTracks.innerHTML = "";

  const entries = Object.entries(profile.selections || {});
  const validEntries = entries.filter(([, value]) => value);

  if (!validEntries.length) {
    selectedTracks.innerHTML = '<div class="track-chip">선택과목 미설정</div>';
    return;
  }

  validEntries.forEach(([group, subject]) => {
    const chip = document.createElement("div");
    chip.className = "track-chip";
    chip.textContent = `${group}: ${subject}`;
    selectedTracks.appendChild(chip);
  });
}

function renderCurrentClass(timetable) {
  if (!currentClassName || !currentClassRoom || !currentClassStatus || !currentClassBadge) return;

  if (!timetable.length) {
    currentClassName.textContent = "수업 정보를 불러오지 못했어";
    currentClassRoom.textContent = "시간표 API 확인 필요";
    currentClassStatus.textContent = "오늘 시간표가 없거나 불러오기에 실패했어.";
    currentClassBadge.textContent = "--";
    return;
  }

  const currentPeriod = getCurrentPeriod();

  if (!currentPeriod) {
    currentClassName.textContent = "지금은 쉬는 시간";
    currentClassRoom.textContent = "다음 수업을 확인해봐";
    currentClassStatus.textContent = "수업 시간이 아닐 때는 아래 전체 시간표를 보면 돼.";
    currentClassBadge.textContent = "BREAK";
    return;
  }

  const currentItem = timetable.find(item => Number(item.period) === Number(currentPeriod));

  if (!currentItem) {
    currentClassName.textContent = `${currentPeriod}교시 정보 없음`;
    currentClassRoom.textContent = "교실 정보 없음";
    currentClassStatus.textContent = "현재 교시 데이터가 없어서 전체 시간표를 참고해줘.";
    currentClassBadge.textContent = `${currentPeriod}교시`;
    return;
  }

  currentClassName.textContent = currentItem.subject || `${currentPeriod}교시`;
  currentClassRoom.textContent = currentItem.room || "교실 정보 없음";
  currentClassStatus.textContent = `현재 ${currentPeriod}교시 수업이 진행 중이야.`;
  currentClassBadge.textContent = `${currentPeriod}교시`;
}

function renderTimetable(timetable) {
  const currentPeriod = getCurrentPeriod();
  timetableList.innerHTML = "";

  if (!timetable.length) {
    timetableList.innerHTML = `<div class="timetable-item"><div class="period-badge">-</div><div class="subject-wrap"><div class="subject-name">시간표 정보가 없어요</div><div class="subject-room">학교코드/날짜를 확인해줘</div></div></div>`;
    return;
  }

  timetable.forEach(item => {
    const timetableItem = document.createElement("div");
    timetableItem.className = "timetable-item";

    if (Number(currentPeriod) === Number(item.period)) {
      timetableItem.classList.add("current-period");
    }

    timetableItem.innerHTML = `
      <div class="period-badge">${item.period}교시</div>
      <div class="subject-wrap">
        <div class="subject-name">${item.subject}</div>
        <div class="subject-room">${item.room || "교실 정보 없음"}</div>
      </div>
    `;

    timetableList.appendChild(timetableItem);
  });
}

function renderMeal(meals) {
  mealList.innerHTML = "";

  if (!meals.length) {
    mealList.innerHTML = "<li>급식 정보가 없어요. 학교코드나 날짜를 확인해줘.</li>";
    return;
  }

  meals.forEach(menu => {
    const li = document.createElement("li");
    li.textContent = menu;
    mealList.appendChild(li);
  });
}

function renderWeather(weather) {
  weatherLocation.textContent = `${weather.locationName} 📍`;
  weatherTemp.textContent = weather.temp !== null ? `${weather.temp}°` : "--°";
  weatherStatus.textContent = weather.status || "날씨 정보 없음";
  weatherSub.textContent = `습도 ${weather.humidity ?? "-"}% · 풍속 ${weather.windSpeed ?? "-"}m/s · 강수 ${weather.rain1h ?? "0"}mm`;
  weatherEmoji.textContent = weather.emoji || "☀️";
}

function renderWeatherFallback(message) {
  weatherStatus.textContent = "날씨를 불러오지 못했어";
  weatherSub.textContent = message || "기상청 API 키를 다시 확인해줘";
}

async function initAppData() {
  debugText.textContent = `학교코드 ${CONFIG.neis.schoolCode} 적용 / 6개 선택과목 방식 적용`;

  try {
    const [timetable, meals] = await Promise.all([fetchTimetableData(), fetchMealData()]);
    renderTimetable(timetable);
    renderCurrentClass(timetable);
    renderMeal(meals);
  } catch (e) {
    console.error(e);
    renderTimetable([]);
    renderCurrentClass([]);
    renderMeal([]);
    debugText.textContent = `NEIS 오류: ${e.message}`;
  }

  try {
    const weather = await fetchWeatherNow();
    renderWeather(weather);
  } catch (e) {
    console.error(e);
    renderWeatherFallback(e.message);
    debugText.textContent += ` / 날씨 오류: ${e.message}`;
  }
}

function openMenu() {
  sideMenu.classList.add("open");
  menuOverlay.classList.add("show");
}

function closeMenu() {
  sideMenu.classList.remove("open");
  menuOverlay.classList.remove("show");
}

function resetProfile() {
  localStorage.removeItem("gapyeong36ProfileABC");
  location.reload();
}

openMenuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);
saveProfileBtn.addEventListener("click", saveProfile);
resetProfileBtn.addEventListener("click", resetProfile);

setTodayDate();
const profile = loadProfile();
if (profile) {
  updateWelcome(profile);
  renderSelectionSummary(profile);
  initAppData();
}
