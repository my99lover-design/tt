"use strict";

/* =========================================================
   넘버원 김포B 공비 - 자동 갱신 최종본
   - locations.json 정확 일치(LH2 ≠ LH2.)
   - 거리 km 소수점 둘째 자리
   - 오피 관련 아파트 맨 뒤 정렬
   - 일반 아파트는 B열, 오피스텔은 D열 건물명으로 GPS 매칭
   - GPS 4개에 가까운 오피 항목 최소 1개 포함
   - 수정기록 및 되돌리기
   - 4자리 PIN 관리자 인증(30분)
   - 화면 즉시 반영
   - 저장 대기열 영구 보관 및 자동 재시도
========================================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbxMc74RsguWtr-4Nx3w2OeTctpb8-ILGN5j41kW97YNY-0KMX4FOfdvQUKDL0UGTbxk/exec";
const LOCATIONS_URL = "./locations.json";

const APP_CONFIG = Object.freeze({
    CACHE_KEY: "gimpoB_common_password_v5",
    CACHE_TIME_KEY: "gimpoB_common_password_cache_time_v5",
    CACHE_VERSION_KEY: "gimpoB_data_version_v1",
    LOCATION_CACHE_KEY: "gimpoB_locations_cache_v1",
    LOCATION_CACHE_TIME_KEY: "gimpoB_locations_cache_time_v1",
    THEME_KEY: "gimpoB_theme_v2",
    LAST_LOCATION_KEY: "gimpoB_last_location_v2",
    SAVE_QUEUE_KEY: "gimpoB_save_queue_v2",
    INSTALLED_APP_KEY: "gimpoB_app_installed_v1",
    ADMIN_TOKEN_KEY: "gimpoB_admin_token_v1",
    ADMIN_TOKEN_EXPIRES_KEY: "gimpoB_admin_token_expires_v1",
    ADMIN_CLIENT_ID_KEY: "gimpoB_admin_client_id_v1",
    CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
    LOCATION_CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
    LAST_LOCATION_MAX_AGE: 24 * 60 * 60 * 1000,
    DATA_CHECK_INTERVAL: 5 * 60 * 1000,
    CACHE_WRITE_DELAY: 120,
    GPS_BUTTON_COUNT: 4,
    GPS_RECALC_DISTANCE: 20,
    HISTORY_LIMIT: 100,
    ADMIN_SESSION_MS: 30 * 60 * 1000,
    GPS_WATCH_TIME: 30000,
    RETRY_DELAYS: [2000, 5000, 10000, 30000, 60000, 120000, 300000]
});

const elements = {
    headerArea: document.querySelector(".header-area"),
    appTitle: document.getElementById("appTitle"),
    titleMain: document.getElementById("titleMain"),
    titleSub: document.getElementById("titleSub"),
    themeToggle: document.getElementById("themeToggle"),
    installAppBtn: document.getElementById("installAppBtn"),
    adminBtn: document.getElementById("adminBtn"),
    adminPinModal: document.getElementById("adminPinModal"),
    adminPinInput: document.getElementById("adminPinInput"),
    adminPinError: document.getElementById("adminPinError"),
    adminPinSubmitBtn: document.getElementById("adminPinSubmitBtn"),
    adminPinCancelBtn: document.getElementById("adminPinCancelBtn"),
    historyBtn: document.getElementById("historyBtn"),
    navContainer: document.getElementById("navContainer"),
    backBtn: document.getElementById("backBtn"),
    homeBtn: document.getElementById("homeBtn"),
    gpsSection: document.getElementById("gpsSection"),
    gpsStatusBadge: document.getElementById("gpsStatusBadge"),
    gpsButtons: document.getElementById("gpsButtons"),
    commonPwdStandalone: document.getElementById("commonPwdStandalone"),
    stepContainer: document.getElementById("stepContainer"),
    buttonGrid: document.getElementById("buttonGrid"),
    cardList: document.getElementById("cardList"),
    commonEditorModal: document.getElementById("commonEditorModal"),
    commonModalAptLabel: document.getElementById("commonModalAptLabel"),
    formCommonPwdValue: document.getElementById("formCommonPwdValue"),
    addPwdModal: document.getElementById("addPwdModal"),
    addPwdModalTitle: document.getElementById("addPwdModalTitle"),
    addPwdRowId: document.getElementById("addPwdRowId"),
    addPwdInfo: document.getElementById("addPwdInfo"),
    addPwdValue: document.getElementById("addPwdValue"),
    deletePwdModal: document.getElementById("deletePwdModal"),
    deletePwdModalTitle: document.getElementById("deletePwdModalTitle"),
    deletePwdRowId: document.getElementById("deletePwdRowId"),
    deletePwdInfo: document.getElementById("deletePwdInfo"),
    deletePwdButtons: document.getElementById("deletePwdButtons"),
    historyModal: document.getElementById("historyModal"),
    historyRefreshBtn: document.getElementById("historyRefreshBtn"),
    historyStatus: document.getElementById("historyStatus"),
    historyList: document.getElementById("historyList"),
    adminModal: document.getElementById("adminModal"),
    adminRefreshBtn: document.getElementById("adminRefreshBtn"),
    adminStatus: document.getElementById("adminStatus"),
    adminContent: document.getElementById("adminContent"),
    adminMetrics: document.getElementById("adminMetrics"),
    adminGpsWarning: document.getElementById("adminGpsWarning"),
    createBackupBtn: document.getElementById("createBackupBtn"),
    backupList: document.getElementById("backupList"),
    toast: document.getElementById("toast")
};

const state = {
    records: [],
    indexes: createEmptyIndexes(),
    dataVersion: "",
    lastDataCheckAt: 0,
    locationMap: new Map(),
    locationsLoaded: false,
    locationsError: false,
    locationsRawText: "",
    dataGeneration: 0,
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
    gpsNearbyCache: [],
    gpsCacheLocation: null,
    gpsCacheGeneration: -1,
    gpsLastRenderSignature: "",
    toastTimer: null,
    pendingOperations: [],
    syncProcessing: false,
    syncTimer: null,
    syncHadWork: false,
    cacheWriteTimer: null,
    cacheWritePending: false,
    deferredInstallPrompt: null,
    iosInstallGuideShown: false,
    changeHistory: [],
    historyLoading: false,
    undoingHistoryId: "",
    adminToken: "",
    adminTokenExpiresAt: 0,
    adminAuthenticating: false,
    adminDashboard: null,
    adminLoading: false,
    backupCreating: false,
    restoringBackupName: "",
    appUpdatePending: false,
    appUpdateTimer: null
};

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
    initializeTheme();
    initializeInstallButton();
    initializeHistoryButton();
    initializeAdminButton();
    initializeModalEvents();
    initializePendingSync();
    initializeFreshnessChecks();
    renderLoading("데이터를 불러오는 중입니다...");

    const cachedRecords = applyPendingOperationsToRecords(loadCachedRecords());
    if (cachedRecords.length > 0) {
        setRecords(cachedRecords);
        state.loading = false;
        resetSteps(false);
    }

    loadCachedLocations();
    startGps();

    await Promise.allSettled([
        refreshRecordsFromServer(false),
        loadLocations()
    ]);

    renderGpsButtons();
    schedulePendingSync(300);
}

/* ========================= 테마 ========================= */

function initializeTheme() {
    const savedTheme = localStorage.getItem(APP_CONFIG.THEME_KEY) || "light";
    applyTheme(savedTheme);
    elements.themeToggle.addEventListener("click", toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(APP_CONFIG.THEME_KEY, nextTheme);
    applyTheme(nextTheme);
}

function applyTheme(theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", normalizedTheme);
    elements.themeToggle.textContent = normalizedTheme === "dark" ? "☀️ 밝기" : "🌙 밝기";
}


/* ========================= 앱 설치 ========================= */

function initializeInstallButton() {
    if (!elements.installAppBtn) return;
    if (isAppRunningStandalone()) markAppInstalled();

    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        state.deferredInstallPrompt = event;
        updateInstallButtonVisibility();
    });

    window.addEventListener("appinstalled", () => {
        markAppInstalled();
        showToast("✅ 앱 설치 완료");
    });

    elements.installAppBtn.addEventListener("click", handleInstallApp);
    updateInstallButtonVisibility();
}

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAppRunningStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isAppMarkedInstalled() {
    return localStorage.getItem(APP_CONFIG.INSTALLED_APP_KEY) === "true";
}

function markAppInstalled() {
    localStorage.setItem(APP_CONFIG.INSTALLED_APP_KEY, "true");
    state.deferredInstallPrompt = null;
    updateInstallButtonVisibility();
}

function updateInstallButtonVisibility() {
    if (!elements.installAppBtn) return;
    const shouldShow = state.view === "regions" && !isAppRunningStandalone() && !isAppMarkedInstalled();
    elements.installAppBtn.hidden = !shouldShow;
    if (!shouldShow) return;
    elements.installAppBtn.textContent = isIosDevice() && state.iosInstallGuideShown ? "✅ 설치 완료 후 누르기" : "📲 앱 설치";
}

async function handleInstallApp() {
    if (isIosDevice()) {
        if (state.iosInstallGuideShown) {
            markAppInstalled();
            showToast("✅ 설치 완료로 저장했습니다.");
            return;
        }

        state.iosInstallGuideShown = true;
        updateInstallButtonVisibility();
        window.alert("아이폰 설치 방법\n\n1. Safari 공유 버튼 누르기\n2. '홈 화면에 추가' 선택\n3. 오른쪽 위 '추가' 누르기\n\n설치 후 이 화면으로 돌아와\n'설치 완료 후 누르기'를 눌러주세요.");
        return;
    }

    if (!state.deferredInstallPrompt) {
        window.alert("브라우저 메뉴에서\n'앱 설치' 또는 '홈 화면에 추가'를 선택해주세요.");
        return;
    }

    const installPrompt = state.deferredInstallPrompt;
    state.deferredInstallPrompt = null;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") markAppInstalled();
    else updateInstallButtonVisibility();
}

/* ========================= 데이터 로딩 ========================= */

function initializeFreshnessChecks() {
    window.addEventListener("online", () => {
        refreshRecordsFromServer(false).catch(() => {});
        loadLocations().catch(() => {});
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            flushRecordsCache();
            return;
        }

        if (Date.now() - state.lastDataCheckAt >= APP_CONFIG.DATA_CHECK_INTERVAL) {
            refreshRecordsFromServer(false).catch(() => {});
        }
    });
}

function createEmptyIndexes() {
    return {
        regions: [],
        apartmentsByRegion: new Map(),
        recordsByApartment: new Map(),
        dongsByApartment: new Map(),
        recordsByApartmentDong: new Map(),
        rowById: new Map(),
        gpsPlaces: []
    };
}

function makeKey(...parts) {
    return parts.map(part => cleanText(part).normalize("NFC")).join("\u0000");
}

function setRecords(records) {
    state.records = Array.isArray(records) ? records : [];
    rebuildDataIndexes();
    invalidateGpsCache();
}

function rebuildDataIndexes() {
    const indexes = createEmptyIndexes();
    const regionSet = new Set();
    const apartmentsByRegionSet = new Map();
    const dongsByApartmentSet = new Map();
    const gpsPlaceMap = new Map();

    for (const record of state.records) {
        const region = cleanText(record.region);
        const apartment = cleanText(record.apartment);
        const dong = normalizeDongValue(record.dong);
        if (!region || !apartment) continue;

        regionSet.add(region);
        indexes.rowById.set(cleanText(record.rowId), record);

        if (!apartmentsByRegionSet.has(region)) apartmentsByRegionSet.set(region, new Set());
        apartmentsByRegionSet.get(region).add(apartment);

        const apartmentKey = makeKey(region, apartment);
        if (!indexes.recordsByApartment.has(apartmentKey)) indexes.recordsByApartment.set(apartmentKey, []);
        indexes.recordsByApartment.get(apartmentKey).push(record);

        if (!dongsByApartmentSet.has(apartmentKey)) dongsByApartmentSet.set(apartmentKey, new Set());
        dongsByApartmentSet.get(apartmentKey).add(dong);

        const dongKey = makeKey(region, apartment, dong);
        if (!indexes.recordsByApartmentDong.has(dongKey)) indexes.recordsByApartmentDong.set(dongKey, []);
        indexes.recordsByApartmentDong.get(dongKey).push(record);

        const isOffice = isOfficeRecord(record);
        const locationName = isOffice ? cleanText(record.dong) : apartment;
        const exactName = normalizeApartmentName(locationName);
        if (!exactName) continue;

        const gpsKey = isOffice
            ? makeKey(region, apartment, exactName)
            : makeKey(region, exactName);

        if (!gpsPlaceMap.has(gpsKey)) {
            gpsPlaceMap.set(gpsKey, {
                region,
                apartment,
                dong: isOffice ? cleanText(record.dong) : "",
                displayName: locationName,
                exactName,
                isOffice
            });
        }
    }

    indexes.regions = [...regionSet].sort(compareRegions);
    for (const [region, apartmentSet] of apartmentsByRegionSet.entries()) {
        indexes.apartmentsByRegion.set(region, [...apartmentSet].sort(compareApartments));
    }
    for (const [apartmentKey, dongSet] of dongsByApartmentSet.entries()) {
        indexes.dongsByApartment.set(apartmentKey, [...dongSet].sort(naturalCompare));
    }

    indexes.gpsPlaces = [...gpsPlaceMap.values()];
    state.indexes = indexes;
    state.dataGeneration += 1;
}

async function refreshRecordsFromServer(force = false) {
    if (state.networkLoading) return;
    state.networkLoading = true;

    try {
        if (!force && state.records.length > 0 && state.dataVersion) {
            const versionResponse = await requestApi("getDataVersion");
            const serverVersion = extractDataVersion(versionResponse);
            state.lastDataCheckAt = Date.now();

            if (serverVersion && serverVersion === state.dataVersion) return;
        }

        const response = await requestApi("getData");
        const rawData = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        if (rawData.length === 0) throw new Error("불러온 데이터가 없습니다.");

        let normalizedRecords = normalizeRecordCollection(rawData);
        if (normalizedRecords.length === 0) throw new Error("사용 가능한 지역·아파트 데이터가 없습니다.");

        normalizedRecords = applyPendingOperationsToRecords(normalizedRecords);
        const serverVersion = extractDataVersion(response);

        setRecords(normalizedRecords);
        state.dataVersion = serverVersion || state.dataVersion;
        state.lastDataCheckAt = Date.now();
        state.loading = false;
        saveRecordsToCache(state.records);
        validateCurrentSelection();
        renderCurrentView();
        renderGpsButtons();
    } catch (error) {
        console.error("데이터 불러오기 실패:", error);
        state.loading = false;

        if (state.records.length === 0) renderError("데이터를 불러오지 못했습니다.", error.message);
        else if (force) showToast("저장된 데이터를 표시합니다.");
    } finally {
        state.networkLoading = false;
    }
}

async function loadRecordsFromServer() {
    return refreshRecordsFromServer(true);
}

function extractDataVersion(response) {
    if (!response || typeof response !== "object") return "";
    return cleanText(response.version || response.dataVersion || response?.meta?.version);
}

function loadCachedLocations() {
    try {
        const rawText = localStorage.getItem(APP_CONFIG.LOCATION_CACHE_KEY);
        const savedTime = Number(localStorage.getItem(APP_CONFIG.LOCATION_CACHE_TIME_KEY));
        if (!rawText) return false;

        const rawLocations = JSON.parse(rawText);
        state.locationMap = normalizeLocationData(rawLocations);
        if (state.locationMap.size === 0) return false;

        state.locationsRawText = rawText;
        state.locationsLoaded = true;
        state.locationsError = false;

        if (savedTime && Date.now() - savedTime > APP_CONFIG.LOCATION_CACHE_MAX_AGE) {
            console.info("오래된 좌표 캐시를 먼저 표시합니다.");
        }

        invalidateGpsCache();
        renderGpsButtons();
        return true;
    } catch (error) {
        console.error("좌표 캐시 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.LOCATION_CACHE_KEY);
        localStorage.removeItem(APP_CONFIG.LOCATION_CACHE_TIME_KEY);
        return false;
    }
}

async function loadLocations() {
    const hadCache = state.locationMap.size > 0;

    if (!hadCache) {
        state.locationsLoaded = false;
        state.locationsError = false;
        renderGpsButtons();
    }

    try {
        const response = await fetch(LOCATIONS_URL, { method: "GET", cache: "no-cache" });
        if (!response.ok) throw new Error(`locations.json 응답 오류 (${response.status})`);

        const rawText = await response.text();
        const rawLocations = JSON.parse(rawText);
        if (!rawLocations || typeof rawLocations !== "object" || Array.isArray(rawLocations)) {
            throw new Error("locations.json 형식이 올바르지 않습니다.");
        }

        const locationMap = normalizeLocationData(rawLocations);
        if (locationMap.size === 0) throw new Error("사용 가능한 GPS 좌표가 없습니다.");

        state.locationMap = locationMap;
        state.locationsRawText = rawText;
        state.locationsLoaded = true;
        state.locationsError = false;

        try {
            localStorage.setItem(APP_CONFIG.LOCATION_CACHE_KEY, rawText);
            localStorage.setItem(APP_CONFIG.LOCATION_CACHE_TIME_KEY, String(Date.now()));
        } catch (cacheError) {
            console.warn("좌표 캐시 저장 실패:", cacheError);
        }

        invalidateGpsCache();
        console.info(`GPS 좌표 아파트 수: ${state.locationMap.size}`);
    } catch (error) {
        console.error("locations.json 불러오기 실패:", error);
        if (!hadCache) {
            state.locationMap = new Map();
            state.locationsLoaded = true;
            state.locationsError = true;
        }
    } finally {
        renderGpsButtons();
    }
}

function normalizeLocationData(rawLocations) {
    const result = new Map();

    for (const [apartmentName, coordinateList] of Object.entries(rawLocations)) {
        if (!Array.isArray(coordinateList)) continue;

        const normalizedName = normalizeApartmentName(apartmentName);
        if (!normalizedName) continue;

        const coordinates = coordinateList
            .map(item => ({ latitude: Number(item?.lat), longitude: Number(item?.lon) }))
            .filter(item => isValidCoordinate(item.latitude, item.longitude));

        if (coordinates.length === 0) continue;

        if (result.has(normalizedName)) result.get(normalizedName).coordinates.push(...coordinates);
        else result.set(normalizedName, { sourceName: cleanText(apartmentName), coordinates });
    }

    return result;
}

function normalizeApartmentName(value) {
    return cleanText(value).normalize("NFC");
}

function isOfficeApartmentMarker(value) {
    const marker = cleanText(value).normalize("NFC").replace(/\s+/g, "").replace(/[.．。]+$/g, "").toUpperCase();
    return marker === "오피" || marker === "OP";
}

function normalizeApartmentValue(value) {
    const apartment = cleanText(value).normalize("NFC");
    return isOfficeApartmentMarker(apartment) ? "오피" : apartment;
}

function isValidCoordinate(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude) &&
        latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function normalizeRecord(item, index) {
    const rowId = firstValue(item, ["rowId", "rowID", "rowNumber", "row", "id", "행번호"]);
    const region = firstValue(item, ["region", "area", "지역", "동네"]);
    const apartment = firstValue(item, ["apartment", "apt", "아파트", "아파트명"]);
    const commonPassword = firstValue(item, ["commonPassword", "commonPwd", "common", "공동", "공동비밀번호", "공동비번"]);
    const dong = firstValue(item, ["dong", "building", "동", "건물"]);
    const line = firstValue(item, ["line", "라인", "호출라인"]);
    const password = firstValue(item, ["password", "pwd", "비밀번호", "비번"]);

    return {
        rowId: cleanText(rowId) || String(index + 2),
        region: cleanText(region),
        apartment: cleanText(apartment),
        commonPassword: cleanText(commonPassword),
        dong: cleanText(dong),
        line: cleanText(line),
        password: cleanText(password)
    };
}

function normalizeRecordCollection(items) {
    const result = [];
    let lastRegion = "";
    let lastApartment = "";

    for (let index = 0; index < items.length; index += 1) {
        const record = normalizeRecord(items[index], index);
        const hasAnyValue = Boolean(record.region || record.apartment || record.commonPassword || record.dong || record.line || record.password);

        if (!hasAnyValue) {
            lastRegion = "";
            lastApartment = "";
            continue;
        }

        const rawRegion = cleanText(record.region);
        const rawApartment = normalizeApartmentValue(record.apartment);

        if (rawRegion) {
            if (lastRegion && normalizeApartmentName(lastRegion) !== normalizeApartmentName(rawRegion)) lastApartment = "";
            lastRegion = rawRegion;
        }
        record.region = rawRegion || lastRegion;

        if (rawApartment) lastApartment = rawApartment;
        record.apartment = rawApartment || lastApartment;

        if (!isUsableRecord(record)) continue;

        result.push(record);
    }

    return result;
}

function isUsableRecord(record) {
    if (!cleanText(record?.region)) return false;
    if (isOfficeRecord(record)) return Boolean(cleanText(record?.dong) || cleanText(record?.apartment));
    return Boolean(cleanText(record?.apartment));
}

function isOfficeRecord(record) {
    return isOfficeApartmentMarker(record?.apartment);
}

function firstValue(object, keys) {
    return cleanText(firstRawValue(object, keys));
}

function firstRawValue(object, keys) {
    if (!object || typeof object !== "object") return "";
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== null && object[key] !== undefined) return object[key];
    }
    return "";
}

function cleanText(value) {
    return value === null || value === undefined ? "" : String(value).trim();
}

/* ========================= 캐시 ========================= */

function loadCachedRecords() {
    try {
        const savedData = localStorage.getItem(APP_CONFIG.CACHE_KEY);
        const savedTime = Number(localStorage.getItem(APP_CONFIG.CACHE_TIME_KEY));
        if (!savedData) return [];

        const parsed = JSON.parse(savedData);
        if (!Array.isArray(parsed)) return [];

        state.dataVersion = cleanText(localStorage.getItem(APP_CONFIG.CACHE_VERSION_KEY));

        if (savedTime && Date.now() - savedTime > APP_CONFIG.CACHE_MAX_AGE) {
            console.info("오래된 데이터 캐시를 먼저 표시합니다.");
        }

        return normalizeRecordCollection(parsed);
    } catch (error) {
        console.error("캐시 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.CACHE_KEY);
        localStorage.removeItem(APP_CONFIG.CACHE_TIME_KEY);
        localStorage.removeItem(APP_CONFIG.CACHE_VERSION_KEY);
        return [];
    }
}

function saveRecordsToCache(records = state.records) {
    if (Array.isArray(records) && records !== state.records) state.records = records;
    state.cacheWritePending = true;
    clearTimeout(state.cacheWriteTimer);
    state.cacheWriteTimer = window.setTimeout(flushRecordsCache, APP_CONFIG.CACHE_WRITE_DELAY);
}

function flushRecordsCache() {
    clearTimeout(state.cacheWriteTimer);
    state.cacheWriteTimer = null;
    if (!state.cacheWritePending || !Array.isArray(state.records)) return;

    try {
        localStorage.setItem(APP_CONFIG.CACHE_KEY, JSON.stringify(state.records));
        localStorage.setItem(APP_CONFIG.CACHE_TIME_KEY, String(Date.now()));
        if (state.dataVersion) localStorage.setItem(APP_CONFIG.CACHE_VERSION_KEY, state.dataVersion);
        state.cacheWritePending = false;
    } catch (error) {
        console.error("캐시 저장 실패:", error);
    }
}

function updateLocalDataVersion(response) {
    const version = extractDataVersion(response);
    if (!version) return;
    state.dataVersion = version;
    try {
        localStorage.setItem(APP_CONFIG.CACHE_VERSION_KEY, version);
    } catch (error) {
        console.warn("데이터 버전 저장 실패:", error);
    }
}

/* ========================= 저장 대기열 ========================= */

function initializePendingSync() {
    state.pendingOperations = loadPendingOperations();
    state.syncHadWork = state.pendingOperations.length > 0;

    window.addEventListener("online", wakePendingSync);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) wakePendingSync();
    });
}

function wakePendingSync() {
    if (state.pendingOperations.length > 0) state.pendingOperations[0].nextAttemptAt = 0;
    savePendingOperations();
    schedulePendingSync(0);
}

function createPendingOperation(action, payload) {
    return {
        id: createOperationId(),
        action: cleanText(action),
        payload: payload && typeof payload === "object" ? { ...payload } : {},
        createdAt: Date.now(),
        attempts: 0,
        nextAttemptAt: 0
    };
}

function createOperationId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function enqueuePendingOperation(action, payload) {
    const operation = createPendingOperation(action, payload);
    state.pendingOperations.push(operation);
    state.syncHadWork = true;
    savePendingOperations();
    showToast("⏳ 저장 대기");
    schedulePendingSync(0);
    return operation;
}

function loadPendingOperations() {
    try {
        const saved = localStorage.getItem(APP_CONFIG.SAVE_QUEUE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(item => item && typeof item === "object" && cleanText(item.action))
            .map(item => ({
                id: cleanText(item.id) || createOperationId(),
                action: cleanText(item.action),
                payload: item.payload && typeof item.payload === "object" ? { ...item.payload } : {},
                createdAt: Number(item.createdAt) || Date.now(),
                attempts: Math.max(0, Number(item.attempts) || 0),
                nextAttemptAt: Math.max(0, Number(item.nextAttemptAt) || 0)
            }));
    } catch (error) {
        console.error("저장 대기열 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.SAVE_QUEUE_KEY);
        return [];
    }
}

function savePendingOperations() {
    try {
        if (state.pendingOperations.length === 0) {
            localStorage.removeItem(APP_CONFIG.SAVE_QUEUE_KEY);
            return;
        }

        localStorage.setItem(APP_CONFIG.SAVE_QUEUE_KEY, JSON.stringify(state.pendingOperations));
    } catch (error) {
        console.error("저장 대기열 보관 실패:", error);
    }
}

function schedulePendingSync(delay = 0) {
    clearTimeout(state.syncTimer);

    if (state.pendingOperations.length === 0) {
        state.syncTimer = null;
        return;
    }

    state.syncTimer = window.setTimeout(processPendingQueue, Math.max(0, Number(delay) || 0));
}

async function processPendingQueue() {
    if (state.syncProcessing || state.pendingOperations.length === 0) return;

    if (navigator.onLine === false) {
        schedulePendingSync(30000);
        return;
    }

    const operation = state.pendingOperations[0];
    const waitTime = Number(operation.nextAttemptAt) - Date.now();

    if (waitTime > 0) {
        schedulePendingSync(waitTime);
        return;
    }

    state.syncProcessing = true;

    try {
        const response = await requestApi(operation.action, { ...operation.payload, operationId: operation.id });
        updateLocalDataVersion(response);
        state.pendingOperations.shift();
        savePendingOperations();
        state.syncProcessing = false;

        if (elements.historyModal?.style.display === "flex") loadChangeHistory(false).catch(() => {});

        if (state.pendingOperations.length > 0) schedulePendingSync(0);
        else {
            if (state.syncHadWork) showToast("✅ 저장 완료");
            state.syncHadWork = false;
        }
    } catch (error) {
        console.warn("백그라운드 저장 실패, 자동 재시도:", operation.action, error);
        operation.attempts = Math.max(0, Number(operation.attempts) || 0) + 1;
        const retryDelay = getRetryDelay(operation.attempts);
        operation.nextAttemptAt = Date.now() + retryDelay;
        savePendingOperations();
        state.syncProcessing = false;
        schedulePendingSync(retryDelay);
    }
}

function getRetryDelay(attempts) {
    const index = Math.min(Math.max(0, Number(attempts) - 1), APP_CONFIG.RETRY_DELAYS.length - 1);
    return APP_CONFIG.RETRY_DELAYS[index];
}

function applyPendingOperationsToRecords(records) {
    if (!Array.isArray(records)) return [];
    const copiedRecords = records.map(record => ({ ...record }));
    for (const operation of state.pendingOperations) applyOperationToRecords(copiedRecords, operation);
    return copiedRecords;
}

function applyOperationToRecords(records, operation) {
    if (!Array.isArray(records) || !operation) return;
    const payload = operation.payload || {};

    if (operation.action === "updateCommonPassword") {
        const region = cleanText(payload.region);
        const apartment = cleanText(payload.apartment);
        const commonPassword = cleanText(payload.commonPassword);

        for (const record of records) {
            if (record.region === region && record.apartment === apartment) record.commonPassword = commonPassword;
        }
        return;
    }

    const record = findRecordByRowIdFromList(records, payload.rowId);
    if (!record) return;

    if (operation.action === "addPassword") {
        const newPassword = cleanText(payload.password);
        if (!newPassword) return;

        const passwords = splitPasswords(record.password);
        const duplicateExists = passwords.some(password =>
            normalizePasswordForCompare(password) === normalizePasswordForCompare(newPassword)
        );

        if (!duplicateExists) passwords.push(newPassword);
        record.password = passwords.join(" / ");
        return;
    }

    if (operation.action === "deletePassword") {
        const deletePasswordValue = cleanText(payload.password);
        if (!deletePasswordValue) return;

        record.password = splitPasswords(record.password)
            .filter(password =>
                normalizePasswordForCompare(password) !== normalizePasswordForCompare(deletePasswordValue)
            )
            .join(" / ");
    }
}

function findRecordByRowIdFromList(records, rowId) {
    const targetId = cleanText(rowId);
    return records.find(record => cleanText(record.rowId) === targetId) || null;
}

/* ========================= 화면 이동 ========================= */

function resetSteps(clearHistory = true) {
    if (clearHistory) state.history = [];
    state.selectedRegion = "";
    state.selectedApartment = "";
    state.selectedDong = "";
    state.view = "regions";
    renderCurrentView();
}

function goBack() {
    const previousState = state.history.pop();

    if (!previousState) {
        resetSteps();
        return;
    }

    state.selectedRegion = previousState.selectedRegion || "";
    state.selectedApartment = previousState.selectedApartment || "";
    state.selectedDong = previousState.selectedDong || "";
    state.view = previousState.view || "regions";
    renderCurrentView();
}

function pushHistory() {
    state.history.push({
        selectedRegion: state.selectedRegion,
        selectedApartment: state.selectedApartment,
        selectedDong: state.selectedDong,
        view: state.view
    });

    if (state.history.length > 20) state.history.shift();
}

function validateCurrentSelection() {
    if (!state.selectedRegion) return;

    if (!state.indexes.apartmentsByRegion.has(state.selectedRegion)) {
        resetSteps();
        return;
    }

    if (!state.selectedApartment) return;

    const apartmentKey = makeKey(state.selectedRegion, state.selectedApartment);
    if (!state.indexes.recordsByApartment.has(apartmentKey)) {
        state.selectedApartment = "";
        state.selectedDong = "";
        state.view = "apartments";
        state.history = [];
        return;
    }

    if (!state.selectedDong) return;

    const dongKey = makeKey(state.selectedRegion, state.selectedApartment, normalizeDongValue(state.selectedDong));
    if (!state.indexes.recordsByApartmentDong.has(dongKey)) {
        state.selectedDong = "";
        state.view = "dongs";
    }
}

/* ========================= 화면 렌더링 ========================= */

function renderCurrentView() {
    updateHeaderAndNavigation();
    elements.buttonGrid.replaceChildren();
    elements.cardList.replaceChildren();
    elements.commonPwdStandalone.replaceChildren();
    elements.commonPwdStandalone.style.display = "none";
    elements.cardList.style.display = "none";
    elements.stepContainer.style.display = "block";

    if (state.loading && state.records.length === 0) {
        renderLoading("데이터를 불러오는 중입니다...");
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
    const isHome = state.view === "regions";
    elements.headerArea.classList.toggle("header-single", !isHome);

    if (isHome) {
        elements.titleMain.textContent = "넘버원🥇";
        elements.titleSub.textContent = "김포B 공비";
        elements.themeToggle.style.display = "";
        elements.navContainer.style.display = "none";
        elements.gpsSection.style.display = "block";
    } else {
        elements.titleMain.textContent = "넘버원🥇 김포B 공비";
        elements.titleSub.textContent = "";
        elements.themeToggle.style.display = "none";
        elements.navContainer.style.display = "grid";
        elements.gpsSection.style.display = "none";
    }

    updateInstallButtonVisibility();
    if (elements.historyBtn) elements.historyBtn.hidden = !isHome;
    if (elements.adminBtn) elements.adminBtn.hidden = !isHome;
}

function renderRegionButtons() {
    const regions = state.indexes.regions;

    if (regions.length === 0) {
        renderStatusMessage("등록된 지역이 없습니다.");
        return;
    }

    for (const region of regions) {
        const button = createSelectButton(region);
        button.addEventListener("click", () => selectRegion(region));
        elements.buttonGrid.appendChild(button);
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

function renderApartmentButtons() {
    const apartments = state.indexes.apartmentsByRegion.get(state.selectedRegion) || [];

    if (apartments.length === 0) {
        renderStatusMessage("등록된 아파트가 없습니다.");
        return;
    }

    for (const apartment of apartments) {
        const button = createSelectButton(apartment);
        button.addEventListener("click", () => selectApartment(apartment));
        elements.buttonGrid.appendChild(button);
    }
}

function compareApartments(a, b) {
    const apartmentA = normalizeApartmentValue(a);
    const apartmentB = normalizeApartmentValue(b);
    const isOfficeA = isOfficeApartmentMarker(apartmentA);
    const isOfficeB = isOfficeApartmentMarker(apartmentB);

    if (isOfficeA && !isOfficeB) return 1;
    if (!isOfficeA && isOfficeB) return -1;
    return naturalCompare(apartmentA, apartmentB);
}

function selectApartment(apartment) {
    pushHistory();
    state.selectedApartment = apartment;
    state.selectedDong = "";
    state.view = "dongs";
    renderCurrentView();
}

function renderDongButtons() {
    const apartmentKey = makeKey(state.selectedRegion, state.selectedApartment);
    const dongs = state.indexes.dongsByApartment.get(apartmentKey) || [];

    if (dongs.length === 0 || (dongs.length === 1 && dongs[0] === "전체")) {
        state.selectedDong = "전체";
        state.view = "cards";
        renderCurrentView();
        return;
    }

    for (const dong of dongs) {
        const button = createSelectButton(dong === "전체" ? "전체" : formatDongLabel(dong));
        button.addEventListener("click", () => selectDong(dong));
        elements.buttonGrid.appendChild(button);
    }
}

function selectDong(dong) {
    pushHistory();
    state.selectedDong = dong;
    state.view = "cards";
    renderCurrentView();
}

function normalizeDongValue(value) {
    return cleanText(value) || "전체";
}

function formatDongLabel(dong) {
    const value = cleanText(dong);
    if (!value || value === "전체") return "전체";
    if (/동$/u.test(value)) return value;
    if (/^\d+$/u.test(value)) return `${value}동`;
    return value;
}

function renderCommonPassword() {
    const apartmentRecords = getSelectedApartmentRecords();
    if (apartmentRecords.length === 0) return;

    const commonPasswords = uniqueValues(apartmentRecords.map(record => record.commonPassword).filter(Boolean));
    const commonValue = commonPasswords.length > 0 ? commonPasswords.join(" / ") : "등록된 공동비밀번호 없음";

    const title = document.createElement("div");
    title.className = "common-pwd-title";
    title.textContent = "<공동비번>";

    const row = document.createElement("div");
    row.className = "common-pwd-row";

    const value = document.createElement("div");
    value.className = "common-pwd-value";
    value.textContent = commonValue;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "common-edit-btn";
    editButton.textContent = "수정";
    editButton.addEventListener("click", openCommonModal);

    row.append(value, editButton);
    elements.commonPwdStandalone.append(title, row);
    elements.commonPwdStandalone.style.display = "block";
}

function getSelectedApartmentRecords() {
    return state.indexes.recordsByApartment.get(makeKey(state.selectedRegion, state.selectedApartment)) || [];
}

function renderPasswordCards() {
    elements.stepContainer.style.display = "none";
    elements.cardList.style.display = "flex";

    let records;

    if (state.selectedDong && state.selectedDong !== "전체") {
        records = state.indexes.recordsByApartmentDong.get(
            makeKey(state.selectedRegion, state.selectedApartment, normalizeDongValue(state.selectedDong))
        ) || [];
    } else {
        records = getSelectedApartmentRecords();
    }

    records = [...records].sort((a, b) => {
        const lineCompare = naturalCompare(a.line, b.line);
        return lineCompare !== 0 ? lineCompare : Number(a.rowId) - Number(b.rowId);
    });

    if (records.length === 0) {
        const message = document.createElement("div");
        message.className = "status-msg";
        message.textContent = "등록된 비밀번호가 없습니다.";
        elements.cardList.appendChild(message);
        return;
    }

    for (const record of records) elements.cardList.appendChild(createPasswordCard(record));
}

function createPasswordCard(record) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.rowId = record.rowId;

    const lineTitle = document.createElement("div");
    lineTitle.className = "line-info";
    lineTitle.textContent = `<${formatLineLabel(record.line)}>`;

    const passwordContainer = document.createElement("div");
    passwordContainer.className = "pwd-container";

    const passwordRow = document.createElement("div");
    passwordRow.className = "pwd-row";

    const passwordBox = document.createElement("div");
    passwordBox.className = "pwd-box";

    const passwordText = document.createElement("span");
    passwordText.className = "pwd-highlight";

    const passwordList = splitPasswords(record.password);
    passwordText.textContent = passwordList.length > 0 ? passwordList.join(" / ") : "등록된 비밀번호 없음";

    passwordBox.appendChild(passwordText);
    passwordRow.appendChild(passwordBox);
    passwordContainer.appendChild(passwordRow);

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "line-action-btn add-btn";
    addButton.textContent = "➕ 추가";
    addButton.addEventListener("click", () => openAddPwdModal(record.rowId));
    footer.appendChild(addButton);

    if (passwordList.length > 0) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "line-action-btn delete-btn";
        deleteButton.textContent = "🗑 삭제";
        deleteButton.addEventListener("click", () => openDeletePwdModal(record.rowId));
        footer.appendChild(deleteButton);
    }

    card.append(lineTitle, passwordContainer, footer);
    return card;
}

function formatLineLabel(line) {
    const value = cleanText(line);
    if (!value) return "공용";
    return /라인$/u.test(value) ? value : `${value}라인`;
}

function splitPasswords(value) {
    const text = cleanText(value);
    if (!text) return [];

    return uniqueValues(
        text.split(/\s*(?:\/|\||,|\r?\n)\s*/u)
            .map(item => item.trim())
            .filter(Boolean)
    );
}

function createSelectButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "select-btn";
    button.textContent = label;
    button.title = label;
    return button;
}

function uniqueValues(values) {
    return [...new Set(values.map(value => cleanText(value)).filter(Boolean))];
}

function naturalCompare(a, b) {
    return cleanText(a).localeCompare(cleanText(b), "ko-KR", { numeric: true, sensitivity: "base" });
}

function compareRegions(a, b) {
    const regionOrder = ["구래", "마산", "양곡", "양촌", "장기", "운양", "오피"];
    const aIndex = regionOrder.findIndex(name => cleanText(a).includes(name));
    const bIndex = regionOrder.findIndex(name => cleanText(b).includes(name));

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return naturalCompare(a, b);
}

function renderLoading(message) {
    elements.cardList.replaceChildren();
    elements.commonPwdStandalone.replaceChildren();
    elements.buttonGrid.replaceChildren();
    elements.stepContainer.style.display = "block";
    elements.cardList.style.display = "none";
    elements.commonPwdStandalone.style.display = "none";

    const wrapper = document.createElement("div");
    wrapper.className = "status-msg";
    wrapper.style.gridColumn = "1 / -1";

    const spinner = document.createElement("span");
    spinner.className = "spinner";

    const text = document.createElement("span");
    text.textContent = message;

    wrapper.append(spinner, text);
    elements.buttonGrid.appendChild(wrapper);
}

function renderStatusMessage(message) {
    elements.buttonGrid.replaceChildren();

    const status = document.createElement("div");
    status.className = "status-msg";
    status.style.gridColumn = "1 / -1";
    status.textContent = message;
    elements.buttonGrid.appendChild(status);
}

function renderError(title, detail = "") {
    elements.buttonGrid.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "status-msg";
    wrapper.style.gridColumn = "1 / -1";

    const titleElement = document.createElement("strong");
    titleElement.textContent = title;
    wrapper.appendChild(titleElement);

    if (detail) {
        const detailElement = document.createElement("div");
        detailElement.style.marginTop = "7px";
        detailElement.style.fontSize = "0.88rem";
        detailElement.textContent = detail;
        wrapper.appendChild(detailElement);
    }

    elements.buttonGrid.appendChild(wrapper);
}

/* ========================= 서버 통신 ========================= */

async function requestApi(action, payload = {}) {
    if (!API_URL || API_URL.includes("여기에_") || !/^https?:\/\//i.test(API_URL)) {
        throw new Error("script.js 맨 위 API_URL에 Apps Script /exec 주소를 입력하세요.");
    }

    let response;

    if (action === "getData" || action === "getDataVersion" || action === "getChangeHistory") {
        const url = new URL(API_URL);
        url.searchParams.set("action", action);
        for (const [key, value] of Object.entries(payload || {})) {
            if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
        }
        url.searchParams.set("_t", String(Date.now()));
        response = await fetch(url.toString(), { method: "GET", cache: "no-store", redirect: "follow" });
    } else {
        response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, ...payload }),
            cache: "no-store",
            redirect: "follow"
        });
    }

    if (!response.ok) throw new Error(`서버 응답 오류 (${response.status})`);

    const responseText = await response.text();
    if (!responseText) throw new Error("서버 응답이 비어 있습니다.");

    let result;
    try {
        result = JSON.parse(responseText);
    } catch {
        console.error("JSON 변환 실패:", responseText);
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
    }

    if (result && typeof result === "object" && result.success === false) {
        throw new Error(result.message || result.error || "서버 작업에 실패했습니다.");
    }

    return result;
}


/* ========================= 수정기록 ========================= */

function initializeHistoryButton() {
    if (elements.historyBtn) elements.historyBtn.addEventListener("click", openChangeHistoryModal);
    if (elements.historyRefreshBtn) elements.historyRefreshBtn.addEventListener("click", () => loadChangeHistory(true));
}

function openChangeHistoryModal() {
    openModal(elements.historyModal);
    loadChangeHistory(true);
}

function closeChangeHistoryModal() {
    closeModal(elements.historyModal);
}

async function loadChangeHistory(showLoading = true) {
    if (state.historyLoading) return;
    state.historyLoading = true;

    if (showLoading) {
        elements.historyStatus.style.display = "block";
        elements.historyStatus.textContent = "수정기록을 불러오는 중입니다...";
        elements.historyList.replaceChildren();
    }

    try {
        const response = await requestApi("getChangeHistory", { limit: APP_CONFIG.HISTORY_LIMIT });
        const history = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        state.changeHistory = history.map(normalizeHistoryItem).filter(item => item.historyId);
        renderChangeHistory();
    } catch (error) {
        console.error("수정기록 불러오기 실패:", error);
        elements.historyList.replaceChildren();
        elements.historyStatus.style.display = "block";
        elements.historyStatus.textContent = `수정기록을 불러오지 못했습니다.\n${error.message}`;
    } finally {
        state.historyLoading = false;
    }
}

function normalizeHistoryItem(item) {
    return {
        historyId: cleanText(item?.historyId),
        changedAt: cleanText(item?.changedAt),
        region: cleanText(item?.region),
        apartment: cleanText(item?.apartment),
        dong: cleanText(item?.dong),
        line: cleanText(item?.line),
        changeType: cleanText(item?.changeType) || "수정",
        beforeValue: cleanText(item?.beforeValue),
        afterValue: cleanText(item?.afterValue),
        reverted: item?.reverted === true || cleanText(item?.reverted) === "예",
        revertedAt: cleanText(item?.revertedAt),
        canUndo: item?.canUndo !== false
    };
}

function renderChangeHistory() {
    elements.historyList.replaceChildren();

    if (state.changeHistory.length === 0) {
        elements.historyStatus.style.display = "block";
        elements.historyStatus.textContent = "아직 저장된 수정기록이 없습니다.";
        return;
    }

    elements.historyStatus.style.display = "none";

    for (const item of state.changeHistory) {
        const wrapper = document.createElement("article");
        wrapper.className = `history-item${item.reverted ? " reverted" : ""}`;

        const head = document.createElement("div");
        head.className = "history-item-head";

        const type = document.createElement("div");
        type.className = "history-type";
        type.textContent = item.changeType;

        const time = document.createElement("div");
        time.className = "history-time";
        time.textContent = item.changedAt;

        head.append(type, time);

        const place = document.createElement("div");
        place.className = "history-place";
        place.textContent = [item.region, item.apartment, item.dong, item.line].filter(Boolean).join(" · ") || "위치 정보 없음";

        const values = document.createElement("div");
        values.className = "history-values";
        values.append(
            createHistoryValueBox("변경 전", item.beforeValue),
            createHistoryValueBox("변경 후", item.afterValue)
        );

        const footer = document.createElement("div");
        footer.className = "history-item-footer";

        const revertedLabel = document.createElement("div");
        revertedLabel.className = "history-reverted-label";
        if (item.reverted) revertedLabel.textContent = item.revertedAt ? `되돌림 완료 · ${item.revertedAt}` : "되돌림 완료";
        else if (item.changeType === "되돌리기") revertedLabel.textContent = "이전 값으로 복원됨";
        else revertedLabel.textContent = "";
        footer.appendChild(revertedLabel);

        if (item.canUndo && !item.reverted && item.changeType !== "되돌리기") {
            const undoButton = document.createElement("button");
            undoButton.type = "button";
            undoButton.className = "history-undo-btn";
            undoButton.textContent = state.undoingHistoryId === item.historyId ? "처리 중..." : "↩ 되돌리기";
            undoButton.disabled = Boolean(state.undoingHistoryId);
            undoButton.addEventListener("click", () => undoHistoryChange(item.historyId));
            footer.appendChild(undoButton);
        }

        wrapper.append(head, place, values, footer);
        elements.historyList.appendChild(wrapper);
    }
}

function createHistoryValueBox(label, value) {
    const box = document.createElement("div");
    box.className = "history-value-box";

    const labelElement = document.createElement("div");
    labelElement.className = "history-value-label";
    labelElement.textContent = label;

    const valueElement = document.createElement("div");
    valueElement.className = "history-value-text";
    valueElement.textContent = cleanText(value) || "(없음)";

    box.append(labelElement, valueElement);
    return box;
}

async function undoHistoryChange(historyId) {
    const targetId = cleanText(historyId);
    if (!targetId || state.undoingHistoryId) return;

    const item = state.changeHistory.find(history => history.historyId === targetId);
    if (!item || item.reverted || !item.canUndo) {
        showToast("되돌릴 수 없는 기록입니다.");
        return;
    }

    if (!window.confirm(`${item.changeType}\n변경 전 값으로 되돌릴까요?`)) return;

    state.undoingHistoryId = targetId;
    renderChangeHistory();

    try {
        const response = await requestApi("undoChange", { historyId: targetId, operationId: createOperationId() });
        updateLocalDataVersion(response);
        showToast("✅ 이전 값으로 되돌렸습니다.");
        await loadRecordsFromServer();
        await loadChangeHistory(false);
    } catch (error) {
        console.error("되돌리기 실패:", error);
        window.alert(`되돌리기에 실패했습니다.\n${error.message}`);
    } finally {
        state.undoingHistoryId = "";
        renderChangeHistory();
    }
}

/* ========================= 관리자 점검·백업 ========================= */

function initializeAdminButton() {
    loadAdminSession();
    if (elements.adminBtn) elements.adminBtn.addEventListener("click", openAdminModal);
    if (elements.adminPinSubmitBtn) elements.adminPinSubmitBtn.addEventListener("click", submitAdminPin);
    if (elements.adminPinCancelBtn) elements.adminPinCancelBtn.addEventListener("click", closeAdminPinModal);
    if (elements.adminPinInput) {
        elements.adminPinInput.addEventListener("input", () => {
            elements.adminPinInput.value = elements.adminPinInput.value.replace(/\D/g, "").slice(0, 4);
            hideAdminPinError();
        });
        elements.adminPinInput.addEventListener("keydown", event => {
            if (event.key === "Enter") submitAdminPin();
        });
    }
    if (elements.adminRefreshBtn) elements.adminRefreshBtn.addEventListener("click", () => loadAdminDashboard(true));
    if (elements.createBackupBtn) elements.createBackupBtn.addEventListener("click", createDataBackup);
}

function openAdminModal() {
    if (state.adminAuthenticating) return;
    if (hasValidAdminSession()) {
        openAdminDashboardModal();
        return;
    }
    openAdminPinModal();
}

function openAdminPinModal() {
    if (!elements.adminPinModal) return;
    elements.adminPinInput.value = "";
    hideAdminPinError();
    openModal(elements.adminPinModal);
    window.setTimeout(() => elements.adminPinInput.focus(), 100);
}

function closeAdminPinModal() {
    if (state.adminAuthenticating) return;
    if (elements.adminPinInput) elements.adminPinInput.value = "";
    hideAdminPinError();
    closeModal(elements.adminPinModal);
}

function showAdminPinError(message) {
    if (!elements.adminPinError) return;
    elements.adminPinError.hidden = false;
    elements.adminPinError.textContent = cleanText(message) || "관리자 인증에 실패했습니다.";
}

function hideAdminPinError() {
    if (!elements.adminPinError) return;
    elements.adminPinError.hidden = true;
    elements.adminPinError.textContent = "";
}

async function submitAdminPin() {
    if (state.adminAuthenticating) return;
    const pin = cleanText(elements.adminPinInput?.value);
    if (!/^\d{4}$/.test(pin)) {
        showAdminPinError("PIN을 숫자 4자리로 입력해주세요.");
        elements.adminPinInput?.focus();
        return;
    }

    const authenticated = await authenticateAdmin(pin);
    if (!authenticated) return;
    closeModal(elements.adminPinModal);
    openAdminDashboardModal();
}

function openAdminDashboardModal() {
    openModal(elements.adminModal);
    loadAdminDashboard(true);
}

function loadAdminSession() {
    try {
        const token = cleanText(sessionStorage.getItem(APP_CONFIG.ADMIN_TOKEN_KEY));
        const expiresAt = Number(sessionStorage.getItem(APP_CONFIG.ADMIN_TOKEN_EXPIRES_KEY));
        if (token && Number.isFinite(expiresAt) && expiresAt > Date.now()) {
            state.adminToken = token;
            state.adminTokenExpiresAt = expiresAt;
            return;
        }
    } catch (error) {
        console.warn("관리자 인증정보 불러오기 실패:", error);
    }
    clearAdminSession();
}

function hasValidAdminSession() {
    return Boolean(state.adminToken) && state.adminTokenExpiresAt > Date.now();
}

function getAdminClientId() {
    try {
        let clientId = cleanText(localStorage.getItem(APP_CONFIG.ADMIN_CLIENT_ID_KEY));
        if (!clientId) {
            clientId = createOperationId();
            localStorage.setItem(APP_CONFIG.ADMIN_CLIENT_ID_KEY, clientId);
        }
        return clientId;
    } catch (error) {
        return createOperationId();
    }
}

function saveAdminSession(token, expiresInSeconds) {
    const expiresIn = Math.max(60, Number(expiresInSeconds) || APP_CONFIG.ADMIN_SESSION_MS / 1000);
    state.adminToken = cleanText(token);
    state.adminTokenExpiresAt = Date.now() + expiresIn * 1000;
    try {
        sessionStorage.setItem(APP_CONFIG.ADMIN_TOKEN_KEY, state.adminToken);
        sessionStorage.setItem(APP_CONFIG.ADMIN_TOKEN_EXPIRES_KEY, String(state.adminTokenExpiresAt));
    } catch (error) {
        console.warn("관리자 인증정보 저장 실패:", error);
    }
}

function clearAdminSession() {
    state.adminToken = "";
    state.adminTokenExpiresAt = 0;
    state.adminDashboard = null;
    try {
        sessionStorage.removeItem(APP_CONFIG.ADMIN_TOKEN_KEY);
        sessionStorage.removeItem(APP_CONFIG.ADMIN_TOKEN_EXPIRES_KEY);
    } catch (error) {}
}

function requireAdminToken() {
    if (!hasValidAdminSession()) {
        clearAdminSession();
        throw new Error("관리자 인증 시간이 만료되었습니다. 다시 로그인해주세요.");
    }
    return state.adminToken;
}

async function authenticateAdmin(pin) {
    state.adminAuthenticating = true;
    hideAdminPinError();
    if (elements.adminBtn) {
        elements.adminBtn.disabled = true;
        elements.adminBtn.textContent = "🔐 확인 중...";
    }
    if (elements.adminPinSubmitBtn) {
        elements.adminPinSubmitBtn.disabled = true;
        elements.adminPinSubmitBtn.textContent = "확인 중...";
    }

    try {
        const response = await requestApi("adminLogin", { pin, clientId: getAdminClientId() });
        if (!response?.token) throw new Error("관리자 인증 토큰을 받지 못했습니다.");
        saveAdminSession(response.token, response.expiresIn);
        showToast("✅ 관리자 인증 완료");
        return true;
    } catch (error) {
        console.error("관리자 인증 실패:", error);
        showAdminPinError(error.message || "관리자 인증에 실패했습니다.");
        clearAdminSession();
        elements.adminPinInput?.focus();
        elements.adminPinInput?.select();
        return false;
    } finally {
        state.adminAuthenticating = false;
        if (elements.adminBtn) {
            elements.adminBtn.disabled = false;
            elements.adminBtn.textContent = "🔒 관리자만";
        }
        if (elements.adminPinSubmitBtn) {
            elements.adminPinSubmitBtn.disabled = false;
            elements.adminPinSubmitBtn.textContent = "확인";
        }
    }
}

function handleAdminAuthError(error) {
    const message = cleanText(error?.message);
    if (!message.includes("관리자 인증")) return false;
    clearAdminSession();
    closeAdminModal();
    window.alert(`${message}
관리자 버튼을 눌러 다시 인증해주세요.`);
    return true;
}

function closeAdminModal() {
    closeModal(elements.adminModal);
}

async function loadAdminDashboard(showLoading = true) {
    if (state.adminLoading) return;
    state.adminLoading = true;

    if (showLoading) {
        elements.adminStatus.style.display = "block";
        elements.adminStatus.textContent = "점검 정보를 불러오는 중입니다...";
        elements.adminContent.hidden = true;
    }

    try {
        const response = await requestApi("getAdminDashboard", { adminToken: requireAdminToken() });
        const dashboard = response?.data && typeof response.data === "object" ? response.data : response;
        state.adminDashboard = normalizeAdminDashboard(dashboard);
        renderAdminDashboard();
    } catch (error) {
        console.error("관리자 점검 불러오기 실패:", error);
        if (handleAdminAuthError(error)) return;
        elements.adminContent.hidden = true;
        elements.adminStatus.style.display = "block";
        elements.adminStatus.textContent = `점검 정보를 불러오지 못했습니다.\n${error.message}`;
    } finally {
        state.adminLoading = false;
    }
}

function normalizeAdminDashboard(data) {
    return {
        dataSheetName: cleanText(data?.dataSheetName),
        totalRows: Number(data?.totalRows) || 0,
        regionCount: Number(data?.regionCount) || 0,
        apartmentCount: Number(data?.apartmentCount) || 0,
        officeBuildingCount: Number(data?.officeBuildingCount) || 0,
        passwordRowCount: Number(data?.passwordRowCount) || 0,
        blankPasswordRowCount: Number(data?.blankPasswordRowCount) || 0,
        historyCount: Number(data?.historyCount) || 0,
        dataVersion: cleanText(data?.dataVersion),
        checkedAt: cleanText(data?.checkedAt),
        backups: Array.isArray(data?.backups) ? data.backups.map(normalizeBackupInfo).filter(item => item.name) : []
    };
}

function normalizeBackupInfo(item) {
    return {
        name: cleanText(item?.name),
        createdAt: cleanText(item?.createdAt),
        rowCount: Number(item?.rowCount) || 0,
        kind: cleanText(item?.kind) || "수동 백업"
    };
}

function renderAdminDashboard() {
    const dashboard = state.adminDashboard;
    if (!dashboard) return;

    const gpsTotal = state.indexes.gpsPlaces.length;
    const gpsMissingItems = state.indexes.gpsPlaces
        .filter(item => !state.locationMap.has(item.exactName))
        .map(item => item.displayName)
        .filter((value, index, array) => value && array.indexOf(value) === index)
        .sort(naturalCompare);
    const gpsMatched = Math.max(0, gpsTotal - gpsMissingItems.length);
    const pendingCount = state.pendingOperations.length;
    const latestBackup = dashboard.backups[0]?.createdAt || "없음";
    const lastSync = state.lastDataCheckAt ? formatLocalDateTime(state.lastDataCheckAt) : "확인 전";

    elements.adminStatus.style.display = "none";
    elements.adminContent.hidden = false;
    elements.adminMetrics.replaceChildren();

    const metrics = [
        ["전체 데이터", `${dashboard.totalRows.toLocaleString()}건`, ""],
        ["지역", `${dashboard.regionCount.toLocaleString()}곳`, ""],
        ["아파트", `${dashboard.apartmentCount.toLocaleString()}곳`, ""],
        ["오피 건물", `${dashboard.officeBuildingCount.toLocaleString()}곳`, ""],
        ["비밀번호 등록 행", `${dashboard.passwordRowCount.toLocaleString()}건`, "good"],
        ["비밀번호 빈 행", `${dashboard.blankPasswordRowCount.toLocaleString()}건`, dashboard.blankPasswordRowCount ? "warn" : "good"],
        ["GPS 좌표 연결", `${gpsMatched.toLocaleString()} / ${gpsTotal.toLocaleString()}`, gpsMissingItems.length ? "warn" : "good"],
        ["저장 대기", `${pendingCount.toLocaleString()}건`, pendingCount ? "danger" : "good"],
        ["수정기록", `${dashboard.historyCount.toLocaleString()}건`, ""],
        ["보관 백업", `${dashboard.backups.length.toLocaleString()}개`, dashboard.backups.length ? "good" : "warn"],
        ["마지막 백업", latestBackup, dashboard.backups.length ? "good" : "warn"],
        ["마지막 동기화", lastSync, ""]
    ];

    for (const [label, value, tone] of metrics) elements.adminMetrics.appendChild(createAdminMetric(label, value, tone));

    if (gpsMissingItems.length > 0) {
        const preview = gpsMissingItems.slice(0, 10).join(", ");
        const extra = gpsMissingItems.length > 10 ? ` 외 ${gpsMissingItems.length - 10}곳` : "";
        elements.adminGpsWarning.hidden = false;
        elements.adminGpsWarning.textContent = `⚠ GPS 좌표 미연결 ${gpsMissingItems.length}곳\n${preview}${extra}`;
    } else {
        elements.adminGpsWarning.hidden = true;
        elements.adminGpsWarning.textContent = "";
    }

    elements.createBackupBtn.disabled = state.backupCreating || Boolean(state.restoringBackupName);
    elements.createBackupBtn.textContent = state.backupCreating ? "백업 중..." : "지금 백업";
    renderBackupList(dashboard.backups, pendingCount);
}

function createAdminMetric(label, value, tone = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "admin-metric";
    const labelElement = document.createElement("div");
    labelElement.className = "admin-metric-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("div");
    valueElement.className = `admin-metric-value${tone ? ` ${tone}` : ""}`;
    valueElement.textContent = value;
    wrapper.append(labelElement, valueElement);
    return wrapper;
}

function renderBackupList(backups, pendingCount) {
    elements.backupList.replaceChildren();

    if (!backups.length) {
        const empty = document.createElement("div");
        empty.className = "backup-empty";
        empty.textContent = "아직 생성된 백업이 없습니다.";
        elements.backupList.appendChild(empty);
        return;
    }

    for (const backup of backups) {
        const item = document.createElement("div");
        item.className = "backup-item";
        const info = document.createElement("div");
        info.className = "backup-info";
        const name = document.createElement("div");
        name.className = "backup-name";
        name.textContent = backup.kind;
        name.title = backup.name;
        const meta = document.createElement("div");
        meta.className = "backup-meta";
        meta.textContent = `${backup.createdAt || backup.name} · ${backup.rowCount.toLocaleString()}행`;
        info.append(name, meta);

        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.className = "restore-backup-btn";
        restoreButton.textContent = state.restoringBackupName === backup.name ? "복구 중..." : "복구";
        restoreButton.disabled = Boolean(state.restoringBackupName) || state.backupCreating || pendingCount > 0;
        restoreButton.title = pendingCount > 0 ? "저장 대기 작업이 끝난 뒤 복구할 수 있습니다." : "";
        restoreButton.addEventListener("click", () => restoreDataBackup(backup));

        item.append(info, restoreButton);
        elements.backupList.appendChild(item);
    }
}

async function createDataBackup() {
    if (state.backupCreating || state.restoringBackupName) return;
    state.backupCreating = true;
    renderAdminDashboard();

    try {
        const response = await requestApi("createBackup", { operationId: createOperationId(), adminToken: requireAdminToken() });
        showToast("✅ 백업을 생성했습니다.");
        await loadAdminDashboard(false);
        if (response?.backup?.name) console.info("생성된 백업:", response.backup.name);
    } catch (error) {
        console.error("백업 생성 실패:", error);
        if (!handleAdminAuthError(error)) window.alert(`백업 생성에 실패했습니다.\n${error.message}`);
    } finally {
        state.backupCreating = false;
        if (state.adminDashboard) renderAdminDashboard();
    }
}

async function restoreDataBackup(backup) {
    if (!backup?.name || state.restoringBackupName || state.backupCreating) return;
    if (state.pendingOperations.length > 0) {
        window.alert("아직 저장 대기 중인 작업이 있습니다. 저장 완료 후 다시 복구해주세요.");
        return;
    }

    const confirmation = window.prompt(
        `${backup.createdAt || backup.name} 백업으로 전체 복구합니다.\n` +
        "현재 데이터는 복구 전에 자동 백업됩니다.\n\n계속하려면 '복구'를 입력하세요."
    );
    if (cleanText(confirmation) !== "복구") {
        if (confirmation !== null) showToast("복구가 취소되었습니다.");
        return;
    }

    state.restoringBackupName = backup.name;
    renderAdminDashboard();

    try {
        const response = await requestApi("restoreBackup", { backupName: backup.name, operationId: createOperationId(), adminToken: requireAdminToken() });
        updateLocalDataVersion(response);
        showToast("✅ 백업 데이터로 복구했습니다.");
        await refreshRecordsFromServer(true);
        await loadAdminDashboard(false);
    } catch (error) {
        console.error("백업 복구 실패:", error);
        if (!handleAdminAuthError(error)) window.alert(`백업 복구에 실패했습니다.\n${error.message}`);
    } finally {
        state.restoringBackupName = "";
        if (state.adminDashboard) renderAdminDashboard();
    }
}

function formatLocalDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "확인 전";
    return new Intl.DateTimeFormat("ko-KR", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
    }).format(date);
}

/* ========================= 공동비밀번호 수정 ========================= */

function openCommonModal() {
    const apartmentRecords = getSelectedApartmentRecords();

    if (apartmentRecords.length === 0) {
        showToast("수정할 아파트 정보가 없습니다.");
        return;
    }

    const currentPasswords = uniqueValues(
        apartmentRecords.map(record => record.commonPassword).filter(Boolean)
    );

    state.currentCommonEdit = { region: state.selectedRegion, apartment: state.selectedApartment };
    elements.commonModalAptLabel.textContent = `${state.selectedRegion} · ${state.selectedApartment}`;
    elements.formCommonPwdValue.value = currentPasswords.join(" / ");
    openModal(elements.commonEditorModal);

    window.setTimeout(() => {
        elements.formCommonPwdValue.focus();
        elements.formCommonPwdValue.select();
    }, 100);
}

function closeCommonModal() {
    state.currentCommonEdit = null;
    elements.formCommonPwdValue.value = "";
    closeModal(elements.commonEditorModal);
}

function submitCommonPwdForm() {
    if (!state.currentCommonEdit) {
        showToast("수정할 아파트를 다시 선택해주세요.");
        return;
    }

    const commonPassword = cleanText(elements.formCommonPwdValue.value);
    const region = state.currentCommonEdit.region;
    const apartment = state.currentCommonEdit.apartment;

    enqueuePendingOperation("updateCommonPassword", { region, apartment, commonPassword });

    for (const record of state.indexes.recordsByApartment.get(makeKey(region, apartment)) || []) {
        record.commonPassword = commonPassword;
    }

    saveRecordsToCache(state.records);
    closeCommonModal();
    renderCurrentView();
}

/* ========================= 비밀번호 추가 ========================= */

function openAddPwdModal(rowId) {
    const record = findRecordByRowId(rowId);

    if (!record) {
        showToast("해당 비밀번호 정보를 찾지 못했습니다.");
        return;
    }

    elements.addPwdRowId.value = record.rowId;
    elements.addPwdModalTitle.textContent = "➕ 비밀번호 추가";
    elements.addPwdInfo.textContent = createRecordInfoText(record);
    elements.addPwdValue.value = "";
    openModal(elements.addPwdModal);
    window.setTimeout(() => elements.addPwdValue.focus(), 100);
}

function closeAddPwdModal() {
    elements.addPwdRowId.value = "";
    elements.addPwdInfo.textContent = "";
    elements.addPwdValue.value = "";
    closeModal(elements.addPwdModal);
}

function submitAddPwd() {
    const rowId = cleanText(elements.addPwdRowId.value);
    const newPassword = cleanText(elements.addPwdValue.value);

    if (!rowId) {
        showToast("추가할 행을 찾지 못했습니다.");
        return;
    }

    if (!newPassword) {
        showToast("추가할 비밀번호를 입력해주세요.");
        elements.addPwdValue.focus();
        return;
    }

    const record = findRecordByRowId(rowId);
    if (!record) {
        showToast("해당 데이터를 찾지 못했습니다.");
        return;
    }

    const currentPasswords = splitPasswords(record.password);
    const duplicateExists = currentPasswords.some(password =>
        normalizePasswordForCompare(password) === normalizePasswordForCompare(newPassword)
    );

    if (duplicateExists) {
        showToast("이미 등록된 비밀번호입니다.");
        return;
    }

    enqueuePendingOperation("addPassword", { rowId, password: newPassword });

    currentPasswords.push(newPassword);
    record.password = currentPasswords.join(" / ");
    saveRecordsToCache(state.records);
    closeAddPwdModal();
    renderCurrentView();
}

/* ========================= 비밀번호 삭제 ========================= */

function openDeletePwdModal(rowId) {
    const record = findRecordByRowId(rowId);

    if (!record) {
        showToast("해당 비밀번호 정보를 찾지 못했습니다.");
        return;
    }

    const passwords = splitPasswords(record.password);
    if (passwords.length === 0) {
        showToast("삭제할 비밀번호가 없습니다.");
        return;
    }

    elements.deletePwdRowId.value = record.rowId;
    elements.deletePwdModalTitle.textContent = "🗑 삭제할 비밀번호 선택";
    elements.deletePwdInfo.textContent = createRecordInfoText(record);
    elements.deletePwdButtons.replaceChildren();

    for (const password of passwords) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "delete-pwd-btn";
        button.textContent = password;
        button.addEventListener("click", () => confirmDeletePassword(record.rowId, password));
        elements.deletePwdButtons.appendChild(button);
    }

    openModal(elements.deletePwdModal);
}

function closeDeletePwdModal() {
    elements.deletePwdRowId.value = "";
    elements.deletePwdInfo.textContent = "";
    elements.deletePwdButtons.replaceChildren();
    closeModal(elements.deletePwdModal);
}

function confirmDeletePassword(rowId, password) {
    const record = findRecordByRowId(rowId);

    if (!record) {
        showToast("해당 데이터를 찾지 못했습니다.");
        return;
    }

    if (!window.confirm(`"${password}" 비밀번호를 삭제할까요?`)) return;

    enqueuePendingOperation("deletePassword", { rowId, password });

    record.password = splitPasswords(record.password)
        .filter(item => normalizePasswordForCompare(item) !== normalizePasswordForCompare(password))
        .join(" / ");

    saveRecordsToCache(state.records);
    closeDeletePwdModal();
    renderCurrentView();
}

function findRecordByRowId(rowId) {
    return state.indexes.rowById.get(cleanText(rowId)) || null;
}

function createRecordInfoText(record) {
    return [
        record.region,
        record.apartment,
        formatDongLabel(normalizeDongValue(record.dong)),
        formatLineLabel(record.line)
    ].filter(Boolean).join(" · ");
}

function normalizePasswordForCompare(value) {
    return cleanText(value).replace(/\s+/gu, "").toLowerCase();
}

/* ========================= GPS ========================= */

function startGps() {
    loadLastLocation();

    if (!("geolocation" in navigator)) {
        updateGpsStatus("🔴 GPS 미지원", "error");
        renderGpsButtons();
        return;
    }

    updateGpsStatus(state.currentLocation ? "🟡 최근 위치" : "📡 위치 확인 중", "loading");

    navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsInitialError, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 10 * 60 * 1000
    });

    state.gpsWatchId = navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsWatchError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
    });

    clearTimeout(state.gpsStopTimer);
    state.gpsStopTimer = window.setTimeout(stopGpsWatch, APP_CONFIG.GPS_WATCH_TIME);
}

function stopGpsWatch() {
    if (state.gpsWatchId !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(state.gpsWatchId);
        state.gpsWatchId = null;
    }

    clearTimeout(state.gpsStopTimer);
    state.gpsStopTimer = null;
}

function handleGpsSuccess(position) {
    if (!position?.coords) return;

    const latitude = Number(position.coords.latitude);
    const longitude = Number(position.coords.longitude);
    const accuracy = Number(position.coords.accuracy);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const newLocation = {
        latitude,
        longitude,
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
        timestamp: Number(position.timestamp) || Date.now()
    };

    if (shouldUseNewLocation(state.currentLocation, newLocation)) {
        state.currentLocation = newLocation;
        saveLastLocation(newLocation);
        renderGpsButtons();
    }

    updateGpsAccuracyStatus(newLocation.accuracy);
    if (newLocation.accuracy !== null && newLocation.accuracy <= 30) stopGpsWatch();
}

function shouldUseNewLocation(currentLocation, newLocation) {
    if (!currentLocation) return true;

    const currentAccuracy = Number(currentLocation.accuracy);
    const newAccuracy = Number(newLocation.accuracy);
    const currentTime = Number(currentLocation.timestamp) || 0;
    const newTime = Number(newLocation.timestamp) || Date.now();

    if (Number.isFinite(newAccuracy) && !Number.isFinite(currentAccuracy)) return true;
    if (Number.isFinite(newAccuracy) && Number.isFinite(currentAccuracy) && newAccuracy < currentAccuracy) return true;
    return newTime - currentTime > 15000;
}

function handleGpsInitialError(error) {
    console.warn("초기 GPS 수신 실패:", error);

    if (state.currentLocation) {
        updateGpsStatus("🟡 최근 위치", "cached");
        renderGpsButtons();
        return;
    }

    updateGpsErrorStatus(error);
}

function handleGpsWatchError(error) {
    console.warn("GPS 감시 오류:", error);
    if (!state.currentLocation) updateGpsErrorStatus(error);
}

function updateGpsErrorStatus(error) {
    const errorCode = Number(error?.code);

    if (errorCode === 1) updateGpsStatus("🔴 위치 권한 필요", "error");
    else if (errorCode === 2) updateGpsStatus("🔴 위치 확인 불가", "error");
    else if (errorCode === 3) updateGpsStatus("🟡 GPS 지연", "warning");
    else updateGpsStatus("🔴 GPS 오류", "error");

    renderGpsButtons();
}

function updateGpsAccuracyStatus(accuracy) {
    if (!Number.isFinite(accuracy)) updateGpsStatus("🟡 위치 확인됨", "warning");
    else if (accuracy <= 30) updateGpsStatus("🟢 강함", "strong");
    else if (accuracy <= 100) updateGpsStatus("🟡 보통", "medium");
    else updateGpsStatus("🔴 약함", "weak");
}

function updateGpsStatus(text, status = "") {
    if (elements.gpsStatusBadge.textContent === text && elements.gpsStatusBadge.dataset.status === status) return;
    elements.gpsStatusBadge.textContent = text;
    elements.gpsStatusBadge.dataset.status = status;
}

function loadLastLocation() {
    try {
        const saved = localStorage.getItem(APP_CONFIG.LAST_LOCATION_KEY);
        if (!saved) return;

        const parsed = JSON.parse(saved);
        const latitude = Number(parsed.latitude);
        const longitude = Number(parsed.longitude);
        const timestamp = Number(parsed.timestamp);

        if (!isValidCoordinate(latitude, longitude) || !Number.isFinite(timestamp)) return;

        if (Date.now() - timestamp > APP_CONFIG.LAST_LOCATION_MAX_AGE) {
            localStorage.removeItem(APP_CONFIG.LAST_LOCATION_KEY);
            return;
        }

        const parsedAccuracy = Number(parsed.accuracy);
        state.currentLocation = {
            latitude,
            longitude,
            accuracy: Number.isFinite(parsedAccuracy) ? parsedAccuracy : null,
            timestamp
        };
    } catch (error) {
        console.error("최근 위치 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.LAST_LOCATION_KEY);
    }
}

function saveLastLocation(location) {
    try {
        localStorage.setItem(APP_CONFIG.LAST_LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
        console.error("최근 위치 저장 실패:", error);
    }
}

function invalidateGpsCache() {
    state.gpsNearbyCache = [];
    state.gpsCacheLocation = null;
    state.gpsCacheGeneration = -1;
    state.gpsLastRenderSignature = "";
}

function renderGpsButtons() {
    let placeholderText = "";
    let nearbyApartments = [];

    if (!state.currentLocation) placeholderText = "위치 확인 중";
    else if (state.records.length === 0) placeholderText = "데이터 확인 중";
    else if (!state.locationsLoaded) placeholderText = "좌표 확인 중";
    else if (state.locationsError || state.locationMap.size === 0) placeholderText = "좌표 오류";
    else {
        nearbyApartments = getNearbyApartments(
            state.currentLocation.latitude,
            state.currentLocation.longitude,
            APP_CONFIG.GPS_BUTTON_COUNT
        );
        if (nearbyApartments.length === 0) placeholderText = "이름 매칭 없음";
    }

    const signature = placeholderText
        ? `placeholder:${placeholderText}`
        : nearbyApartments.map(item => [
            item.region,
            item.apartment,
            item.dong,
            Math.round(item.distance)
        ].join("|")).join("::");

    if (signature === state.gpsLastRenderSignature) return;
    state.gpsLastRenderSignature = signature;
    elements.gpsButtons.replaceChildren();

    if (placeholderText) {
        for (let index = 0; index < APP_CONFIG.GPS_BUTTON_COUNT; index += 1) {
            elements.gpsButtons.appendChild(createGpsPlaceholderButton(placeholderText));
        }
        return;
    }

    for (const item of nearbyApartments) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gps-btn";
        button.style.whiteSpace = "pre-line";

        const distanceText = formatDistance(item.distance);
        button.textContent = `${item.displayName}\n${distanceText}`;
        button.title = item.isOffice
            ? `${item.region} · ${item.apartment} · ${item.dong} · ${distanceText}`
            : `${item.region} · ${item.apartment} · ${distanceText}`;
        button.addEventListener("click", () => openApartmentFromGps(item));
        elements.gpsButtons.appendChild(button);
    }

    while (elements.gpsButtons.children.length < APP_CONFIG.GPS_BUTTON_COUNT) {
        elements.gpsButtons.appendChild(createGpsPlaceholderButton(""));
    }
}

function renderGpsPlaceholderButtons(text = "위치 확인 중") {
    state.gpsLastRenderSignature = "";
    elements.gpsButtons.replaceChildren();
    for (let index = 0; index < APP_CONFIG.GPS_BUTTON_COUNT; index += 1) {
        elements.gpsButtons.appendChild(createGpsPlaceholderButton(text));
    }
}

function createGpsPlaceholderButton(text = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gps-btn";
    button.disabled = true;
    button.textContent = text;
    return button;
}

function getNearbyApartments(currentLatitude, currentLongitude, buttonCount = APP_CONFIG.GPS_BUTTON_COUNT) {
    const limit = Math.max(1, Number(buttonCount) || APP_CONFIG.GPS_BUTTON_COUNT);
    const currentPoint = {
        latitude: Number(currentLatitude),
        longitude: Number(currentLongitude)
    };

    const canReuse = state.gpsCacheLocation &&
        state.gpsCacheGeneration === state.dataGeneration &&
        state.gpsNearbyCache.length > 0 &&
        calculateDistanceMeters(
            currentPoint.latitude,
            currentPoint.longitude,
            state.gpsCacheLocation.latitude,
            state.gpsCacheLocation.longitude
        ) < APP_CONFIG.GPS_RECALC_DISTANCE;

    if (canReuse) return state.gpsNearbyCache.slice(0, limit);

    const results = [];

    for (const placeInfo of state.indexes.gpsPlaces) {
        const locationEntry = state.locationMap.get(placeInfo.exactName);
        if (!locationEntry) continue;

        let shortestDistance = Infinity;

        for (const coordinate of locationEntry.coordinates) {
            const distance = calculateDistanceMeters(
                currentPoint.latitude,
                currentPoint.longitude,
                coordinate.latitude,
                coordinate.longitude
            );
            if (distance < shortestDistance) shortestDistance = distance;
        }

        if (!Number.isFinite(shortestDistance)) continue;

        results.push({
            region: placeInfo.region,
            apartment: placeInfo.apartment,
            dong: placeInfo.dong,
            displayName: placeInfo.displayName,
            distance: shortestDistance,
            isOffice: placeInfo.isOffice
        });
    }

    results.sort((a, b) => a.distance - b.distance || naturalCompare(a.displayName, b.displayName));

    let selected = results.slice(0, limit);
    if (!selected.some(item => item.isOffice)) {
        const nearestOffice = results.find(item => item.isOffice);
        if (nearestOffice) {
            selected = results.filter(item => !item.isOffice).slice(0, Math.max(0, limit - 1));
            selected.push(nearestOffice);
            selected.sort((a, b) => a.distance - b.distance || naturalCompare(a.displayName, b.displayName));
        }
    }

    state.gpsNearbyCache = selected.slice(0, limit);
    state.gpsCacheLocation = currentPoint;
    state.gpsCacheGeneration = state.dataGeneration;
    return state.gpsNearbyCache.slice();
}

function openApartmentFromGps(item) {
    state.history = [];
    state.selectedRegion = item.region;
    state.selectedApartment = item.apartment;

    if (item.isOffice && item.dong) {
        state.selectedDong = item.dong;
        state.view = "cards";
    } else {
        state.selectedDong = "";
        state.view = "dongs";
    }

    renderCurrentView();
}

function calculateDistanceMeters(latitude1, longitude1, latitude2, longitude2) {
    const earthRadius = 6371000;
    const lat1 = degreesToRadians(latitude1);
    const lat2 = degreesToRadians(latitude2);
    const deltaLatitude = degreesToRadians(latitude2 - latitude1);
    const deltaLongitude = degreesToRadians(longitude2 - longitude1);

    const a = Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function formatDistance(distance) {
    if (!Number.isFinite(distance)) return "";
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(2)}km`;
}

/* ========================= 모달 ========================= */

function initializeModalEvents() {
    const modals = [elements.commonEditorModal, elements.addPwdModal, elements.deletePwdModal, elements.historyModal, elements.adminPinModal, elements.adminModal];

    for (const modal of modals) {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModalByElement(modal);
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeTopModal();
    });

    elements.formCommonPwdValue.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            submitCommonPwdForm();
        }
    });

    elements.addPwdValue.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            submitAddPwd();
        }
    });
}

function openModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;
    modal.style.display = "none";

    const anyModalOpen = [
        elements.commonEditorModal,
        elements.addPwdModal,
        elements.deletePwdModal,
        elements.historyModal,
        elements.adminPinModal,
        elements.adminModal
    ].some(item => item.style.display === "flex");

    if (!anyModalOpen) document.body.style.overflow = "";
}

function closeModalByElement(modal) {
    if (modal === elements.commonEditorModal) closeCommonModal();
    else if (modal === elements.addPwdModal) closeAddPwdModal();
    else if (modal === elements.deletePwdModal) closeDeletePwdModal();
    else if (modal === elements.historyModal) closeChangeHistoryModal();
    else if (modal === elements.adminPinModal) closeAdminPinModal();
    else if (modal === elements.adminModal) closeAdminModal();
}

function closeTopModal() {
    const modals = [elements.adminModal, elements.adminPinModal, elements.historyModal, elements.deletePwdModal, elements.addPwdModal, elements.commonEditorModal];
    const openedModal = modals.find(modal => modal.style.display === "flex");
    if (openedModal) closeModalByElement(openedModal);
}

/* ========================= 토스트 ========================= */

function showToast(message) {
    const text = cleanText(message);
    if (!text) return;

    clearTimeout(state.toastTimer);
    elements.toast.textContent = text;
    elements.toast.classList.add("show");

    state.toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 2500);
}

window.addEventListener("beforeunload", () => {
    flushRecordsCache();
    stopGpsWatch();
});

function scheduleAppUpdateReload() {
    state.appUpdatePending = true;
    clearTimeout(state.appUpdateTimer);
    state.appUpdateTimer = window.setTimeout(tryApplyAppUpdate, 700);
}

function tryApplyAppUpdate() {
    if (!state.appUpdatePending) return;
    const modalOpen = [
        elements.commonEditorModal,
        elements.addPwdModal,
        elements.deletePwdModal,
        elements.historyModal,
        elements.adminPinModal,
        elements.adminModal
    ].some(modal => modal?.style.display === "flex");

    if (modalOpen || state.syncProcessing || state.pendingOperations.length > 0 || state.backupCreating || state.restoringBackupName) {
        clearTimeout(state.appUpdateTimer);
        state.appUpdateTimer = window.setTimeout(tryApplyAppUpdate, 1500);
        return;
    }

    state.appUpdatePending = false;
    window.location.reload();
}

/* ========================= PWA 서비스워커 ========================= */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", event => {
        if (event.data?.type === "APP_UPDATED") scheduleAppUpdateReload();
    });

    window.addEventListener("load", async () => {
        const hadController = Boolean(navigator.serviceWorker.controller);
        let refreshing = false;

        if (hadController) {
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }

        try {
            const registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
            await registration.update();
        } catch (error) {
            console.error("서비스워커 등록 실패:", error);
        }
    });
}
