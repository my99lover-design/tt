"use strict";

/* =========================================================
   넘버원 김포B 공비 V2
   script.js 전체 교체본
   - 스프레드시트 데이터: Apps Script
   - GPS 좌표 데이터: locations.json
========================================================= */

/*
 * Google Apps Script 웹 앱 배포 주소를 입력합니다.
 * 반드시 /exec로 끝나는 주소를 사용합니다.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbxMc74RsguWtr-4Nx3w2OeTctpb8-ILGN5j41kW97YNY-0KMX4FOfdvQUKDL0UGTbxk/exec";

/*
 * locations.json은 index.html, script.js와
 * 같은 GitHub 폴더에 둡니다.
 */
const LOCATIONS_URL = "./locations.json";

/* =========================================================
   기본 설정
========================================================= */

const APP_CONFIG = Object.freeze({
    CACHE_KEY: "gimpoB_common_password_v2",
    CACHE_TIME_KEY: "gimpoB_common_password_cache_time_v2",
    THEME_KEY: "gimpoB_theme_v2",
    LAST_LOCATION_KEY: "gimpoB_last_location_v2",

    CACHE_MAX_AGE: 1000 * 60 * 60 * 24,
    LAST_LOCATION_MAX_AGE: 1000 * 60 * 60 * 24,

    GPS_BUTTON_COUNT: 4,
    GPS_WATCH_TIME: 30000
});

/* =========================================================
   화면 요소
========================================================= */

const elements = {
    headerArea: document.querySelector(".header-area"),

    appTitle: document.getElementById("appTitle"),
    titleMain: document.getElementById("titleMain"),
    titleSub: document.getElementById("titleSub"),
    themeToggle: document.getElementById("themeToggle"),

    navContainer: document.getElementById("navContainer"),
    backBtn: document.getElementById("backBtn"),
    homeBtn: document.getElementById("homeBtn"),

    gpsSection: document.getElementById("gpsSection"),
    gpsStatusBadge: document.getElementById("gpsStatusBadge"),
    gpsButtons: document.getElementById("gpsButtons"),

    commonPwdStandalone:
        document.getElementById("commonPwdStandalone"),

    stepContainer: document.getElementById("stepContainer"),
    buttonGrid: document.getElementById("buttonGrid"),

    cardList: document.getElementById("cardList"),

    commonEditorModal:
        document.getElementById("commonEditorModal"),

    commonModalAptLabel:
        document.getElementById("commonModalAptLabel"),

    formCommonPwdValue:
        document.getElementById("formCommonPwdValue"),

    addPwdModal:
        document.getElementById("addPwdModal"),

    addPwdModalTitle:
        document.getElementById("addPwdModalTitle"),

    addPwdRowId:
        document.getElementById("addPwdRowId"),

    addPwdInfo:
        document.getElementById("addPwdInfo"),

    addPwdValue:
        document.getElementById("addPwdValue"),

    deletePwdModal:
        document.getElementById("deletePwdModal"),

    deletePwdModalTitle:
        document.getElementById("deletePwdModalTitle"),

    deletePwdRowId:
        document.getElementById("deletePwdRowId"),

    deletePwdInfo:
        document.getElementById("deletePwdInfo"),

    deletePwdButtons:
        document.getElementById("deletePwdButtons"),

    toast:
        document.getElementById("toast")
};

/* =========================================================
   앱 상태
========================================================= */

const state = {
    records: [],

    /*
     * key:
     * 정규화한 아파트명
     *
     * value:
     * {
     *   sourceName,
     *   coordinates: [
     *      { latitude, longitude }
     *   ]
     * }
     */
    locationMap: new Map(),

    locationsLoaded: false,
    locationsError: false,

    selectedRegion: "",
    selectedApartment: "",
    selectedDong: "",

    view: "regions",
    history: [],

    loading: true,
    networkLoading: false,

    currentCommonEdit: null,

    currentLocation: null,
    gpsWatchId: null,
    gpsStopTimer: null,

    toastTimer: null
};

/* =========================================================
   앱 시작
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

async function initializeApp() {
    initializeTheme();
    initializeModalEvents();

    renderLoading(
        "데이터를 불러오는 중입니다..."
    );

    const cachedRecords =
        loadCachedRecords();

    if (cachedRecords.length > 0) {
        state.records = cachedRecords;
        state.loading = false;

        resetSteps(false);
    }

    /*
     * GPS는 데이터 로딩과 관계없이 바로 시작합니다.
     */
    startGps();

    /*
     * 스프레드시트 데이터와 locations.json을
     * 동시에 불러옵니다.
     */
    await Promise.allSettled([
        loadRecordsFromServer(),
        loadLocations()
    ]);

    renderGpsButtons();
}

/* =========================================================
   테마
========================================================= */

function initializeTheme() {
    const savedTheme =
        localStorage.getItem(
            APP_CONFIG.THEME_KEY
        ) || "light";

    applyTheme(savedTheme);

    elements.themeToggle.addEventListener(
        "click",
        toggleTheme
    );
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute(
            "data-theme"
        );

    const nextTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";

    localStorage.setItem(
        APP_CONFIG.THEME_KEY,
        nextTheme
    );

    applyTheme(nextTheme);
}

function applyTheme(theme) {
    const normalizedTheme =
        theme === "dark"
            ? "dark"
            : "light";

    document.documentElement.setAttribute(
        "data-theme",
        normalizedTheme
    );

    elements.themeToggle.textContent =
        normalizedTheme === "dark"
            ? "☀️ 밝기"
            : "🌙 밝기";
}

/* =========================================================
   스프레드시트 데이터 불러오기
========================================================= */

async function loadRecordsFromServer() {
    if (state.networkLoading) {
        return;
    }

    state.networkLoading = true;

    try {
        const response =
            await requestApi("getData");

        const rawData =
            Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

        if (rawData.length === 0) {
            throw new Error(
                "불러온 데이터가 없습니다."
            );
        }

        const normalizedRecords =
            rawData
                .map((item, index) =>
                    normalizeRecord(item, index)
                )
                .filter(record =>
                    record.region &&
                    record.apartment
                );

        if (normalizedRecords.length === 0) {
            throw new Error(
                "사용 가능한 지역·아파트 데이터가 없습니다."
            );
        }

        state.records =
            normalizedRecords;

        state.loading = false;

        saveRecordsToCache(
            normalizedRecords
        );

        validateCurrentSelection();
        renderCurrentView();
        renderGpsButtons();

    } catch (error) {
        console.error(
            "데이터 불러오기 실패:",
            error
        );

        state.loading = false;

        if (state.records.length === 0) {
            renderError(
                "데이터를 불러오지 못했습니다.",
                error.message
            );

        } else {
            showToast(
                "서버 연결 실패로 저장된 데이터를 표시합니다."
            );
        }

    } finally {
        state.networkLoading = false;
    }
}

/* =========================================================
   locations.json 불러오기
========================================================= */

async function loadLocations() {
    state.locationsLoaded = false;
    state.locationsError = false;

    renderGpsButtons();

    try {
        /*
         * 수정된 JSON이 즉시 반영되도록
         * 현재 시간을 주소 뒤에 붙입니다.
         */
        const separator =
            LOCATIONS_URL.includes("?")
                ? "&"
                : "?";

        const requestUrl =
            `${LOCATIONS_URL}${separator}_t=${Date.now()}`;

        const response = await fetch(
            requestUrl,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `locations.json 응답 오류 (${response.status})`
            );
        }

        const rawLocations =
            await response.json();

        if (
            !rawLocations ||
            typeof rawLocations !== "object" ||
            Array.isArray(rawLocations)
        ) {
            throw new Error(
                "locations.json 형식이 올바르지 않습니다."
            );
        }

        state.locationMap =
            normalizeLocationData(
                rawLocations
            );

        state.locationsLoaded = true;
        state.locationsError = false;

        console.info(
            `GPS 좌표 아파트 수: ${state.locationMap.size}`
        );

    } catch (error) {
        console.error(
            "locations.json 불러오기 실패:",
            error
        );

        state.locationMap =
            new Map();

        state.locationsLoaded = true;
        state.locationsError = true;

    } finally {
        renderGpsButtons();
    }
}

/* =========================================================
   locations.json 정규화
========================================================= */

function normalizeLocationData(
    rawLocations
) {
    const result = new Map();

    for (
        const [
            apartmentName,
            coordinateList
        ] of Object.entries(rawLocations)
    ) {
        if (!Array.isArray(coordinateList)) {
            continue;
        }

        const normalizedName =
            normalizeApartmentName(
                apartmentName
            );

        if (!normalizedName) {
            continue;
        }

        const coordinates =
            coordinateList
                .map(item => {
                    const latitude =
                        Number(item?.lat);

                    const longitude =
                        Number(item?.lon);

                    return {
                        latitude,
                        longitude
                    };
                })
                .filter(item =>
                    isValidCoordinate(
                        item.latitude,
                        item.longitude
                    )
                );

        if (coordinates.length === 0) {
            continue;
        }

        if (result.has(normalizedName)) {
            const existing =
                result.get(normalizedName);

            existing.coordinates.push(
                ...coordinates
            );

        } else {
            result.set(
                normalizedName,
                {
                    sourceName:
                        cleanText(apartmentName),

                    coordinates
                }
            );
        }
    }

    return result;
}

function isValidCoordinate(
    latitude,
    longitude
) {
    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

/*
 * 아파트 이름 비교용 정규화
 *
 * 예:
 * 래미안.        → 래미안
 * 래미안 아파트  → 래미안
 * LH1.           → lh1
 */
function normalizeApartmentName(value) {
    return cleanText(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, "")
        .replace(/아파트$/u, "")
        .replace(/오피스텔$/u, "");
}

/* =========================================================
   스프레드시트 데이터 정규화
========================================================= */

function normalizeRecord(item, index) {
    const rowId = firstValue(item, [
        "rowId",
        "rowID",
        "rowNumber",
        "row",
        "id",
        "행번호"
    ]);

    const region = firstValue(item, [
        "region",
        "area",
        "지역",
        "동네"
    ]);

    const apartment = firstValue(item, [
        "apartment",
        "apt",
        "아파트",
        "아파트명"
    ]);

    const commonPassword = firstValue(item, [
        "commonPassword",
        "commonPwd",
        "common",
        "공동",
        "공동비밀번호",
        "공동비번"
    ]);

    const dong = firstValue(item, [
        "dong",
        "building",
        "동",
        "건물"
    ]);

    const line = firstValue(item, [
        "line",
        "라인",
        "호출라인"
    ]);

    const password = firstValue(item, [
        "password",
        "pwd",
        "비밀번호",
        "비번"
    ]);

    return {
        rowId:
            cleanText(rowId) ||
            String(index + 2),

        region:
            cleanText(region),

        apartment:
            cleanText(apartment),

        commonPassword:
            cleanText(commonPassword),

        dong:
            cleanText(dong),

        line:
            cleanText(line),

        password:
            cleanText(password)
    };
}

function firstValue(object, keys) {
    return cleanText(
        firstRawValue(object, keys)
    );
}

function firstRawValue(object, keys) {
    if (
        !object ||
        typeof object !== "object"
    ) {
        return "";
    }

    for (const key of keys) {
        if (
            Object.prototype.hasOwnProperty.call(
                object,
                key
            ) &&
            object[key] !== null &&
            object[key] !== undefined
        ) {
            return object[key];
        }
    }

    return "";
}

function cleanText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

/* =========================================================
   데이터 캐시
========================================================= */

function loadCachedRecords() {
    try {
        const savedData =
            localStorage.getItem(
                APP_CONFIG.CACHE_KEY
            );

        const savedTime =
            Number(
                localStorage.getItem(
                    APP_CONFIG.CACHE_TIME_KEY
                )
            );

        if (!savedData) {
            return [];
        }

        const parsed =
            JSON.parse(savedData);

        if (!Array.isArray(parsed)) {
            return [];
        }

        if (
            savedTime &&
            Date.now() - savedTime >
                APP_CONFIG.CACHE_MAX_AGE
        ) {
            console.info(
                "오래된 캐시를 임시로 사용합니다."
            );
        }

        return parsed
            .map((item, index) =>
                normalizeRecord(item, index)
            )
            .filter(record =>
                record.region &&
                record.apartment
            );

    } catch (error) {
        console.error(
            "캐시 읽기 실패:",
            error
        );

        localStorage.removeItem(
            APP_CONFIG.CACHE_KEY
        );

        localStorage.removeItem(
            APP_CONFIG.CACHE_TIME_KEY
        );

        return [];
    }
}

function saveRecordsToCache(records) {
    try {
        localStorage.setItem(
            APP_CONFIG.CACHE_KEY,
            JSON.stringify(records)
        );

        localStorage.setItem(
            APP_CONFIG.CACHE_TIME_KEY,
            String(Date.now())
        );

    } catch (error) {
        console.error(
            "캐시 저장 실패:",
            error
        );
    }
}

/* =========================================================
   화면 상태 초기화
========================================================= */

function resetSteps(clearHistory = true) {
    if (clearHistory) {
        state.history = [];
    }

    state.selectedRegion = "";
    state.selectedApartment = "";
    state.selectedDong = "";
    state.view = "regions";

    renderCurrentView();
}

function goBack() {
    const previousState =
        state.history.pop();

    if (!previousState) {
        resetSteps();
        return;
    }

    state.selectedRegion =
        previousState.selectedRegion || "";

    state.selectedApartment =
        previousState.selectedApartment || "";

    state.selectedDong =
        previousState.selectedDong || "";

    state.view =
        previousState.view || "regions";

    renderCurrentView();
}

function pushHistory() {
    state.history.push({
        selectedRegion:
            state.selectedRegion,

        selectedApartment:
            state.selectedApartment,

        selectedDong:
            state.selectedDong,

        view:
            state.view
    });

    if (state.history.length > 20) {
        state.history.shift();
    }
}

function validateCurrentSelection() {
    if (!state.selectedRegion) {
        return;
    }

    const regionExists =
        state.records.some(record =>
            record.region ===
            state.selectedRegion
        );

    if (!regionExists) {
        resetSteps();
        return;
    }

    if (!state.selectedApartment) {
        return;
    }

    const apartmentExists =
        state.records.some(record =>
            record.region ===
                state.selectedRegion &&
            record.apartment ===
                state.selectedApartment
        );

    if (!apartmentExists) {
        state.selectedApartment = "";
        state.selectedDong = "";
        state.view = "apartments";
        state.history = [];

        return;
    }

    if (!state.selectedDong) {
        return;
    }

    const dongExists =
        state.records.some(record =>
            record.region ===
                state.selectedRegion &&
            record.apartment ===
                state.selectedApartment &&
            normalizeDongValue(record.dong) ===
                normalizeDongValue(
                    state.selectedDong
                )
        );

    if (!dongExists) {
        state.selectedDong = "";
        state.view = "dongs";
    }
}

/* =========================================================
   현재 화면 렌더링
========================================================= */

function renderCurrentView() {
    updateHeaderAndNavigation();

    elements.buttonGrid.replaceChildren();
    elements.cardList.replaceChildren();
    elements.commonPwdStandalone.replaceChildren();

    elements.commonPwdStandalone.style.display =
        "none";

    elements.cardList.style.display =
        "none";

    elements.stepContainer.style.display =
        "block";

    if (
        state.loading &&
        state.records.length === 0
    ) {
        renderLoading(
            "데이터를 불러오는 중입니다..."
        );

        return;
    }

    switch (state.view) {
        case "apartments":
            renderApartmentButtons();
            break;

        case "dongs":
            renderCommonPassword();
            renderDongButtons();
            break;

        case "cards":
            renderCommonPassword();
            renderPasswordCards();
            break;

        case "regions":
        default:
            renderRegionButtons();
            break;
    }
}

function updateHeaderAndNavigation() {
    const isHome =
        state.view === "regions";

    elements.headerArea.classList.toggle(
        "header-single",
        !isHome
    );

    if (isHome) {
        elements.titleMain.textContent =
            "넘버원🥇";

        elements.titleSub.textContent =
            "김포B 공비";

        elements.themeToggle.style.display =
            "";

        elements.navContainer.style.display =
            "none";

        elements.gpsSection.style.display =
            "block";

    } else {
        elements.titleMain.textContent =
            "넘버원🥇 김포B 공비";

        elements.titleSub.textContent =
            "";

        elements.themeToggle.style.display =
            "none";

        elements.navContainer.style.display =
            "grid";

        elements.gpsSection.style.display =
            "none";
    }
}

/* =========================================================
   지역 버튼
========================================================= */

function renderRegionButtons() {
    const regions =
        uniqueValues(
            state.records.map(
                record => record.region
            )
        ).sort(compareRegions);

    if (regions.length === 0) {
        renderStatusMessage(
            "등록된 지역이 없습니다."
        );

        return;
    }

    for (const region of regions) {
        const button =
            createSelectButton(region);

        button.addEventListener(
            "click",
            () => {
                selectRegion(region);
            }
        );

        elements.buttonGrid.appendChild(
            button
        );
    }

    renderGpsButtons();
}

function selectRegion(region) {
    pushHistory();

    state.selectedRegion = region;
    state.selectedApartment = "";
    state.selectedDong = "";
    state.view = "apartments";

    renderCurrentView();
}

/* =========================================================
   아파트 버튼
========================================================= */

function renderApartmentButtons() {
    const apartments =
        uniqueValues(
            state.records
                .filter(record =>
                    record.region ===
                    state.selectedRegion
                )
                .map(record =>
                    record.apartment
                )
        ).sort(naturalCompare);

    if (apartments.length === 0) {
        renderStatusMessage(
            "등록된 아파트가 없습니다."
        );

        return;
    }

    for (const apartment of apartments) {
        const button =
            createSelectButton(apartment);

        button.addEventListener(
            "click",
            () => {
                selectApartment(apartment);
            }
        );

        elements.buttonGrid.appendChild(
            button
        );
    }
}

function selectApartment(apartment) {
    pushHistory();

    state.selectedApartment =
        apartment;

    state.selectedDong = "";
    state.view = "dongs";

    renderCurrentView();
}

/* =========================================================
   동 버튼
========================================================= */

function renderDongButtons() {
    const apartmentRecords =
        getSelectedApartmentRecords();

    const dongs =
        uniqueValues(
            apartmentRecords.map(record =>
                normalizeDongValue(
                    record.dong
                )
            )
        ).sort(naturalCompare);

    /*
     * 동 값이 없고 모두 "전체"뿐이면
     * 동 선택 화면 없이 바로 비밀번호 화면으로 이동합니다.
     */
    if (
        dongs.length === 0 ||
        (
            dongs.length === 1 &&
            dongs[0] === "전체"
        )
    ) {
        state.selectedDong = "전체";
        state.view = "cards";

        renderCurrentView();
        return;
    }

    for (const dong of dongs) {
        const label =
            dong === "전체"
                ? "전체"
                : formatDongLabel(dong);

        const button =
            createSelectButton(label);

        button.addEventListener(
            "click",
            () => {
                selectDong(dong);
            }
        );

        elements.buttonGrid.appendChild(
            button
        );
    }
}

function selectDong(dong) {
    pushHistory();

    state.selectedDong = dong;
    state.view = "cards";

    renderCurrentView();
}

function normalizeDongValue(value) {
    const cleaned =
        cleanText(value);

    return cleaned || "전체";
}

function formatDongLabel(dong) {
    const value =
        cleanText(dong);

    if (
        !value ||
        value === "전체"
    ) {
        return "전체";
    }

    if (/동$/u.test(value)) {
        return value;
    }

    if (/^\d+$/u.test(value)) {
        return `${value}동`;
    }

    return value;
}

/* =========================================================
   공동비밀번호 표시
========================================================= */

function renderCommonPassword() {
    const apartmentRecords =
        getSelectedApartmentRecords();

    if (apartmentRecords.length === 0) {
        return;
    }

    const commonPasswords =
        uniqueValues(
            apartmentRecords
                .map(record =>
                    record.commonPassword
                )
                .filter(Boolean)
        );

    const commonValue =
        commonPasswords.length > 0
            ? commonPasswords.join(" / ")
            : "등록된 공동비밀번호 없음";

    const title =
        document.createElement("div");

    title.className =
        "common-pwd-title";

    title.textContent =
        "<공동비번>";

    const row =
        document.createElement("div");

    row.className =
        "common-pwd-row";

    const value =
        document.createElement("div");

    value.className =
        "common-pwd-value";

    value.textContent =
        commonValue;

    const editButton =
        document.createElement("button");

    editButton.type = "button";

    editButton.className =
        "common-edit-btn";

    editButton.textContent =
        "수정";

    editButton.addEventListener(
        "click",
        openCommonModal
    );

    row.append(
        value,
        editButton
    );

    elements.commonPwdStandalone.append(
        title,
        row
    );

    elements.commonPwdStandalone.style.display =
        "block";
}

function getSelectedApartmentRecords() {
    return state.records.filter(record =>
        record.region ===
            state.selectedRegion &&
        record.apartment ===
            state.selectedApartment
    );
}

/* =========================================================
   라인별 비밀번호 카드
========================================================= */

function renderPasswordCards() {
    elements.stepContainer.style.display =
        "none";

    elements.cardList.style.display =
        "flex";

    let records =
        getSelectedApartmentRecords();

    if (
        state.selectedDong &&
        state.selectedDong !== "전체"
    ) {
        records =
            records.filter(record =>
                normalizeDongValue(
                    record.dong
                ) ===
                normalizeDongValue(
                    state.selectedDong
                )
            );
    }

    records =
        [...records].sort(
            (a, b) => {
                const lineCompare =
                    naturalCompare(
                        a.line,
                        b.line
                    );

                if (lineCompare !== 0) {
                    return lineCompare;
                }

                return (
                    Number(a.rowId) -
                    Number(b.rowId)
                );
            }
        );

    if (records.length === 0) {
        const message =
            document.createElement("div");

        message.className =
            "status-msg";

        message.textContent =
            "등록된 비밀번호가 없습니다.";

        elements.cardList.appendChild(
            message
        );

        return;
    }

    for (const record of records) {
        elements.cardList.appendChild(
            createPasswordCard(record)
        );
    }
}

function createPasswordCard(record) {
    const card =
        document.createElement("article");

    card.className = "card";
    card.dataset.rowId = record.rowId;

    const lineTitle =
        document.createElement("div");

    lineTitle.className =
        "line-info";

    lineTitle.textContent =
        `<${formatLineLabel(record.line)}>`;

    const passwordContainer =
        document.createElement("div");

    passwordContainer.className =
        "pwd-container";

    const passwordRow =
        document.createElement("div");

    passwordRow.className =
        "pwd-row";

    const passwordBox =
        document.createElement("div");

    passwordBox.className =
        "pwd-box";

    const passwordText =
        document.createElement("span");

    passwordText.className =
        "pwd-highlight";

    const passwordList =
        splitPasswords(record.password);

    passwordText.textContent =
        passwordList.length > 0
            ? passwordList.join(" / ")
            : "등록된 비밀번호 없음";

    passwordBox.appendChild(
        passwordText
    );

    passwordRow.appendChild(
        passwordBox
    );

    passwordContainer.appendChild(
        passwordRow
    );

    const footer =
        document.createElement("div");

    footer.className =
        "card-footer";

    const addButton =
        document.createElement("button");

    addButton.type = "button";

    addButton.className =
        "line-action-btn add-btn";

    addButton.textContent =
        "➕ 추가";

    addButton.addEventListener(
        "click",
        () => {
            openAddPwdModal(
                record.rowId
            );
        }
    );

    footer.appendChild(
        addButton
    );

    if (passwordList.length > 0) {
        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "line-action-btn delete-btn";

        deleteButton.textContent =
            "🗑 삭제";

        deleteButton.addEventListener(
            "click",
            () => {
                openDeletePwdModal(
                    record.rowId
                );
            }
        );

        footer.appendChild(
            deleteButton
        );
    }

    card.append(
        lineTitle,
        passwordContainer,
        footer
    );

    return card;
}

function formatLineLabel(line) {
    const value =
        cleanText(line);

    if (!value) {
        return "공용";
    }

    if (/라인$/u.test(value)) {
        return value;
    }

    return `${value}라인`;
}

function splitPasswords(value) {
    const text =
        cleanText(value);

    if (!text) {
        return [];
    }

    return uniqueValues(
        text
            .split(
                /\s*(?:\/|\||,|\r?\n)\s*/u
            )
            .map(item =>
                item.trim()
            )
            .filter(Boolean)
    );
}

/* =========================================================
   공통 버튼 및 정렬
========================================================= */

function createSelectButton(label) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.className = "select-btn";
    button.textContent = label;
    button.title = label;

    return button;
}

function uniqueValues(values) {
    return [
        ...new Set(
            values
                .map(value =>
                    cleanText(value)
                )
                .filter(Boolean)
        )
    ];
}

function naturalCompare(a, b) {
    return cleanText(a).localeCompare(
        cleanText(b),
        "ko-KR",
        {
            numeric: true,
            sensitivity: "base"
        }
    );
}

function compareRegions(a, b) {
    const regionOrder = [
        "구래",
        "마산",
        "양곡",
        "양촌",
        "장기",
        "운양",
        "오피"
    ];

    const aIndex =
        regionOrder.findIndex(name =>
            cleanText(a).includes(name)
        );

    const bIndex =
        regionOrder.findIndex(name =>
            cleanText(b).includes(name)
        );

    if (
        aIndex !== -1 &&
        bIndex !== -1
    ) {
        return aIndex - bIndex;
    }

    if (aIndex !== -1) {
        return -1;
    }

    if (bIndex !== -1) {
        return 1;
    }

    return naturalCompare(a, b);
}

/* =========================================================
   로딩 및 오류 표시
========================================================= */

function renderLoading(message) {
    elements.cardList.replaceChildren();
    elements.commonPwdStandalone.replaceChildren();
    elements.buttonGrid.replaceChildren();

    elements.stepContainer.style.display =
        "block";

    elements.cardList.style.display =
        "none";

    elements.commonPwdStandalone.style.display =
        "none";

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "status-msg";

    wrapper.style.gridColumn =
        "1 / -1";

    const spinner =
        document.createElement("span");

    spinner.className =
        "spinner";

    const text =
        document.createElement("span");

    text.textContent =
        message;

    wrapper.append(
        spinner,
        text
    );

    elements.buttonGrid.appendChild(
        wrapper
    );
}

function renderStatusMessage(message) {
    elements.buttonGrid.replaceChildren();

    const status =
        document.createElement("div");

    status.className =
        "status-msg";

    status.style.gridColumn =
        "1 / -1";

    status.textContent =
        message;

    elements.buttonGrid.appendChild(
        status
    );
}

function renderError(title, detail = "") {
    elements.buttonGrid.replaceChildren();

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "status-msg";

    wrapper.style.gridColumn =
        "1 / -1";

    const titleElement =
        document.createElement("strong");

    titleElement.textContent =
        title;

    wrapper.appendChild(
        titleElement
    );

    if (detail) {
        const detailElement =
            document.createElement("div");

        detailElement.style.marginTop =
            "7px";

        detailElement.style.fontSize =
            "0.88rem";

        detailElement.textContent =
            detail;

        wrapper.appendChild(
            detailElement
        );
    }

    elements.buttonGrid.appendChild(
        wrapper
    );
}

/* =========================================================
   서버 통신
========================================================= */

async function requestApi(
    action,
    payload = {}
) {
    if (
        !API_URL ||
        API_URL.includes("여기에_") ||
        !/^https?:\/\//i.test(API_URL)
    ) {
        throw new Error(
            "script.js 맨 위 API_URL에 Apps Script /exec 주소를 입력하세요."
        );
    }

    const isReadRequest =
        action === "getData";

    let response;

    if (isReadRequest) {
        const url =
            new URL(API_URL);

        url.searchParams.set(
            "action",
            action
        );

        url.searchParams.set(
            "_t",
            String(Date.now())
        );

        response = await fetch(
            url.toString(),
            {
                method: "GET",
                cache: "no-store",
                redirect: "follow"
            }
        );

    } else {
        response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({
                    action,
                    ...payload
                }),

                cache: "no-store",
                redirect: "follow"
            }
        );
    }

    if (!response.ok) {
        throw new Error(
            `서버 응답 오류 (${response.status})`
        );
    }

    const responseText =
        await response.text();

    if (!responseText) {
        throw new Error(
            "서버 응답이 비어 있습니다."
        );
    }

    let result;

    try {
        result =
            JSON.parse(responseText);

    } catch (error) {
        console.error(
            "JSON 변환 실패:",
            responseText
        );

        throw new Error(
            "서버에서 올바르지 않은 응답을 받았습니다."
        );
    }

    if (
        result &&
        typeof result === "object" &&
        result.success === false
    ) {
        throw new Error(
            result.message ||
            result.error ||
            "서버 작업에 실패했습니다."
        );
    }

    return result;
}

/* =========================================================
   공동비밀번호 수정
========================================================= */

function openCommonModal() {
    const apartmentRecords =
        getSelectedApartmentRecords();

    if (apartmentRecords.length === 0) {
        showToast(
            "수정할 아파트 정보가 없습니다."
        );

        return;
    }

    const currentPasswords =
        uniqueValues(
            apartmentRecords
                .map(record =>
                    record.commonPassword
                )
                .filter(Boolean)
        );

    state.currentCommonEdit = {
        region:
            state.selectedRegion,

        apartment:
            state.selectedApartment
    };

    elements.commonModalAptLabel.textContent =
        `${state.selectedRegion} · ${state.selectedApartment}`;

    elements.formCommonPwdValue.value =
        currentPasswords.join(" / ");

    openModal(
        elements.commonEditorModal
    );

    window.setTimeout(
        () => {
            elements.formCommonPwdValue.focus();
            elements.formCommonPwdValue.select();
        },
        100
    );
}

function closeCommonModal() {
    state.currentCommonEdit =
        null;

    elements.formCommonPwdValue.value =
        "";

    closeModal(
        elements.commonEditorModal
    );
}

async function submitCommonPwdForm() {
    if (!state.currentCommonEdit) {
        showToast(
            "수정할 아파트를 다시 선택해주세요."
        );

        return;
    }

    const commonPassword =
        cleanText(
            elements.formCommonPwdValue.value
        );

    const region =
        state.currentCommonEdit.region;

    const apartment =
        state.currentCommonEdit.apartment;

    setModalBusy(
        elements.commonEditorModal,
        true,
        "저장 중..."
    );

    try {
        await requestApi(
            "updateCommonPassword",
            {
                region,
                apartment,
                commonPassword
            }
        );

        for (const record of state.records) {
            if (
                record.region === region &&
                record.apartment === apartment
            ) {
                record.commonPassword =
                    commonPassword;
            }
        }

        saveRecordsToCache(
            state.records
        );

        closeCommonModal();
        renderCurrentView();

        showToast(
            "공동비밀번호를 저장했습니다."
        );

    } catch (error) {
        console.error(
            "공동비밀번호 수정 실패:",
            error
        );

        showToast(
            error.message ||
            "공동비밀번호 저장에 실패했습니다."
        );

    } finally {
        setModalBusy(
            elements.commonEditorModal,
            false
        );
    }
}

/* =========================================================
   라인 비밀번호 추가
========================================================= */

function openAddPwdModal(rowId) {
    const record =
        findRecordByRowId(rowId);

    if (!record) {
        showToast(
            "해당 비밀번호 정보를 찾지 못했습니다."
        );

        return;
    }

    elements.addPwdRowId.value =
        record.rowId;

    elements.addPwdModalTitle.textContent =
        "➕ 비밀번호 추가";

    elements.addPwdInfo.textContent =
        createRecordInfoText(record);

    elements.addPwdValue.value =
        "";

    openModal(
        elements.addPwdModal
    );

    window.setTimeout(
        () => {
            elements.addPwdValue.focus();
        },
        100
    );
}

function closeAddPwdModal() {
    elements.addPwdRowId.value =
        "";

    elements.addPwdInfo.textContent =
        "";

    elements.addPwdValue.value =
        "";

    closeModal(
        elements.addPwdModal
    );
}

async function submitAddPwd() {
    const rowId =
        cleanText(
            elements.addPwdRowId.value
        );

    const newPassword =
        cleanText(
            elements.addPwdValue.value
        );

    if (!rowId) {
        showToast(
            "추가할 행을 찾지 못했습니다."
        );

        return;
    }

    if (!newPassword) {
        showToast(
            "추가할 비밀번호를 입력해주세요."
        );

        elements.addPwdValue.focus();

        return;
    }

    const record =
        findRecordByRowId(rowId);

    if (!record) {
        showToast(
            "해당 데이터를 찾지 못했습니다."
        );

        return;
    }

    const currentPasswords =
        splitPasswords(
            record.password
        );

    const duplicateExists =
        currentPasswords.some(password =>
            normalizePasswordForCompare(
                password
            ) ===
            normalizePasswordForCompare(
                newPassword
            )
        );

    if (duplicateExists) {
        showToast(
            "이미 등록된 비밀번호입니다."
        );

        return;
    }

    setModalBusy(
        elements.addPwdModal,
        true,
        "추가 중..."
    );

    try {
        const response =
            await requestApi(
                "addPassword",
                {
                    rowId,
                    password: newPassword
                }
            );

        const serverPassword =
            cleanText(
                response?.password ||
                response?.data?.password
            );

        record.password =
            serverPassword ||
            [
                ...currentPasswords,
                newPassword
            ].join(" / ");

        saveRecordsToCache(
            state.records
        );

        closeAddPwdModal();
        renderCurrentView();

        showToast(
            "비밀번호를 추가했습니다."
        );

    } catch (error) {
        console.error(
            "비밀번호 추가 실패:",
            error
        );

        showToast(
            error.message ||
            "비밀번호 추가에 실패했습니다."
        );

    } finally {
        setModalBusy(
            elements.addPwdModal,
            false
        );
    }
}

/* =========================================================
   라인 비밀번호 삭제
========================================================= */

function openDeletePwdModal(rowId) {
    const record =
        findRecordByRowId(rowId);

    if (!record) {
        showToast(
            "해당 비밀번호 정보를 찾지 못했습니다."
        );

        return;
    }

    const passwords =
        splitPasswords(
            record.password
        );

    if (passwords.length === 0) {
        showToast(
            "삭제할 비밀번호가 없습니다."
        );

        return;
    }

    elements.deletePwdRowId.value =
        record.rowId;

    elements.deletePwdModalTitle.textContent =
        "🗑 삭제할 비밀번호 선택";

    elements.deletePwdInfo.textContent =
        createRecordInfoText(record);

    elements.deletePwdButtons.replaceChildren();

    for (const password of passwords) {
        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "delete-pwd-btn";

        button.textContent =
            password;

        button.addEventListener(
            "click",
            () => {
                confirmDeletePassword(
                    record.rowId,
                    password
                );
            }
        );

        elements.deletePwdButtons.appendChild(
            button
        );
    }

    openModal(
        elements.deletePwdModal
    );
}

function closeDeletePwdModal() {
    elements.deletePwdRowId.value =
        "";

    elements.deletePwdInfo.textContent =
        "";

    elements.deletePwdButtons.replaceChildren();

    closeModal(
        elements.deletePwdModal
    );
}

async function confirmDeletePassword(
    rowId,
    password
) {
    const record =
        findRecordByRowId(rowId);

    if (!record) {
        showToast(
            "해당 데이터를 찾지 못했습니다."
        );

        return;
    }

    const shouldDelete =
        window.confirm(
            `"${password}" 비밀번호를 삭제할까요?`
        );

    if (!shouldDelete) {
        return;
    }

    setModalBusy(
        elements.deletePwdModal,
        true,
        "삭제 중..."
    );

    try {
        const response =
            await requestApi(
                "deletePassword",
                {
                    rowId,
                    password
                }
            );

        const serverPassword =
            response?.password !== undefined
                ? cleanText(
                    response.password
                )
                : response?.data?.password !== undefined
                    ? cleanText(
                        response.data.password
                    )
                    : null;

        if (serverPassword !== null) {
            record.password =
                serverPassword;

        } else {
            record.password =
                splitPasswords(
                    record.password
                )
                    .filter(item =>
                        normalizePasswordForCompare(
                            item
                        ) !==
                        normalizePasswordForCompare(
                            password
                        )
                    )
                    .join(" / ");
        }

        saveRecordsToCache(
            state.records
        );

        closeDeletePwdModal();
        renderCurrentView();

        showToast(
            "비밀번호를 삭제했습니다."
        );

    } catch (error) {
        console.error(
            "비밀번호 삭제 실패:",
            error
        );

        showToast(
            error.message ||
            "비밀번호 삭제에 실패했습니다."
        );

    } finally {
        setModalBusy(
            elements.deletePwdModal,
            false
        );
    }
}

/* =========================================================
   데이터 검색 보조
========================================================= */

function findRecordByRowId(rowId) {
    const targetId =
        cleanText(rowId);

    return (
        state.records.find(record =>
            cleanText(record.rowId) ===
            targetId
        ) || null
    );
}

function createRecordInfoText(record) {
    const parts = [
        record.region,
        record.apartment,

        formatDongLabel(
            normalizeDongValue(
                record.dong
            )
        ),

        formatLineLabel(
            record.line
        )
    ].filter(Boolean);

    return parts.join(" · ");
}

function normalizePasswordForCompare(value) {
    return cleanText(value)
        .replace(/\s+/gu, "")
        .toLowerCase();
}

/* =========================================================
   GPS 시작
========================================================= */

function startGps() {
    loadLastLocation();

    if (
        !("geolocation" in navigator)
    ) {
        updateGpsStatus(
            "🔴 GPS 미지원",
            "error"
        );

        renderGpsButtons();

        return;
    }

    updateGpsStatus(
        state.currentLocation
            ? "🟡 최근 위치"
            : "📡 위치 확인 중",
        "loading"
    );

    /*
     * 먼저 빠른 위치를 요청합니다.
     */
    navigator.geolocation.getCurrentPosition(
        handleGpsSuccess,
        handleGpsInitialError,
        {
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 1000 * 60 * 10
        }
    );

    /*
     * 이후 정밀 위치를 최대 30초 동안 감시합니다.
     */
    state.gpsWatchId =
        navigator.geolocation.watchPosition(
            handleGpsSuccess,
            handleGpsWatchError,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 5000
            }
        );

    clearTimeout(
        state.gpsStopTimer
    );

    state.gpsStopTimer =
        window.setTimeout(
            stopGpsWatch,
            APP_CONFIG.GPS_WATCH_TIME
        );
}

function stopGpsWatch() {
    if (
        state.gpsWatchId !== null &&
        "geolocation" in navigator
    ) {
        navigator.geolocation.clearWatch(
            state.gpsWatchId
        );

        state.gpsWatchId =
            null;
    }

    clearTimeout(
        state.gpsStopTimer
    );

    state.gpsStopTimer =
        null;
}

function handleGpsSuccess(position) {
    if (!position?.coords) {
        return;
    }

    const latitude =
        Number(
            position.coords.latitude
        );

    const longitude =
        Number(
            position.coords.longitude
        );

    const accuracy =
        Number(
            position.coords.accuracy
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return;
    }

    const newLocation = {
        latitude,
        longitude,

        accuracy:
            Number.isFinite(accuracy)
                ? accuracy
                : null,

        timestamp:
            Number(position.timestamp) ||
            Date.now()
    };

    if (
        shouldUseNewLocation(
            state.currentLocation,
            newLocation
        )
    ) {
        state.currentLocation =
            newLocation;

        saveLastLocation(
            newLocation
        );

        renderGpsButtons();
    }

    updateGpsAccuracyStatus(
        newLocation.accuracy
    );

    if (
        newLocation.accuracy !== null &&
        newLocation.accuracy <= 30
    ) {
        stopGpsWatch();
    }
}

function shouldUseNewLocation(
    currentLocation,
    newLocation
) {
    if (!currentLocation) {
        return true;
    }

    const currentAccuracy =
        Number(
            currentLocation.accuracy
        );

    const newAccuracy =
        Number(
            newLocation.accuracy
        );

    const currentTime =
        Number(
            currentLocation.timestamp
        ) || 0;

    const newTime =
        Number(
            newLocation.timestamp
        ) || Date.now();

    if (
        Number.isFinite(newAccuracy) &&
        !Number.isFinite(currentAccuracy)
    ) {
        return true;
    }

    if (
        Number.isFinite(newAccuracy) &&
        Number.isFinite(currentAccuracy) &&
        newAccuracy < currentAccuracy
    ) {
        return true;
    }

    return (
        newTime - currentTime >
        15000
    );
}

function handleGpsInitialError(error) {
    console.warn(
        "초기 GPS 수신 실패:",
        error
    );

    if (state.currentLocation) {
        updateGpsStatus(
            "🟡 최근 위치",
            "cached"
        );

        renderGpsButtons();

        return;
    }

    updateGpsErrorStatus(error);
}

function handleGpsWatchError(error) {
    console.warn(
        "GPS 감시 오류:",
        error
    );

    if (!state.currentLocation) {
        updateGpsErrorStatus(error);
    }
}

function updateGpsErrorStatus(error) {
    const errorCode =
        Number(error?.code);

    if (errorCode === 1) {
        updateGpsStatus(
            "🔴 위치 권한 필요",
            "error"
        );

    } else if (errorCode === 2) {
        updateGpsStatus(
            "🔴 위치 확인 불가",
            "error"
        );

    } else if (errorCode === 3) {
        updateGpsStatus(
            "🟡 GPS 지연",
            "warning"
        );

    } else {
        updateGpsStatus(
            "🔴 GPS 오류",
            "error"
        );
    }

    renderGpsButtons();
}

function updateGpsAccuracyStatus(accuracy) {
    if (!Number.isFinite(accuracy)) {
        updateGpsStatus(
            "🟡 위치 확인됨",
            "warning"
        );

        return;
    }

    if (accuracy <= 30) {
        updateGpsStatus(
            "🟢 강함",
            "strong"
        );

    } else if (accuracy <= 100) {
        updateGpsStatus(
            "🟡 보통",
            "medium"
        );

    } else {
        updateGpsStatus(
            "🔴 약함",
            "weak"
        );
    }
}

function updateGpsStatus(
    text,
    status = ""
) {
    elements.gpsStatusBadge.textContent =
        text;

    elements.gpsStatusBadge.dataset.status =
        status;
}

/* =========================================================
   최근 GPS 위치 저장
========================================================= */

function loadLastLocation() {
    try {
        const saved =
            localStorage.getItem(
                APP_CONFIG.LAST_LOCATION_KEY
            );

        if (!saved) {
            return;
        }

        const parsed =
            JSON.parse(saved);

        const latitude =
            Number(parsed.latitude);

        const longitude =
            Number(parsed.longitude);

        const timestamp =
            Number(parsed.timestamp);

        if (
            !isValidCoordinate(
                latitude,
                longitude
            ) ||
            !Number.isFinite(timestamp)
        ) {
            return;
        }

        if (
            Date.now() - timestamp >
            APP_CONFIG.LAST_LOCATION_MAX_AGE
        ) {
            localStorage.removeItem(
                APP_CONFIG.LAST_LOCATION_KEY
            );

            return;
        }

        const parsedAccuracy =
            Number(parsed.accuracy);

        state.currentLocation = {
            latitude,
            longitude,

            accuracy:
                Number.isFinite(
                    parsedAccuracy
                )
                    ? parsedAccuracy
                    : null,

            timestamp
        };

    } catch (error) {
        console.error(
            "최근 위치 읽기 실패:",
            error
        );

        localStorage.removeItem(
            APP_CONFIG.LAST_LOCATION_KEY
        );
    }
}

function saveLastLocation(location) {
    try {
        localStorage.setItem(
            APP_CONFIG.LAST_LOCATION_KEY,
            JSON.stringify(location)
        );

    } catch (error) {
        console.error(
            "최근 위치 저장 실패:",
            error
        );
    }
}

/* =========================================================
   GPS 근처 아파트 버튼
========================================================= */

function renderGpsButtons() {
    elements.gpsButtons.replaceChildren();

    if (!state.currentLocation) {
        renderGpsPlaceholderButtons(
            "위치 확인 중"
        );

        return;
    }

    if (state.records.length === 0) {
        renderGpsPlaceholderButtons(
            "데이터 확인 중"
        );

        return;
    }

    if (!state.locationsLoaded) {
        renderGpsPlaceholderButtons(
            "좌표 확인 중"
        );

        return;
    }

    if (
        state.locationsError ||
        state.locationMap.size === 0
    ) {
        renderGpsPlaceholderButtons(
            "좌표 오류"
        );

        return;
    }

    const nearbyApartments =
        getNearbyApartments(
            state.currentLocation.latitude,
            state.currentLocation.longitude
        ).slice(
            0,
            APP_CONFIG.GPS_BUTTON_COUNT
        );

    if (nearbyApartments.length === 0) {
        renderGpsPlaceholderButtons(
            "이름 매칭 없음"
        );

        return;
    }

    for (const item of nearbyApartments) {
        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "gps-btn";

        button.style.whiteSpace =
            "pre-line";

        const distanceText =
            formatDistance(
                item.distance
            );

        button.textContent =
            `${item.apartment}\n${distanceText}`;

        button.title =
            `${item.region} · ${item.apartment} · ${distanceText}`;

        button.addEventListener(
            "click",
            () => {
                openApartmentFromGps(
                    item
                );
            }
        );

        elements.gpsButtons.appendChild(
            button
        );
    }

    while (
        elements.gpsButtons.children.length <
        APP_CONFIG.GPS_BUTTON_COUNT
    ) {
        elements.gpsButtons.appendChild(
            createGpsPlaceholderButton("")
        );
    }
}

function renderGpsPlaceholderButtons(
    text = "위치 확인 중"
) {
    elements.gpsButtons.replaceChildren();

    for (
        let index = 0;
        index < APP_CONFIG.GPS_BUTTON_COUNT;
        index += 1
    ) {
        elements.gpsButtons.appendChild(
            createGpsPlaceholderButton(
                text
            )
        );
    }
}

function createGpsPlaceholderButton(
    text = ""
) {
    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "gps-btn";

    button.disabled =
        true;

    button.textContent =
        text;

    return button;
}

/*
 * 각 아파트의 모든 좌표와 사용자 위치를 비교해
 * 가장 짧은 거리를 해당 아파트의 거리로 사용합니다.
 */
function getNearbyApartments(
    currentLatitude,
    currentLongitude
) {
    const uniqueApartments =
        new Map();

    for (const record of state.records) {
        const normalizedName =
            normalizeApartmentName(
                record.apartment
            );

        if (
            !normalizedName ||
            uniqueApartments.has(
                normalizedName
            )
        ) {
            continue;
        }

        uniqueApartments.set(
            normalizedName,
            {
                region:
                    record.region,

                apartment:
                    record.apartment
            }
        );
    }

    const results = [];

    for (
        const [
            normalizedName,
            apartmentInfo
        ] of uniqueApartments
    ) {
        const locationEntry =
            state.locationMap.get(
                normalizedName
            );

        if (!locationEntry) {
            continue;
        }

        let shortestDistance =
            Infinity;

        for (
            const coordinate
            of locationEntry.coordinates
        ) {
            const distance =
                calculateDistanceMeters(
                    currentLatitude,
                    currentLongitude,
                    coordinate.latitude,
                    coordinate.longitude
                );

            if (
                distance <
                shortestDistance
            ) {
                shortestDistance =
                    distance;
            }
        }

        if (
            !Number.isFinite(
                shortestDistance
            )
        ) {
            continue;
        }

        results.push({
            region:
                apartmentInfo.region,

            apartment:
                apartmentInfo.apartment,

            distance:
                shortestDistance
        });
    }

    return results.sort(
        (a, b) =>
            a.distance -
            b.distance
    );
}

function openApartmentFromGps(item) {
    state.history = [];

    state.selectedRegion =
        item.region;

    state.selectedApartment =
        item.apartment;

    state.selectedDong =
        "";

    state.view =
        "dongs";

    renderCurrentView();
}

/* =========================================================
   거리 계산
========================================================= */

function calculateDistanceMeters(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {
    const earthRadius =
        6371000;

    const lat1 =
        degreesToRadians(
            latitude1
        );

    const lat2 =
        degreesToRadians(
            latitude2
        );

    const deltaLatitude =
        degreesToRadians(
            latitude2 -
            latitude1
        );

    const deltaLongitude =
        degreesToRadians(
            longitude2 -
            longitude1
        );

    const a =
        Math.sin(
            deltaLatitude / 2
        ) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(
            deltaLongitude / 2
        ) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
}

function degreesToRadians(degrees) {
    return (
        degrees *
        (Math.PI / 180)
    );
}

function formatDistance(distance) {
    if (!Number.isFinite(distance)) {
        return "";
    }

    if (distance < 1000) {
        return `${Math.round(distance)}m`;
    }

    return `${(distance / 1000).toFixed(1)}km`;
}

/* =========================================================
   모달 공통 처리
========================================================= */

function initializeModalEvents() {
    const modals = [
        elements.commonEditorModal,
        elements.addPwdModal,
        elements.deletePwdModal
    ];

    for (const modal of modals) {
        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    closeModalByElement(
                        modal
                    );
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeTopModal();
            }
        }
    );

    elements.formCommonPwdValue.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                submitCommonPwdForm();
            }
        }
    );

    elements.addPwdValue.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                submitAddPwd();
            }
        }
    );
}

function openModal(modal) {
    if (!modal) {
        return;
    }

    modal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}

function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.style.display =
        "none";

    const anyModalOpen = [
        elements.commonEditorModal,
        elements.addPwdModal,
        elements.deletePwdModal
    ].some(item =>
        item.style.display === "flex"
    );

    if (!anyModalOpen) {
        document.body.style.overflow =
            "";
    }
}

function closeModalByElement(modal) {
    if (
        modal ===
        elements.commonEditorModal
    ) {
        closeCommonModal();

    } else if (
        modal ===
        elements.addPwdModal
    ) {
        closeAddPwdModal();

    } else if (
        modal ===
        elements.deletePwdModal
    ) {
        closeDeletePwdModal();
    }
}

function closeTopModal() {
    const modals = [
        elements.deletePwdModal,
        elements.addPwdModal,
        elements.commonEditorModal
    ];

    const openedModal =
        modals.find(modal =>
            modal.style.display === "flex"
        );

    if (openedModal) {
        closeModalByElement(
            openedModal
        );
    }
}

function setModalBusy(
    modal,
    isBusy,
    busyText = "처리 중..."
) {
    if (!modal) {
        return;
    }

    const buttons =
        modal.querySelectorAll(
            "button"
        );

    for (const button of buttons) {
        if (isBusy) {
            if (
                !button.dataset.originalText
            ) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled =
                true;

            if (
                button.classList.contains(
                    "btn-submit"
                )
            ) {
                button.textContent =
                    busyText;
            }

        } else {
            button.disabled =
                false;

            if (
                button.dataset.originalText
            ) {
                button.textContent =
                    button.dataset.originalText;

                delete button.dataset.originalText;
            }
        }
    }

    const inputs =
        modal.querySelectorAll(
            "input"
        );

    for (const input of inputs) {
        input.disabled =
            isBusy;
    }
}

/* =========================================================
   토스트 메시지
========================================================= */

function showToast(message) {
    const text =
        cleanText(message);

    if (!text) {
        return;
    }

    clearTimeout(
        state.toastTimer
    );

    elements.toast.textContent =
        text;

    elements.toast.classList.add(
        "show"
    );

    state.toastTimer =
        window.setTimeout(
            () => {
                elements.toast.classList.remove(
                    "show"
                );
            },
            2500
        );
}

/* =========================================================
   앱 종료 시 GPS 정리
========================================================= */

window.addEventListener(
    "beforeunload",
    stopGpsWatch
);
