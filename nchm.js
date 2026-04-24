/**
 * ==================== nchm.js 파일 설명 ====================
 * 이 파일은 시흥시능곡청소년문화의집 통합 서비스의 모든 동작을 관리합니다.
 * 
 * 수정 규칙:
 * 1. 비밀번호 변경 가능 (현재: 9806)
 * 2. 데이터 저장 구조(AGE_GROUPS, PURPOSES)는 표준을 따르세요
 * 3. HTML 요소 ID명 변경 금지 (nchm.html과 연동)
 * 4. localStorage 키명 변경 금지 (데이터 손실 발생)
 * 5. 스타일 수정은 nchm.css에서만 처리
 * ==========================================================
 */

/* ==================== 전역 상수 및 변수 ==================== */

/**
 * 연령대 분류
 * 방문 등록과 AR 예약에서 사용되는 표준 연령대 목록
 * 순서: 초등 → 중등 → 고등 → 청년 → 청년 → 유아 → 성인
 */
const AGE_GROUPS = [
    "초등(9~13세)",
    "중등(14~16세)",
    "고등(17~19세)",
    "청년(20~24세)",
    "청년(25~39세)",
    "유아(8세 미만)",
    "성인(40세 이상)"
];

/**
 * 이용 목적 분류
 * 방문 등록에서 선택 가능한 활동 목적 목록
 */
const PURPOSES = ["휴식", "독서", "보드게임", "탁구", "스터디룸"];

// 방문 등록 데이터 배열 (localStorage에서 불러옴)
let visitLogs = JSON.parse(localStorage.getItem("visitLogs")) || [];

// AR 예약 데이터 배열 (localStorage에서 불러옴)
let arLogs = JSON.parse(localStorage.getItem("arLogs")) || [];

// 현재 필터 상태 (all, month, custom)
let currentFilter = "all";

/* ==================== 유틸리티 함수 ==================== */

/**
 * Lucide 아이콘 라이브러리 새로고침
 * DOM이 변경될 때마다 호출하여 새로운 아이콘을 렌더링합니다.
 */
function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * localStorage에 데이터 저장
 * visitLogs와 arLogs 배열을 JSON 형식으로 저장
 */
function saveData() {
    localStorage.setItem("visitLogs", JSON.stringify(visitLogs));
    localStorage.setItem("arLogs", JSON.stringify(arLogs));
}

/**
 * 화면 상단에 알림 메시지 표시
 * @param {string} msg - 표시할 메시지
 */
function showMessage(msg) {
    const box = document.getElementById("custom-alert");
    box.innerText = msg;
    box.style.display = "block";

    // 2초 후 자동으로 숨김
    setTimeout(() => {
        box.style.display = "none";
    }, 2000);
}

/* ==================== 관리자 인증 함수 ==================== */

/**
 * 관리자 비밀번호 입력 모달 열기
 */
function openPasswordModal() {
    document.getElementById("password-modal").classList.remove("hidden");
    document.getElementById("admin-password-input").value = "";
    document.getElementById("admin-password-input").focus();
}

/**
 * 관리자 비밀번호 입력 모달 닫기
 */
function closePasswordModal() {
    document.getElementById("password-modal").classList.add("hidden");
}

/**
 * 관리자 비밀번호 검증
 * ⚠️ 비밀번호: 9806 (필요시 변경 가능)
 */
function verifyAdminPassword() {
    const inputPassword = document.getElementById("admin-password-input").value;
    
    if (inputPassword === "9806") {
        // 비밀번호 정확함 → 관리자 모드 진입
        enterAdminMode();
        closePasswordModal();
    } else {
        // 비밀번호 오류 → 알림 표시 후 초기화
        showMessage("비밀번호가 틀렸습니다.");
        document.getElementById("admin-password-input").value = "";
        document.getElementById("admin-password-input").focus();
    }
}

/**
 * 관리자 모드 진입
 * UI를 관리자 대시보드로 변경하고 통계 업데이트
 */
function enterAdminMode() {
    document.body.className = "pb-10 theme-admin";
    document.getElementById("main-tabs").classList.add("hidden");
    document.getElementById("section-visit").classList.add("hidden");
    document.getElementById("section-ar").classList.add("hidden");
    document.getElementById("admin-tabs").classList.remove("hidden");
    document.getElementById("section-admin").classList.remove("hidden");
    document.getElementById("admin-entry-btn").classList.add("hidden");
    document.getElementById("exit-admin-btn").classList.remove("hidden");
    document.getElementById("main-content-container").classList.replace("max-w-xl", "max-w-6xl");
    updateAdminDashboard();
}

/**
 * 관리자 모드 종료
 */
function exitAdmin() {
    document.getElementById("main-content-container").classList.replace("max-w-6xl", "max-w-xl");
    document.getElementById("admin-tabs").classList.add("hidden");
    document.getElementById("section-admin").classList.add("hidden");
    document.getElementById("exit-admin-btn").classList.add("hidden");
    document.getElementById("admin-entry-btn").classList.remove("hidden");
    switchTab("visit");
}

/* ==================== 탭 전환 함수 ==================== */

/**
 * 메인 탭 전환 (방문 등록 ↔ AR 예약)
 * @param {string} type - 'visit' 또는 'ar'
 */
function switchTab(type) {
    // 모든 탭 버튼 초기화
    document.getElementById("tab-visit").className = "tab-btn font-bold";
    document.getElementById("tab-ar").className = "tab-btn font-bold";
    document.getElementById("main-tabs").classList.remove("hidden");
    document.getElementById("section-visit").classList.add("hidden");
    document.getElementById("section-ar").classList.add("hidden");

    if (type === "visit") {
        // 방문 등록 탭 활성화
        document.body.className = "pb-10 theme-visit";
        document.getElementById("section-visit").classList.remove("hidden");
        document.getElementById("tab-visit").classList.add("active-visit");
    } else {
        // AR 예약 탭 활성화
        document.body.className = "pb-10 theme-ar";
        document.getElementById("section-ar").classList.remove("hidden");
        document.getElementById("tab-ar").classList.add("active-ar");
        generateTimeSlots(); // 시간대 버튼 생성
    }
}

/**
 * 관리자 서브 탭 전환 (방문 등록 내역 ↔ AR 예약 현황)
 * @param {string} tab - 'visit-logs' 또는 'ar-logs'
 */
function switchAdminSubTab(tab) {
    document.getElementById("admin-visit-logs").classList.add("hidden");
    document.getElementById("admin-ar-logs").classList.add("hidden");
    document.getElementById("subtab-visit-logs").classList.remove("active-visit");
    document.getElementById("subtab-ar-logs").classList.remove("active-ar");

    if (tab === "visit-logs") {
        document.getElementById("admin-visit-logs").classList.remove("hidden");
        document.getElementById("subtab-visit-logs").classList.add("active-visit");
    } else {
        document.getElementById("admin-ar-logs").classList.remove("hidden");
        document.getElementById("subtab-ar-logs").classList.add("active-ar");
    }
}

function selectBtn(el, group) {
    if (el.classList.contains("disabled")) return;

    document.querySelectorAll("." + group).forEach((button) => {
        button.classList.remove("active");
    });

    el.classList.add("active");
}

function togglePurpose(el) {
    el.classList.toggle("active");
}

/*
    AR 예약 이용자 카드 추가
    건드려도 되는 것:
    - 입력창 placeholder
    - 버튼 문구
    - 카드 내부 구조

    건드리지 말아야 하는 것:
    - .ar-user-card 클래스명
    - input/select/button 구조의 기본 흐름
    - 마지막의 refreshIcons() 호출
*/
function addUserForm() {
    const container = document.getElementById("ar-user-container");
    const div = document.createElement("div");

    div.className = "ar-user-card card-shadow animate-fadeIn";
    div.innerHTML = `
        <div class="flex flex-1 gap-3">
            <div class="flex-1"><input type="text" placeholder="이름" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-base font-bold outline-none focus:border-indigo-400"></div>
            <div class="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-32 shrink-0">
                <button type="button" class="flex-1 py-2.5 bg-white rounded-xl text-sm font-bold shadow-sm" onclick="selectGender(this)">남</button>
                <button type="button" class="flex-1 py-2.5 text-sm font-bold text-slate-400" onclick="selectGender(this)">여</button>
            </div>
        </div>
        <div class="flex gap-3 items-center">
            <select class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-400">
                <option value="" disabled selected>나이 선택</option>
                ${AGE_GROUPS.map((age) => `<option>${age}</option>`).join("")}
            </select>
            <button type="button" onclick="this.closest('.ar-user-card').remove()" class="text-slate-300 hover:text-red-500 transition-colors p-2 shrink-0">
                <i data-lucide="minus-circle" class="w-7 h-7"></i>
            </button>
        </div>
    `;

    container.appendChild(div);
    refreshIcons();
}

function selectGender(btn) {
    const parent = btn.parentElement;

    parent.querySelectorAll("button").forEach((button) => {
        button.className = "flex-1 py-2.5 text-sm font-bold text-slate-400";
    });

    btn.className = "flex-1 py-2.5 bg-white rounded-xl text-sm font-bold shadow-sm";
}

function generateTimeSlots() {
    const container = document.getElementById("time-container");
    const indicator = document.getElementById("ar-day-indicator");

    container.innerHTML = "";

    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const todayStr = now.toISOString().split("T")[0];
    const reservedSlots = arLogs
        .filter((log) => log.date === todayStr)
        .map((log) => log.timeSlot);

    if (isWeekend) {
        indicator.innerText = "🗓️ 주말 운영 (10:00~18:00)";
        indicator.className = "mb-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700";

        for (let h = 10; h < 18; h += 1) {
            if (h === 12) continue;

            ["00", "30"].forEach((m) => {
                addTimeBtn(container, h, m, reservedSlots);
            });
        }
    } else {
        indicator.innerText = "🗓️ 평일 운영 (10:00~20:30)";
        indicator.className = "mb-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700";

        for (let h = 10; h <= 20; h += 1) {
            if (h === 12) continue;

            ["00", "30"].forEach((m) => {
                if (h === 20 && m === "30") return;
                addTimeBtn(container, h, m, reservedSlots);
            });
        }
    }

    refreshIcons();
}

function addTimeBtn(container, h, m, reservedSlots) {
    const timeStr = `${h.toString().padStart(2, "0")}:${m}`;
    const isReserved = reservedSlots.includes(timeStr);
    const endH = m === "30" ? h + 1 : h;
    const endM = m === "30" ? "00" : "30";
    const endTimeStr = `${endH.toString().padStart(2, "0")}:${endM}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `time-slot-btn choice-btn p-4 rounded-2xl flex flex-col items-center ${isReserved ? "disabled" : ""}`;

    if (isReserved) {
        btn.innerHTML = `<span class="text-lg font-black">${timeStr}</span><span class="text-[10px] text-red-500 font-bold">예약 완료</span>`;
    } else {
        btn.innerHTML = `
            <span class="text-lg font-black">${timeStr}</span>
            <span class="text-[10px] text-slate-400">~ ${endTimeStr}</span>
            <div class="check-badge"><i data-lucide="check" class="w-3 h-3"></i></div>
        `;
        btn.onclick = () => selectBtn(btn, "time-slot-btn");
    }

    container.appendChild(btn);
}

function setFilter(type) {
    currentFilter = type;

    document.querySelectorAll(".filter-chip").forEach((btn) => {
        btn.classList.remove("active");
    });

    if (type === "month") {
        document.getElementById("filter-month").classList.add("active");
    } else {
        document.getElementById("filter-" + type).classList.add("active");
    }

    const customDateBox = document.getElementById("custom-date-inputs");

    if (type === "custom") {
        customDateBox.classList.remove("hidden");
    } else {
        customDateBox.classList.add("hidden");
    }

    if (type === "all") {
        updateAdminDashboard();
    }
}

function isDateInRange(dateStr) {
    const targetDate = new Date(dateStr);

    if (currentFilter === "all") return true;

    if (currentFilter === "month") {
        const selectedYear = parseInt(document.getElementById("filter-year-select").value, 10);
        const selectedMonth = parseInt(document.getElementById("filter-month-select").value, 10);
        return targetDate.getMonth() === selectedMonth && targetDate.getFullYear() === selectedYear;
    }

    if (currentFilter === "custom") {
        const start = document.getElementById("start-date").value;
        const end = document.getElementById("end-date").value;

        if (!start || !end) return true;

        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59);

        return targetDate >= startDate && targetDate <= endDate;
    }

    return true;
}

function renderStatsTable(data, categories, targetBodyId, targetFooterId, themeClass) {
    const body = document.getElementById(targetBodyId);
    const footer = document.getElementById(targetFooterId);

    body.innerHTML = "";

    let grandTotal = 0;
    const ageGenderTotals = {};

    AGE_GROUPS.forEach((age) => {
        ageGenderTotals[age] = { 남: 0, 여: 0 };
    });

    categories.forEach((category) => {
        let youthSum = 0;
        let youngSum = 0;
        let rowTotal = 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="category-row">${category}</td>`;

        AGE_GROUPS.forEach((age, idx) => {
            const male = data[category][age]["남"];
            const female = data[category][age]["여"];
            const rowVal = male + female;

            tr.innerHTML += `<td>${male || "-"}</td><td>${female || "-"}</td>`;
            rowTotal += rowVal;
            ageGenderTotals[age]["남"] += male;
            ageGenderTotals[age]["여"] += female;

            if (idx < 3) youthSum += rowVal;
            if (idx >= 3 && idx <= 4) youngSum += rowVal;
        });

        tr.innerHTML += `<td class="${themeClass}">${youthSum}</td><td class="${themeClass}">${youngSum}</td><td class="total-sum-col">${rowTotal}</td>`;
        body.appendChild(tr);
        grandTotal += rowTotal;
    });

    footer.innerHTML = "<td>합계</td>";

    let footerYouth = 0;
    let footerYoung = 0;

    AGE_GROUPS.forEach((age, idx) => {
        const male = ageGenderTotals[age]["남"];
        const female = ageGenderTotals[age]["여"];

        footer.innerHTML += `<td>${male}</td><td>${female}</td>`;

        const sum = male + female;
        if (idx < 3) footerYouth += sum;
        if (idx >= 3 && idx <= 4) footerYoung += sum;
    });

    const finalClass = themeClass === "sum-col" ? "final-total-visit" : "final-total-ar";
    footer.innerHTML += `<td>${footerYouth}</td><td>${footerYoung}</td><td class="${finalClass}">${grandTotal}</td>`;
}

function updateAdminDashboard() {
    const filteredVisitLogs = visitLogs.filter((log) => isDateInRange(log.date));
    const filteredArLogs = arLogs.filter((log) => isDateInRange(log.date));

    const generalPurposes = PURPOSES.filter((purpose) => purpose !== "스터디룸");

    const vStats = {};
    generalPurposes.forEach((purpose) => {
        vStats[purpose] = {};
        AGE_GROUPS.forEach((age) => {
            vStats[purpose][age] = { 남: 0, 여: 0 };
        });
    });

    filteredVisitLogs.forEach((log) => {
        log.purposes.forEach((purpose) => {
            if (generalPurposes.includes(purpose) && vStats[purpose] && vStats[purpose][log.age]) {
                vStats[purpose][log.age][log.gender] += 1;
            }
        });
    });

    renderStatsTable(vStats, generalPurposes, "visit-stats-body", "visit-stats-footer", "sum-col");

    const studyStats = { "스터디룸": {} };
    AGE_GROUPS.forEach((age) => {
        studyStats["스터디룸"][age] = { 남: 0, 여: 0 };
    });

    filteredVisitLogs.forEach((log) => {
        if (log.purposes.includes("스터디룸")) {
            studyStats["스터디룸"][log.age][log.gender] += 1;
        }
    });

    renderStatsTable(studyStats, ["스터디룸"], "study-stats-body", "study-stats-footer", "sum-col");

    const arStats = { "AR 이용": {} };
    AGE_GROUPS.forEach((age) => {
        arStats["AR 이용"][age] = { 남: 0, 여: 0 };
    });

    filteredArLogs.forEach((log) => {
        log.users.forEach((user) => {
            if (arStats["AR 이용"][user.age]) {
                arStats["AR 이용"][user.age][user.gender] += 1;
            }
        });
    });

    renderStatsTable(arStats, ["AR 이용"], "ar-stats-body", "ar-stats-footer", "ar-sum-col");

    const visitBody = document.getElementById("visit-log-body");
    visitBody.innerHTML = "";

    filteredVisitLogs.slice().reverse().forEach((log) => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-slate-50";
        tr.innerHTML = `
            <td class="py-3 text-slate-500 font-bold text-xs">${log.date}</td>
            <td class="text-slate-400 font-medium">${log.time}</td>
            <td class="font-bold">${log.name}</td>
            <td>${log.gender}</td>
            <td>${log.age.split("(")[0]}</td>
            <td><div class="flex gap-1 justify-center">${log.purposes.map((purpose) => `<span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold">${purpose}</span>`).join("")}</div></td>
        `;
        visitBody.appendChild(tr);
    });

    document.getElementById("visit-count-badge").innerText = filteredVisitLogs.length + "건";

    const arBody = document.getElementById("ar-log-body");
    arBody.innerHTML = "";

    filteredArLogs.slice().reverse().forEach((log) => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-indigo-50/30";

        const details = log.users
            .map((user) => `<span class="inline-block bg-slate-100 rounded-lg px-2 py-1 mr-1 mb-1 text-slate-700 font-medium">${user.name}<span class="text-[10px] text-slate-400 ml-1">(${user.gender}, ${user.age.split("(")[0]})</span></span>`)
            .join("");

        tr.innerHTML = `
            <td class="py-3 text-slate-500 font-bold text-xs">${log.date}</td>
            <td class="py-3 text-indigo-600 font-bold">${log.timeSlot}</td>
            <td class="font-bold">${log.users[0].name}</td>
            <td>${log.users.length}명</td>
            <td class="text-xs text-left px-4 py-2">${details}</td>
        `;

        arBody.appendChild(tr);
    });

    document.getElementById("ar-count-badge").innerText = filteredArLogs.length + "건";
}

function submitForm(type) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    const dateStr = now.toISOString().split("T")[0];

    if (type === "visit") {
        const name = document.getElementById("v-name-input").value.trim();
        const gender = document.querySelector(".v-gender.active")?.childNodes[0]?.textContent?.trim() || document.querySelector(".v-gender.active")?.innerText?.trim();
        const age = document.querySelector(".v-age.active")?.childNodes[0]?.textContent?.trim() || document.querySelector(".v-age.active")?.innerText?.trim();
        const purposes = Array.from(document.querySelectorAll(".v-purpose.active")).map((purpose) => purpose.querySelector("span").innerText);

        if (!name || !gender || !age || purposes.length === 0) {
            showMessage("정보를 모두 입력해 주세요!");
            return;
        }

        visitLogs.push({ date: dateStr, time: timeStr, name, gender, age, purposes });
        saveData();
        alert("방문 등록이 완료되었습니다!");

        document.getElementById("v-name-input").value = "";
        document.querySelectorAll(".v-gender, .v-age, .v-purpose").forEach((button) => {
            button.classList.remove("active");
        });
    } else {
        const timeSlot = document.querySelector(".time-slot-btn.active")?.querySelector("span")?.innerText;

        if (!timeSlot) {
            showMessage("시간을 선택해 주세요!");
            return;
        }

        const users = Array.from(document.querySelectorAll(".ar-user-card")).map((card) => {
            const genderBtn = Array.from(card.querySelectorAll("button")).find((button) => button.classList.contains("bg-white"));

            return {
                name: card.querySelector("input").value.trim(),
                gender: genderBtn ? genderBtn.innerText.trim() : "남",
                age: card.querySelector("select").value
            };
        });

        if (users.length === 0 || users.some((user) => !user.name || !user.age)) {
            showMessage("정보를 모두 입력해 주세요!");
            return;
        }

        arLogs.push({ date: dateStr, timeSlot, users });
        saveData();
        alert("AR 예약이 신청되었습니다!");

        document.getElementById("ar-user-container").innerHTML = "";
        document.querySelectorAll(".time-slot-btn").forEach((button) => {
            button.classList.remove("active");
        });

        addUserForm();
        generateTimeSlots();
    }
}

function exportToExcel(type) {
    let csvContent = "\uFEFF";
    let fileName = "";

    if (type === "visit") {
        const filtered = visitLogs.filter((log) => isDateInRange(log.date));
        if (filtered.length === 0) {
            alert("데이터가 없습니다.");
            return;
        }

        csvContent += "날짜,시간,이름,성별,나이,이용목적\n";
        filtered.forEach((log) => {
            csvContent += `${log.date},${log.time},${log.name},${log.gender},${log.age.split("(")[0]},"${log.purposes.join(", ")}"\n`;
        });

        fileName = `방문등록_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
        const filtered = arLogs.filter((log) => isDateInRange(log.date));
        if (filtered.length === 0) {
            alert("데이터가 없습니다.");
            return;
        }

        csvContent += "예약날짜,예약시간,대표자,총인원,이용자상세\n";
        filtered.forEach((log) => {
            const details = log.users.map((user) => `${user.name}(${user.gender}/${user.age.split("(")[0]})`).join(" | ");
            csvContent += `${log.date},${log.timeSlot},${log.users[0].name},${log.users.length},"${details}"\n`;
        });

        fileName = `AR예약_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.click();
}

function initFilterOptions() {
    const yearSelect = document.getElementById("filter-year-select");
    const monthSelect = document.getElementById("filter-month-select");
    const now = new Date();

    for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y += 1) {
        const option = document.createElement("option");
        option.value = y;
        option.innerText = y + "년";

        if (y === now.getFullYear()) {
            option.selected = true;
        }

        yearSelect.appendChild(option);
    }

    monthSelect.value = now.getMonth();
}

function initializePage() {
    const now = new Date();

    document.getElementById("current-date").innerText = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
    document.getElementById("start-date").value = now.toISOString().split("T")[0];
    document.getElementById("end-date").value = now.toISOString().split("T")[0];

    initFilterOptions();
    addUserForm();
    refreshIcons();
}

document.addEventListener("DOMContentLoaded", initializePage);