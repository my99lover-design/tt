"use strict";
/* 넘버원 김포B 공비 - GPS·데이터 갱신 명칭 구분판 20260716-15 */
const APP_BOOT_STARTED_AT = performance.now();
const API_URL = "https://script.google.com/macros/s/AKfycbyFbQUILKYrMZEfGl8tXPHThYEK1ncyU0JV36Dbfiqi5cdFRKY06PQUS4IwHDDLW8boIA/exec";
const LOCATIONS_URL = "./locations.json";
const GATE_IMAGES = Object.freeze({
    "썬앤빌": { src: "./gate-images/썬앤빌.webp", label: "썬앤빌" },
    "럭스A": { src: "./gate-images/럭스A.webp", label: "럭스A" },
    "럭스B": { src: "./gate-images/럭스B.webp", label: "럭스B" },
    "루체뷰1": { src: "./gate-images/루체뷰1.webp", label: "루체뷰1" }
});
const APP_CONFIG = Object.freeze({ CACHE_KEY: "gimpoB_common_password_v6", CACHE_TIME_KEY: "gimpoB_common_password_cache_time_v6", CACHE_VERSION_KEY: "gimpoB_data_version_v2", LOCATION_CACHE_KEY: "gimpoB_locations_cache_v1", LOCATION_CACHE_TIME_KEY: "gimpoB_locations_cache_time_v1", THEME_KEY: "gimpoB_theme_v2", LAST_LOCATION_KEY: "gimpoB_last_location_v2", SAVE_QUEUE_KEY: "gimpoB_save_queue_v2", INSTALLED_APP_KEY: "gimpoB_app_installed_v1", ADMIN_TOKEN_KEY: "gimpoB_admin_token_v1", ADMIN_TOKEN_EXPIRES_KEY: "gimpoB_admin_token_expires_v1", ADMIN_CLIENT_ID_KEY: "gimpoB_admin_client_id_v1", USAGE_CLIENT_ID_KEY: "gimpoB_usage_client_id_v1", HISTORY_CACHE_KEY: "gimpoB_change_history_cache_v1", HISTORY_CACHE_TIME_KEY: "gimpoB_change_history_cache_time_v1", PERFORMANCE_HISTORY_KEY: "gimpoB_performance_history_v1", VIEW_STATE_KEY: "gimpoB_view_state_v1", CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, LOCATION_REFRESH_INTERVAL: 24 * 60 * 60 * 1000, LOCATION_CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, LAST_LOCATION_MAX_AGE: 24 * 60 * 60 * 1000, DATA_CHECK_INTERVAL: 5 * 60 * 1000, CACHE_WRITE_DELAY: 120, GPS_BUTTON_COUNT: 4, GPS_RECALC_DISTANCE: 10, GPS_FAST_MAX_AGE: 5 * 60 * 1000, GPS_FAST_TIMEOUT: 1500, GPS_HIGH_TIMEOUT: 15000, GPS_META_REFRESH_INTERVAL: 15000, GPS_REFRESH_TIMEOUT: 10000, GPS_REFRESH_MIN_DISPLAY: 1000, GPS_HIGH_ACCURACY_TARGET: 60, VIEW_STATE_MAX_AGE: 12 * 60 * 60 * 1000, VIEW_STATE_SAVE_DELAY: 300, PERFORMANCE_HISTORY_LIMIT: 5, HISTORY_LIMIT: 100, HISTORY_CACHE_MAX_AGE: 10 * 60 * 1000, ADMIN_SESSION_MS: 30 * 60 * 1000, USAGE_HEARTBEAT_INTERVAL: 2 * 60 * 1000, USAGE_HEARTBEAT_MIN_GAP: 60 * 1000, RETRY_DELAYS: [2000, 5000, 10000, 30000, 60000, 120000, 300000] });
const PERFORMANCE_RULES = Object.freeze({
    cacheLoad: { label: "캐시 데이터 로딩", category: "기기 처리", good: 250, warning: 600 },
    indexBuild: { label: "탐색 인덱스 생성", category: "기기 처리", good: 200, warning: 500 },
    firstScreen: { label: "첫 화면 표시", category: "기기 처리", good: 800, warning: 1800 },
    cachedGps: { label: "저장 GPS 표시", category: "GPS", good: 200, warning: 500 },
    firstGps: { label: "첫 기기 위치 수신", category: "GPS", good: 4000, warning: 8000 },
    highAccuracyGps: { label: "고정밀 위치 수신", category: "GPS", good: 8000, warning: 15000 },
    versionCheck: { label: "데이터 버전 확인", category: "서버 통신", good: 2500, warning: 5000 },
    dataSync: { label: "전체 데이터 동기화", category: "서버 통신", good: 5000, warning: 10000 }
});
const elements = {
    headerArea: document.querySelector(".header-area"), appTitle: document.getElementById("appTitle"), titleMain: document.getElementById("titleMain"), titleSub: document.getElementById("titleSub"), themeToggle: document.getElementById("themeToggle"), installAppBtn: document.getElementById("installAppBtn"), adminBtn: document.getElementById("adminBtn"), adminPerformanceAlertBadge: document.getElementById("adminPerformanceAlertBadge"), adminPinModal: document.getElementById("adminPinModal"), adminPinInput: document.getElementById("adminPinInput"), adminPinError: document.getElementById("adminPinError"), adminPinSubmitBtn: document.getElementById("adminPinSubmitBtn"), adminPinCancelBtn: document.getElementById("adminPinCancelBtn"), historyBtn: document.getElementById("historyBtn"), navContainer: document.getElementById("navContainer"), viewContextBar: document.getElementById("viewContextBar"), backBtn: document.getElementById("backBtn"), homeBtn: document.getElementById("homeBtn"), gpsSection: document.getElementById("gpsSection"), gpsStatusBadge: document.getElementById("gpsStatusBadge"), gpsRefreshBtn: document.getElementById("gpsRefreshBtn"), gpsLocationMeta: document.getElementById("gpsLocationMeta"), dataSyncStatus: document.getElementById("dataSyncStatus"), homeDataStatusCard: document.getElementById("homeDataStatusCard"), homeDataStatusDot: document.getElementById("homeDataStatusDot"), homeDataStatusTitle: document.getElementById("homeDataStatusTitle"), homeDataStatusDetail: document.getElementById("homeDataStatusDetail"), homeDataRefreshBtn: document.getElementById("homeDataRefreshBtn"), gpsButtons: document.getElementById("gpsButtons"), commonPwdStandalone: document.getElementById("commonPwdStandalone"), stepContainer: document.getElementById("stepContainer"), buttonGrid: document.getElementById("buttonGrid"), cardList: document.getElementById("cardList"), commonSaveBtn: document.getElementById("commonSaveBtn"), commonDeleteBtn: document.getElementById("commonDeleteBtn"), addPwdSubmitBtn: document.getElementById("addPwdSubmitBtn"), commonEditorModal: document.getElementById("commonEditorModal"), commonModalAptLabel: document.getElementById("commonModalAptLabel"), formCommonPwdValue: document.getElementById("formCommonPwdValue"), addPwdModal: document.getElementById("addPwdModal"), addPwdModalTitle: document.getElementById("addPwdModalTitle"), addPwdRowId: document.getElementById("addPwdRowId"), addPwdInfo: document.getElementById("addPwdInfo"), addPwdFormatStatus: document.getElementById("addPwdFormatStatus"), addPwdSmartFields: document.getElementById("addPwdSmartFields"), addPwdRoomValue: document.getElementById("addPwdRoomValue"), addPwdCodeValue: document.getElementById("addPwdCodeValue"), addPwdFormatSample: document.getElementById("addPwdFormatSample"), addPwdPreview: document.getElementById("addPwdPreview"), addPwdDirectGroup: document.getElementById("addPwdDirectGroup"), addPwdValue: document.getElementById("addPwdValue"), addPwdModeToggle: document.getElementById("addPwdModeToggle"), deletePwdModal: document.getElementById("deletePwdModal"), deletePwdModalTitle: document.getElementById("deletePwdModalTitle"), deletePwdRowId: document.getElementById("deletePwdRowId"), deletePwdInfo: document.getElementById("deletePwdInfo"), deletePwdButtons: document.getElementById("deletePwdButtons"), selectedPwdOriginal: document.getElementById("selectedPwdOriginal"), passwordEditPanel: document.getElementById("passwordEditPanel"), editPwdValue: document.getElementById("editPwdValue"), updateSelectedPwdBtn: document.getElementById("updateSelectedPwdBtn"), deleteSelectedPwdBtn: document.getElementById("deleteSelectedPwdBtn"), historyModal: document.getElementById("historyModal"), historyRefreshBtn: document.getElementById("historyRefreshBtn"), historyStatus: document.getElementById("historyStatus"), historyList: document.getElementById("historyList"), adminModal: document.getElementById("adminModal"), adminRefreshBtn: document.getElementById("adminRefreshBtn"), adminStatus: document.getElementById("adminStatus"), adminContent: document.getElementById("adminContent"), adminCurrentTab: document.getElementById("adminCurrentTab"), adminStatsTab: document.getElementById("adminStatsTab"), adminCurrentPanel: document.getElementById("adminCurrentPanel"), adminStatsPanel: document.getElementById("adminStatsPanel"), adminStatsCheckedAt: document.getElementById("adminStatsCheckedAt"), adminStatsMetrics: document.getElementById("adminStatsMetrics"), adminRegionStats: document.getElementById("adminRegionStats"), adminChangeTypeStats: document.getElementById("adminChangeTypeStats"), adminTopApartments: document.getElementById("adminTopApartments"), adminAppInfoStats: document.getElementById("adminAppInfoStats"), adminMetrics: document.getElementById("adminMetrics"), adminPerformanceStatus: document.getElementById("adminPerformanceStatus"), adminPerformanceList: document.getElementById("adminPerformanceList"), adminGpsWarning: document.getElementById("adminGpsWarning"), adminDataQualityStatus: document.getElementById("adminDataQualityStatus"), adminDataQualityList: document.getElementById("adminDataQualityList"), sortPasswordsBtn: document.getElementById("sortPasswordsBtn"), deduplicatePasswordsBtn: document.getElementById("deduplicatePasswordsBtn"), createBackupBtn: document.getElementById("createBackupBtn"), autoBackupStatus: document.getElementById("autoBackupStatus"), autoBackupWarning: document.getElementById("autoBackupWarning"), setupAutoBackupBtn: document.getElementById("setupAutoBackupBtn"), backupList: document.getElementById("backupList"), toast: document.getElementById("toast")
};
const state = {
    records: [], indexes: createEmptyIndexes(), dataVersion: "", lastDataCheckAt: 0, lastSuccessfulSyncAt: 0, dataSyncState: "checking", locationMap: new Map(), locationsLoaded: false, locationsError: false, locationsRawText: "", locationCacheSavedAt: 0, dataGeneration: 0, selectedRegion: "", selectedApartment: "", selectedDong: "", view: "regions", history: [], loading: true, networkLoading: false, currentCommonEdit: null, currentLocation: null,
    gpsWatchId: null, gpsStopTimer: null, gpsRestartTimer: null, gpsResumeTimer: null, gpsRefreshUnlockTimer: null, gpsMetaTimer: null, gpsRequestGeneration: 0, gpsRefreshInProgress: false, gpsRefreshStartedAt: 0, lastGpsResumeAt: 0, gpsNearbyCache: [], gpsCacheLocation: null, gpsCacheGeneration: -1, gpsLastListSignature: "", gpsLastPlaceholder: "", gpsButtonItems: [],
    toastTimer: null, pendingOperations: [], syncProcessing: false, syncTimer: null, syncHadWork: false, cacheWriteTimer: null, cacheWritePending: false, deferredInstallPrompt: null, iosInstallGuideShown: false, changeHistory: [], historyLoading: false, undoingHistoryId: "", adminToken: "", adminTokenExpiresAt: 0, adminAuthenticating: false, adminDashboard: null, adminLoading: false, backupCreating: false, restoringBackupName: "", autoBackupUpdating: false, passwordCleanupMode: "", addPasswordMode: "direct", addPasswordTemplate: null, appUpdatePending: false, appUpdateTimer: null,
    performanceSessionId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, performanceMetrics: {}, performanceHistory: [], initialIndexPerformanceRecorded: false, firstDeviceGpsRecorded: false, highAccuracyGpsRecorded: false, savedViewState: null, initialViewResolved: false, pendingScrollRestore: null, viewStateSaveTimer: null, restoringSavedView: false, usageHeartbeatTimer: null, lastUsageHeartbeatAt: 0, usageHeartbeatInFlight: false, homeDataStatusTimer: null
};
document.addEventListener("DOMContentLoaded", initializeApp);
async function initializeApp() {
    initializeTheme();
    initializePendingSync();
    initializeGpsEvents();
    initializeHistoryButton();
    initializeAdminButton();
    initializeModalEvents();
    initializePerformanceTracking();
    initializeViewStatePersistence();
    state.savedViewState = loadSavedViewState();
    renderLoading("데이터를 불러오는 중입니다...");

    const cacheStartedAt = performance.now();
    const cachedRecords = applyPendingOperationsToRecords(loadCachedRecords());
    recordPerformanceMetric("cacheLoad", performance.now() - cacheStartedAt);
    if (cachedRecords.length > 0) {
        setRecords(cachedRecords);
        state.loading = false;
        resolveInitialView();
        const cacheTime = Number(localStorage.getItem(APP_CONFIG.CACHE_TIME_KEY)) || 0;
        state.lastSuccessfulSyncAt = cacheTime;
        updateDataSyncStatus(navigator.onLine === false ? "offline" : "cached", cacheTime);
    }

    loadCachedLocations();
    if (loadLastLocation()) {
        recordPerformanceMetric("cachedGps", performance.now() - APP_BOOT_STARTED_AT);
        updateGpsStatus("🟡 최근 위치", "cached");
        renderGpsMeta();
        renderGpsButtons();
    }
    syncGpsWatch();
    markFirstScreenRendered();

    scheduleDeferredInitialization();
    initializeUsageHeartbeat();
    initializeHomeDataStatusCard();
    refreshRecordsFromServer(false).catch(() => {});
    loadLocations().catch(() => {});
    schedulePendingSync(300);
}
function scheduleDeferredInitialization() {
    const run = () => {
        initializeInstallButton();
        initializeGateImageModal();
        initializeFreshnessChecks();
        initializeDailyDataIntegrityValidation();
        scheduleGateImagePreload();
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 1200 });
    else window.setTimeout(run, 60);
}
function markFirstScreenRendered() {
    window.requestAnimationFrame(() => recordPerformanceMetric("firstScreen", performance.now() - APP_BOOT_STARTED_AT));
}
/* ========================= 테마 ========================= */
function initializeTheme() { const savedTheme = localStorage.getItem(APP_CONFIG.THEME_KEY) || "light"; applyTheme(savedTheme); elements.themeToggle.addEventListener("click", toggleTheme); }
function toggleTheme() { const currentTheme = document.documentElement.getAttribute("data-theme"); const nextTheme = currentTheme === "dark" ? "light" : "dark"; localStorage.setItem(APP_CONFIG.THEME_KEY, nextTheme); applyTheme(nextTheme); }
function applyTheme(theme) { const normalizedTheme = theme === "dark" ? "dark" : "light"; document.documentElement.setAttribute("data-theme", normalizedTheme); elements.themeToggle.textContent = normalizedTheme === "dark" ? "☀️ 밝기" : "🌙 밝기"; }
/* ========================= 앱 설치 ========================= */
function initializeInstallButton() { if (!elements.installAppBtn) return; if (isAppRunningStandalone()) markAppInstalled(); window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.deferredInstallPrompt = event; updateInstallButtonVisibility(); }); window.addEventListener("appinstalled", () => { markAppInstalled(); showToast("✅ 앱 설치 완료"); }); elements.installAppBtn.addEventListener("click", handleInstallApp); updateInstallButtonVisibility(); }
function isIosDevice() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function isAppRunningStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function isAppMarkedInstalled() { return localStorage.getItem(APP_CONFIG.INSTALLED_APP_KEY) === "true"; }
function markAppInstalled() { localStorage.setItem(APP_CONFIG.INSTALLED_APP_KEY, "true"); state.deferredInstallPrompt = null; updateInstallButtonVisibility(); }
function updateInstallButtonVisibility() { if (!elements.installAppBtn) return; const shouldShow = state.view === "regions" && !isAppRunningStandalone() && !isAppMarkedInstalled(); elements.installAppBtn.hidden = !shouldShow; if (!shouldShow) return; elements.installAppBtn.textContent = isIosDevice() && state.iosInstallGuideShown ? "✅ 설치 완료 후 누르기" : "📲 앱 설치"; }
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

/* ========================= 익명 앱 사용 현황 ========================= */
function getUsageClientId() {
    try {
        let value = cleanText(localStorage.getItem(APP_CONFIG.USAGE_CLIENT_ID_KEY));
        if (!value) {
            value = `usage_${Date.now()}_${crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(APP_CONFIG.USAGE_CLIENT_ID_KEY, value);
        }
        return value;
    } catch (error) {
        return `session_${state.performanceSessionId}`;
    }
}
function initializeUsageHeartbeat() {
    // 초기 데이터 확인과 Apps Script 요청이 겹치지 않도록 첫 익명 활동 신호만 잠시 늦춥니다.
    window.setTimeout(() => sendUsageHeartbeat(true), 2500);
    if (state.usageHeartbeatTimer) window.clearInterval(state.usageHeartbeatTimer);
    state.usageHeartbeatTimer = window.setInterval(() => {
        if (!document.hidden) sendUsageHeartbeat(false);
    }, APP_CONFIG.USAGE_HEARTBEAT_INTERVAL);
}
async function sendUsageHeartbeat(force = false) {
    const now = Date.now();
    if (document.hidden || !navigator.onLine || state.usageHeartbeatInFlight) return;
    if (!force && now - state.lastUsageHeartbeatAt < APP_CONFIG.USAGE_HEARTBEAT_MIN_GAP) return;
    state.usageHeartbeatInFlight = true;
    try {
        await requestApi("recordUsage", { clientId: getUsageClientId() });
        state.lastUsageHeartbeatAt = Date.now();
    } catch (error) {
        console.warn("익명 사용 현황 기록 실패:", error?.message || error);
    } finally {
        state.usageHeartbeatInFlight = false;
    }
}

/* ========================= 데이터 로딩 ========================= */
function initializeFreshnessChecks() {
    window.addEventListener("online", () => {
        updateDataSyncStatus("checking");
        refreshRecordsFromServer(false).catch(() => {});
        loadLocations().catch(() => {});
    });
    window.addEventListener("offline", () => updateDataSyncStatus("offline", state.lastSuccessfulSyncAt));
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            flushRecordsCache();
            return;
        }
        sendUsageHeartbeat(false);
        if (Date.now() - state.lastDataCheckAt >= APP_CONFIG.DATA_CHECK_INTERVAL) refreshRecordsFromServer(false).catch(() => {});
        if (!isLocationCacheFresh()) loadLocations().catch(() => {});
    });
}
function updateDataSyncStatus(status, timestamp = 0) {
    state.dataSyncState = status;
    const target = elements.dataSyncStatus;
    if (target) {
        const timeText = timestamp ? formatClockTime(timestamp) : "";
        let text = "데이터 확인 중…";
        if (status === "current") text = `데이터 최신${timeText ? ` · ${timeText}` : ""}`;
        else if (status === "cached") text = `저장 데이터${timeText ? ` · ${timeText}` : ""}`;
        else if (status === "offline") text = `오프라인 데이터${timeText ? ` · ${timeText}` : ""}`;
        else if (status === "error") text = `동기화 지연${timeText ? ` · ${timeText}` : ""}`;
        target.textContent = text;
        target.dataset.status = status;
    }
    updateHomeDataStatusCard(timestamp);
}
function initializeHomeDataStatusCard() {
    const button = elements.homeDataRefreshBtn;
    if (button && !button.dataset.bound) {
        button.dataset.bound = "true";
        button.addEventListener("click", handleHomeDataRefresh);
    }
    if (state.homeDataStatusTimer) window.clearInterval(state.homeDataStatusTimer);
    state.homeDataStatusTimer = window.setInterval(() => updateHomeDataStatusCard(), 15000);
    updateHomeDataStatusCard();
}
async function handleHomeDataRefresh() {
    if (navigator.onLine === false) {
        updateDataSyncStatus("offline", state.lastSuccessfulSyncAt);
        showToast("인터넷 연결 후 다시 확인해주세요.");
        return;
    }
    if (state.networkLoading) return;
    await refreshRecordsFromServer(false);
    if (state.dataSyncState === "current") showToast("✅ 최신 데이터를 확인했습니다.");
    else if (state.dataSyncState === "error") showToast("⚠ 데이터 확인이 지연되고 있습니다.");
}
function updateHomeDataStatusCard(timestamp = 0) {
    const card = elements.homeDataStatusCard;
    const title = elements.homeDataStatusTitle;
    const detail = elements.homeDataStatusDetail;
    const button = elements.homeDataRefreshBtn;
    if (!card || !title || !detail || !button) return;

    const count = Array.isArray(state.records) ? state.records.length : 0;
    const countText = `${count.toLocaleString("ko-KR")}건`;
    const checkedAt = Number(timestamp) || Number(state.lastDataCheckAt) || Number(state.lastSuccessfulSyncAt) || Number(localStorage.getItem(APP_CONFIG.CACHE_TIME_KEY)) || 0;
    const ageText = formatHomeDataAge(checkedAt);
    const status = navigator.onLine === false ? "offline" : (cleanText(state.dataSyncState) || "checking");

    let level = "checking";
    let titleText = "데이터 확인 중";
    let detailText = count > 0 ? `저장 데이터 ${countText} · 서버 확인 중` : "저장 데이터를 확인하고 있습니다.";
    let buttonText = "확인 중…";
    let disabled = true;

    if (status === "current") {
        level = "good";
        titleText = "데이터 최신";
        detailText = `${countText}${ageText ? ` · ${ageText} 확인` : ""}`;
        buttonText = "데이터 확인";
        disabled = false;
    } else if (status === "cached") {
        level = "warning";
        titleText = "저장 데이터 사용 중";
        detailText = `저장 데이터 ${countText}${ageText ? ` · ${ageText} 저장` : ""}`;
        buttonText = "데이터 확인";
        disabled = false;
    } else if (status === "offline") {
        level = "offline";
        titleText = "오프라인 사용 중";
        detailText = `저장 데이터 ${countText}${ageText ? ` · 마지막 확인 ${ageText}` : ""}`;
        buttonText = "오프라인";
        disabled = true;
    } else if (status === "error") {
        level = "danger";
        titleText = "데이터 확인 지연";
        detailText = count > 0 ? `저장 데이터 ${countText}${ageText ? ` · 마지막 확인 ${ageText}` : ""}` : "서버 데이터를 확인하지 못했습니다.";
        buttonText = "다시 시도";
        disabled = false;
    }

    card.dataset.level = level;
    title.textContent = titleText;
    detail.textContent = detailText;
    button.textContent = buttonText;
    button.disabled = disabled;
    button.classList.toggle("is-processing", status === "checking");
}
function formatHomeDataAge(timestamp) {
    const value = Number(timestamp);
    if (!Number.isFinite(value) || value <= 0) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - value) / 1000));
    if (seconds < 10) return "방금 전";
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(value));
}
function formatClockTime(value) {
    const date = new Date(Number(value));
    if (!Number.isFinite(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}
function createEmptyIndexes() {
    return {
        regions: [], apartmentsByRegion: new Map(), recordsByApartment: new Map(), dongsByApartment: new Map(), recordsByApartmentDong: new Map(), rowById: new Map(), gpsPlaces: [], gpsCandidates: []
    };
}
function makeKey(...parts) { return parts.map(part => cleanText(part).normalize("NFC")).join("\u0000"); }
function setRecords(records) { state.records = Array.isArray(records) ? records : []; rebuildDataIndexes(); invalidateGpsCache(); }
function compareRecordDisplayOrder(a, b) {
    const lineCompare = naturalCompare(a.line, b.line);
    return lineCompare !== 0 ? lineCompare : Number(a.rowId) - Number(b.rowId);
}
function rebuildDataIndexes() {
    const startedAt = performance.now();
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
        const exactName = normalizeGpsName(locationName);
        if (!exactName) continue;
        const gpsKey = isOffice ? makeKey(region, apartment, exactName) : makeKey(region, exactName);
        if (!gpsPlaceMap.has(gpsKey)) gpsPlaceMap.set(gpsKey, { region, apartment, dong: isOffice ? cleanText(record.dong) : "", displayName: locationName, exactName, isOffice });
    }
    indexes.regions = [...regionSet].sort(compareRegions);
    for (const [region, apartmentSet] of apartmentsByRegionSet.entries()) indexes.apartmentsByRegion.set(region, sortApartmentsWithOfficeLast([...apartmentSet]));
    for (const [apartmentKey, dongSet] of dongsByApartmentSet.entries()) indexes.dongsByApartment.set(apartmentKey, [...dongSet].sort(naturalCompare));
    for (const records of indexes.recordsByApartment.values()) records.sort(compareRecordDisplayOrder);
    for (const records of indexes.recordsByApartmentDong.values()) records.sort(compareRecordDisplayOrder);
    indexes.gpsPlaces = [...gpsPlaceMap.values()];
    state.indexes = indexes;
    state.dataGeneration += 1;
    rebuildGpsCandidateIndex();
    if (!state.initialIndexPerformanceRecorded) {
        state.initialIndexPerformanceRecorded = true;
        recordPerformanceMetric("indexBuild", performance.now() - startedAt);
    }
}
function rebuildGpsCandidateIndex() {
    if (!state.indexes || !Array.isArray(state.indexes.gpsPlaces)) return;
    const candidates = [];
    if (state.locationMap.size > 0) {
        for (const placeInfo of state.indexes.gpsPlaces) {
            const locationEntry = findLocationEntryForPlace(placeInfo);
            if (!locationEntry?.coordinates?.length) continue;
            candidates.push({ ...placeInfo, coordinates: locationEntry.coordinates });
        }
    }
    state.indexes.gpsCandidates = candidates;
    invalidateGpsCache();
}
async function refreshRecordsFromServer(force = false) {
    if (state.networkLoading) return;
    state.networkLoading = true;
    updateDataSyncStatus("checking");
    try {
        if (!force && state.records.length > 0 && state.dataVersion) {
            const versionStartedAt = performance.now();
            try {
                const versionResponse = await requestApi("getDataVersion");
                recordPerformanceMetric("versionCheck", performance.now() - versionStartedAt);
                const serverVersion = extractDataVersion(versionResponse);
                state.lastDataCheckAt = Date.now();
                if (serverVersion && serverVersion === state.dataVersion) {
                    state.lastSuccessfulSyncAt = state.lastDataCheckAt;
                    updateDataSyncStatus("current", state.lastSuccessfulSyncAt);
                    return;
                }
            } catch (versionError) {
                recordPerformanceMetric("versionCheck", performance.now() - versionStartedAt);
                console.warn("데이터 버전 확인 실패, 전체 데이터를 다시 확인합니다:", versionError);
            }
        }
        const syncStartedAt = performance.now();
        const response = await requestApi("getData");
        const rawData = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        if (rawData.length === 0) throw new Error("불러온 데이터가 없습니다.");
        let normalizedRecords = normalizeRecordCollection(rawData);
        if (normalizedRecords.length === 0) throw new Error("사용 가능한 지역·아파트 데이터가 없습니다.");
        normalizedRecords = applyPendingOperationsToRecords(normalizedRecords);
        const serverVersion = extractDataVersion(response);
        const preservedScrollY = window.scrollY || 0;
        setRecords(normalizedRecords);
        state.dataVersion = serverVersion || state.dataVersion;
        state.lastDataCheckAt = Date.now();
        state.lastSuccessfulSyncAt = state.lastDataCheckAt;
        state.loading = false;
        saveRecordsToCache(state.records);
        if (!state.initialViewResolved) {
            resolveInitialView();
        } else {
            validateCurrentSelection();
            state.pendingScrollRestore = preservedScrollY;
            renderCurrentView();
        }
        renderGpsButtons();
        recordPerformanceMetric("dataSync", performance.now() - syncStartedAt);
        updateDataSyncStatus("current", state.lastSuccessfulSyncAt);
    } catch (error) {
        console.error("데이터 불러오기 실패:", error);
        state.loading = false;
        if (state.records.length === 0) renderError("데이터를 불러오지 못했습니다.", error.message);
        else if (force) showToast("저장된 데이터를 표시합니다.");
        updateDataSyncStatus(navigator.onLine === false ? "offline" : "error", state.lastSuccessfulSyncAt);
    } finally {
        state.networkLoading = false;
    }
}
async function loadRecordsFromServer() { return refreshRecordsFromServer(true); }
function extractDataVersion(response) { if (!response || typeof response !== "object") return ""; return cleanText(response.version || response.dataVersion || response?.meta?.version); }
function isLocationCacheFresh() {
    return state.locationMap.size > 0 && state.locationCacheSavedAt > 0 && Date.now() - state.locationCacheSavedAt < APP_CONFIG.LOCATION_REFRESH_INTERVAL;
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
        state.locationCacheSavedAt = Number.isFinite(savedTime) ? savedTime : 0;
        state.locationsLoaded = true;
        state.locationsError = false;
        if (savedTime && Date.now() - savedTime > APP_CONFIG.LOCATION_CACHE_MAX_AGE) {
            console.info("오래된 좌표 캐시를 먼저 표시합니다.");
        }
        rebuildGpsCandidateIndex();
        renderGpsButtons();
        return true;
    } catch (error) {
        console.error("좌표 캐시 읽기 실패:", error);
        state.locationCacheSavedAt = 0;
        localStorage.removeItem(APP_CONFIG.LOCATION_CACHE_KEY);
        localStorage.removeItem(APP_CONFIG.LOCATION_CACHE_TIME_KEY);
        return false;
    }
}
async function loadLocations(force = false) {
    const hadCache = state.locationMap.size > 0;
    if (!force && isLocationCacheFresh()) {
        state.locationsLoaded = true;
        state.locationsError = false;
        renderGpsButtons();
        return false;
    }
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
        const fetchedAt = Date.now();
        state.locationMap = locationMap;
        state.locationsRawText = rawText;
        state.locationCacheSavedAt = fetchedAt;
        state.locationsLoaded = true;
        state.locationsError = false;
        try {
            localStorage.setItem(APP_CONFIG.LOCATION_CACHE_KEY, rawText);
            localStorage.setItem(APP_CONFIG.LOCATION_CACHE_TIME_KEY, String(fetchedAt));
        } catch (cacheError) {
            console.warn("좌표 캐시 저장 실패:", cacheError);
        }
        rebuildGpsCandidateIndex();
        console.info(`GPS 좌표 아파트 수: ${state.locationMap.size}`);
        return true;
    } catch (error) {
        console.error("locations.json 불러오기 실패:", error);
        if (!hadCache) {
            state.locationMap = new Map();
            state.locationsLoaded = true;
            state.locationsError = true;
        }
        return false;
    } finally {
        renderGpsButtons();
    }
}
function normalizeLocationData(rawLocations) {
    const result = new Map();
    for (const [apartmentName, coordinateList] of Object.entries(rawLocations)) {
        if (!Array.isArray(coordinateList)) continue;
        const normalizedName = normalizeGpsName(apartmentName);
        if (!normalizedName) continue;
        const coordinates = coordinateList
            .map(item => ({ latitude: Number(item?.lat), longitude: Number(item?.lon) })) .filter(item => isValidCoordinate(item.latitude, item.longitude)); if (coordinates.length === 0) continue;
        if (result.has(normalizedName)) result.get(normalizedName).coordinates.push(...coordinates);
        else result.set(normalizedName, { sourceName: cleanText(apartmentName), coordinates });
    }
    return result;
}
function normalizeApartmentName(value) { return cleanText(value).normalize("NFC"); }
function normalizeGpsName(value) { return cleanText(value) .normalize("NFC") .replace(/[\s\u200B-\u200D\u2060\uFEFF]/gu, ""); }
function normalizeOfficeLabel(value) { return cleanText(value) .normalize("NFC") .replace(/\s+/g, "") .replace(/[.．。]+$/g, "") .toUpperCase(); }
/* 오피, 오피., OP처럼 같은 항목으로 합쳐야 하는 기본 표기 */
function isOfficeApartmentMarker(value) { const marker = normalizeOfficeLabel(value); return marker === "오피" || marker === "OP" || marker === "오피스텔" || marker === "OFFICETEL"; }
/* 기본 오피 표기와 구래동의 길건너오피·먹자오피만 오피로 취급 */
function isOfficeApartmentCategory(value) { const marker = normalizeOfficeLabel(value); return isOfficeApartmentMarker(marker) || marker === "길건너오피" || marker === "먹자오피"; }
function normalizeApartmentValue(value) { return cleanText(value).normalize("NFC"); }
function isValidCoordinate(latitude, longitude) { return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180; }
function normalizeRecord(item, index) {
    const rowId = firstValue(item, ["rowId", "rowID", "rowNumber", "row", "id", "행번호"]);
    const region = firstValue(item, ["region", "area", "지역", "동네"]);
    const apartment = firstValue(item, ["apartment", "apt", "아파트", "아파트명"]);
    const commonPassword = firstValue(item, ["commonPassword", "commonPwd", "common", "공동", "공동비밀번호", "공동비번"]);
    const dong = firstValue(item, ["dong", "building", "동", "건물"]);
    const line = firstValue(item, ["line", "라인", "호출라인"]);
    const password = firstValue(item, ["password", "pwd", "비밀번호", "비번"]);
    return {
        rowId: cleanText(rowId) || String(index + 2), region: cleanText(region), apartment: cleanText(apartment), commonPassword: cleanText(commonPassword), dong: cleanText(dong), line: cleanText(line), password: cleanText(password)
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
function isUsableRecord(record) { if (!cleanText(record?.region)) return false; if (isOfficeRecord(record)) return Boolean(cleanText(record?.dong) || cleanText(record?.apartment)); return Boolean(cleanText(record?.apartment)); }
function isOfficeRecord(record) { return isOfficeApartmentCategory(record?.apartment); }
function firstValue(object, keys) { return cleanText(firstRawValue(object, keys)); }
function firstRawValue(object, keys) {
    if (!object || typeof object !== "object") return "";
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== null && object[key] !== undefined) return object[key];
    }
    return "";
}
function cleanText(value) { return value === null || value === undefined ? "" : String(value).trim(); }
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
function saveRecordsToCache(records = state.records) { if (Array.isArray(records) && records !== state.records) state.records = records; state.cacheWritePending = true; clearTimeout(state.cacheWriteTimer); state.cacheWriteTimer = window.setTimeout(flushRecordsCache, APP_CONFIG.CACHE_WRITE_DELAY); }
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
function initializePendingSync() { state.pendingOperations = loadPendingOperations(); state.syncHadWork = state.pendingOperations.length > 0; window.addEventListener("online", wakePendingSync); document.addEventListener("visibilitychange", () => { if (!document.hidden) wakePendingSync(); }); }
function wakePendingSync() { if (state.pendingOperations.length > 0) state.pendingOperations[0].nextAttemptAt = 0; savePendingOperations(); schedulePendingSync(0); }
function createPendingOperation(action, payload) {
    return {
        id: createOperationId(), action: cleanText(action), payload: payload && typeof payload === "object" ? { ...payload } : {}, createdAt: Date.now(), attempts: 0, nextAttemptAt: 0
    };
}
function createOperationId() { if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID(); return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
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
            .filter(item => item && typeof item === "object" && cleanText(item.action)) .map(item => ({ id: cleanText(item.id) || createOperationId(), action: cleanText(item.action), payload: item.payload && typeof item.payload === "object" ? { ...item.payload } : {}, createdAt: Number(item.createdAt) || Date.now(), attempts: Math.max(0, Number(item.attempts) || 0), nextAttemptAt: Math.max(0, Number(item.nextAttemptAt) || 0) }));
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
        applyServerOperationResponse(operation, response);
        state.lastDataCheckAt = Date.now();
        state.lastSuccessfulSyncAt = state.lastDataCheckAt;
        updateDataSyncStatus("current", state.lastSuccessfulSyncAt);
        state.pendingOperations.shift();
        savePendingOperations();
        clearChangeHistoryCache();
        state.syncProcessing = false;
        if (elements.historyModal?.style.display === "flex") loadChangeHistory(false).catch(() => {});
        if (state.pendingOperations.length > 0) schedulePendingSync(0);
        else {
            if (state.syncHadWork) showToast("✅ 저장 완료");
            state.syncHadWork = false;
        }
    } catch (error) {
        const conflict = /먼저 변경|최신 데이터를 확인|충돌/u.test(cleanText(error?.message));
        console.warn(conflict ? "저장 충돌 감지:" : "백그라운드 저장 실패, 자동 재시도:", operation.action, error);
        operation.attempts = Math.max(0, Number(operation.attempts) || 0) + 1;
        if (conflict) {
            operation.conflict = true;
            operation.conflictMessage = cleanText(error?.message);
            operation.nextAttemptAt = Number.MAX_SAFE_INTEGER;
            savePendingOperations();
            state.syncProcessing = false;
            updateDataSyncStatus("error", state.lastSuccessfulSyncAt);
            showToast("⚠ 다른 수정과 충돌했습니다. 최신 데이터 확인이 필요합니다.");
            logLocalError("save-conflict", error, { action: operation.action, rowId: operation.payload?.rowId });
            return;
        }
        const retryDelay = getRetryDelay(operation.attempts);
        operation.nextAttemptAt = Date.now() + retryDelay;
        savePendingOperations();
        state.syncProcessing = false;
        updateDataSyncRetryStatus(operation.attempts, retryDelay);
        schedulePendingSync(retryDelay);
    }
}
function getRetryDelay(attempts) { const index = Math.min(Math.max(0, Number(attempts) - 1), APP_CONFIG.RETRY_DELAYS.length - 1); return APP_CONFIG.RETRY_DELAYS[index]; }
function applyPendingOperationsToRecords(records) { if (!Array.isArray(records)) return []; const copiedRecords = records.map(record => ({ ...record })); for (const operation of state.pendingOperations) applyOperationToRecords(copiedRecords, operation); return copiedRecords; }
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
        const duplicateExists = passwords.some(password => normalizePasswordForCompare(password) === normalizePasswordForCompare(newPassword));
        if (!duplicateExists) passwords.push(newPassword);
        record.password = sortPasswords(passwords).join(" / ");
        return;
    }
    if (operation.action === "updatePassword") {
        const oldPassword = cleanText(payload.oldPassword);
        const newPassword = cleanText(payload.newPassword);
        if (!oldPassword || !newPassword) return;
        const oldKey = normalizePasswordForCompare(oldPassword);
        const updated = splitPasswords(record.password).map(password =>
            normalizePasswordForCompare(password) === oldKey ? newPassword : password
        );
        record.password = sortPasswords(updated).join(" / ");
        return;
    }
    if (operation.action === "deletePassword") {
        const deletePasswordValue = cleanText(payload.password);
        if (!deletePasswordValue) return;
        record.password = sortPasswords(splitPasswords(record.password)
            .filter(password => normalizePasswordForCompare(password) !== normalizePasswordForCompare(deletePasswordValue)))
            .join(" / ");
    }
}
function applyServerOperationResponse(operation, response) {
    if (!operation || !response || typeof response !== "object") return;
    const payload = operation.payload || {};
    if (operation.action === "updateCommonPassword") {
        const region = cleanText(payload.region);
        const apartment = cleanText(payload.apartment);
        const commonPassword = Object.prototype.hasOwnProperty.call(response, "commonPassword") ? cleanText(response.commonPassword) : cleanText(payload.commonPassword);
        for (const record of state.indexes.recordsByApartment.get(makeKey(region, apartment)) || []) record.commonPassword = commonPassword;
        saveRecordsToCache(state.records);
        if (state.view === "dongs" && state.selectedRegion === region && state.selectedApartment === apartment) renderCommonPassword();
        return;
    }
    const rowId = cleanText(response.rowId || payload.rowId);
    const record = findRecordByRowId(rowId);
    if (!record) return;
    if (Object.prototype.hasOwnProperty.call(response, "password")) record.password = cleanText(response.password);
    saveRecordsToCache(state.records);
    refreshPasswordCard(rowId);
}
function findRecordByRowIdFromList(records, rowId) { const targetId = cleanText(rowId); return records.find(record => cleanText(record.rowId) === targetId) || null; }
/* ========================= 화면 이동·마지막 화면 복원 ========================= */
function initializeViewStatePersistence() {
    window.addEventListener("scroll", scheduleViewStateSave, { passive: true });
    window.addEventListener("pagehide", flushViewState);
    document.addEventListener("visibilitychange", () => { if (document.hidden) flushViewState(); });
}
function loadSavedViewState() {
    try {
        const raw = localStorage.getItem(APP_CONFIG.VIEW_STATE_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        const savedAt = Number(saved?.savedAt) || 0;
        if (!savedAt || Date.now() - savedAt > APP_CONFIG.VIEW_STATE_MAX_AGE) {
            localStorage.removeItem(APP_CONFIG.VIEW_STATE_KEY);
            return null;
        }
        return saved;
    } catch (error) {
        console.warn("마지막 화면 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.VIEW_STATE_KEY);
        return null;
    }
}
function resolveInitialView() {
    if (state.initialViewResolved) return;
    state.initialViewResolved = true;
    const saved = state.savedViewState;
    if (saved && typeof saved === "object") {
        state.restoringSavedView = true;
        state.selectedRegion = cleanText(saved.selectedRegion);
        state.selectedApartment = cleanText(saved.selectedApartment);
        state.selectedDong = cleanText(saved.selectedDong);
        state.view = ["regions", "apartments", "dongs", "cards"].includes(saved.view) ? saved.view : "regions";
        state.history = normalizeSavedViewHistory(saved.history);
        validateCurrentSelection();
        state.pendingScrollRestore = Math.max(0, Number(saved.scrollY) || 0);
        renderCurrentView();
        state.restoringSavedView = false;
        return;
    }
    resetSteps(false);
}
function normalizeSavedViewHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-20).map(item => ({
        selectedRegion: cleanText(item?.selectedRegion),
        selectedApartment: cleanText(item?.selectedApartment),
        selectedDong: cleanText(item?.selectedDong),
        view: ["regions", "apartments", "dongs", "cards"].includes(item?.view) ? item.view : "regions",
        scrollY: Math.max(0, Number(item?.scrollY) || 0)
    }));
}
function scheduleViewStateSave() {
    if (!state.initialViewResolved || state.restoringSavedView) return;
    clearTimeout(state.viewStateSaveTimer);
    state.viewStateSaveTimer = window.setTimeout(flushViewState, APP_CONFIG.VIEW_STATE_SAVE_DELAY);
}
function flushViewState() {
    clearTimeout(state.viewStateSaveTimer);
    state.viewStateSaveTimer = null;
    if (!state.initialViewResolved) return;
    try {
        localStorage.setItem(APP_CONFIG.VIEW_STATE_KEY, JSON.stringify({
            savedAt: Date.now(),
            selectedRegion: state.selectedRegion,
            selectedApartment: state.selectedApartment,
            selectedDong: state.selectedDong,
            view: state.view,
            scrollY: Math.max(0, Math.round(window.scrollY || 0)),
            history: state.history.slice(-20)
        }));
    } catch (error) {
        console.warn("마지막 화면 저장 실패:", error);
    }
}
function resetSteps(clearHistory = true) {
    if (clearHistory) state.history = [];
    state.selectedRegion = "";
    state.selectedApartment = "";
    state.selectedDong = "";
    state.view = "regions";
    state.pendingScrollRestore = 0;
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
    state.pendingScrollRestore = Math.max(0, Number(previousState.scrollY) || 0);
    renderCurrentView();
}
function pushHistory() {
    state.history.push({ selectedRegion: state.selectedRegion, selectedApartment: state.selectedApartment, selectedDong: state.selectedDong, view: state.view, scrollY: Math.max(0, Math.round(window.scrollY || 0)) });
    if (state.history.length > 20) state.history.shift();
}
function validateCurrentSelection() {
    if (!state.selectedRegion || !state.indexes.apartmentsByRegion.has(state.selectedRegion)) {
        state.selectedRegion = "";
        state.selectedApartment = "";
        state.selectedDong = "";
        state.view = "regions";
        state.history = [];
        return;
    }
    if (!state.selectedApartment) {
        if (state.view !== "apartments") state.view = "apartments";
        state.selectedDong = "";
        return;
    }
    const apartmentKey = makeKey(state.selectedRegion, state.selectedApartment);
    if (!state.indexes.recordsByApartment.has(apartmentKey)) {
        state.selectedApartment = "";
        state.selectedDong = "";
        state.view = "apartments";
        state.history = [];
        return;
    }
    if (state.view === "dongs") return;
    if (!state.selectedDong) {
        state.view = "dongs";
        return;
    }
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
    hideCommonPassword();
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
            if (!isOfficeApartmentCategory(state.selectedApartment)) {
                renderCommonPassword();
            }
            renderDongButtons();
            break;
        case "cards":
            renderPasswordCards();
            break;
        case "regions":
        default:
            renderRegionButtons();
            break;
    }
    finalizeViewRender();
}
function finalizeViewRender() {
    updateViewContextBar();
    const requestedScroll = state.pendingScrollRestore;
    state.pendingScrollRestore = null;
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (requestedScroll !== null && requestedScroll !== undefined) window.scrollTo(0, Math.max(0, Number(requestedScroll) || 0));
            scheduleViewStateSave();
        });
    });
}
function updateViewContextBar() {
    const target = elements.viewContextBar;
    if (!target) return;
    if (state.view === "regions") {
        target.hidden = true;
        target.textContent = "";
        return;
    }
    let label = "";
    if (state.view === "apartments") label = `지역 · ${state.selectedRegion}`;
    else if (state.view === "dongs") label = `${state.selectedRegion} · ${state.selectedApartment}`;
    else if (state.view === "cards") {
        if (isOfficeApartmentCategory(state.selectedApartment)) label = [state.selectedRegion, state.selectedDong && state.selectedDong !== "전체" ? state.selectedDong : state.selectedApartment].filter(Boolean).join(" · ");
        else label = [state.selectedApartment, state.selectedDong && state.selectedDong !== "전체" ? formatDongLabel(state.selectedDong) : "전체"].filter(Boolean).join(" · ");
    }
    target.textContent = label;
    target.title = label;
    target.hidden = !label;
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
    if (elements.homeDataStatusCard) elements.homeDataStatusCard.hidden = !isHome;
    if (isHome) updateHomeDataStatusCard();
    syncGpsWatch();
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
function selectRegion(region) { pushHistory(); state.selectedRegion = region; state.selectedApartment = ""; state.selectedDong = ""; state.view = "apartments"; state.pendingScrollRestore = 0; renderCurrentView(); }
function renderApartmentButtons() {
    const apartments = sortApartmentsWithOfficeLast( state.indexes.apartmentsByRegion.get(state.selectedRegion) || [] );
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
function sortApartmentsWithOfficeLast(values) {
    const normalApartments = [];
    const officeApartments = [];
    for (const value of values || []) {
        if (isOfficeApartmentCategory(value)) officeApartments.push(value);
        else normalApartments.push(value);
    }
    normalApartments.sort(naturalCompare);
    officeApartments.sort(naturalCompare);
    return [...normalApartments, ...officeApartments];
}
function compareApartments(a, b) { const isOfficeA = isOfficeApartmentCategory(a); const isOfficeB = isOfficeApartmentCategory(b); if (isOfficeA !== isOfficeB) return isOfficeA ? 1 : -1; return naturalCompare(normalizeApartmentValue(a), normalizeApartmentValue(b)); }
function selectApartment(apartment) { pushHistory(); state.selectedApartment = apartment; state.selectedDong = ""; state.view = "dongs"; state.pendingScrollRestore = 0; renderCurrentView(); }
function renderDongButtons() {
    const apartmentKey = makeKey(state.selectedRegion, state.selectedApartment);
    const dongs = state.indexes.dongsByApartment.get(apartmentKey) || [];
    if (dongs.length === 0 || (dongs.length === 1 && dongs[0] === "전체")) {
        state.selectedDong = "전체";
        state.view = "cards";
        if (state.pendingScrollRestore === null) state.pendingScrollRestore = 0;
        renderCurrentView();
        return;
    }
    for (const dong of dongs) {
        const button = createSelectButton(dong === "전체" ? "전체" : formatDongLabel(dong));
        button.addEventListener("click", () => selectDong(dong));
        elements.buttonGrid.appendChild(button);
    }
}
function selectDong(dong) { pushHistory(); state.selectedDong = dong; state.view = "cards"; state.pendingScrollRestore = 0; renderCurrentView(); }
function normalizeDongValue(value) { return cleanText(value) || "전체"; }
function formatDongLabel(dong) { const value = cleanText(dong); if (!value || value === "전체") return "전체"; if (/동$/u.test(value)) return value; if (/^\d+$/u.test(value)) return `${value}동`; return value; }
function hideCommonPassword() { elements.commonPwdStandalone.replaceChildren(); elements.commonPwdStandalone.style.display = "none"; elements.commonPwdStandalone.hidden = true; }
function renderCommonPassword() {
    hideCommonPassword();
    if (state.view !== "dongs") return;
    if (isOfficeApartmentCategory(state.selectedApartment)) return;
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
    elements.commonPwdStandalone.hidden = false;
    elements.commonPwdStandalone.style.display = "block";
}
function getSelectedApartmentRecords() { return state.indexes.recordsByApartment.get(makeKey(state.selectedRegion, state.selectedApartment)) || []; }
function renderPasswordCards() {
    hideCommonPassword();
    elements.stepContainer.style.display = "none";
    elements.cardList.style.display = "flex";
    renderGateLocationButton();
    let records;
    if (state.selectedDong && state.selectedDong !== "전체") {
        records = state.indexes.recordsByApartmentDong.get( makeKey(state.selectedRegion, state.selectedApartment, normalizeDongValue(state.selectedDong)) ) || [];
    } else {
        records = getSelectedApartmentRecords();
    }
    records = Array.isArray(records) ? records : [];
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
    const passwordList = sortPasswords(splitPasswords(record.password));
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
        deleteButton.textContent = "✏️ 수정";
        deleteButton.addEventListener("click", () => openDeletePwdModal(record.rowId));
        footer.appendChild(deleteButton);
    }
    card.append(lineTitle, passwordContainer, footer);
    return card;
}
function refreshPasswordCard(rowId) {
    if (state.view !== "cards") return;
    const record = findRecordByRowId(rowId);
    if (!record) return;
    const visibleApartment = record.region === state.selectedRegion && record.apartment === state.selectedApartment;
    const visibleDong = !state.selectedDong || state.selectedDong === "전체" || normalizeDongValue(record.dong) === normalizeDongValue(state.selectedDong);
    if (!visibleApartment || !visibleDong) return;
    const existingCard = [...elements.cardList.querySelectorAll(".card[data-row-id]")].find(card => card.dataset.rowId === cleanText(rowId));
    if (!existingCard) {
        renderCurrentView();
        return;
    }
    existingCard.replaceWith(createPasswordCard(record));
}
/* ========================= 게이트 이미지 백그라운드 선로딩 ========================= */
const gateImagePreloadPool = [];
function scheduleGateImagePreload() {
    const schedule = () => {
        const run = () => preloadGateImagesInBackground();
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(run, { timeout: 4000 });
        } else {
            window.setTimeout(run, 1200);
        }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
}
function preloadGateImagesInBackground() {
    const loadedSources = new Set(gateImagePreloadPool.map(image => image.src));
    for (const info of Object.values(GATE_IMAGES)) {
        const absoluteSource = new URL(info.src, window.location.href).href;
        if (loadedSources.has(absoluteSource)) continue;
        const image = new Image();
        image.decoding = "async";
        if ("fetchPriority" in image) image.fetchPriority = "low";
        image.src = info.src;
        gateImagePreloadPool.push(image);
        loadedSources.add(absoluteSource);
    }
}

/* ========================= 게이트 위치 이미지 ========================= */
const gateView = { scale: 1, x: 0, y: 0, pointers: new Map() };
function getGateImageInfo(name) {
    const key = cleanText(name).normalize("NFC");
    return GATE_IMAGES[key] || null;
}
function getSelectedGateBuildingName() {
    if (!isOfficeApartmentCategory(state.selectedApartment)) return "";
    if (state.selectedDong && state.selectedDong !== "전체") return state.selectedDong;
    const dongs = uniqueValues(getSelectedApartmentRecords().map(record => normalizeDongValue(record.dong)).filter(dong => dong !== "전체"));
    return dongs.length === 1 ? dongs[0] : "";
}
function renderGateLocationButton() {
    const building = getSelectedGateBuildingName();
    const info = getGateImageInfo(building);
    if (!info) return;
    const wrap = document.createElement("div");
    wrap.className = "gate-location-action";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gate-location-btn";
    button.textContent = "📍 게이트 위치";
    button.addEventListener("click", () => openGateImageModal(info, building));
    wrap.appendChild(button);
    elements.cardList.appendChild(wrap);
}
function initializeGateImageModal() {
    const modal = document.getElementById("gateImageModal");
    const stage = document.getElementById("gateImageStage");
    const image = document.getElementById("gateImage");
    if (!modal || !stage || !image) return;
    document.getElementById("gateImageCloseBtn").addEventListener("click", closeGateImageModal);
    document.getElementById("gateImageResetBtn").addEventListener("click", resetGateImageView);
    image.addEventListener("load", resetGateImageView);
    stage.addEventListener("pointerdown", event => { stage.setPointerCapture(event.pointerId); gateView.pointers.set(event.pointerId, gatePoint(event, stage)); });
    stage.addEventListener("pointermove", event => {
        if (!gateView.pointers.has(event.pointerId)) return;
        const before = new Map(gateView.pointers);
        gateView.pointers.set(event.pointerId, gatePoint(event, stage));
        const oldPoints = [...before.values()], newPoints = [...gateView.pointers.values()];
        if (newPoints.length === 1 && gateView.scale > 1) { gateView.x += newPoints[0].x - oldPoints[0].x; gateView.y += newPoints[0].y - oldPoints[0].y; }
        else if (newPoints.length >= 2) {
            const oldMid = gateMid(oldPoints[0], oldPoints[1]), newMid = gateMid(newPoints[0], newPoints[1]);
            const oldDistance = Math.max(1, gateDistance(oldPoints[0], oldPoints[1]));
            const nextScale = Math.min(5, Math.max(1, gateView.scale * gateDistance(newPoints[0], newPoints[1]) / oldDistance));
            const cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
            const qx = (oldMid.x - cx - gateView.x) / gateView.scale, qy = (oldMid.y - cy - gateView.y) / gateView.scale;
            gateView.x = newMid.x - cx - qx * nextScale; gateView.y = newMid.y - cy - qy * nextScale; gateView.scale = nextScale;
        }
        clampGateImageView(); applyGateImageView();
    });
    const endPointer = event => gateView.pointers.delete(event.pointerId);
    stage.addEventListener("pointerup", endPointer); stage.addEventListener("pointercancel", endPointer);
    stage.addEventListener("wheel", event => { event.preventDefault(); zoomGateImageAt(event.offsetX, event.offsetY, gateView.scale * (event.deltaY < 0 ? 1.18 : .85)); }, { passive: false });
    stage.addEventListener("dblclick", event => zoomGateImageAt(event.offsetX, event.offsetY, gateView.scale > 1 ? 1 : 2.5));
    document.addEventListener("keydown", event => { if (event.key === "Escape" && modal.style.display === "flex") closeGateImageModal(); });
}
function gatePoint(event, stage) { const rect = stage.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function gateDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function gateMid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function openGateImageModal(info, building) {
    const modal = document.getElementById("gateImageModal"), image = document.getElementById("gateImage");
    document.getElementById("gateImageTitle").textContent = `${cleanText(building) || info.label} 게이트 위치`;
    image.src = info.src; image.alt = `${cleanText(building) || info.label} 게이트 위치 안내`;
    resetGateImageView(); modal.style.display = "flex"; document.body.classList.add("gate-image-open");
}
function closeGateImageModal() { const modal = document.getElementById("gateImageModal"); if (!modal) return; modal.style.display = "none"; document.body.classList.remove("gate-image-open"); gateView.pointers.clear(); resetGateImageView(); }
function resetGateImageView() { gateView.scale = 1; gateView.x = 0; gateView.y = 0; gateView.pointers.clear(); applyGateImageView(); }
function zoomGateImageAt(x, y, requestedScale) {
    const stage = document.getElementById("gateImageStage"); if (!stage) return;
    const nextScale = Math.min(5, Math.max(1, requestedScale)), cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
    const qx = (x - cx - gateView.x) / gateView.scale, qy = (y - cy - gateView.y) / gateView.scale;
    gateView.x = x - cx - qx * nextScale; gateView.y = y - cy - qy * nextScale; gateView.scale = nextScale;
    clampGateImageView(); applyGateImageView();
}
function clampGateImageView() {
    const stage = document.getElementById("gateImageStage"), image = document.getElementById("gateImage"); if (!stage || !image) return;
    if (gateView.scale <= 1) { gateView.scale = 1; gateView.x = 0; gateView.y = 0; return; }
    const maxX = Math.max(0, (image.clientWidth * gateView.scale - stage.clientWidth) / 2), maxY = Math.max(0, (image.clientHeight * gateView.scale - stage.clientHeight) / 2);
    gateView.x = Math.max(-maxX, Math.min(maxX, gateView.x)); gateView.y = Math.max(-maxY, Math.min(maxY, gateView.y));
}
function applyGateImageView() { const image = document.getElementById("gateImage"); if (image) image.style.transform = `translate3d(${gateView.x}px,${gateView.y}px,0) scale(${gateView.scale})`; }
function formatLineLabel(line) { const value = cleanText(line); if (!value) return "공용"; return /라인$/u.test(value) ? value : `${value}라인`; }
function splitPasswords(value) { const text = cleanText(value); if (!text) return []; return uniqueValues( text.split(/\s*(?:\/|\||,|\r?\n)\s*/u) .map(item => item.trim()) .filter(Boolean) ); }
function createSelectButton(label) { const button = document.createElement("button"); button.type = "button"; button.className = "select-btn"; button.textContent = label; button.title = label; return button; }
function uniqueValues(values) { return [...new Set(values.map(value => cleanText(value)).filter(Boolean))]; }
function naturalCompare(a, b) { return cleanText(a).localeCompare(cleanText(b), "ko-KR", { numeric: true, sensitivity: "base" }); }
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
function renderStatusMessage(message) { elements.buttonGrid.replaceChildren(); const status = document.createElement("div"); status.className = "status-msg"; status.style.gridColumn = "1 / -1"; status.textContent = message; elements.buttonGrid.appendChild(status); }
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
async function requestApi(action, payload = {}, requestOptions = {}) { if (!API_URL || API_URL.includes("여기에_") || !/^https?:\/\//i.test(API_URL)) { throw new Error("script.js 맨 위 API_URL에 Apps Script /exec 주소를 입력하세요."); }
    let response;
    if (action === "getData" || action === "getDataVersion" || action === "getDataIntegrity" || action === "getChangeHistory") {
        const url = new URL(API_URL);
        url.searchParams.set("action", action);
        for (const [key, value] of Object.entries(payload || {})) {
            if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
        }
        url.searchParams.set("_t", String(Date.now()));
        response = await fetch(url.toString(), { method: "GET", cache: "no-store", redirect: "follow", signal: requestOptions.signal });
    } else {
        response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }), cache: "no-store", redirect: "follow", signal: requestOptions.signal });
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
        const businessError = new Error(result.message || result.error || "서버 작업에 실패했습니다.");
        businessError.apiBusinessError = true;
        businessError.apiAction = action;
        throw businessError;
    }
    return result;
}
/* ========================= 수정기록 ========================= */
function initializeHistoryButton() {
    if (elements.historyBtn) elements.historyBtn.addEventListener("click", openChangeHistoryModal);
    if (elements.historyRefreshBtn) elements.historyRefreshBtn.addEventListener("click", () => {
        clearChangeHistoryCache();
        loadChangeHistory(true);
    });
}
function openChangeHistoryModal() {
    openModal(elements.historyModal);
    const cachedHistory = loadCachedChangeHistory();
    if (cachedHistory.length > 0) {
        state.changeHistory = cachedHistory;
        renderChangeHistory();
        elements.historyStatus.style.display = "block";
        elements.historyStatus.textContent = "최신 기록 확인 중...";
        loadChangeHistory(false);
        return;
    }
    loadChangeHistory(true);
}
function closeChangeHistoryModal() { closeModal(elements.historyModal); }
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
        saveChangeHistoryCache(state.changeHistory);
        renderChangeHistory();
    } catch (error) {
        console.error("수정기록 불러오기 실패:", error);
        if (state.changeHistory.length > 0) {
            renderChangeHistory();
            showToast("수정기록 최신 확인 실패");
        } else {
            elements.historyList.replaceChildren();
            elements.historyStatus.style.display = "block";
            elements.historyStatus.textContent = `수정기록을 불러오지 못했습니다.\n${error.message}`;
        }
    } finally {
        state.historyLoading = false;
    }
}
function loadCachedChangeHistory() {
    try {
        const savedAt = Number(localStorage.getItem(APP_CONFIG.HISTORY_CACHE_TIME_KEY));
        if (!Number.isFinite(savedAt) || Date.now() - savedAt > APP_CONFIG.HISTORY_CACHE_MAX_AGE) return [];
        const parsed = JSON.parse(localStorage.getItem(APP_CONFIG.HISTORY_CACHE_KEY) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeHistoryItem).filter(item => item.historyId);
    } catch (error) {
        clearChangeHistoryCache();
        return [];
    }
}
function saveChangeHistoryCache(history) {
    try {
        localStorage.setItem(APP_CONFIG.HISTORY_CACHE_KEY, JSON.stringify(Array.isArray(history) ? history : []));
        localStorage.setItem(APP_CONFIG.HISTORY_CACHE_TIME_KEY, String(Date.now()));
    } catch (error) {
        console.warn("수정기록 캐시 저장 실패:", error);
    }
}
function clearChangeHistoryCache() {
    try {
        localStorage.removeItem(APP_CONFIG.HISTORY_CACHE_KEY);
        localStorage.removeItem(APP_CONFIG.HISTORY_CACHE_TIME_KEY);
    } catch (error) {}
}
function normalizeHistoryItem(item) {
    return {
        historyId: cleanText(item?.historyId), changedAt: cleanText(item?.changedAt), region: cleanText(item?.region), apartment: cleanText(item?.apartment), dong: cleanText(item?.dong), line: cleanText(item?.line), changeType: cleanText(item?.changeType) || "수정", beforeValue: cleanText(item?.beforeValue), afterValue: cleanText(item?.afterValue), reverted: item?.reverted === true || cleanText(item?.reverted) === "예", revertedAt: cleanText(item?.revertedAt), canUndo: item?.canUndo !== false
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
        values.append( createHistoryValueBox("변경 전", item.beforeValue), createHistoryValueBox("변경 후", item.afterValue) );
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
        clearChangeHistoryCache();
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
        elements.adminPinInput.addEventListener("input", () => { elements.adminPinInput.value = elements.adminPinInput.value.replace(/\D/g, "").slice(0, 4); hideAdminPinError(); });
        elements.adminPinInput.addEventListener("keydown", event => { if (event.key === "Enter") submitAdminPin(); });
    }
    if (elements.adminRefreshBtn) elements.adminRefreshBtn.addEventListener("click", () => loadAdminDashboard(true));
    if (elements.adminCurrentTab) elements.adminCurrentTab.addEventListener("click", () => setAdminView("current"));
    if (elements.adminStatsTab) elements.adminStatsTab.addEventListener("click", () => setAdminView("stats"));
    if (elements.createBackupBtn) elements.createBackupBtn.addEventListener("click", createDataBackup);
    if (elements.setupAutoBackupBtn) elements.setupAutoBackupBtn.addEventListener("click", setupAutomaticBackup);
    if (elements.sortPasswordsBtn) elements.sortPasswordsBtn.addEventListener("click", () => runPasswordCleanup("sort"));
    if (elements.deduplicatePasswordsBtn) elements.deduplicatePasswordsBtn.addEventListener("click", () => runPasswordCleanup("deduplicate"));
}
function openAdminModal() {
    if (state.adminAuthenticating) return;
    if (hasValidAdminSession()) {
        openAdminDashboardModal();
        return;
    }
    openAdminPinModal();
}
function openAdminPinModal() { if (!elements.adminPinModal) return; elements.adminPinInput.value = ""; hideAdminPinError(); openModal(elements.adminPinModal); window.setTimeout(() => elements.adminPinInput.focus(), 100); }
function closeAdminPinModal() { if (state.adminAuthenticating) return; if (elements.adminPinInput) elements.adminPinInput.value = ""; hideAdminPinError(); closeModal(elements.adminPinModal); }
function showAdminPinError(message) { if (!elements.adminPinError) return; elements.adminPinError.hidden = false; elements.adminPinError.textContent = cleanText(message) || "관리자 인증에 실패했습니다."; }
function hideAdminPinError() { if (!elements.adminPinError) return; elements.adminPinError.hidden = true; elements.adminPinError.textContent = ""; }
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
function openAdminDashboardModal() { openModal(elements.adminModal); loadAdminDashboard(true); }
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
function hasValidAdminSession() { return Boolean(state.adminToken) && state.adminTokenExpiresAt > Date.now(); }
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
    window.alert(`${message} 관리자 버튼을 눌러 다시 인증해주세요.`); return true; } function closeAdminModal() { closeModal(elements.adminModal); } async function loadAdminDashboard(showLoading = true) { if (state.adminLoading) return; state.adminLoading = true; if (showLoading) { elements.adminStatus.style.display = "block"; elements.adminStatus.textContent = "점검 정보를 불러오는 중입니다..."; elements.adminContent.hidden = true; } try { const response = await requestApi("getAdminDashboard", { adminToken: requireAdminToken() }); const dashboard = response?.data && typeof response.data === "object" ? response.data : response; state.adminDashboard = normalizeAdminDashboard(dashboard); renderAdminDashboard(); } catch (error) { console.error("관리자 점검 불러오기 실패:", error); if (handleAdminAuthError(error)) return; elements.adminContent.hidden = true; elements.adminStatus.style.display = "block"; elements.adminStatus.textContent = `점검 정보를 불러오지 못했습니다.\n${error.message}`; } finally { state.adminLoading = false; } } function normalizeAdminDashboard(data) {
    const qualityCategories = Array.isArray(data?.dataQuality?.categories)
        ? data.dataQuality.categories.map(normalizeDataQualityCategory).filter(item => item.label)
        : [];
    return {
        dataSheetName: cleanText(data?.dataSheetName),
        totalRows: Number(data?.totalRows) || 0,
        regionCount: Number(data?.regionCount) || 0,
        apartmentCount: Number(data?.apartmentCount) || 0,
        officeBuildingCount: Number(data?.officeBuildingCount) || 0,
        passwordRowCount: Number(data?.passwordRowCount) || 0,
        blankPasswordRowCount: Number(data?.blankPasswordRowCount) || 0,
        historyCount: Number(data?.historyCount) || 0,
        statistics: normalizeAdminStatistics(data?.statistics),
        usage: normalizeUsageStatistics(data?.usage),
        dataVersion: cleanText(data?.dataVersion),
        checkedAt: cleanText(data?.checkedAt),
        dataQuality: {
            checkedAt: cleanText(data?.dataQuality?.checkedAt),
            checkedRows: Number(data?.dataQuality?.checkedRows) || 0,
            totalIssues: Number(data?.dataQuality?.totalIssues) || 0,
            healthy: data?.dataQuality?.healthy === true,
            cleanup: {
                sortableCount: Number(data?.dataQuality?.cleanup?.sortableCount) || 0,
                duplicateCount: Number(data?.dataQuality?.cleanup?.duplicateCount) || 0
            },
            categories: qualityCategories
        },
        autoBackup: {
            enabled: data?.autoBackup?.enabled === true,
            healthy: data?.autoBackup?.healthy !== false,
            needsAttention: data?.autoBackup?.needsAttention === true,
            status: cleanText(data?.autoBackup?.status),
            schedule: cleanText(data?.autoBackup?.schedule) || "매일 06시경",
            timezone: cleanText(data?.autoBackup?.timezone) || "Asia/Seoul",
            message: cleanText(data?.autoBackup?.message),
            lastSuccessAt: cleanText(data?.autoBackup?.lastSuccessAt),
            lastFailureAt: cleanText(data?.autoBackup?.lastFailureAt),
            lastFailureMessage: cleanText(data?.autoBackup?.lastFailureMessage),
            hoursSinceSuccess: Number.isFinite(Number(data?.autoBackup?.hoursSinceSuccess)) ? Number(data.autoBackup.hoursSinceSuccess) : null
        },
        backups: Array.isArray(data?.backups) ? data.backups.map(normalizeBackupInfo).filter(item => item.name) : []
    };
}
function normalizeUsageStatistics(data) {
    return {
        todayUsers: Number(data?.todayUsers) || 0,
        activeUsers: Number(data?.activeUsers) || 0,
        activeMinutes: Number(data?.activeMinutes) || 5,
        checkedAt: cleanText(data?.checkedAt)
    };
}
function normalizeAdminStatistics(data) {
    return {
        dongCount: Number(data?.dongCount) || 0,
        lineCount: Number(data?.lineCount) || 0,
        passwordCount: Number(data?.passwordCount) || 0,
        commonPasswordPlaceCount: Number(data?.commonPasswordPlaceCount) || 0,
        averagePasswordsPerLine: Number(data?.averagePasswordsPerLine) || 0,
        recent7Days: Number(data?.recent7Days) || 0,
        recent30Days: Number(data?.recent30Days) || 0,
        activitySampleLimited: data?.activitySampleLimited === true,
        regionStats: Array.isArray(data?.regionStats) ? data.regionStats.map(item => ({ region: cleanText(item?.region), placeCount: Number(item?.placeCount) || 0, dongCount: Number(item?.dongCount) || 0, lineCount: Number(item?.lineCount) || 0, passwordCount: Number(item?.passwordCount) || 0 })).filter(item => item.region) : [],
        changeTypes: Array.isArray(data?.changeTypes) ? data.changeTypes.map(item => ({ type: cleanText(item?.type), count: Number(item?.count) || 0 })).filter(item => item.type) : [],
        topApartments: Array.isArray(data?.topApartments) ? data.topApartments.map(item => ({ region: cleanText(item?.region), apartment: cleanText(item?.apartment), count: Number(item?.count) || 0 })).filter(item => item.apartment) : []
    };
}
function normalizeDataQualityCategory(item) {
    return {
        key: cleanText(item?.key),
        label: cleanText(item?.label),
        severity: cleanText(item?.severity) || "warning",
        count: Number(item?.count) || 0,
        items: Array.isArray(item?.items) ? item.items.map(cleanText).filter(Boolean) : [],
        hiddenCount: Number(item?.hiddenCount) || 0
    };
}
function normalizeBackupInfo(item) { return { name: cleanText(item?.name), createdAt: cleanText(item?.createdAt), rowCount: Number(item?.rowCount) || 0, kind: cleanText(item?.kind) || "수동 백업" }; } function renderAdminDashboard() {
    const dashboard = state.adminDashboard;
    if (!dashboard) return;
    const gpsTotal = state.indexes.gpsPlaces.length;
    const gpsMissingItems = state.indexes.gpsPlaces
        .filter(item => !findLocationEntryForPlace(item))
        .map(item => item.displayName)
        .filter((value, index, array) => value && array.indexOf(value) === index)
        .sort(naturalCompare);
    const gpsMatched = Math.max(0, gpsTotal - gpsMissingItems.length);
    const pendingCount = state.pendingOperations.length;
    const latestBackup = dashboard.backups[0]?.createdAt || "없음";
    const lastSync = state.lastDataCheckAt ? formatLocalDateTime(state.lastDataCheckAt) : "확인 전";
    const totalDataIssues = dashboard.dataQuality.totalIssues + gpsMissingItems.length;

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
        ["데이터 오류", `${totalDataIssues.toLocaleString()}건`, totalDataIssues ? "danger" : "good"],
        ["GPS 좌표 연결", `${gpsMatched.toLocaleString()} / ${gpsTotal.toLocaleString()}`, gpsMissingItems.length ? "warn" : "good"],
        ["저장 대기", `${pendingCount.toLocaleString()}건`, pendingCount ? "danger" : "good"],
        ["오늘 사용 기기", `${dashboard.usage.todayUsers.toLocaleString()}명`, dashboard.usage.todayUsers ? "good" : ""],
        ["현재 활동 기기", `${dashboard.usage.activeUsers.toLocaleString()}명 · 최근 ${dashboard.usage.activeMinutes}분`, dashboard.usage.activeUsers ? "good" : ""],
        ["수정기록", `${dashboard.historyCount.toLocaleString()}건`, ""],
        ["자동 백업", getAutoBackupMetricText(dashboard.autoBackup), dashboard.autoBackup.needsAttention ? "danger" : "good"],
        ["보관 백업", `${dashboard.backups.length.toLocaleString()}개`, dashboard.backups.length ? "good" : "warn"],
        ["마지막 백업", latestBackup, dashboard.backups.length ? "good" : "warn"],
        ["마지막 동기화", lastSync, ""]
    ];
    for (const [label, value, tone] of metrics) elements.adminMetrics.appendChild(createAdminMetric(label, value, tone));
    renderAdminPerformanceReport();
    renderAdminStatistics(dashboard, { gpsTotal, gpsMatched, gpsMissing: gpsMissingItems.length });

    if (gpsMissingItems.length > 0) {
        const preview = gpsMissingItems.slice(0, 10).join(", ");
        const extra = gpsMissingItems.length > 10 ? ` 외 ${gpsMissingItems.length - 10}곳` : "";
        elements.adminGpsWarning.hidden = false;
        elements.adminGpsWarning.textContent = `⚠ GPS 좌표 미연결 ${gpsMissingItems.length}곳\n${preview}${extra}`;
    } else {
        elements.adminGpsWarning.hidden = true;
        elements.adminGpsWarning.textContent = "";
    }

    renderDataQualityReport(dashboard.dataQuality, gpsMissingItems);
    renderPasswordCleanupActions(dashboard.dataQuality.cleanup, pendingCount);
    elements.createBackupBtn.disabled = state.backupCreating || Boolean(state.restoringBackupName) || Boolean(state.passwordCleanupMode);
    elements.createBackupBtn.textContent = state.backupCreating ? "백업중…" : "지금 백업";
    renderAutoBackupHealth(dashboard.autoBackup);
    if (elements.setupAutoBackupBtn) {
        elements.setupAutoBackupBtn.disabled = state.autoBackupUpdating;
        elements.setupAutoBackupBtn.textContent = state.autoBackupUpdating ? "설정 중..." : "자동백업 재설정";
    }
    renderBackupList(dashboard.backups, pendingCount);
}
function setAdminView(view) {
    const stats = view === "stats";
    if (elements.adminCurrentPanel) elements.adminCurrentPanel.hidden = stats;
    if (elements.adminStatsPanel) elements.adminStatsPanel.hidden = !stats;
    if (elements.adminCurrentTab) { elements.adminCurrentTab.classList.toggle("active", !stats); elements.adminCurrentTab.setAttribute("aria-selected", String(!stats)); }
    if (elements.adminStatsTab) { elements.adminStatsTab.classList.toggle("active", stats); elements.adminStatsTab.setAttribute("aria-selected", String(stats)); }
}
function renderAdminStatistics(dashboard, gpsInfo) {
    if (!elements.adminStatsMetrics) return;
    const stats = dashboard.statistics || normalizeAdminStatistics(null);
    const totalPlaces = dashboard.apartmentCount + dashboard.officeBuildingCount;
    const commonRate = totalPlaces ? Math.round((stats.commonPasswordPlaceCount / totalPlaces) * 1000) / 10 : 0;
    const gpsRate = gpsInfo.gpsTotal ? Math.round((gpsInfo.gpsMatched / gpsInfo.gpsTotal) * 1000) / 10 : 0;
    const gateCount = Object.keys(GATE_IMAGES).length;
    const metrics = [
        ["전체 동", `${stats.dongCount.toLocaleString()}개`, ""],
        ["전체 라인", `${stats.lineCount.toLocaleString()}개`, ""],
        ["개별 비밀번호", `${stats.passwordCount.toLocaleString()}개`, "good"],
        ["라인당 평균", `${stats.averagePasswordsPerLine.toLocaleString()}개`, ""],
        ["공동비번 등록", `${stats.commonPasswordPlaceCount.toLocaleString()}곳 · ${commonRate}%`, commonRate >= 90 ? "good" : ""],
        ["GPS 연결률", `${gpsInfo.gpsMatched.toLocaleString()}/${gpsInfo.gpsTotal.toLocaleString()} · ${gpsRate}%`, gpsInfo.gpsMissing ? "warn" : "good"],
        ["게이트 이미지", `${gateCount.toLocaleString()}개`, gateCount ? "good" : ""],
        ["오늘 사용 기기", `${dashboard.usage.todayUsers.toLocaleString()}명`, dashboard.usage.todayUsers ? "good" : ""],
        ["현재 활동 기기", `${dashboard.usage.activeUsers.toLocaleString()}명 · 최근 ${dashboard.usage.activeMinutes}분`, dashboard.usage.activeUsers ? "good" : ""],
        ["최근 7일 수정", `${stats.recent7Days.toLocaleString()}건`, ""],
        ["최근 30일 수정", `${stats.recent30Days.toLocaleString()}건`, ""],
        ["전체 수정기록", `${dashboard.historyCount.toLocaleString()}건`, ""]
    ];
    elements.adminStatsMetrics.replaceChildren();
    for (const [label, value, tone] of metrics) elements.adminStatsMetrics.appendChild(createAdminMetric(label, value, tone));
    if (elements.adminStatsCheckedAt) elements.adminStatsCheckedAt.textContent = dashboard.checkedAt || "방금 확인";
    renderAdminStatsRows(elements.adminRegionStats, stats.regionStats.map(item => ({ title: item.region, value: `건물 ${item.placeCount} · 동 ${item.dongCount} · 라인 ${item.lineCount} · 비번 ${item.passwordCount}` })));
    renderAdminStatsRows(elements.adminChangeTypeStats, stats.changeTypes.map(item => ({ title: item.type, value: `${item.count.toLocaleString()}건` })), stats.activitySampleLimited ? "최근 5,000건 기준" : "수정기록 없음");
    renderAdminStatsRows(elements.adminTopApartments, stats.topApartments.map((item, index) => ({ title: `${index + 1}. ${item.apartment}`, subtitle: item.region, value: `${item.count.toLocaleString()}회` })), "수정기록 없음");
    const appCache = navigator.serviceWorker?.controller ? "활성" : "확인 중";
    renderAdminStatsRows(elements.adminAppInfoStats, [
        { title: "앱 파일 버전", value: FINAL_BUILD_INFO.fileVersion },
        { title: "서비스워커", value: appCache },
        { title: "데이터 버전", value: dashboard.dataVersion || "확인 전" },
        { title: "데이터 시트", value: dashboard.dataSheetName || "확인 전" },
        { title: "마지막 점검", value: dashboard.checkedAt || "확인 전" }
    ]);
}
function renderAdminStatsRows(container, rows, emptyText = "표시할 통계가 없습니다.") {
    if (!container) return;
    container.replaceChildren();
    if (!rows.length) { const empty = document.createElement("div"); empty.className = "admin-stats-empty"; empty.textContent = emptyText; container.appendChild(empty); return; }
    for (const row of rows) {
        const item = document.createElement("div"); item.className = "admin-stats-row";
        const text = document.createElement("div");
        const title = document.createElement("div"); title.className = "admin-stats-row-title"; title.textContent = row.title;
        text.appendChild(title);
        if (row.subtitle) { const sub = document.createElement("div"); sub.className = "admin-stats-row-sub"; sub.textContent = row.subtitle; text.appendChild(sub); }
        const value = document.createElement("div"); value.className = "admin-stats-row-value"; value.textContent = row.value;
        item.append(text, value); container.appendChild(item);
    }
}
function getAutoBackupMetricText(autoBackup) {
    if (!autoBackup?.enabled) return "설정 필요";
    if (autoBackup.needsAttention) return "이상 확인";
    if (autoBackup.status === "waiting") return "첫 실행 대기";
    return "정상";
}
function renderAutoBackupHealth(autoBackup) {
    if (elements.autoBackupStatus) {
        const icon = autoBackup?.needsAttention ? "⚠" : autoBackup?.status === "waiting" ? "🕒" : "✅";
        const lastSuccess = autoBackup?.lastSuccessAt ? ` · 최근 성공 ${autoBackup.lastSuccessAt}` : "";
        elements.autoBackupStatus.textContent = `${icon} ${autoBackup?.message || autoBackup?.schedule || "자동 백업 상태 확인 중"}${lastSuccess}`;
    }
    if (!elements.autoBackupWarning) return;
    if (autoBackup?.needsAttention) {
        const details = [autoBackup.message];
        if (autoBackup.lastFailureAt) details.push(`마지막 실패: ${autoBackup.lastFailureAt}`);
        if (autoBackup.lastFailureMessage && !autoBackup.message.includes(autoBackup.lastFailureMessage)) details.push(autoBackup.lastFailureMessage);
        elements.autoBackupWarning.hidden = false;
        elements.autoBackupWarning.textContent = `⚠ 자동백업 확인 필요\n${details.filter(Boolean).join("\n")}`;
    } else {
        elements.autoBackupWarning.hidden = true;
        elements.autoBackupWarning.textContent = "";
    }
}
function renderDataQualityReport(dataQuality, gpsMissingItems) {
    if (!elements.adminDataQualityList || !elements.adminDataQualityStatus) return;
    const categories = Array.isArray(dataQuality?.categories) ? dataQuality.categories.filter(item => item.count > 0) : [];
    if (gpsMissingItems.length > 0) {
        categories.push({
            key: "gpsMissing",
            label: "GPS 좌표 미연결",
            severity: "warning",
            count: gpsMissingItems.length,
            items: gpsMissingItems.slice(0, 20),
            hiddenCount: Math.max(0, gpsMissingItems.length - 20)
        });
    }
    const totalIssues = categories.reduce((sum, item) => sum + item.count, 0);
    elements.adminDataQualityStatus.className = `admin-data-quality-status ${totalIssues ? "danger" : "good"}`;
    elements.adminDataQualityStatus.textContent = totalIssues ? `${totalIssues.toLocaleString()}건 확인` : "이상 없음";
    elements.adminDataQualityList.replaceChildren();
    if (!categories.length) {
        const empty = document.createElement("div");
        empty.className = "admin-quality-empty";
        empty.textContent = "✅ 현재 확인된 데이터 오류가 없습니다.";
        elements.adminDataQualityList.appendChild(empty);
        return;
    }
    for (const category of categories) {
        const item = document.createElement("div");
        item.className = "admin-quality-item";
        item.dataset.severity = category.severity;
        const summary = document.createElement("div");
        summary.className = "admin-quality-summary";
        const label = document.createElement("div");
        label.className = "admin-quality-label";
        label.textContent = category.label;
        const count = document.createElement("div");
        count.className = "admin-quality-count";
        count.textContent = `${category.count.toLocaleString()}건`;
        summary.append(label, count);
        item.appendChild(summary);
        if (category.items.length > 0) {
            const details = document.createElement("ul");
            details.className = "admin-quality-details";
            for (const detailText of category.items) {
                const detail = document.createElement("li");
                detail.textContent = detailText;
                details.appendChild(detail);
            }
            if (category.hiddenCount > 0) {
                const more = document.createElement("li");
                more.className = "admin-quality-more";
                more.textContent = `외 ${category.hiddenCount.toLocaleString()}건`;
                details.appendChild(more);
            }
            item.appendChild(details);
        }
        elements.adminDataQualityList.appendChild(item);
    }
}

function renderPasswordCleanupActions(cleanup, pendingCount) {
    const sortableCount = Number(cleanup?.sortableCount) || 0;
    const duplicateCount = Number(cleanup?.duplicateCount) || 0;
    const busy = Boolean(state.passwordCleanupMode) || state.backupCreating || Boolean(state.restoringBackupName) || pendingCount > 0;
    if (elements.sortPasswordsBtn) {
        elements.sortPasswordsBtn.disabled = busy;
        elements.sortPasswordsBtn.textContent = state.passwordCleanupMode === "sort"
            ? "정렬중…"
            : sortableCount > 0
                ? `쉬운 번호 우선 정렬 (${sortableCount.toLocaleString()})`
                : "쉬운 번호 우선 정렬";
        elements.sortPasswordsBtn.title = sortableCount > 0
            ? `${sortableCount.toLocaleString()}개 행이 점검에서 확인되었습니다.`
            : "누르면 서버에서 전체 비밀번호를 다시 확인합니다.";
    }
    if (elements.deduplicatePasswordsBtn) {
        elements.deduplicatePasswordsBtn.disabled = busy;
        elements.deduplicatePasswordsBtn.textContent = state.passwordCleanupMode === "deduplicate"
            ? "제거중…"
            : duplicateCount > 0
                ? `중복 제거 (${duplicateCount.toLocaleString()})`
                : "중복 제거";
        elements.deduplicatePasswordsBtn.title = duplicateCount > 0
            ? `${duplicateCount.toLocaleString()}개 행이 점검에서 확인되었습니다.`
            : "누르면 서버에서 전체 비밀번호를 다시 확인합니다.";
    }
}

async function runPasswordCleanup(mode) {
    if (state.passwordCleanupMode || !state.adminDashboard) return;
    if (state.pendingOperations.length > 0) {
        window.alert("저장 대기 중인 작업이 끝난 뒤 자동 정리를 실행해주세요.");
        return;
    }
    const isSort = mode === "sort";
    const count = isSort
        ? Number(state.adminDashboard.dataQuality.cleanup?.sortableCount) || 0
        : Number(state.adminDashboard.dataQuality.cleanup?.duplicateCount) || 0;
    const title = isSort ? "쉬운 번호 우선·호수 정렬" : "중복 비밀번호 제거";
    const detail = isSort
        ? "쉬운 번호를 1) 3자리 이하, 2) 같은 숫자 반복, 3) 숫자 블록 반복, 4) 숫자 쌍 반복, 5) 연속 숫자, 6) 역순 숫자, 7) 앞뒤 대칭, 8) 호수와 동일, 9) 지정 쉬운 번호 순으로 나누고, 각 순위 안에서는 호수순으로 정렬합니다. 일반 번호는 그 뒤에서 호수순으로 정렬하며 중복 개수는 유지합니다."
        : "처음 저장된 값은 유지하고 같은 비밀번호만 제거합니다. 순서는 변경하지 않습니다.";
    const targetText = count > 0
        ? `점검에서 확인된 대상 ${count.toLocaleString()}개 행을 처리합니다.`
        : "서버에서 전체 비밀번호 데이터를 다시 확인한 뒤 대상 행만 처리합니다.";
    const confirmation = window.confirm(
        `${title}\n\n${targetText}\n${detail}\n비밀번호 열 외의 데이터는 변경하지 않습니다.\n변경 대상이 있으면 실행 전 자동 백업됩니다.\n\n계속할까요?`
    );
    if (!confirmation) return;

    state.passwordCleanupMode = mode;
    renderAdminDashboard();
    try {
        const response = await requestApi("cleanupPasswords", {
            mode,
            operationId: createOperationId(),
            adminToken: requireAdminToken()
        });
        updateLocalDataVersion(response);
        showToast(`✅ ${response?.message || title + " 완료"}`);
        await refreshRecordsFromServer(true);
        await loadAdminDashboard(false);
    } catch (error) {
        console.error(`${title} 실패:`, error);
        if (!handleAdminAuthError(error)) window.alert(`${title}에 실패했습니다.\n${error.message}`);
    } finally {
        state.passwordCleanupMode = "";
        if (state.adminDashboard) renderAdminDashboard();
    }
}

function initializePerformanceTracking() {
    state.performanceHistory = loadPerformanceHistory();
    savePerformanceSnapshot();
    updateAdminPerformanceAlertBadge();
}
function loadPerformanceHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(APP_CONFIG.PERFORMANCE_HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === "object").slice(0, APP_CONFIG.PERFORMANCE_HISTORY_LIMIT) : [];
    } catch (error) {
        console.warn("성능 측정 기록 읽기 실패:", error);
        return [];
    }
}
function recordPerformanceMetric(key, value) {
    const numericValue = Number(value);
    if (!Object.prototype.hasOwnProperty.call(PERFORMANCE_RULES, key) || !Number.isFinite(numericValue) || numericValue < 0) return;
    state.performanceMetrics[key] = Math.round(numericValue);
    savePerformanceSnapshot();
    updateAdminPerformanceAlertBadge();
    if (elements.adminModal?.style.display === "flex" && state.adminDashboard) renderAdminPerformanceReport();
}
function savePerformanceSnapshot() {
    try {
        const history = Array.isArray(state.performanceHistory) ? state.performanceHistory.slice() : [];
        const entry = { id: state.performanceSessionId, measuredAt: Date.now(), metrics: { ...state.performanceMetrics } };
        const index = history.findIndex(item => item.id === state.performanceSessionId);
        if (index >= 0) history[index] = entry;
        else history.unshift(entry);
        state.performanceHistory = history.slice(0, APP_CONFIG.PERFORMANCE_HISTORY_LIMIT);
        localStorage.setItem(APP_CONFIG.PERFORMANCE_HISTORY_KEY, JSON.stringify(state.performanceHistory));
    } catch (error) {
        console.warn("성능 측정 기록 저장 실패:", error);
    }
}
function getPerformanceTone(value, rule) {
    if (!Number.isFinite(value)) return "pending";
    if (value <= rule.good) return "good";
    if (value <= rule.warning) return "warn";
    return "danger";
}
function formatPerformanceDuration(value) {
    if (!Number.isFinite(value)) return "측정 전";
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}초`;
}
function formatPerformanceRange(rule) {
    return `정상 ≤ ${formatPerformanceDuration(rule.good)} · 주의 ≤ ${formatPerformanceDuration(rule.warning)} · 느림 > ${formatPerformanceDuration(rule.warning)}`;
}
function getPerformanceValues(key) {
    return (Array.isArray(state.performanceHistory) ? state.performanceHistory : [])
        .map(item => Number(item?.metrics?.[key]))
        .filter(Number.isFinite)
        .slice(0, APP_CONFIG.PERFORMANCE_HISTORY_LIMIT);
}
function getPerformanceStatistics(key, rule) {
    const values = getPerformanceValues(key);
    if (!values.length) {
        return { values: [], latest: null, average: null, median: null, count: 0, latestTone: "pending", medianTone: "pending", currentTone: "pending", consecutiveWarnings: 0, hasDanger: false };
    }
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const tones = values.map(value => getPerformanceTone(value, rule));
    let consecutiveWarnings = 0;
    for (const tone of tones) {
        if (tone !== "warn") break;
        consecutiveWarnings += 1;
    }
    const hasDanger = tones.includes("danger");
    const latestTone = tones[0];
    const medianTone = getPerformanceTone(median, rule);
    const currentTone = latestTone === "danger" || medianTone === "danger"
        ? "danger"
        : latestTone === "warn" || medianTone === "warn"
            ? "warn"
            : "good";
    return {
        values,
        latest: values[0],
        average,
        median,
        count: values.length,
        latestTone,
        medianTone,
        currentTone,
        consecutiveWarnings,
        hasDanger
    };
}
function updateAdminPerformanceAlertBadge() {
    const badge = elements.adminPerformanceAlertBadge;
    if (!badge) return;
    let warningCount = 0;
    let dangerCount = 0;
    let measuredCount = 0;
    const details = [];
    for (const [key, rule] of Object.entries(PERFORMANCE_RULES)) {
        const stats = getPerformanceStatistics(key, rule);
        if (!stats.count) continue;
        measuredCount += 1;
        if (stats.currentTone === "danger") {
            dangerCount += 1;
            details.push(`${rule.label}: 느림 기록 ${stats.values.filter(value => getPerformanceTone(value, rule) === "danger").length}회 · 중앙값 ${formatPerformanceDuration(stats.median)}`);
        } else if (stats.currentTone === "warn") {
            warningCount += 1;
            details.push(`${rule.label}: 연속 주의 ${stats.consecutiveWarnings}회 · 중앙값 ${formatPerformanceDuration(stats.median)}`);
        }
    }
    badge.hidden = false;
    badge.textContent = "";
    if (dangerCount) {
        badge.className = "admin-performance-alert-badge danger";
        badge.removeAttribute("aria-label");
    } else if (warningCount) {
        badge.className = "admin-performance-alert-badge warning";
        badge.removeAttribute("aria-label");
    } else {
        badge.className = "admin-performance-alert-badge good";
        badge.removeAttribute("aria-label");
    }
    badge.removeAttribute("title");
}
function renderAdminPerformanceReport() {
    if (!elements.adminPerformanceList || !elements.adminPerformanceStatus) return;
    elements.adminPerformanceList.replaceChildren();
    let measuredCount = 0;
    let warningCount = 0;
    let dangerCount = 0;
    for (const [key, rule] of Object.entries(PERFORMANCE_RULES)) {
        const stats = getPerformanceStatistics(key, rule);
        if (stats.count) measuredCount += 1;
        if (stats.currentTone === "warn") warningCount += 1;
        if (stats.currentTone === "danger") dangerCount += 1;
        const displayTone = stats.currentTone;
        const row = document.createElement("div");
        row.className = `admin-performance-item ${displayTone}`;
        const head = document.createElement("div");
        head.className = "admin-performance-head";
        const label = document.createElement("div");
        label.className = "admin-performance-label";
        label.textContent = rule.label;
        const badge = document.createElement("div");
        badge.className = `admin-performance-badge ${displayTone}`;
        badge.textContent = displayTone === "good" ? "정상" : displayTone === "warn" ? "주의" : displayTone === "danger" ? "느림" : "측정 전";
        head.append(label, badge);
        const value = document.createElement("div");
        value.className = "admin-performance-value";
        value.textContent = `최신 ${formatPerformanceDuration(stats.latest)} · 평균 ${formatPerformanceDuration(stats.average)} · 중앙값 ${formatPerformanceDuration(stats.median)}`;
        const trend = document.createElement("div");
        trend.className = "admin-performance-trend";
        const warningText = stats.consecutiveWarnings ? ` · 연속 주의 ${stats.consecutiveWarnings}회` : "";
        const dangerText = stats.hasDanger ? ` · 최근 ${stats.count}회 중 느림 ${stats.values.filter(item => getPerformanceTone(item, rule) === "danger").length}회` : "";
        trend.textContent = `${rule.category} · 최근 ${stats.count}회${warningText}${dangerText}`;
        const range = document.createElement("div");
        range.className = "admin-performance-range";
        range.textContent = formatPerformanceRange(rule);
        row.append(head, value, trend, range);
        elements.adminPerformanceList.appendChild(row);
    }
    const overallTone = dangerCount ? "danger" : warningCount ? "warn" : measuredCount ? "good" : "";
    elements.adminPerformanceStatus.className = `admin-data-quality-status ${overallTone}`;
    elements.adminPerformanceStatus.textContent = dangerCount
        ? `느림 ${dangerCount}개${warningCount ? ` · 주의 ${warningCount}개` : ""}`
        : warningCount
            ? `주의 ${warningCount}개`
            : measuredCount
                ? `전체 정상 · ${measuredCount}/${Object.keys(PERFORMANCE_RULES).length} 측정`
                : "측정 중";
}

function createAdminMetric(label, value, tone = "") { const wrapper = document.createElement("div"); wrapper.className = "admin-metric"; const labelElement = document.createElement("div"); labelElement.className = "admin-metric-label"; labelElement.textContent = label; const valueElement = document.createElement("div"); valueElement.className = `admin-metric-value${tone ? ` ${tone}` : ""}`; valueElement.textContent = value; wrapper.append(labelElement, valueElement); return wrapper; } function renderBackupList(backups, pendingCount) { elements.backupList.replaceChildren(); if (!backups.length) { const empty = document.createElement("div"); empty.className = "backup-empty"; empty.textContent = "아직 생성된 백업이 없습니다."; elements.backupList.appendChild(empty); return; } for (const backup of backups) { const item = document.createElement("div"); item.className = "backup-item"; const info = document.createElement("div"); info.className = "backup-info"; const name = document.createElement("div"); name.className = "backup-name"; name.textContent = backup.kind; name.title = backup.name; const meta = document.createElement("div"); meta.className = "backup-meta"; meta.textContent = `${backup.createdAt || backup.name} · ${backup.rowCount.toLocaleString()}행`; info.append(name, meta); const restoreButton = document.createElement("button"); restoreButton.type = "button"; restoreButton.className = "restore-backup-btn"; restoreButton.textContent = state.restoringBackupName === backup.name ? "복구 중..." : "복구"; restoreButton.disabled = Boolean(state.restoringBackupName) || state.backupCreating || pendingCount > 0; restoreButton.title = pendingCount > 0 ? "저장 대기 작업이 끝난 뒤 복구할 수 있습니다." : ""; restoreButton.addEventListener("click", () => restoreDataBackup(backup)); item.append(info, restoreButton); elements.backupList.appendChild(item); } } async function setupAutomaticBackup() {
    if (state.autoBackupUpdating) return;
    state.autoBackupUpdating = true;
    if (state.adminDashboard) renderAdminDashboard();
    try {
        await requestApi("setupAutoBackup", { adminToken: requireAdminToken() });
        showToast("✅ 매일 06시 자동백업 설정 완료");
        await loadAdminDashboard(false);
    } catch (error) {
        console.error("자동백업 설정 실패:", error);
        if (!handleAdminAuthError(error)) window.alert(`자동백업 설정에 실패했습니다.\n${error.message}`);
    } finally {
        state.autoBackupUpdating = false;
        if (state.adminDashboard) renderAdminDashboard();
    }
}
async function createDataBackup() { if (state.backupCreating || state.restoringBackupName) return; state.backupCreating = true; renderAdminDashboard(); try { const response = await requestApi("createBackup", { operationId: createOperationId(), adminToken: requireAdminToken() }); showToast("✅ 백업을 생성했습니다."); await loadAdminDashboard(false); if (response?.backup?.name) console.info("생성된 백업:", response.backup.name); } catch (error) { console.error("백업 생성 실패:", error); if (!handleAdminAuthError(error)) window.alert(`백업 생성에 실패했습니다.\n${error.message}`); } finally { state.backupCreating = false; if (state.adminDashboard) renderAdminDashboard(); } } async function restoreDataBackup(backup) { if (!backup?.name || state.restoringBackupName || state.backupCreating) return; if (state.pendingOperations.length > 0) { window.alert("아직 저장 대기 중인 작업이 있습니다. 저장 완료 후 다시 복구해주세요."); return; } const confirmation = window.prompt( `${backup.createdAt || backup.name} 백업으로 전체 복구합니다.\n` + "현재 데이터는 복구 전에 자동 백업됩니다.\n\n계속하려면 '복구'를 입력하세요." ); if (cleanText(confirmation) !== "복구") { if (confirmation !== null) showToast("복구가 취소되었습니다."); return; } state.restoringBackupName = backup.name; renderAdminDashboard(); try { const response = await requestApi("restoreBackup", { backupName: backup.name, operationId: createOperationId(), adminToken: requireAdminToken() }); updateLocalDataVersion(response); showToast("✅ 백업 데이터로 복구했습니다."); await refreshRecordsFromServer(true); await loadAdminDashboard(false); } catch (error) { console.error("백업 복구 실패:", error); if (!handleAdminAuthError(error)) window.alert(`백업 복구에 실패했습니다.\n${error.message}`); } finally { state.restoringBackupName = ""; if (state.adminDashboard) renderAdminDashboard(); } } function formatLocalDateTime(value) { const date = value instanceof Date ? value : new Date(value); if (!Number.isFinite(date.getTime())) return "확인 전"; return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date); }
/* ========================= 공동비밀번호 수정 ========================= */
function openCommonModal() {
    const apartmentRecords = getSelectedApartmentRecords();
    if (apartmentRecords.length === 0) {
        showToast("수정할 아파트 정보가 없습니다.");
        return;
    }
    const currentPasswords = uniqueValues( apartmentRecords.map(record => record.commonPassword).filter(Boolean) );
    state.currentCommonEdit = { region: state.selectedRegion, apartment: state.selectedApartment };
    elements.commonModalAptLabel.textContent = `${state.selectedRegion} · ${state.selectedApartment}`;
    elements.formCommonPwdValue.value = currentPasswords.join(" / ");
    if (elements.commonDeleteBtn) {
        elements.commonDeleteBtn.disabled = currentPasswords.length === 0;
        elements.commonDeleteBtn.hidden = currentPasswords.length === 0;
    }
    openModal(elements.commonEditorModal);
    window.setTimeout(() => { elements.formCommonPwdValue.focus(); elements.formCommonPwdValue.select(); }, 100);
}
function closeCommonModal() {
    state.currentCommonEdit = null;
    elements.formCommonPwdValue.value = "";
    if (elements.commonDeleteBtn) {
        elements.commonDeleteBtn.disabled = false;
        elements.commonDeleteBtn.hidden = false;
    }
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
    if (state.view === "dongs" && state.selectedRegion === region && state.selectedApartment === apartment) renderCommonPassword();
}
function confirmDeleteCommonPassword() {
    if (!state.currentCommonEdit) return showToast("삭제할 아파트를 다시 선택해주세요.");
    const region = state.currentCommonEdit.region;
    const apartment = state.currentCommonEdit.apartment;
    const currentPasswords = uniqueValues(
        (state.indexes.recordsByApartment.get(makeKey(region, apartment)) || [])
            .map(record => record.commonPassword)
            .filter(Boolean)
    );
    if (currentPasswords.length === 0) return showToast("삭제할 공동비밀번호가 없습니다.");
    if (!standardizedConfirm({
        title: "공동비밀번호를 삭제합니다.",
        target: `${region} · ${apartment} · ${currentPasswords.join(" / ")}`,
        effect: "이 아파트의 공동비밀번호가 빈 값으로 변경됩니다.",
        reversible: true
    })) return;
    enqueuePendingOperation("updateCommonPassword", { region, apartment, commonPassword: "" });
    for (const record of state.indexes.recordsByApartment.get(makeKey(region, apartment)) || []) {
        record.commonPassword = "";
    }
    saveRecordsToCache(state.records);
    closeCommonModal();
    if (state.view === "dongs" && state.selectedRegion === region && state.selectedApartment === apartment) renderCommonPassword();
    showToast(navigator.onLine === false ? "공동비밀번호 삭제를 기기에 저장했습니다." : "공동비밀번호 삭제를 요청했습니다.");
}
/* 인라인 버튼과 이전 캐시 HTML 모두에서 공동비번 삭제 함수를 확실히 찾도록 전역에 등록합니다. */
window.confirmDeleteCommonPassword = confirmDeleteCommonPassword;
window.confirmDeleteCommonPassworld = confirmDeleteCommonPassword;
/* ========================= 비밀번호 추가·수정·삭제 ========================= */
function openAddPwdModal(rowId) {
    const record = findRecordByRowId(rowId);
    if (!record) {
        showToast("해당 비밀번호 정보를 찾지 못했습니다.");
        return;
    }

    elements.addPwdRowId.value = record.rowId;
    elements.addPwdModalTitle.textContent = "➕ 비밀번호 추가";
    elements.addPwdInfo.textContent = createRecordInfoText(record);
    resetAddPasswordInputs();

    const currentPasswords = splitPasswords(record.password);
    const detectedTemplate = detectPasswordTemplate(currentPasswords);
    state.addPasswordTemplate = detectedTemplate;

    if (currentPasswords.length === 0) {
        elements.addPwdFormatStatus.textContent = "첫 비밀번호는 호수·비밀번호·종료문자를 포함한 전체 형식으로 입력해주세요.";
        setAddPasswordMode("direct");
    } else if (detectedTemplate) {
        elements.addPwdFormatStatus.textContent = "기존 등록 형식을 자동으로 적용합니다.";
        elements.addPwdFormatSample.textContent = `기준 형식: ${detectedTemplate.sample}`;
        setAddPasswordMode("smart");
    } else {
        elements.addPwdFormatStatus.textContent = "기존 형식의 숫자 위치를 확실히 판단할 수 없어 전체 입력 방식으로 열었습니다.";
        setAddPasswordMode("direct");
    }

    openModal(elements.addPwdModal);
    window.setTimeout(() => focusCurrentAddPasswordInput(), 100);
}
function resetAddPasswordInputs() {
    elements.addPwdValue.value = "";
    elements.addPwdRoomValue.value = "";
    elements.addPwdCodeValue.value = "";
    elements.addPwdPreview.textContent = "호수와 비밀번호를 입력하면 결과가 표시됩니다.";
    elements.addPwdPreview.classList.remove("ready", "error");
}
function setAddPasswordMode(mode) {
    const canUseSmartMode = Boolean(state.addPasswordTemplate);
    state.addPasswordMode = mode === "smart" && canUseSmartMode ? "smart" : "direct";
    const smartMode = state.addPasswordMode === "smart";

    elements.addPwdSmartFields.hidden = !smartMode;
    elements.addPwdDirectGroup.hidden = smartMode;
    elements.addPwdModeToggle.hidden = !canUseSmartMode;
    elements.addPwdModeToggle.textContent = smartMode ? "전체 형식 직접 입력" : "호수·비밀번호 따로 입력";
    updateAddPasswordPreview();
}
function toggleAddPasswordMode() {
    setAddPasswordMode(state.addPasswordMode === "smart" ? "direct" : "smart");
    window.setTimeout(() => focusCurrentAddPasswordInput(), 30);
}
function focusCurrentAddPasswordInput() {
    if (state.addPasswordMode === "smart") elements.addPwdRoomValue.focus();
    else elements.addPwdValue.focus();
}
function updateAddPasswordPreview() {
    if (state.addPasswordMode !== "smart" || !state.addPasswordTemplate) return;
    const room = cleanText(elements.addPwdRoomValue.value);
    const password = cleanText(elements.addPwdCodeValue.value);

    elements.addPwdPreview.classList.remove("ready", "error");
    if (!room && !password) {
        elements.addPwdPreview.textContent = "호수와 비밀번호를 입력하면 결과가 표시됩니다.";
        return;
    }
    if (!/^\d+$/u.test(room) || !/^\d+$/u.test(password)) {
        elements.addPwdPreview.textContent = "호수와 비밀번호는 숫자로 입력해주세요.";
        elements.addPwdPreview.classList.add("error");
        return;
    }

    elements.addPwdPreview.textContent = `추가될 형식: ${formatPasswordFromTemplate(state.addPasswordTemplate, room, password)}`;
    elements.addPwdPreview.classList.add("ready");
}
function closeAddPwdModal() {
    elements.addPwdRowId.value = "";
    elements.addPwdInfo.textContent = "";
    elements.addPwdFormatStatus.textContent = "";
    elements.addPwdFormatSample.textContent = "";
    resetAddPasswordInputs();
    state.addPasswordMode = "direct";
    state.addPasswordTemplate = null;
    closeModal(elements.addPwdModal);
}
function submitAddPwd() {
    const rowId = cleanText(elements.addPwdRowId.value);
    if (!rowId) return showToast("추가할 행을 찾지 못했습니다.");

    let newPassword = "";
    if (state.addPasswordMode === "smart" && state.addPasswordTemplate) {
        const room = cleanText(elements.addPwdRoomValue.value);
        const password = cleanText(elements.addPwdCodeValue.value);
        if (!/^\d+$/u.test(room)) {
            showToast("호수를 숫자로 입력해주세요.");
            elements.addPwdRoomValue.focus();
            return;
        }
        if (!/^\d+$/u.test(password)) {
            showToast("비밀번호를 숫자로 입력해주세요.");
            elements.addPwdCodeValue.focus();
            return;
        }
        newPassword = formatPasswordFromTemplate(state.addPasswordTemplate, room, password);
    } else {
        newPassword = cleanText(elements.addPwdValue.value);
        if (!newPassword) {
            showToast("추가할 비밀번호 전체 형식을 입력해주세요.");
            elements.addPwdValue.focus();
            return;
        }
    }

    const record = findRecordByRowId(rowId);
    if (!record) return showToast("해당 데이터를 찾지 못했습니다.");
    const currentPasswords = splitPasswords(record.password);
    const duplicateExists = currentPasswords.some(password => normalizePasswordForCompare(password) === normalizePasswordForCompare(newPassword));
    if (duplicateExists) return showToast("이미 등록된 비밀번호입니다.");

    enqueuePendingOperation("addPassword", { rowId, password: newPassword });
    currentPasswords.push(newPassword);
    record.password = sortPasswords(currentPasswords).join(" / ");
    saveRecordsToCache(state.records);
    closeAddPwdModal();
    refreshPasswordCard(rowId);
}
function parsePasswordTemplate(value) {
    const text = cleanText(value);
    if (!text) return null;
    const numberMatches = [...text.matchAll(/\d+/gu)];
    if (numberMatches.length !== 2) return null;

    const roomMatch = numberMatches[0];
    const passwordMatch = numberMatches[1];
    const roomEnd = roomMatch.index + roomMatch[0].length;
    const passwordEnd = passwordMatch.index + passwordMatch[0].length;
    const prefix = text.slice(0, roomMatch.index);
    const middle = text.slice(roomEnd, passwordMatch.index);
    const suffix = text.slice(passwordEnd);
    if (!middle) return null;

    return {
        prefix,
        middle,
        suffix,
        sample: text,
        signature: `${prefix}\u0001${middle}\u0001${suffix}`
    };
}
function detectPasswordTemplate(passwords) {
    const candidates = new Map();
    let order = 0;
    for (const password of Array.isArray(passwords) ? passwords : []) {
        const template = parsePasswordTemplate(password);
        if (!template) continue;
        const existing = candidates.get(template.signature);
        if (existing) {
            existing.count += 1;
            continue;
        }
        candidates.set(template.signature, { ...template, count: 1, order });
        order += 1;
    }
    return [...candidates.values()].sort((left, right) => right.count - left.count || left.order - right.order)[0] || null;
}
function formatPasswordFromTemplate(template, room, password) {
    return `${template.prefix}${room}${template.middle}${password}${template.suffix}`;
}
function openDeletePwdModal(rowId) {
    const record = findRecordByRowId(rowId);
    if (!record) return showToast("해당 비밀번호 정보를 찾지 못했습니다.");
    const passwords = sortPasswords(splitPasswords(record.password));
    if (passwords.length === 0) return showToast("수정할 비밀번호가 없습니다.");
    elements.deletePwdRowId.value = record.rowId;
    elements.deletePwdModalTitle.textContent = "✏️ 비밀번호 수정·삭제";
    elements.deletePwdInfo.textContent = createRecordInfoText(record);
    elements.deletePwdButtons.replaceChildren();
    resetPasswordEditSelection();
    for (const password of passwords) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "delete-pwd-btn password-select-btn";
        button.textContent = password;
        button.dataset.password = password;
        button.addEventListener("click", () => selectPasswordForEdit(password));
        elements.deletePwdButtons.appendChild(button);
    }
    openModal(elements.deletePwdModal);
}
function selectPasswordForEdit(password) {
    const selected = cleanText(password);
    elements.selectedPwdOriginal.value = selected;
    elements.editPwdValue.value = selected;
    elements.passwordEditPanel.hidden = false;
    for (const button of elements.deletePwdButtons.querySelectorAll(".password-select-btn")) {
        button.classList.toggle("selected", button.dataset.password === selected);
    }
    window.setTimeout(() => { elements.editPwdValue.focus(); elements.editPwdValue.select(); }, 50);
}
function resetPasswordEditSelection() {
    elements.selectedPwdOriginal.value = "";
    elements.editPwdValue.value = "";
    elements.passwordEditPanel.hidden = true;
}
function closeDeletePwdModal() {
    elements.deletePwdRowId.value = "";
    elements.deletePwdInfo.textContent = "";
    elements.deletePwdButtons.replaceChildren();
    resetPasswordEditSelection();
    closeModal(elements.deletePwdModal);
}
function submitUpdatePassword() {
    const rowId = cleanText(elements.deletePwdRowId.value);
    const oldPassword = cleanText(elements.selectedPwdOriginal.value);
    const newPassword = cleanText(elements.editPwdValue.value);
    const record = findRecordByRowId(rowId);
    if (!record || !oldPassword) return showToast("수정할 비밀번호를 선택해주세요.");
    if (!newPassword) {
        showToast("수정할 비밀번호를 입력해주세요.");
        elements.editPwdValue.focus();
        return;
    }
    if (normalizePasswordForCompare(oldPassword) === normalizePasswordForCompare(newPassword)) return showToast("변경된 내용이 없습니다.");
    const duplicateExists = splitPasswords(record.password).some(password =>
        normalizePasswordForCompare(password) !== normalizePasswordForCompare(oldPassword) &&
        normalizePasswordForCompare(password) === normalizePasswordForCompare(newPassword)
    );
    if (duplicateExists) return showToast("이미 등록된 비밀번호입니다.");
    enqueuePendingOperation("updatePassword", { rowId, oldPassword, newPassword });
    record.password = sortPasswords(splitPasswords(record.password).map(password =>
        normalizePasswordForCompare(password) === normalizePasswordForCompare(oldPassword) ? newPassword : password
    )).join(" / ");
    saveRecordsToCache(state.records);
    closeDeletePwdModal();
    refreshPasswordCard(rowId);
}
function confirmDeleteSelectedPassword() {
    const rowId = cleanText(elements.deletePwdRowId.value);
    const password = cleanText(elements.selectedPwdOriginal.value);
    const record = findRecordByRowId(rowId);
    if (!record || !password) return showToast("삭제할 비밀번호를 선택해주세요.");
    if (!window.confirm(`"${password}" 비밀번호를 삭제할까요?`)) return;
    enqueuePendingOperation("deletePassword", { rowId, password });
    record.password = sortPasswords(splitPasswords(record.password)
        .filter(item => normalizePasswordForCompare(item) !== normalizePasswordForCompare(password)))
        .join(" / ");
    saveRecordsToCache(state.records);
    closeDeletePwdModal();
    refreshPasswordCard(rowId);
}
function findRecordByRowId(rowId) { return state.indexes.rowById.get(cleanText(rowId)) || null; }
function createRecordInfoText(record) { return [record.region, record.apartment, formatDongLabel(normalizeDongValue(record.dong)), formatLineLabel(record.line)].filter(Boolean).join(" · "); }
function normalizePasswordForCompare(value) { return cleanText(value).replace(/\s+/gu, "").toLowerCase(); }
function sortPasswords(values) {
    const uniqueValues = [];
    const used = new Set();
    for (const value of Array.isArray(values) ? values : []) {
        const text = cleanText(value);
        const key = normalizePasswordForCompare(text);
        if (!text || used.has(key)) continue;
        used.add(key);
        uniqueValues.push(text);
    }
    return sortPasswordEntriesByPriority(uniqueValues);
}
function sortPasswordEntriesByPriority(values) {
    return (Array.isArray(values) ? values : [])
        .map((value, originalIndex) => analyzePasswordSortEntry(value, originalIndex))
        .sort(comparePasswordSortEntries)
        .map(entry => entry.value);
}
const EASY_PASSWORD_SPECIAL_NUMBERS = Object.freeze({
    "1004": true,
    "2580": true,
    "7942": true,
    "8282": true,
    "2424": true
});
const PASSWORD_SORT_PRIORITY = Object.freeze({
    SHORT: 1,
    SAME_DIGIT: 2,
    REPEATED_BLOCK: 3,
    REPEATED_PAIRS: 4,
    ASCENDING_SEQUENCE: 5,
    DESCENDING_SEQUENCE: 6,
    PALINDROME: 7,
    SAME_AS_ROOM: 8,
    SPECIAL: 9,
    GENERAL: 10,
    UNRECOGNIZED: 11
});
function analyzePasswordSortEntry(value, originalIndex) {
    const text = cleanText(value);
    const matches = text.match(/\d+/gu) || [];
    if (matches.length !== 2) {
        return {
            value: text,
            priority: PASSWORD_SORT_PRIORITY.UNRECOGNIZED,
            roomNumber: Number.POSITIVE_INFINITY,
            originalIndex,
            easyReason: "형식 인식 불가"
        };
    }
    const roomText = matches[0];
    const passwordText = matches[1];
    const roomNumber = Number(roomText);
    const analysis = analyzeEasyPassword(roomText, passwordText);
    return {
        value: text,
        priority: analysis.priority,
        roomNumber: Number.isFinite(roomNumber) ? roomNumber : Number.POSITIVE_INFINITY,
        originalIndex,
        easyReason: analysis.reason
    };
}
function analyzeEasyPassword(roomTextValue, passwordTextValue) {
    const roomText = cleanText(roomTextValue);
    const passwordText = cleanText(passwordTextValue);
    if (!passwordText) return { easy: false, priority: PASSWORD_SORT_PRIORITY.GENERAL, reason: "" };
    const normalizedRoom = normalizeNumericText(roomText);
    const normalizedPassword = normalizeNumericText(passwordText);

    // 한 번호가 여러 조건에 해당하면 아래에서 먼저 일치한 가장 높은 순위를 적용합니다.
    if (passwordText.length <= 3) return { easy: true, priority: PASSWORD_SORT_PRIORITY.SHORT, reason: "1순위 · 3자리 이하" };
    if (/^(\d)\1+$/u.test(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.SAME_DIGIT, reason: "2순위 · 같은 숫자 반복" };
    if (hasRepeatedDigitBlock(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.REPEATED_BLOCK, reason: "3순위 · 숫자 블록 반복" };
    if (hasRepeatedDigitPairs(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.REPEATED_PAIRS, reason: "4순위 · 숫자 쌍 반복" };
    if (isAscendingDigitPattern(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.ASCENDING_SEQUENCE, reason: "5순위 · 연속 숫자" };
    if (isDescendingDigitPattern(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.DESCENDING_SEQUENCE, reason: "6순위 · 역순 숫자" };
    if (isPalindromeDigitPattern(passwordText)) return { easy: true, priority: PASSWORD_SORT_PRIORITY.PALINDROME, reason: "7순위 · 앞뒤 대칭" };
    if (normalizedRoom === normalizedPassword) return { easy: true, priority: PASSWORD_SORT_PRIORITY.SAME_AS_ROOM, reason: "8순위 · 호수와 동일" };
    if (EASY_PASSWORD_SPECIAL_NUMBERS[passwordText]) return { easy: true, priority: PASSWORD_SORT_PRIORITY.SPECIAL, reason: "9순위 · 지정 쉬운 번호" };
    return { easy: false, priority: PASSWORD_SORT_PRIORITY.GENERAL, reason: "일반 번호" };
}
function hasRepeatedDigitBlock(value) {
    const text = cleanText(value);
    const length = text.length;
    if (length < 4) return false;
    // 한 자리 반복은 2순위에서 처리하므로 블록은 최소 2자리부터 검사합니다.
    for (let blockLength = 2; blockLength <= Math.floor(length / 2); blockLength += 1) {
        if (length % blockLength !== 0) continue;
        const repeatCount = length / blockLength;
        if (repeatCount < 2) continue;
        const block = text.slice(0, blockLength);
        if (block.repeat(repeatCount) === text) return true;
    }
    return false;
}
function hasRepeatedDigitPairs(value) {
    const text = cleanText(value);
    if (text.length < 4 || text.length % 2 !== 0) return false;
    for (let index = 0; index < text.length; index += 2) {
        if (text[index] !== text[index + 1]) return false;
    }
    return true;
}
function isAscendingDigitPattern(value) { return isDirectionalDigitPattern(value, 1); }
function isDescendingDigitPattern(value) { return isDirectionalDigitPattern(value, -1); }
function isDirectionalDigitPattern(value, direction) {
    const text = cleanText(value);
    if (text.length < 4) return false;
    const digits = text.split("").map(Number);
    for (let index = 1; index < digits.length; index += 1) {
        const expected = (digits[index - 1] + direction + 10) % 10;
        if (digits[index] !== expected) return false;
    }
    return true;
}
function isSequentialDigitPattern(value) {
    return isAscendingDigitPattern(value) || isDescendingDigitPattern(value);
}
function isPalindromeDigitPattern(value) {
    const text = cleanText(value);
    return text.length >= 4 && text === text.split("").reverse().join("");
}
function comparePasswordSortEntries(left, right) {
    if (left.priority !== right.priority) return left.priority - right.priority;
    if (left.roomNumber !== right.roomNumber) return left.roomNumber - right.roomNumber;
    return naturalCompare(left.value, right.value) || left.originalIndex - right.originalIndex;
}
function normalizeNumericText(value) {
    const normalized = cleanText(value).replace(/^0+(?=\d)/u, "");
    return normalized || "0";
}
/* ========================= GPS ========================= */
function initializeGpsEvents() {
    if (elements.gpsRefreshBtn) elements.gpsRefreshBtn.addEventListener("click", requestManualGpsRefresh);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleGpsResumeRefresh(); });
    window.addEventListener("pageshow", event => { if (event.persisted) scheduleGpsResumeRefresh(); });
    clearInterval(state.gpsMetaTimer);
    state.gpsMetaTimer = window.setInterval(renderGpsMeta, APP_CONFIG.GPS_META_REFRESH_INTERVAL);
    renderGpsMeta();
}
function syncGpsWatch() { if (state.gpsWatchId === null) startGps({ reason: "startup", useFastPosition: true }); }
function scheduleGpsResumeRefresh() {
    const now = Date.now();
    if (now - state.lastGpsResumeAt < 900) return;
    state.lastGpsResumeAt = now;
    clearTimeout(state.gpsResumeTimer);
    state.gpsResumeTimer = window.setTimeout(() => {
        state.gpsResumeTimer = null;
        startGps({ force: true, reason: "resume", useFastPosition: true });
    }, 120);
}
function restartGpsWatch() { scheduleGpsResumeRefresh(); }
function requestManualGpsRefresh() {
    if (state.gpsRefreshInProgress) return;
    state.gpsRefreshInProgress = true;
    state.gpsRefreshStartedAt = performance.now();
    updateGpsRefreshButton();
    clearTimeout(state.gpsRefreshUnlockTimer);
    state.gpsRefreshUnlockTimer = window.setTimeout(finishGpsRefresh, APP_CONFIG.GPS_REFRESH_TIMEOUT);
    updateGpsStatus("📡 GPS 갱신 중", "loading");
    startGps({ force: true, reason: "manual", useFastPosition: true });
}
function finishGpsRefresh() {
    if (!state.gpsRefreshInProgress) return;
    const elapsed = performance.now() - state.gpsRefreshStartedAt;
    const remaining = APP_CONFIG.GPS_REFRESH_MIN_DISPLAY - elapsed;
    if (remaining > 0) {
        clearTimeout(state.gpsRefreshUnlockTimer);
        state.gpsRefreshUnlockTimer = window.setTimeout(finishGpsRefresh, remaining);
        return;
    }
    clearTimeout(state.gpsRefreshUnlockTimer);
    state.gpsRefreshUnlockTimer = null;
    state.gpsRefreshInProgress = false;
    state.gpsRefreshStartedAt = 0;
    updateGpsRefreshButton();
}
function updateGpsRefreshButton() {
    if (!elements.gpsRefreshBtn) return;
    elements.gpsRefreshBtn.disabled = state.gpsRefreshInProgress;
    elements.gpsRefreshBtn.classList.toggle("loading", state.gpsRefreshInProgress);
    elements.gpsRefreshBtn.textContent = state.gpsRefreshInProgress ? "🔄 GPS 갱신 중…" : "🔄 GPS 갱신";
    elements.gpsRefreshBtn.setAttribute("aria-busy", state.gpsRefreshInProgress ? "true" : "false");
}
function startGps(options = {}) {
    const force = options.force === true;
    const useFastPosition = options.useFastPosition !== false;
    if (!state.currentLocation && loadLastLocation()) {
        updateGpsStatus("🟡 최근 위치", "cached");
        renderGpsMeta();
        renderGpsButtons();
    }
    if (!("geolocation" in navigator)) {
        updateGpsStatus("🔴 GPS 미지원", "error");
        renderGpsButtons();
        finishGpsRefresh();
        return;
    }
    if (force) stopGpsWatch();
    if (state.gpsWatchId !== null) return;
    const generation = ++state.gpsRequestGeneration;
    updateGpsStatus(state.currentLocation ? "🟡 위치 갱신 중" : "📡 위치 확인 중", "loading");
    if (useFastPosition) {
        navigator.geolocation.getCurrentPosition(
            position => handleGpsSuccess(position, { generation, source: "fast" }),
            error => handleGpsFastError(error, generation),
            { enableHighAccuracy: false, timeout: APP_CONFIG.GPS_FAST_TIMEOUT, maximumAge: APP_CONFIG.GPS_FAST_MAX_AGE }
        );
    }
    navigator.geolocation.getCurrentPosition(
        position => handleGpsSuccess(position, { generation, source: "high" }),
        error => handleGpsInitialError(error, generation),
        { enableHighAccuracy: true, timeout: APP_CONFIG.GPS_HIGH_TIMEOUT, maximumAge: 30 * 1000 }
    );
    state.gpsWatchId = navigator.geolocation.watchPosition(
        position => handleGpsSuccess(position, { generation, source: "watch" }),
        error => handleGpsWatchError(error, generation),
        { enableHighAccuracy: true, timeout: APP_CONFIG.GPS_HIGH_TIMEOUT, maximumAge: 3000 }
    );
}
function stopGpsWatch() {
    state.gpsRequestGeneration += 1;
    if (state.gpsWatchId !== null && "geolocation" in navigator) navigator.geolocation.clearWatch(state.gpsWatchId);
    state.gpsWatchId = null;
    clearTimeout(state.gpsStopTimer);
    state.gpsStopTimer = null;
}
function handleGpsSuccess(position, context = {}) {
    if (!position?.coords || context.generation !== state.gpsRequestGeneration) return;
    const latitude = Number(position.coords.latitude);
    const longitude = Number(position.coords.longitude);
    const accuracy = Number(position.coords.accuracy);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (!state.firstDeviceGpsRecorded) {
        state.firstDeviceGpsRecorded = true;
        recordPerformanceMetric("firstGps", performance.now() - APP_BOOT_STARTED_AT);
    }
    if (!state.highAccuracyGpsRecorded && Number.isFinite(accuracy) && accuracy <= APP_CONFIG.GPS_HIGH_ACCURACY_TARGET) {
        state.highAccuracyGpsRecorded = true;
        recordPerformanceMetric("highAccuracyGps", performance.now() - APP_BOOT_STARTED_AT);
    }
    const newLocation = { latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null, timestamp: Number(position.timestamp) || Date.now(), source: context.source || "gps" };
    const locationAccepted = shouldUseNewLocation(state.currentLocation, newLocation);
    if (locationAccepted) {
        state.currentLocation = newLocation;
        saveLastLocation(newLocation);
        invalidateGpsCache();
        renderGpsButtons();
    }
    updateGpsAccuracyStatus(locationAccepted ? newLocation.accuracy : state.currentLocation?.accuracy);
    renderGpsMeta();
    if (state.gpsRefreshInProgress && (locationAccepted || context.source !== "fast")) finishGpsRefresh();
}
function shouldUseNewLocation(currentLocation, newLocation) {
    if (!currentLocation) return true;
    const currentTime = Number(currentLocation.timestamp) || 0;
    const newTime = Number(newLocation.timestamp) || Date.now();
    if (newTime + 2000 < currentTime) return false;
    const currentLatitude = Number(currentLocation.latitude);
    const currentLongitude = Number(currentLocation.longitude);
    const newLatitude = Number(newLocation.latitude);
    const newLongitude = Number(newLocation.longitude);
    if (!isValidCoordinate(currentLatitude, currentLongitude) || !isValidCoordinate(newLatitude, newLongitude)) return true;
    const movedDistance = calculateDistanceMeters(currentLatitude, currentLongitude, newLatitude, newLongitude);
    const currentAccuracy = Number(currentLocation.accuracy);
    const newAccuracy = Number(newLocation.accuracy);
    const currentIsRecent = Date.now() - currentTime < 2 * 60 * 1000;
    if (currentIsRecent && Number.isFinite(currentAccuracy) && Number.isFinite(newAccuracy) && newAccuracy > Math.max(100, currentAccuracy * 2) && movedDistance < 100) return false;
    if (movedDistance >= APP_CONFIG.GPS_RECALC_DISTANCE) return true;
    if (Number.isFinite(newAccuracy) && (!Number.isFinite(currentAccuracy) || newAccuracy + 10 < currentAccuracy)) return true;
    return newTime - currentTime >= 60 * 1000;
}
function handleGpsFastError(error, generation) { if (generation === state.gpsRequestGeneration) console.info("빠른 위치 수신 생략:", error?.message || error); }
function handleGpsInitialError(error, generation) {
    if (generation !== state.gpsRequestGeneration) return;
    console.warn("초기 GPS 수신 실패:", error);
    if (state.currentLocation) {
        updateGpsStatus("🟡 최근 위치", "cached");
        renderGpsButtons();
        renderGpsMeta();
        finishGpsRefresh();
        return;
    }
    updateGpsErrorStatus(error);
    finishGpsRefresh();
}
function handleGpsWatchError(error, generation) { if (generation !== state.gpsRequestGeneration) return; console.warn("GPS 감시 오류:", error); if (!state.currentLocation) updateGpsErrorStatus(error); }
function updateGpsErrorStatus(error) { const errorCode = Number(error?.code); if (errorCode === 1) updateGpsStatus("🔴 위치 권한 필요", "error"); else if (errorCode === 2) updateGpsStatus("🔴 위치 확인 불가", "error"); else if (errorCode === 3) updateGpsStatus("🟡 GPS 지연", "warning"); else updateGpsStatus("🔴 GPS 오류", "error"); renderGpsButtons(); renderGpsMeta(); }
function updateGpsAccuracyStatus(accuracy) { if (!Number.isFinite(accuracy)) updateGpsStatus("🟡 위치 확인됨", "warning"); else if (accuracy <= 30) updateGpsStatus("🟢 강함", "strong"); else if (accuracy <= 100) updateGpsStatus("🟡 보통", "medium"); else updateGpsStatus("🔴 약함", "weak"); }
function updateGpsStatus(text, status = "") { if (!elements.gpsStatusBadge || (elements.gpsStatusBadge.textContent === text && elements.gpsStatusBadge.dataset.status === status)) return; elements.gpsStatusBadge.textContent = text; elements.gpsStatusBadge.dataset.status = status; }
function loadLastLocation() {
    try {
        const saved = localStorage.getItem(APP_CONFIG.LAST_LOCATION_KEY);
        if (!saved) return false;
        const parsed = JSON.parse(saved);
        const latitude = Number(parsed.latitude);
        const longitude = Number(parsed.longitude);
        const timestamp = Number(parsed.timestamp);
        if (!isValidCoordinate(latitude, longitude) || !Number.isFinite(timestamp)) return false;
        if (Date.now() - timestamp > APP_CONFIG.LAST_LOCATION_MAX_AGE) {
            localStorage.removeItem(APP_CONFIG.LAST_LOCATION_KEY);
            return false;
        }
        const parsedAccuracy = Number(parsed.accuracy);
        state.currentLocation = { latitude, longitude, accuracy: Number.isFinite(parsedAccuracy) ? parsedAccuracy : null, timestamp, source: "stored" };
        return true;
    } catch (error) {
        console.error("최근 위치 읽기 실패:", error);
        localStorage.removeItem(APP_CONFIG.LAST_LOCATION_KEY);
        return false;
    }
}
function saveLastLocation(location) { try { localStorage.setItem(APP_CONFIG.LAST_LOCATION_KEY, JSON.stringify(location)); } catch (error) { console.error("최근 위치 저장 실패:", error); } }
function renderGpsMeta() {
    if (!elements.gpsLocationMeta) return;
    if (!state.currentLocation) {
        elements.gpsLocationMeta.textContent = "최근 위치 확인 중";
        elements.gpsLocationMeta.dataset.status = "loading";
        return;
    }
    const age = Math.max(0, Date.now() - (Number(state.currentLocation.timestamp) || Date.now()));
    const accuracy = Number(state.currentLocation.accuracy);
    const ageText = formatLocationAge(age);
    const accuracyText = Number.isFinite(accuracy) ? `오차 ${Math.round(accuracy)}m` : "오차 확인 중";
    elements.gpsLocationMeta.textContent = `최근 위치 ${ageText} · ${accuracyText}`;
    elements.gpsLocationMeta.dataset.status = age <= 60 * 1000 ? "fresh" : age <= 3 * 60 * 1000 ? "aging" : "stale";
}
function formatLocationAge(milliseconds) {
    if (milliseconds < 15000) return "방금";
    if (milliseconds < 60 * 1000) return `${Math.floor(milliseconds / 1000)}초 전`;
    if (milliseconds < 60 * 60 * 1000) return `${Math.floor(milliseconds / (60 * 1000))}분 전`;
    return `${Math.floor(milliseconds / (60 * 60 * 1000))}시간 전`;
}
function invalidateGpsCache() { state.gpsNearbyCache = []; state.gpsCacheLocation = null; state.gpsCacheGeneration = -1; }
function renderGpsButtons() {
    let placeholderText = "";
    let nearbyApartments = [];
    if (!state.currentLocation) placeholderText = "위치 확인 중";
    else if (state.records.length === 0) placeholderText = "데이터 확인 중";
    else if (!state.locationsLoaded) placeholderText = "좌표 확인 중";
    else if (state.locationsError || state.locationMap.size === 0) placeholderText = "좌표 오류";
    else {
        nearbyApartments = getNearbyApartments(state.currentLocation.latitude, state.currentLocation.longitude, APP_CONFIG.GPS_BUTTON_COUNT);
        if (nearbyApartments.length === 0) placeholderText = "이름 매칭 없음";
    }
    if (placeholderText) {
        if (state.gpsLastPlaceholder === placeholderText && state.gpsLastListSignature === "") return;
        state.gpsLastPlaceholder = placeholderText;
        state.gpsLastListSignature = "";
        state.gpsButtonItems = [];
        elements.gpsButtons.replaceChildren();
        for (let index = 0; index < APP_CONFIG.GPS_BUTTON_COUNT; index += 1) elements.gpsButtons.appendChild(createGpsPlaceholderButton(placeholderText));
        return;
    }
    const listSignature = nearbyApartments.map(item => [item.region, item.apartment, item.dong].join("|")).join("::");
    if (listSignature === state.gpsLastListSignature) {
        updateGpsButtonDistances(nearbyApartments);
        return;
    }
    state.gpsLastPlaceholder = "";
    state.gpsLastListSignature = listSignature;
    state.gpsButtonItems = nearbyApartments.slice();
    elements.gpsButtons.replaceChildren();
    for (const item of nearbyApartments) elements.gpsButtons.appendChild(createGpsPlaceButton(item));
    while (elements.gpsButtons.children.length < APP_CONFIG.GPS_BUTTON_COUNT) elements.gpsButtons.appendChild(createGpsPlaceholderButton(""));
}
function createGpsPlaceButton(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gps-btn";
    button.style.whiteSpace = "pre-line";
    updateGpsPlaceButton(button, item);
    button.addEventListener("click", () => openApartmentFromGps(item));
    return button;
}
function updateGpsPlaceButton(button, item) {
    const distanceText = formatDistance(item.distance);
    const nextText = `${item.displayName}\n${distanceText}`;
    if (button.textContent !== nextText) button.textContent = nextText;
    button.dataset.distance = String(Math.round(item.distance));
    button.title = item.isOffice ? `${item.region} · ${item.apartment} · ${item.dong} · ${distanceText}` : `${item.region} · ${item.apartment} · ${distanceText}`;
}
function updateGpsButtonDistances(items) {
    const buttons = [...elements.gpsButtons.querySelectorAll(".gps-btn:not(:disabled)")];
    items.forEach((item, index) => { if (buttons[index]) updateGpsPlaceButton(buttons[index], item); });
    state.gpsButtonItems = items.slice();
}
function renderGpsPlaceholderButtons(text = "위치 확인 중") {
    state.gpsLastListSignature = "";
    state.gpsLastPlaceholder = text;
    elements.gpsButtons.replaceChildren();
    for (let index = 0; index < APP_CONFIG.GPS_BUTTON_COUNT; index += 1) elements.gpsButtons.appendChild(createGpsPlaceholderButton(text));
}
function createGpsPlaceholderButton(text = "") { const button = document.createElement("button"); button.type = "button"; button.className = "gps-btn"; button.disabled = true; button.textContent = text; return button; }
function normalizeOfficeGpsAlias(value) { return normalizeGpsName(value) .toUpperCase() .replace(/[()（）\[\]{}·ㆍ_\-–—]/gu, "") .replace(/오피스텔|OFFICETEL/gu, "") .replace(/오피$/u, ""); }
function findLocationEntryForPlace(placeInfo) {
    const exactEntry = state.locationMap.get(placeInfo.exactName);
    if (exactEntry || !placeInfo.isOffice) return exactEntry || null;
    const targetAlias = normalizeOfficeGpsAlias(placeInfo.displayName);
    if (targetAlias.length < 2) return null;
    const matches = [];
    for (const [locationName, locationEntry] of state.locationMap.entries()) {
        const locationAlias = normalizeOfficeGpsAlias(locationName);
        if (!locationAlias) continue;
        const isSame = locationAlias === targetAlias;
        const isContained = targetAlias.length >= 4 && locationAlias.length >= 4 && (locationAlias.includes(targetAlias) || targetAlias.includes(locationAlias));
        if (isSame || isContained) matches.push(locationEntry);
        if (matches.length > 1) return null;
    }
    return matches[0] || null;
}
function getNearbyApartments(currentLatitude, currentLongitude, buttonCount = APP_CONFIG.GPS_BUTTON_COUNT) {
    const limit = Math.max(1, Number(buttonCount) || APP_CONFIG.GPS_BUTTON_COUNT);
    const currentPoint = {
        latitude: Number(currentLatitude), longitude: Number(currentLongitude)
    };
    const canReuse = state.gpsCacheLocation && state.gpsCacheGeneration === state.dataGeneration && state.gpsNearbyCache.length > 0 && calculateDistanceMeters( currentPoint.latitude, currentPoint.longitude, state.gpsCacheLocation.latitude, state.gpsCacheLocation.longitude ) < APP_CONFIG.GPS_RECALC_DISTANCE;
    if (canReuse) return state.gpsNearbyCache.slice(0, limit);
    const results = [];
    for (const placeInfo of state.indexes.gpsCandidates) {
        let shortestDistance = Infinity;
        for (const coordinate of placeInfo.coordinates) {
            const distance = calculateDistanceMeters( currentPoint.latitude, currentPoint.longitude, coordinate.latitude, coordinate.longitude );
            if (distance < shortestDistance) shortestDistance = distance;
        }
        if (!Number.isFinite(shortestDistance)) continue;
        results.push({ region: placeInfo.region, apartment: placeInfo.apartment, dong: placeInfo.dong, displayName: placeInfo.displayName, distance: shortestDistance, isOffice: placeInfo.isOffice });
    }
    results.sort((a, b) => a.distance - b.distance || naturalCompare(a.displayName, b.displayName));
    const selected = results.slice(0, limit);
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
    const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function degreesToRadians(degrees) { return degrees * (Math.PI / 180); }
function formatDistance(distance) { if (!Number.isFinite(distance)) return ""; if (distance < 1000) return `${Math.round(distance)}m`; return `${(distance / 1000).toFixed(2)}km`; }
/* ========================= 모달 ========================= */
function initializeModalEvents() {
    const modals = [elements.commonEditorModal, elements.addPwdModal, elements.deletePwdModal, elements.historyModal, elements.adminPinModal, elements.adminModal];
    for (const modal of modals) {
        modal.addEventListener("click", event => { if (event.target === modal) closeModalByElement(modal); });
    }
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeTopModal(); });
    elements.formCommonPwdValue.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitCommonPwdForm(); } });
    elements.addPwdValue.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitAddPwd(); } });
    elements.addPwdRoomValue.addEventListener("input", updateAddPasswordPreview);
    elements.addPwdCodeValue.addEventListener("input", updateAddPasswordPreview);
    elements.addPwdRoomValue.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); elements.addPwdCodeValue.focus(); } });
    elements.addPwdCodeValue.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitAddPwd(); } });
    elements.addPwdModeToggle.addEventListener("click", toggleAddPasswordMode);
    if (elements.editPwdValue) elements.editPwdValue.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitUpdatePassword(); } });
}
function openModal(modal) { if (!modal) return; modal.style.display = "flex"; document.body.style.overflow = "hidden"; }
function closeModal(modal) { if (!modal) return; modal.style.display = "none"; const anyModalOpen = [ elements.commonEditorModal, elements.addPwdModal, elements.deletePwdModal, elements.historyModal, elements.adminPinModal, elements.adminModal ].some(item => item.style.display === "flex"); if (!anyModalOpen) document.body.style.overflow = ""; }
function closeModalByElement(modal) { if (modal === elements.commonEditorModal) closeCommonModal(); else if (modal === elements.addPwdModal) closeAddPwdModal(); else if (modal === elements.deletePwdModal) closeDeletePwdModal(); else if (modal === elements.historyModal) closeChangeHistoryModal(); else if (modal === elements.adminPinModal) closeAdminPinModal(); else if (modal === elements.adminModal) closeAdminModal(); }
function closeTopModal() { const modals = [elements.adminModal, elements.adminPinModal, elements.historyModal, elements.deletePwdModal, elements.addPwdModal, elements.commonEditorModal]; const openedModal = modals.find(modal => modal.style.display === "flex"); if (openedModal) closeModalByElement(openedModal); }
/* ========================= 토스트 ========================= */
function showToast(message) { const text = cleanText(message); if (!text) return; clearTimeout(state.toastTimer); elements.toast.textContent = text; elements.toast.classList.add("show"); state.toastTimer = window.setTimeout(() => { elements.toast.classList.remove("show"); }, 2500); }
window.addEventListener("beforeunload", () => { clearTimeout(state.gpsRestartTimer); clearTimeout(state.gpsResumeTimer); clearTimeout(state.gpsRefreshUnlockTimer); clearInterval(state.gpsMetaTimer); flushRecordsCache(); savePerformanceSnapshot(); stopGpsWatch(); });
function scheduleAppUpdateReload() { state.appUpdatePending = true; clearTimeout(state.appUpdateTimer); state.appUpdateTimer = window.setTimeout(tryApplyAppUpdate, 700); }
function tryApplyAppUpdate() {
    if (!state.appUpdatePending) return;
    const modalOpen = [ elements.commonEditorModal, elements.addPwdModal, elements.deletePwdModal, elements.historyModal, elements.adminPinModal, elements.adminModal ].some(modal => modal?.style.display === "flex");
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
    let hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadServiceWorkerController) scheduleAppUpdateReload();
        hadServiceWorkerController = true;
    });
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
            await registration.update();
        } catch (error) {
            console.error("서비스워커 등록 실패:", error);
        }
    });
}

/* ========================= 최종 장기운영 + 관리자 통계 + 진단 보정 20260715-9 ========================= */
const LONGTERM_CONFIG = Object.freeze({
    CACHE_ENVELOPE_KEY: "gimpoB_records_envelope_v1",
    CACHE_BACKUP_KEY: "gimpoB_records_envelope_backup_v1",
    CACHE_TEMP_KEY: "gimpoB_records_envelope_temp_v1",
    CACHE_SCHEMA_VERSION: 1,
    ERROR_LOG_KEY: "gimpoB_error_log_v1",
    ERROR_LOG_LIMIT: 20,
    ERROR_DEDUPE_MS: 5 * 60 * 1000,
    SAFE_MODE_KEY: "gimpoB_safe_mode_v1",
    BOOT_FAILURE_KEY: "gimpoB_boot_failure_v1",
    REQUEST_TIMEOUT: 20000,
    GPS_JUMP_MAX_SPEED_MPS: 80,
    GPS_JUMP_MIN_DISTANCE: 300,
    GPS_RANK_HYSTERESIS_METERS: 10,
    INTEGRITY_INTERVAL: 5 * 60 * 1000,
    DATA_INTEGRITY_INTERVAL: 24 * 60 * 60 * 1000,
    DATA_INTEGRITY_RETRY_DELAY: 60 * 1000,
    DATA_INTEGRITY_TIME_KEY: "gimpoB_data_integrity_time_v1",
    DATA_INTEGRITY_STATUS_KEY: "gimpoB_data_integrity_status_v1",
    UNDO_VISIBLE_MS: 10000
});

const longtermState = {
    inFlightRequests: new Map(),
    requestSequence: new Map(),
    lastUndo: null,
    undoTimer: null,
    backupToRestore: null,
    lastStableGpsItems: [],
    lastIntegrityAt: 0,
    dataIntegrityTimer: null,
    dataIntegrityRunning: false,
    dataIntegrityPromise: null,
    safeMode: false,
    diagnosticsLastAt: 0,
    diagnosticsRefreshing: false,
    diagnosticRepairing: ""
};

function fnv1aHash(text) {
    let hash = 0x811c9dc5;
    const value = String(text || "");
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        pruneNonessentialStorage();
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (retryError) {
            logLocalError("storage-write", retryError, { key });
            return false;
        }
    }
}

function pruneNonessentialStorage() {
    try {
        localStorage.removeItem(APP_CONFIG.PERFORMANCE_HISTORY_KEY);
        localStorage.removeItem(APP_CONFIG.HISTORY_CACHE_KEY);
        localStorage.removeItem(APP_CONFIG.HISTORY_CACHE_TIME_KEY);
        const logs = loadLocalErrorLogs().slice(0, 5);
        localStorage.setItem(LONGTERM_CONFIG.ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (error) {}
}

function makeRecordsEnvelope(records) {
    const normalized = normalizeRecordCollection(Array.isArray(records) ? records : []);
    const serializedData = JSON.stringify(normalized);
    return {
        schemaVersion: LONGTERM_CONFIG.CACHE_SCHEMA_VERSION,
        savedAt: Date.now(),
        dataVersion: cleanText(state.dataVersion),
        rowCount: normalized.length,
        checksum: fnv1aHash(serializedData),
        data: normalized
    };
}

function validateRecordsEnvelope(envelope) {
    if (!envelope || typeof envelope !== "object") return null;
    if (Number(envelope.schemaVersion) !== LONGTERM_CONFIG.CACHE_SCHEMA_VERSION) return null;
    if (!Array.isArray(envelope.data) || Number(envelope.rowCount) !== envelope.data.length) return null;
    const normalized = normalizeRecordCollection(envelope.data);
    const checksum = fnv1aHash(JSON.stringify(normalized));
    if (checksum !== cleanText(envelope.checksum)) return null;
    return { ...envelope, data: normalized };
}

function readEnvelopeFromStorage(key) {
    try {
        const text = localStorage.getItem(key);
        if (!text) return null;
        return validateRecordsEnvelope(JSON.parse(text));
    } catch (error) {
        logLocalError("cache-read", error, { key });
        return null;
    }
}

const originalLoadCachedRecordsLongterm = loadCachedRecords;
loadCachedRecords = function loadCachedRecordsLongterm() {
    const primary = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    const backup = primary ? null : readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_BACKUP_KEY);
    const envelope = primary || backup;
    if (envelope) {
        state.dataVersion = cleanText(envelope.dataVersion) || cleanText(localStorage.getItem(APP_CONFIG.CACHE_VERSION_KEY));
        if (!primary && backup) safeStorageSet(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY, JSON.stringify(backup));
        /* 장기 저장은 검증된 주 캐시와 이전 정상 백업, 두 벌만 유지합니다. */
        localStorage.removeItem(LONGTERM_CONFIG.CACHE_TEMP_KEY);
        localStorage.removeItem(APP_CONFIG.CACHE_KEY);
        return envelope.data;
    }
    const legacy = originalLoadCachedRecordsLongterm();
    if (legacy.length > 0) {
        const migrated = makeRecordsEnvelope(legacy);
        if (safeStorageSet(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY, JSON.stringify(migrated))) {
            localStorage.removeItem(APP_CONFIG.CACHE_KEY);
        }
    }
    return legacy;
};

flushRecordsCache = function flushRecordsCacheLongterm() {
    clearTimeout(state.cacheWriteTimer);
    state.cacheWriteTimer = null;
    if (!state.cacheWritePending || !Array.isArray(state.records)) return;
    const envelope = makeRecordsEnvelope(state.records);
    const text = JSON.stringify(envelope);
    const currentEnvelope = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    const current = currentEnvelope ? JSON.stringify(currentEnvelope) : "";
    const verified = validateRecordsEnvelope(envelope);
    if (!verified) {
        logLocalError("cache-verify", new Error("새 캐시 메모리 검증 실패"));
        return;
    }
    /* localStorage.setItem은 동기식 원자 저장이므로 임시 전체 복제본 없이 두 벌만 유지합니다. */
    if (current && !safeStorageSet(LONGTERM_CONFIG.CACHE_BACKUP_KEY, current)) return;
    if (!safeStorageSet(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY, text)) return;
    localStorage.removeItem(LONGTERM_CONFIG.CACHE_TEMP_KEY);
    /* 구버전 전체 데이터 캐시는 제거해 영구 복제본을 두 벌로 제한합니다. */
    localStorage.removeItem(APP_CONFIG.CACHE_KEY);
    safeStorageSet(APP_CONFIG.CACHE_TIME_KEY, String(envelope.savedAt));
    if (state.dataVersion) safeStorageSet(APP_CONFIG.CACHE_VERSION_KEY, state.dataVersion);
    state.cacheWritePending = false;
};

function logLocalError(type, error, context = {}) {
    try {
        const now = Date.now();
        const normalizedType = cleanText(type) || "unknown";
        const message = cleanText(error?.message || error) || "알 수 없는 오류";
        const action = cleanText(context?.action);
        const logs = loadLocalErrorLogs();
        const duplicate = logs.some(item =>
            now - Number(item?.at) < LONGTERM_CONFIG.ERROR_DEDUPE_MS &&
            cleanText(item?.type) === normalizedType &&
            cleanText(item?.message) === message &&
            cleanText(item?.context?.action) === action
        );
        if (duplicate) return;
        const item = {
            at: now,
            type: normalizedType,
            message,
            view: cleanText(state?.view),
            online: navigator.onLine !== false,
            dataVersion: cleanText(state?.dataVersion),
            context
        };
        logs.unshift(item);
        localStorage.setItem(LONGTERM_CONFIG.ERROR_LOG_KEY, JSON.stringify(logs.slice(0, LONGTERM_CONFIG.ERROR_LOG_LIMIT)));
    } catch (storageError) {}
}

function isTransientNetworkErrorMessage(value) {
    const message = cleanText(value).toLowerCase();
    return message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("load failed") ||
        message.includes("서버 응답 시간이 초과") ||
        message.includes("the internet connection appears to be offline");
}

function clearResolvedTransientNetworkErrors() {
    try {
        const logs = loadLocalErrorLogs();
        const remaining = logs.filter(item => {
            const type = cleanText(item?.type);
            return !(type === "network" || type === "data-integrity-check") || !isTransientNetworkErrorMessage(item?.message);
        });
        if (remaining.length === logs.length) return;
        localStorage.setItem(LONGTERM_CONFIG.ERROR_LOG_KEY, JSON.stringify(remaining.slice(0, LONGTERM_CONFIG.ERROR_LOG_LIMIT)));
    } catch (error) {}
}

function loadLocalErrorLogs() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LONGTERM_CONFIG.ERROR_LOG_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

window.addEventListener("error", event => logLocalError("javascript", event.error || event.message, { source: event.filename, line: event.lineno }));
// Promise 오류는 아래 사용자 오류 분류 리스너 한 곳에서만 기록합니다.

const originalRequestApiLongterm = requestApi;
requestApi = function requestApiLongterm(action, payload = {}) {
    const readOnly = ["getData", "getDataVersion", "getDataIntegrity", "getChangeHistory", "getAdminDashboard", "compareBackup"].includes(action);
    const requestKey = readOnly ? `${action}:${JSON.stringify(payload || {})}` : "";
    if (readOnly && longtermState.inFlightRequests.has(requestKey)) return longtermState.inFlightRequests.get(requestKey);
    const sequence = (longtermState.requestSequence.get(action) || 0) + 1;
    longtermState.requestSequence.set(action, sequence);
    const controller = readOnly && typeof AbortController === "function" ? new AbortController() : null;
    let timeoutId = null;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => {
            if (controller) controller.abort();
            reject(new Error("서버 응답 시간이 초과되었습니다."));
        }, LONGTERM_CONFIG.REQUEST_TIMEOUT);
    });
    const promise = Promise.race([originalRequestApiLongterm(action, payload, { signal: controller?.signal }), timeoutPromise])
        .then(result => {
            if (readOnly && sequence < (longtermState.requestSequence.get(action) || 0)) {
                const staleError = new Error("더 최신 요청이 완료되어 오래된 응답을 무시했습니다.");
                staleError.staleResponse = true;
                throw staleError;
            }
            return result;
        })
        .catch(error => {
            const normalizedError = error?.name === "AbortError" ? new Error("서버 응답 시간이 초과되었습니다.") : error;
            if (!normalizedError?.staleResponse && shouldRecordApiTransportError(normalizedError)) {
                logLocalError("network", normalizedError, { action });
            }
            throw normalizedError;
        })
        .finally(() => {
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            if (readOnly && longtermState.inFlightRequests.get(requestKey) === promise) longtermState.inFlightRequests.delete(requestKey);
        });
    if (readOnly) longtermState.inFlightRequests.set(requestKey, promise);
    return promise;
};

const originalShouldUseNewLocationLongterm = shouldUseNewLocation;
shouldUseNewLocation = function shouldUseNewLocationLongterm(currentLocation, newLocation) {
    if (currentLocation && newLocation) {
        const elapsedSeconds = Math.max(0.1, (Number(newLocation.timestamp) - Number(currentLocation.timestamp)) / 1000);
        const distance = calculateDistanceMeters(Number(currentLocation.latitude), Number(currentLocation.longitude), Number(newLocation.latitude), Number(newLocation.longitude));
        const speed = distance / elapsedSeconds;
        const newAccuracy = Number(newLocation.accuracy);
        if (distance >= LONGTERM_CONFIG.GPS_JUMP_MIN_DISTANCE && speed > LONGTERM_CONFIG.GPS_JUMP_MAX_SPEED_MPS && (!Number.isFinite(newAccuracy) || newAccuracy > 15)) {
            logLocalError("gps-jump", new Error("비정상 위치 점프 차단"), { distance: Math.round(distance), speed: Math.round(speed) });
            return false;
        }
    }
    return originalShouldUseNewLocationLongterm(currentLocation, newLocation);
};

const originalGetNearbyApartmentsLongterm = getNearbyApartments;
getNearbyApartments = function getNearbyApartmentsLongterm(latitude, longitude, buttonCount = APP_CONFIG.GPS_BUTTON_COUNT) {
    const requestedCount = Math.max(1, Number(buttonCount) || APP_CONFIG.GPS_BUTTON_COUNT);
    const candidateCount = Math.max(requestedCount + 4, 8);
    const next = originalGetNearbyApartmentsLongterm(latitude, longitude, candidateCount);
    const previous = longtermState.lastStableGpsItems;
    if (!Array.isArray(previous) || previous.length === 0 || !Array.isArray(next) || next.length === 0) {
        const initial = Array.isArray(next) ? next.slice(0, requestedCount) : [];
        longtermState.lastStableGpsItems = initial.map(item => ({ ...item }));
        return initial;
    }
    const nextMap = new Map(next.map(item => [makeGpsItemIdentity(item), item]));
    const stable = [];
    for (const oldItem of previous) {
        const identity = makeGpsItemIdentity(oldItem);
        const current = nextMap.get(identity);
        if (current) {
            stable.push(current);
            nextMap.delete(identity);
        }
    }
    /* 새 후보는 먼저 뒤에 넣고, 실제 거리 차이가 10m 이상일 때만 앞으로 이동합니다. */
    stable.push(...[...nextMap.values()].sort((a, b) => a.distance - b.distance || naturalCompare(a.displayName, b.displayName)));
    const threshold = LONGTERM_CONFIG.GPS_RANK_HYSTERESIS_METERS;
    let changed = true;
    while (changed) {
        changed = false;
        for (let index = 0; index < stable.length - 1; index += 1) {
            const current = stable[index];
            const following = stable[index + 1];
            if (following.distance + threshold <= current.distance) {
                stable[index] = following;
                stable[index + 1] = current;
                changed = true;
            }
        }
    }
    const result = stable.slice(0, requestedCount);
    longtermState.lastStableGpsItems = result.map(item => ({ ...item }));
    return result;
};

function makeGpsItemIdentity(item) {
    return makeKey(item?.region, item?.apartment, item?.dong, item?.displayName);
}

const originalRebuildDataIndexesLongterm = rebuildDataIndexes;
rebuildDataIndexes = function rebuildDataIndexesLongterm() {
    originalRebuildDataIndexesLongterm();
    verifyIndexIntegrity();
};

function verifyIndexIntegrity(force = false) {
    if (!force && Date.now() - longtermState.lastIntegrityAt < LONGTERM_CONFIG.INTEGRITY_INTERVAL) return true;
    longtermState.lastIntegrityAt = Date.now();
    const indexedIds = new Set(state.indexes.rowById.keys());
    const recordIds = state.records.map(record => cleanText(record.rowId)).filter(Boolean);
    const uniqueIds = new Set(recordIds);
    const valid = indexedIds.size === uniqueIds.size && recordIds.length === uniqueIds.size && recordIds.every(id => indexedIds.has(id));
    if (!valid) {
        logLocalError("index-integrity", new Error("탐색 인덱스 불일치"), { records: recordIds.length, indexed: indexedIds.size });
        return false;
    }
    return true;
}

function initializeDailyDataIntegrityValidation() {
    window.addEventListener("online", () => scheduleDailyDataIntegrityValidation(1500));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleDailyDataIntegrityValidation(1800); });
    scheduleDailyDataIntegrityValidation(3500);
}

function scheduleDailyDataIntegrityValidation(delay = 0) {
    clearTimeout(longtermState.dataIntegrityTimer);
    const lastCheckedAt = Number(localStorage.getItem(LONGTERM_CONFIG.DATA_INTEGRITY_TIME_KEY)) || 0;
    if (Date.now() - lastCheckedAt < LONGTERM_CONFIG.DATA_INTEGRITY_INTERVAL) return;
    longtermState.dataIntegrityTimer = window.setTimeout(runDailyDataIntegrityValidation, Math.max(0, Number(delay) || 0));
}

async function runDailyDataIntegrityValidation(force = false) {
    longtermState.dataIntegrityTimer = null;
    const lastCheckedAt = Number(localStorage.getItem(LONGTERM_CONFIG.DATA_INTEGRITY_TIME_KEY)) || 0;
    if (!force && Date.now() - lastCheckedAt < LONGTERM_CONFIG.DATA_INTEGRITY_INTERVAL) {
        return { success: true, skipped: true, reason: "recent" };
    }
    if (longtermState.dataIntegrityRunning) {
        return longtermState.dataIntegrityPromise || { success: false, skipped: true, reason: "running" };
    }
    if (navigator.onLine === false || state.networkLoading || state.syncProcessing || state.pendingOperations.length > 0 || !state.records.length) {
        if (!force) scheduleDailyDataIntegrityValidation(LONGTERM_CONFIG.DATA_INTEGRITY_RETRY_DELAY);
        return { success: false, skipped: true, reason: navigator.onLine === false ? "offline" : "busy" };
    }

    longtermState.dataIntegrityRunning = true;
    const task = (async () => {
        try {
            flushRecordsCache();
            const response = await requestApi("getDataIntegrity");
            const serverInfo = response?.data && typeof response.data === "object" ? response.data : response;
            if (serverInfo?.stable === false) throw new Error("서버 데이터가 변경 중이어서 무결성 검사를 잠시 연기합니다.");
            const localInfo = calculateLocalDataIntegrity(state.records);
            const matches = Number(serverInfo?.rowCount) === localInfo.rowCount && cleanText(serverInfo?.checksum) === localInfo.checksum;
            if (matches) {
                const previousVersion = state.dataVersion;
                updateLocalDataVersion(serverInfo);
                if (state.dataVersion && state.dataVersion !== previousVersion) saveRecordsToCache(state.records);
                saveDataIntegrityResult("ok", serverInfo, localInfo, "서버 원본과 로컬 데이터가 일치합니다.");
                return { success: true, status: "ok" };
            }
            logLocalError("data-integrity", new Error("서버와 로컬 데이터 불일치 감지"), { server: serverInfo, local: localInfo });
            await refreshRecordsFromServer(true);
            const verifyResponse = await requestApi("getDataIntegrity");
            const recoveryServerInfo = verifyResponse?.data && typeof verifyResponse.data === "object" ? verifyResponse.data : verifyResponse;
            if (recoveryServerInfo?.stable === false) throw new Error("복구 확인 중 서버 데이터가 다시 변경되어 검사를 잠시 연기합니다.");
            const recoveredInfo = calculateLocalDataIntegrity(state.records);
            const recovered = Number(recoveryServerInfo?.rowCount) === recoveredInfo.rowCount && cleanText(recoveryServerInfo?.checksum) === recoveredInfo.checksum;
            if (recovered) {
                updateLocalDataVersion(recoveryServerInfo);
                saveDataIntegrityResult("recovered", recoveryServerInfo, recoveredInfo, "데이터 불일치를 감지해 전체 데이터를 자동 복구했습니다.");
                showToast("✅ 데이터 불일치를 자동 복구했습니다.");
                return { success: true, status: "recovered" };
            }
            saveDataIntegrityResult("failed", recoveryServerInfo, recoveredInfo, "전체 재동기화 후에도 무결성 확인이 필요합니다.", false);
            logLocalError("data-integrity-recovery", new Error("자동 복구 후 무결성 불일치"), { server: recoveryServerInfo, local: recoveredInfo });
            if (!force) scheduleDailyDataIntegrityValidation(LONGTERM_CONFIG.DATA_INTEGRITY_RETRY_DELAY);
            return { success: false, status: "failed" };
        } catch (error) {
            /* 네트워크 계층에서 이미 기록한 일시적 통신 오류는 여기서 중복 기록하지 않습니다. */
            if (!isTransientNetworkErrorMessage(error?.message || error)) logLocalError("data-integrity-check", error);
            if (!force) scheduleDailyDataIntegrityValidation(LONGTERM_CONFIG.DATA_INTEGRITY_RETRY_DELAY);
            return { success: false, status: "error", error };
        } finally {
            longtermState.dataIntegrityRunning = false;
            longtermState.dataIntegrityPromise = null;
        }
    })();
    longtermState.dataIntegrityPromise = task;
    return task;
}

function calculateLocalDataIntegrity(records) {
    const normalized = normalizeRecordCollection(Array.isArray(records) ? records : []);
    return { rowCount: normalized.length, checksum: fnv1aHash(JSON.stringify(normalized)) };
}

function saveDataIntegrityResult(status, serverInfo, localInfo, message, markChecked = true) {
    const checkedAt = Date.now();
    const result = { status, checkedAt, message, serverRowCount: Number(serverInfo?.rowCount) || 0, localRowCount: Number(localInfo?.rowCount) || 0, checksum: cleanText(serverInfo?.checksum) };
    safeStorageSet(LONGTERM_CONFIG.DATA_INTEGRITY_STATUS_KEY, JSON.stringify(result));
    if (markChecked) safeStorageSet(LONGTERM_CONFIG.DATA_INTEGRITY_TIME_KEY, String(checkedAt));
}

function loadDataIntegrityResult() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LONGTERM_CONFIG.DATA_INTEGRITY_STATUS_KEY) || "null");
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

const originalEnqueuePendingOperationLongterm = enqueuePendingOperation;
enqueuePendingOperation = function enqueuePendingOperationLongterm(action, payload) {
    const safePayload = payload && typeof payload === "object" ? { ...payload } : {};
    let record = safePayload.rowId ? findRecordByRowId(safePayload.rowId) : null;
    if (!record && safePayload.region && safePayload.apartment) {
        record = (state.indexes.recordsByApartment.get(makeKey(safePayload.region, safePayload.apartment)) || [])[0] || null;
    }
    const snapshot = {
        action,
        rowId: cleanText(safePayload.rowId),
        region: cleanText(safePayload.region),
        apartment: cleanText(safePayload.apartment),
        beforePassword: record ? cleanText(record.password) : "",
        beforeCommonPassword: record ? cleanText(record.commonPassword) : "",
        createdAt: Date.now()
    };
    if (record && ["addPassword", "updatePassword", "deletePassword"].includes(action)) safePayload.expectedPassword = cleanText(record.password);
    const operation = originalEnqueuePendingOperationLongterm(action, safePayload);
    longtermState.lastUndo = { operationId: operation.id, snapshot, historyId: "", synced: false };
    clearTimeout(longtermState.undoTimer);
    window.setTimeout(() => showToastAction("변경 내용을 저장합니다.", "되돌리기", undoLastImmediateChange), 0);
    longtermState.undoTimer = window.setTimeout(clearImmediateUndo, LONGTERM_CONFIG.UNDO_VISIBLE_MS);
    return operation;
};

const originalApplyServerOperationResponseLongterm = applyServerOperationResponse;
applyServerOperationResponse = function applyServerOperationResponseLongterm(operation, response) {
    originalApplyServerOperationResponseLongterm(operation, response);
    if (longtermState.lastUndo?.operationId === operation?.id) {
        longtermState.lastUndo.synced = true;
        longtermState.lastUndo.historyId = cleanText(response?.historyId);
    }
};

function clearImmediateUndo() {
    clearTimeout(longtermState.undoTimer);
    longtermState.undoTimer = null;
    longtermState.lastUndo = null;
    hideToastAction();
}

async function undoLastImmediateChange() {
    const candidate = longtermState.lastUndo;
    if (!candidate) return;
    const queueIndex = state.pendingOperations.findIndex(item => item.id === candidate.operationId);
    if (queueIndex >= 0 && !(state.syncProcessing && queueIndex === 0)) {
        state.pendingOperations.splice(queueIndex, 1);
        savePendingOperations();
        restoreLocalOperationSnapshot(candidate.snapshot);
        clearImmediateUndo();
        showToast("↩ 변경을 취소했습니다.");
        return;
    }
    if (candidate.historyId) {
        try {
            const response = await requestApi("undoChange", { historyId: candidate.historyId, operationId: createOperationId() });
            updateLocalDataVersion(response);
            await refreshRecordsFromServer(true);
            clearChangeHistoryCache();
            clearImmediateUndo();
            showToast("↩ 서버 변경을 되돌렸습니다.");
        } catch (error) {
            showToast(`되돌리기 실패: ${error.message}`);
        }
        return;
    }
    showToast("저장 완료 직후 다시 되돌려주세요.");
}

function restoreLocalOperationSnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.rowId) {
        const record = findRecordByRowId(snapshot.rowId);
        if (record) {
            record.password = cleanText(snapshot.beforePassword);
            record.commonPassword = cleanText(snapshot.beforeCommonPassword);
            refreshPasswordCard(snapshot.rowId);
        }
    } else if (snapshot.region && snapshot.apartment) {
        for (const record of state.indexes.recordsByApartment.get(makeKey(snapshot.region, snapshot.apartment)) || []) record.commonPassword = cleanText(snapshot.beforeCommonPassword);
        renderCommonPassword();
    }
    saveRecordsToCache(state.records);
}

const originalShowToastLongterm = showToast;
showToast = function showToastLongterm(message) {
    hideToastAction();
    const messageTarget = document.getElementById("toastMessage");
    if (!messageTarget) return originalShowToastLongterm(message);
    const text = cleanText(message);
    if (!text) return;
    clearTimeout(state.toastTimer);
    messageTarget.textContent = text;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2500);
};

function showToastAction(message, actionLabel, handler) {
    const messageTarget = document.getElementById("toastMessage");
    const actionButton = document.getElementById("toastActionBtn");
    if (!messageTarget || !actionButton) return showToast(message);
    clearTimeout(state.toastTimer);
    messageTarget.textContent = cleanText(message);
    actionButton.textContent = cleanText(actionLabel);
    actionButton.hidden = false;
    actionButton.onclick = handler;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("show");
        hideToastAction();
    }, LONGTERM_CONFIG.UNDO_VISIBLE_MS);
}

function hideToastAction() {
    const actionButton = document.getElementById("toastActionBtn");
    if (actionButton) {
        actionButton.hidden = true;
        actionButton.onclick = null;
        actionButton.textContent = "";
    }
}

function initializeBackupCompareUi() {
    document.getElementById("backupCompareCancelBtn")?.addEventListener("click", closeBackupCompareModal);
    document.getElementById("backupCompareRestoreBtn")?.addEventListener("click", confirmComparedBackupRestore);
    document.getElementById("backupCompareModal")?.addEventListener("click", event => {
        if (event.target?.id === "backupCompareModal") closeBackupCompareModal();
    });
}

const originalRestoreDataBackupLongterm = restoreDataBackup;
restoreDataBackup = async function restoreDataBackupWithCompare(backup) {
    if (!backup?.name || state.restoringBackupName || state.backupCreating) return;
    if (state.pendingOperations.length > 0) {
        window.alert("아직 저장 대기 중인 작업이 있습니다. 저장 완료 후 다시 복구해주세요.");
        return;
    }
    longtermState.backupToRestore = backup;
    openModal(document.getElementById("backupCompareModal"));
    renderBackupCompareLoading();
    try {
        const response = await requestApi("compareBackup", { backupName: backup.name, adminToken: requireAdminToken() });
        renderBackupComparison(response?.data || response);
    } catch (error) {
        document.getElementById("backupCompareStatus").textContent = `비교 실패: ${error.message}`;
        document.getElementById("backupCompareRestoreBtn").disabled = true;
    }
};

function renderBackupCompareLoading() {
    document.getElementById("backupCompareStatus").textContent = "현재 데이터와 백업을 비교하는 중입니다...";
    document.getElementById("backupCompareSummary").replaceChildren();
    document.getElementById("backupCompareExamples").replaceChildren();
    document.getElementById("backupCompareRestoreBtn").disabled = true;
}

function renderBackupComparison(data) {
    const status = document.getElementById("backupCompareStatus");
    const summary = document.getElementById("backupCompareSummary");
    const examples = document.getElementById("backupCompareExamples");
    const restoreButton = document.getElementById("backupCompareRestoreBtn");
    status.textContent = `${data?.backup?.createdAt || data?.backup?.name || "선택 백업"} · 비교 완료`;
    summary.replaceChildren();
    const stats = [["추가", data.added], ["삭제", data.removed], ["수정", data.changed], ["전체 변경", data.totalChanges]];
    for (const [label, value] of stats) {
        const item = document.createElement("div");
        item.className = "backup-compare-stat";
        item.innerHTML = `<strong>${Number(value || 0).toLocaleString()}</strong>${label}`;
        summary.appendChild(item);
    }
    examples.replaceChildren();
    for (const item of Array.isArray(data.examples) ? data.examples : []) {
        const node = document.createElement("div");
        node.className = "backup-compare-example";
        const before = cleanText(item.beforeValue).replace("\u0001", " / ") || "없음";
        const after = cleanText(item.afterValue).replace("\u0001", " / ") || "없음";
        node.textContent = `${item.type} · ${item.identity}\n현재: ${before}\n복구 후: ${after}`;
        examples.appendChild(node);
    }
    if (!examples.childElementCount) {
        const empty = document.createElement("div");
        empty.className = "backup-compare-example";
        empty.textContent = "현재 데이터와 차이가 없습니다.";
        examples.appendChild(empty);
    }
    restoreButton.disabled = false;
}

function closeBackupCompareModal() {
    longtermState.backupToRestore = null;
    closeModal(document.getElementById("backupCompareModal"));
}

async function confirmComparedBackupRestore() {
    const backup = longtermState.backupToRestore;
    if (!backup?.name) return;
    const confirmation = window.prompt(`${backup.createdAt || backup.name} 백업으로 전체 복구합니다.\n현재 데이터는 복구 전에 자동 백업됩니다.\n\n계속하려면 '복구'를 입력하세요.`);
    if (cleanText(confirmation) !== "복구") return;
    closeBackupCompareModal();
    state.restoringBackupName = backup.name;
    renderAdminDashboard();
    try {
        const response = await requestApi("restoreBackup", { backupName: backup.name, operationId: createOperationId(), adminToken: requireAdminToken() });
        updateLocalDataVersion(response);
        showToast("✅ 백업 데이터로 복구했습니다.");
        await refreshRecordsFromServer(true);
        await loadAdminDashboard(false);
    } catch (error) {
        logLocalError("backup-restore", error, { backupName: backup.name });
        if (!handleAdminAuthError(error)) window.alert(`백업 복구에 실패했습니다.\n${error.message}`);
    } finally {
        state.restoringBackupName = "";
        if (state.adminDashboard) renderAdminDashboard();
    }
}

function initializeDiagnosticsUi() {
    document.getElementById("adminDiagnosticsRefreshBtn")?.addEventListener("click", refreshAdminDiagnostics);
}

async function refreshAdminDiagnostics() {
    if (longtermState.diagnosticsRefreshing || longtermState.diagnosticRepairing) return;
    const button = document.getElementById("adminDiagnosticsRefreshBtn");
    longtermState.diagnosticsRefreshing = true;
    if (button) {
        button.disabled = true;
        button.textContent = "점검중…";
    }
    setDiagnosticActionButtonsDisabled(true);
    try {
        const integrity = await runDailyDataIntegrityValidation(true);
        if (integrity?.success) clearResolvedTransientNetworkErrors();
        await renderAdminDiagnostics(true);
        if (!integrity?.success && integrity?.reason === "offline") showToast("인터넷 연결 후 다시 점검해주세요.");
        else if (!integrity?.success && integrity?.reason === "busy") showToast("저장 작업이 끝난 뒤 다시 점검해주세요.");
    } finally {
        longtermState.diagnosticsRefreshing = false;
        if (button) {
            button.disabled = false;
            button.textContent = "다시 점검";
        }
        setDiagnosticActionButtonsDisabled(false);
    }
}

const originalRenderAdminDashboardLongterm = renderAdminDashboard;
renderAdminDashboard = function renderAdminDashboardLongterm() {
    originalRenderAdminDashboardLongterm();
    renderAdminDiagnostics(false);
};

async function renderAdminDiagnostics(force = false) {
    const status = document.getElementById("adminDiagnosticsStatus");
    const list = document.getElementById("adminDiagnosticsList");
    if (!status || !list) return;
    if (!force && Date.now() - longtermState.diagnosticsLastAt < 3000 && list.childElementCount) return;
    longtermState.diagnosticsLastAt = Date.now();
    status.textContent = "점검중…";
    try {
        const diagnostics = await collectDiagnostics();
        list.replaceChildren();
        let warningCount = 0;
        let errorCount = 0;
        for (const item of diagnostics) {
            if (item.level === "warning") warningCount += 1;
            if (item.level === "error") errorCount += 1;
            const row = document.createElement("div");
            row.className = "admin-diagnostic-row";
            row.dataset.level = item.level;

            const left = document.createElement("div");
            const label = document.createElement("div");
            label.className = "label";
            label.textContent = item.label;
            const detail = document.createElement("div");
            detail.className = "detail";
            detail.textContent = item.level === "good" ? item.detail : `원인: ${item.detail}`;
            left.append(label, detail);

            const right = document.createElement("div");
            right.className = "admin-diagnostic-actions";
            const statusElement = document.createElement("div");
            statusElement.className = "status";
            statusElement.textContent = item.status;
            right.appendChild(statusElement);

            for (const action of Array.isArray(item.actions) ? item.actions : []) {
                const actionButton = document.createElement("button");
                actionButton.type = "button";
                actionButton.className = `admin-diagnostic-action-btn${action.danger ? " danger" : ""}`;
                actionButton.dataset.action = action.key;
                actionButton.dataset.defaultLabel = action.label;
                actionButton.dataset.busyLabel = action.busyLabel || "처리중…";
                const repairing = longtermState.diagnosticRepairing === action.key;
                actionButton.textContent = repairing ? actionButton.dataset.busyLabel : action.label;
                actionButton.disabled = Boolean(longtermState.diagnosticRepairing) || longtermState.diagnosticsRefreshing;
                actionButton.addEventListener("click", () => runDiagnosticRepair(action.key));
                right.appendChild(actionButton);
            }

            row.append(left, right);
            list.appendChild(row);
        }
        status.textContent = errorCount ? `오류 ${errorCount} · 주의 ${warningCount}` : warningCount ? `주의 ${warningCount}` : "전체 정상";
        status.dataset.status = errorCount ? "danger" : warningCount ? "warning" : "good";
    } catch (error) {
        status.textContent = "점검 실패";
        status.dataset.status = "danger";
        logLocalError("diagnostics", error);
    }
}

function setDiagnosticActionButtonsDisabled(disabled) {
    document.querySelectorAll(".admin-diagnostic-action-btn").forEach(button => {
        const active = longtermState.diagnosticRepairing === button.dataset.action;
        button.disabled = disabled || Boolean(longtermState.diagnosticRepairing);
        button.textContent = active ? button.dataset.busyLabel || "처리중…" : button.dataset.defaultLabel || button.textContent;
    });
}

async function runDiagnosticRepair(actionKey) {
    const key = cleanText(actionKey);
    if (!key || longtermState.diagnosticRepairing || longtermState.diagnosticsRefreshing) return;
    longtermState.diagnosticRepairing = key;
    setDiagnosticActionButtonsDisabled(true);
    try {
        const message = await executeDiagnosticRepair(key);
        if (message) showToast(`✅ ${message}`);
    } catch (error) {
        logLocalError("diagnostic-repair", error, { action: key });
        window.alert(`자동 조치에 실패했습니다.\n${error.message}`);
    } finally {
        longtermState.diagnosticRepairing = "";
        await renderAdminDiagnostics(true);
    }
}

async function executeDiagnosticRepair(actionKey) {
    switch (actionKey) {
        case "repair-data-cache":
            await repairDataCacheFromServer();
            return "데이터 캐시를 복구했습니다.";
        case "rebuild-index":
            rebuildDataIndexes();
            if (!verifyIndexIntegrity(true)) throw new Error("인덱스를 다시 만들었지만 무결성 확인에 실패했습니다.");
            renderCurrentView();
            renderGpsButtons();
            return "탐색 인덱스를 재생성했습니다.";
        case "repair-integrity": {
            const result = await runDailyDataIntegrityValidation(true);
            if (!result?.success) throw new Error(getIntegrityFailureMessage(result));
            clearResolvedTransientNetworkErrors();
            return result.status === "recovered" ? "데이터 불일치를 자동 복구했습니다." : "데이터 무결성이 정상입니다.";
        }
        case "restart-gps": {
            const previousSuccessAt = longtermState.lastGpsSuccessAt;
            requestManualGpsRefresh();
            await waitForDiagnosticCondition(() => state.gpsWatchId !== null, 3000, "GPS 감시를 다시 등록하지 못했습니다.");
            await waitForDiagnosticCondition(() => {
                const locationAt = Number(state.currentLocation?.timestamp) || 0;
                const accuracy = Number(state.currentLocation?.accuracy);
                const receivedNewLocation = longtermState.lastGpsSuccessAt > previousSuccessAt || locationAt > Date.now() - 20000;
                return receivedNewLocation && (!Number.isFinite(accuracy) || accuracy <= APP_CONFIG.GPS_HIGH_ACCURACY_TARGET);
            }, APP_CONFIG.GPS_HIGH_TIMEOUT + 2000, "GPS 감시는 등록됐지만 정확도 60m 이내의 새 위치를 받지 못했습니다.");
            return "GPS 감시를 다시 시작하고 정상 위치 수신을 확인했습니다.";
        }
        case "retry-pending":
            return retryPendingOperationsFromDiagnostics();
        case "full-sync":
            await forceDiagnosticFullSync();
            return "서버 데이터로 전체 동기화했습니다.";
        case "clear-errors":
            localStorage.removeItem(LONGTERM_CONFIG.ERROR_LOG_KEY);
            return "로컬 오류 기록을 지웠습니다.";
        case "exit-safe-mode":
            await recoverFromSafeMode();
            return "정상모드로 복구했습니다.";
        case "repair-service-worker":
            await repairServiceWorkerCaches();
            return "앱 파일 캐시를 복구했습니다.";
        case "cleanup-storage":
            await cleanupDiagnosticStorage();
            return "불필요한 캐시와 기록을 정리했습니다.";
        case "setup-auto-backup":
            await setupAutomaticBackup();
            return "자동백업 설정을 다시 확인했습니다.";
        default:
            throw new Error("지원하지 않는 진단 조치입니다.");
    }
}

function getIntegrityFailureMessage(result) {
    if (result?.reason === "offline") return "인터넷 연결이 없어 무결성 검사를 실행할 수 없습니다.";
    if (result?.reason === "busy") return "저장 작업이 진행 중이라 무결성 검사를 실행할 수 없습니다.";
    return cleanText(result?.error?.message) || "데이터 무결성을 자동 복구하지 못했습니다.";
}

function waitForDiagnosticCondition(predicate, timeout = 5000, failureMessage = "작업 완료를 확인하지 못했습니다.") {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const check = () => {
            let completed = false;
            try { completed = Boolean(predicate()); } catch (error) {}
            if (completed) {
                resolve(true);
                return;
            }
            if (Date.now() - startedAt >= timeout) {
                reject(new Error(failureMessage));
                return;
            }
            window.setTimeout(check, 120);
        };
        check();
    });
}

async function forceDiagnosticFullSync() {
    if (navigator.onLine === false) throw new Error("인터넷 연결이 필요합니다.");
    if (state.pendingOperations.length > 0 || state.syncProcessing) throw new Error("저장 대기 작업을 먼저 처리해주세요.");
    if (state.networkLoading) await waitForDiagnosticCondition(() => !state.networkLoading, LONGTERM_CONFIG.REQUEST_TIMEOUT + 1000, "진행 중인 데이터 요청이 끝나지 않았습니다.");
    await refreshRecordsFromServer(true);
    if (state.dataSyncState !== "current" || !state.records.length) throw new Error("서버 전체 데이터를 받지 못했습니다.");
    saveRecordsToCache(state.records);
    flushRecordsCache();
}

async function repairDataCacheFromServer() {
    await forceDiagnosticFullSync();
    const envelope = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    if (!envelope || envelope.rowCount !== state.records.length) throw new Error("새 데이터 캐시 검증에 실패했습니다.");
    rebuildDataIndexes();
    if (!verifyIndexIntegrity(true)) throw new Error("캐시는 복구했지만 탐색 인덱스 확인에 실패했습니다.");
}

async function retryPendingOperationsFromDiagnostics() {
    if (!state.pendingOperations.length) return "저장 대기 작업이 없습니다.";
    const conflicts = state.pendingOperations.filter(item => item?.conflict);
    if (conflicts.length > 0) {
        window.alert(
            `충돌 작업 ${conflicts.length}건은 자동으로 덮어쓸 수 없습니다.\n` +
            "서버의 최신 데이터를 확인한 뒤 해당 비밀번호를 다시 입력해주세요.\n" +
            "충돌 작업은 데이터 보호를 위해 자동 삭제하지 않습니다."
        );
        return "충돌 작업의 해결 방법을 표시했습니다.";
    }
    if (navigator.onLine === false) throw new Error("인터넷 연결이 필요합니다.");
    for (const operation of state.pendingOperations) operation.nextAttemptAt = 0;
    savePendingOperations();
    wakePendingSync();
    return "저장 대기 작업 재전송을 시작했습니다.";
}

async function recoverFromSafeMode() {
    let envelope = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    if (!envelope && navigator.onLine !== false) {
        await repairDataCacheFromServer();
        envelope = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    }
    if (!envelope) throw new Error("정상 데이터 캐시를 확인하지 못했습니다.");
    rebuildDataIndexes();
    if (!verifyIndexIntegrity(true)) throw new Error("탐색 인덱스가 정상적이지 않습니다.");
    if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active && !navigator.serviceWorker.controller) throw new Error("활성 서비스워커가 없습니다.");
    }
    longtermState.safeMode = false;
    localStorage.removeItem(LONGTERM_CONFIG.SAFE_MODE_KEY);
    sessionStorage.setItem(LONGTERM_CONFIG.BOOT_FAILURE_KEY, JSON.stringify({ count: 0, at: Date.now() }));
}

const DIAGNOSTIC_CACHE_NAMES = Object.freeze({
    app: "gimpo-b-app-v40",
    images: "gimpo-b-images-v4",
    data: "gimpo-b-data-v5",
    runtime: "gimpo-b-runtime-v3"
});

const DIAGNOSTIC_APP_SHELL = Object.freeze([
    "./", "./index.html", "./style.css?v=20260716-15", "./script.js?v=20260716-15", "./manifest.json",
    "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
]);
const DIAGNOSTIC_GATE_IMAGES = Object.freeze([
    "./gate-images/썬앤빌.webp", "./gate-images/럭스A.webp", "./gate-images/럭스B.webp", "./gate-images/루체뷰1.webp"
]);

async function repairServiceWorkerCaches() {
    if (!("serviceWorker" in navigator) || !("caches" in window)) throw new Error("이 브라우저는 앱 캐시 복구를 지원하지 않습니다.");
    if (navigator.onLine === false) throw new Error("앱 파일 캐시 복구에는 인터넷 연결이 필요합니다.");
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
    await registration.update();

    const appCache = await caches.open(DIAGNOSTIC_CACHE_NAMES.app);
    for (const url of DIAGNOSTIC_APP_SHELL) {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (!response?.ok) throw new Error(`앱 파일을 다시 받지 못했습니다: ${url}`);
        await appCache.put(url, response.clone());
    }
    const imageCache = await caches.open(DIAGNOSTIC_CACHE_NAMES.images);
    for (const url of DIAGNOSTIC_GATE_IMAGES) {
        try {
            const response = await fetch(new Request(url, { cache: "reload" }));
            if (response?.ok) await imageCache.put(url, response.clone());
        } catch (error) {}
    }
    const dataCache = await caches.open(DIAGNOSTIC_CACHE_NAMES.data);
    try {
        const response = await fetch(new Request("./locations.json", { cache: "reload" }));
        if (response?.ok) await dataCache.put("./locations.json", response.clone());
    } catch (error) {}
    await deleteStaleManagedCaches();
    const status = await getServiceWorkerHealth();
    if (status.level !== "good") throw new Error(status.detail || "앱 캐시 복구 상태를 확인하지 못했습니다.");
}

async function deleteStaleManagedCaches() {
    if (!("caches" in window)) return;
    const keep = new Set(Object.values(DIAGNOSTIC_CACHE_NAMES));
    const prefixes = ["gimpo-b-app-", "gimpo-b-images-", "gimpo-b-data-", "gimpo-b-runtime-", "gimpo-b-pwa-"];
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => prefixes.some(prefix => key.startsWith(prefix)) && !keep.has(key)).map(key => caches.delete(key)));
}

async function cleanupDiagnosticStorage() {
    pruneNonessentialStorage();
    localStorage.removeItem(LONGTERM_CONFIG.CACHE_TEMP_KEY);
    localStorage.removeItem(APP_CONFIG.CACHE_KEY);
    await deleteStaleManagedCaches();
}

async function getServiceWorkerHealth() {
    if (!("serviceWorker" in navigator)) {
        return { label: "서비스워커", status: "미지원", level: "warning", detail: "현재 브라우저가 오프라인 앱 기능을 지원하지 않습니다.", actions: [] };
    }
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        const active = navigator.serviceWorker.controller || registration?.active;
        if (!active) {
            return diagnosticItem("서비스워커", "확인 필요", "warning", "활성 서비스워커가 없어 앱 파일 캐시를 제어하지 못합니다.", "repair-service-worker", "앱 캐시 복구", "복구중…");
        }
        const cacheCounts = {};
        if ("caches" in window) {
            for (const [type, name] of Object.entries(DIAGNOSTIC_CACHE_NAMES)) {
                const cache = await caches.open(name);
                cacheCounts[type] = (await cache.keys()).length;
            }
        }
        const healthy = cacheCounts.app >= DIAGNOSTIC_APP_SHELL.length && cacheCounts.images >= DIAGNOSTIC_GATE_IMAGES.length && cacheCounts.data >= 1;
        const detail = `앱 ${cacheCounts.app || 0}/${DIAGNOSTIC_APP_SHELL.length} · 이미지 ${cacheCounts.images || 0}/${DIAGNOSTIC_GATE_IMAGES.length} · 좌표 ${cacheCounts.data || 0}/1`;
        return healthy
            ? { label: "서비스워커", status: "정상", level: "good", detail, actions: [] }
            : diagnosticItem("서비스워커", "캐시 복구 필요", "warning", detail, "repair-service-worker", "앱 캐시 복구", "복구중…");
    } catch (error) {
        return diagnosticItem("서비스워커", "오류", "error", cleanText(error.message) || "서비스워커 상태를 읽지 못했습니다.", "repair-service-worker", "앱 캐시 복구", "복구중…");
    }
}

function diagnosticItem(label, status, level, detail, actionKey = "", actionLabel = "", busyLabel = "처리중…", danger = false) {
    return {
        label, status, level, detail,
        actions: actionKey ? [{ key: actionKey, label: actionLabel, busyLabel, danger }] : []
    };
}

async function collectDiagnostics() {
    const envelope = readEnvelopeFromStorage(LONGTERM_CONFIG.CACHE_ENVELOPE_KEY);
    const indexValid = verifyIndexIntegrity(true);
    const errorLogs = loadLocalErrorLogs();
    const gpsWatchCount = state.gpsWatchId === null ? 0 : 1;
    const pendingCount = state.pendingOperations.length;
    const pendingConflictCount = state.pendingOperations.filter(item => item?.conflict).length;
    const integrityResult = loadDataIntegrityResult();
    const integrityStatus = integrityResult?.status === "recovered" ? "자동 복구" : integrityResult?.status === "ok" ? "정상" : integrityResult?.status === "failed" ? "확인 필요" : "검사 전";
    const integrityLevel = integrityResult?.status === "failed" ? "warning" : integrityResult ? "good" : "warning";
    const activeErrorLogs = errorLogs.filter(item =>
        Date.now() - Number(item?.at) < 60 * 60 * 1000 &&
        !isTransientNetworkErrorMessage(item?.message)
    );

    const diagnostics = [
        envelope
            ? { label: "데이터 캐시", status: "정상", level: "good", detail: `${envelope.rowCount.toLocaleString()}행 · 체크섬 정상`, actions: [] }
            : diagnosticItem("데이터 캐시", "복구 필요", "warning", "검증 가능한 주 데이터 캐시가 없습니다.", "repair-data-cache", "데이터 자동 복구", "복구중…"),
        indexValid
            ? { label: "탐색 인덱스", status: "정상", level: "good", detail: `${state.indexes.rowById.size.toLocaleString()}행 연결`, actions: [] }
            : diagnosticItem("탐색 인덱스", "재생성 필요", "error", `원본 ${state.records.length.toLocaleString()}행과 인덱스 연결이 일치하지 않습니다.`, "rebuild-index", "인덱스 재생성", "재생성중…"),
        integrityLevel === "good"
            ? { label: "데이터 무결성", status: integrityStatus, level: "good", detail: `${formatLocalDateTime(integrityResult.checkedAt)} · ${integrityResult.message}`, actions: [] }
            : diagnosticItem("데이터 무결성", integrityStatus, integrityLevel, integrityResult ? `${formatLocalDateTime(integrityResult.checkedAt)} · ${integrityResult.message}` : "서버 원본과 로컬 데이터 비교 기록이 없습니다.", "repair-integrity", integrityResult?.status === "failed" ? "전체 자동 복구" : "지금 검사", "검사중…"),
        gpsWatchCount === 1
            ? { label: "GPS 감시", status: "정상", level: "good", detail: "1개 등록 · 중복 감시 없음", actions: [] }
            : diagnosticItem("GPS 감시", "재시작 필요", "warning", `${gpsWatchCount}개 등록되어 현재 위치 갱신을 보장할 수 없습니다.`, "restart-gps", "GPS 재시작", "재시작중…"),
        pendingCount === 0
            ? { label: "저장 대기열", status: "정상", level: "good", detail: "전송 대기 작업이 없습니다.", actions: [] }
            : diagnosticItem("저장 대기열", pendingConflictCount ? `충돌 ${pendingConflictCount}건` : `${pendingCount}건`, pendingConflictCount ? "error" : "warning", pendingConflictCount ? "다른 수정과 충돌해 자동 전송이 중단된 작업이 있습니다." : "온라인 복귀 후 전송되지 않은 수정 작업이 있습니다.", "retry-pending", pendingConflictCount ? "충돌 해결 안내" : "다시 전송", pendingConflictCount ? "확인중…" : "전송중…"),
        state.lastSuccessfulSyncAt
            ? { label: "최근 동기화", status: "정상", level: "good", detail: formatLocalDateTime(state.lastSuccessfulSyncAt), actions: [] }
            : diagnosticItem("최근 동기화", "확인 전", "warning", "현재 실행에서 서버 데이터 동기화 성공 기록이 없습니다.", "full-sync", "지금 전체 동기화", "동기화중…"),
        activeErrorLogs.length === 0
            ? { label: "로컬 오류 기록", status: errorLogs.length ? `과거 기록 ${errorLogs.length}건` : "정상", level: "good", detail: errorLogs[0] ? `${formatLocalDateTime(errorLogs[0].at)} · ${errorLogs[0].type} · ${errorLogs[0].message}` : "최근 오류가 없습니다.", actions: errorLogs.length ? [{ key: "clear-errors", label: "기록 지우기", busyLabel: "삭제중…" }] : [] }
            : diagnosticItem("로컬 오류 기록", `주의 ${activeErrorLogs.length}건`, "warning", `${formatLocalDateTime(activeErrorLogs[0].at)} · ${activeErrorLogs[0].type} · ${activeErrorLogs[0].message}`, "clear-errors", "오류 기록 지우기", "삭제중…", true),
        longtermState.safeMode
            ? diagnosticItem("안전모드", "사용 중", "warning", "반복 실행 오류가 감지되어 일부 복원 기능이 제한됐습니다.", "exit-safe-mode", "정상모드 복구", "복구중…")
            : { label: "안전모드", status: "정상", level: "good", detail: "일반 모드로 실행 중입니다.", actions: [] }
    ];

    diagnostics.push(await getServiceWorkerHealth());

    if (navigator.storage?.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            const usage = Number(estimate.usage) || 0;
            const quota = Number(estimate.quota) || 0;
            const ratio = quota ? usage / quota : 0;
            const detail = quota ? `${(usage / 1024 / 1024).toFixed(1)}MB / ${(quota / 1024 / 1024).toFixed(0)}MB` : "용량 확인 불가";
            diagnostics.push(ratio > 0.85
                ? diagnosticItem("기기 저장공간", "부족", "warning", detail, "cleanup-storage", "불필요 캐시 정리", "정리중…")
                : { label: "기기 저장공간", status: "정상", level: "good", detail, actions: [] });
        } catch (error) {}
    }

    const autoBackup = state.adminDashboard?.autoBackup;
    if (autoBackup) {
        const healthy = autoBackup.enabled && !autoBackup.needsAttention;
        const status = !autoBackup.enabled ? "설정 필요" : autoBackup.needsAttention ? "확인 필요" : autoBackup.status === "waiting" ? "첫 실행 대기" : "정상";
        const detail = [autoBackup.message, autoBackup.lastSuccessAt ? `최근 성공 ${autoBackup.lastSuccessAt}` : "", autoBackup.lastFailureMessage].filter(Boolean).join(" · ");
        diagnostics.push(healthy
            ? { label: "자동백업", status, level: "good", detail: detail || autoBackup.schedule, actions: [] }
            : diagnosticItem("자동백업", status, "warning", detail || "자동백업 트리거 또는 실행 상태를 확인해야 합니다.", "setup-auto-backup", "자동백업 재설정", "설정중…"));
    }
    return diagnostics;
}

function initializeSafeMode() {
    try {
        longtermState.safeMode = localStorage.getItem(LONGTERM_CONFIG.SAFE_MODE_KEY) === "1";
        sessionStorage.setItem(LONGTERM_CONFIG.BOOT_FAILURE_KEY, JSON.stringify({ count: 0, at: Date.now() }));
        if (longtermState.safeMode) {
            state.savedViewState = null;
            localStorage.removeItem(APP_CONFIG.VIEW_STATE_KEY);
        }
    } catch (error) {}
}

const originalLoadSavedViewStateLongterm = loadSavedViewState;
loadSavedViewState = function loadSavedViewStateLongterm() {
    if (longtermState.safeMode) return null;
    return originalLoadSavedViewStateLongterm();
};

initializeSafeMode();
document.addEventListener("DOMContentLoaded", () => {
    initializeBackupCompareUi();
    initializeDiagnosticsUi();
});


/* ========================= 성능 판정 현실화 v24 ========================= */
const FINAL_BUILD_INFO = Object.freeze({ fileVersion: "20260716-15", serviceWorkerVersion: "v40" });
const SAFE_MODE_BUILD_KEY = "gimpoB_safe_mode_build_v1";
(function clearStaleSafeModeAfterBuildUpdate() {
    try {
        const previousBuild = localStorage.getItem(SAFE_MODE_BUILD_KEY);
        if (previousBuild !== FINAL_BUILD_INFO.fileVersion) {
            localStorage.removeItem(LONGTERM_CONFIG.SAFE_MODE_KEY);
            localStorage.removeItem("gimpoB_boot_error_state_v1");
            sessionStorage.removeItem(LONGTERM_CONFIG.BOOT_FAILURE_KEY);
            longtermState.safeMode = false;
            localStorage.setItem(SAFE_MODE_BUILD_KEY, FINAL_BUILD_INFO.fileVersion);
        }
    } catch (error) {}
})();
const FINAL_DIAGNOSTIC_CONFIG = Object.freeze({
    GPS_FRESH_MS: 3 * 60 * 1000,
    GPS_STALE_MS: 10 * 60 * 1000,
    SYNC_FRESH_MS: 10 * 60 * 1000,
    PENDING_RETRY_WAIT_MS: 35 * 1000,
    BOOT_ERROR_WINDOW_MS: 10 * 1000,
    BOOT_ERROR_STATE_KEY: "gimpoB_boot_error_state_v2"
});

longtermState.lastGpsError = longtermState.lastGpsError || null;
longtermState.lastGpsSuccessAt = Number(longtermState.lastGpsSuccessAt) || 0;
longtermState.adminDashboardPromise = null;
longtermState.historyPromise = null;
longtermState.backupCompareGeneration = Number(longtermState.backupCompareGeneration) || 0;
longtermState.backupComparingName = "";

function shouldRecordApiTransportError(error) {
    if (!error || error.apiBusinessError || error.staleResponse) return false;
    const message = cleanText(error.message || error).toLowerCase();
    if (!message) return false;
    return error instanceof TypeError ||
        error.name === "AbortError" ||
        isTransientNetworkErrorMessage(message) ||
        message.includes("서버 응답 오류") ||
        message.includes("서버 응답이 비어") ||
        message.includes("올바르지 않은 응답");
}

/* 실제 위치 수신과 오류 상태를 진단에 사용합니다. */
const originalHandleGpsSuccessV23 = handleGpsSuccess;
handleGpsSuccess = function handleGpsSuccessV23(position, context = {}) {
    const validGeneration = context.generation === state.gpsRequestGeneration;
    const validCoords = Number.isFinite(Number(position?.coords?.latitude)) && Number.isFinite(Number(position?.coords?.longitude));
    originalHandleGpsSuccessV23(position, context);
    if (validGeneration && validCoords) {
        longtermState.lastGpsSuccessAt = Number(position?.timestamp) || Date.now();
        longtermState.lastGpsError = null;
    }
};
const originalHandleGpsInitialErrorV23 = handleGpsInitialError;
handleGpsInitialError = function handleGpsInitialErrorV23(error, generation) {
    if (generation === state.gpsRequestGeneration) longtermState.lastGpsError = { at: Date.now(), code: Number(error?.code) || 0, message: cleanText(error?.message) || "GPS 위치 수신 실패" };
    return originalHandleGpsInitialErrorV23(error, generation);
};
const originalHandleGpsWatchErrorV23 = handleGpsWatchError;
handleGpsWatchError = function handleGpsWatchErrorV23(error, generation) {
    if (generation === state.gpsRequestGeneration) longtermState.lastGpsError = { at: Date.now(), code: Number(error?.code) || 0, message: cleanText(error?.message) || "GPS 감시 실패" };
    return originalHandleGpsWatchErrorV23(error, generation);
};

async function getGeolocationPermissionStateV23() {
    try {
        if (!navigator.permissions?.query) return "unknown";
        const status = await navigator.permissions.query({ name: "geolocation" });
        return cleanText(status?.state) || "unknown";
    } catch (error) {
        return "unknown";
    }
}

async function getGpsDiagnosticItemV23() {
    const watchRegistered = state.gpsWatchId !== null;
    const permission = await getGeolocationPermissionStateV23();
    const location = state.currentLocation;
    const timestamp = Number(location?.timestamp) || longtermState.lastGpsSuccessAt || 0;
    const age = timestamp ? Date.now() - timestamp : Number.POSITIVE_INFINITY;
    const accuracy = Number(location?.accuracy);
    const accuracyText = Number.isFinite(accuracy) ? `오차 ${Math.round(accuracy)}m` : "정확도 확인 불가";
    const ageText = timestamp ? formatRelativeAge(timestamp) : "정상 위치 없음";

    if (permission === "denied" || Number(longtermState.lastGpsError?.code) === 1) {
        return { label: "GPS 감시", status: "권한 필요", level: "warning", detail: "위치 권한이 차단되어 자동 복구할 수 없습니다. 휴대폰 또는 브라우저 설정에서 위치 권한을 허용해주세요.", actions: [] };
    }
    if (!watchRegistered) return diagnosticItem("GPS 감시", "재시작 필요", "warning", "고정밀 위치 감시가 등록되지 않았습니다.", "restart-gps", "GPS 재시작", "재시작중…");
    if (!location || !Number.isFinite(timestamp)) return diagnosticItem("GPS 감시", "위치 미수신", "warning", "감시는 1개지만 정상 좌표를 아직 받지 못했습니다.", "restart-gps", "GPS 재시작", "재시작중…");
    if (Number.isFinite(accuracy) && accuracy > APP_CONFIG.GPS_HIGH_ACCURACY_TARGET) return diagnosticItem("GPS 감시", "정확도 확인", "warning", `${ageText} · ${accuracyText}`, "restart-gps", "GPS 재시작", "재시작중…");
    if (age > FINAL_DIAGNOSTIC_CONFIG.GPS_STALE_MS) return diagnosticItem("GPS 감시", "갱신 지연", "warning", `${ageText} · ${accuracyText}`, "restart-gps", "GPS 재시작", "재시작중…");
    if (age > FINAL_DIAGNOSTIC_CONFIG.GPS_FRESH_MS) return diagnosticItem("GPS 감시", "최근 위치 유지", "warning", `${ageText} · ${accuracyText}`, "restart-gps", "GPS 재시작", "재시작중…");
    return { label: "GPS 감시", status: "정상", level: "good", detail: `감시 1개 · ${ageText} · ${accuracyText}`, actions: [] };
}

function formatRelativeAge(timestamp) {
    const seconds = Math.max(0, Math.round((Date.now() - Number(timestamp)) / 1000));
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    return `${Math.round(minutes / 60)}시간 전`;
}

/* 관리자 서버 상태를 보존하면서 실제 최신값으로 다시 받습니다. */
loadAdminDashboard = function loadAdminDashboardV23(showLoading = true) {
    if (longtermState.adminDashboardPromise) return longtermState.adminDashboardPromise;
    const hadDashboard = Boolean(state.adminDashboard);
    const button = elements.adminRefreshBtn;
    state.adminLoading = true;
    if (button) { button.disabled = true; button.textContent = "불러오는 중…"; }
    if (showLoading) {
        elements.adminStatus.style.display = "block";
        elements.adminStatus.textContent = hadDashboard ? "최신 점검 정보를 확인하는 중입니다..." : "점검 정보를 불러오는 중입니다...";
        if (!hadDashboard) elements.adminContent.hidden = true;
    }
    const task = (async () => {
        try {
            // 관리자 본인의 활동 신호를 먼저 기록해 현재/오늘 사용 인원에 즉시 반영합니다.
            await sendUsageHeartbeat(true);
            const response = await requestApi("getAdminDashboard", { adminToken: requireAdminToken() });
            const dashboard = response?.data && typeof response.data === "object" ? response.data : response;
            state.adminDashboard = normalizeAdminDashboard(dashboard);
            renderAdminDashboard();
            return state.adminDashboard;
        } catch (error) {
            console.error("관리자 점검 불러오기 실패:", error);
            if (handleAdminAuthError(error)) return null;
            if (hadDashboard) {
                elements.adminContent.hidden = false;
                elements.adminStatus.style.display = "block";
                elements.adminStatus.textContent = `최신 확인 실패 · 기존 점검 결과 표시 중\n${error.message}`;
            } else {
                elements.adminContent.hidden = true;
                elements.adminStatus.style.display = "block";
                elements.adminStatus.textContent = `점검 정보를 불러오지 못했습니다.\n${error.message}`;
            }
            return null;
        } finally {
            state.adminLoading = false;
            longtermState.adminDashboardPromise = null;
            if (button) { button.disabled = false; button.textContent = "새로고침"; }
        }
    })();
    longtermState.adminDashboardPromise = task;
    return task;
};

loadChangeHistory = function loadChangeHistoryV23(showLoading = true) {
    if (longtermState.historyPromise) return longtermState.historyPromise;
    const button = elements.historyRefreshBtn;
    const hadHistory = state.changeHistory.length > 0;
    state.historyLoading = true;
    if (button) { button.disabled = true; button.textContent = "불러오는 중…"; }
    if (showLoading) {
        elements.historyStatus.style.display = "block";
        elements.historyStatus.textContent = "수정기록을 불러오는 중입니다...";
        if (!hadHistory) elements.historyList.replaceChildren();
    }
    const task = (async () => {
        try {
            const response = await requestApi("getChangeHistory", { limit: APP_CONFIG.HISTORY_LIMIT });
            const history = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
            state.changeHistory = history.map(normalizeHistoryItem).filter(item => item.historyId);
            saveChangeHistoryCache(state.changeHistory);
            renderChangeHistory();
            return state.changeHistory;
        } catch (error) {
            console.error("수정기록 불러오기 실패:", error);
            if (state.changeHistory.length > 0) {
                renderChangeHistory();
                elements.historyStatus.style.display = "block";
                elements.historyStatus.textContent = "최신 확인 실패 · 저장된 수정기록 표시 중";
            } else {
                elements.historyList.replaceChildren();
                elements.historyStatus.style.display = "block";
                elements.historyStatus.textContent = `수정기록을 불러오지 못했습니다.\n${error.message}`;
            }
            return state.changeHistory;
        } finally {
            state.historyLoading = false;
            longtermState.historyPromise = null;
            if (button) { button.disabled = false; button.textContent = "새로고침"; }
        }
    })();
    longtermState.historyPromise = task;
    return task;
};

/* 백업 비교는 마지막 선택만 유효하며 비교 완료 전까지 중복 실행하지 않습니다. */
renderBackupList = function renderBackupListV23(backups, pendingCount) {
    elements.backupList.replaceChildren();
    if (!backups.length) {
        const empty = document.createElement("div");
        empty.className = "backup-empty";
        empty.textContent = "아직 생성된 백업이 없습니다.";
        elements.backupList.appendChild(empty);
        return;
    }
    for (const backup of backups) {
        const item = document.createElement("div"); item.className = "backup-item";
        const info = document.createElement("div"); info.className = "backup-info";
        const name = document.createElement("div"); name.className = "backup-name"; name.textContent = backup.kind; name.title = backup.name;
        const meta = document.createElement("div"); meta.className = "backup-meta"; meta.textContent = `${backup.createdAt || backup.name} · ${backup.rowCount.toLocaleString()}행`;
        info.append(name, meta);
        const restoreButton = document.createElement("button"); restoreButton.type = "button"; restoreButton.className = "restore-backup-btn";
        const comparing = longtermState.backupComparingName === backup.name;
        const restoring = state.restoringBackupName === backup.name;
        restoreButton.textContent = restoring ? "복구 중..." : comparing ? "비교중…" : "복구";
        restoreButton.disabled = Boolean(state.restoringBackupName) || Boolean(longtermState.backupComparingName) || state.backupCreating || pendingCount > 0;
        restoreButton.title = pendingCount > 0 ? "저장 대기 작업이 끝난 뒤 복구할 수 있습니다." : "";
        restoreButton.addEventListener("click", () => restoreDataBackup(backup));
        item.append(info, restoreButton); elements.backupList.appendChild(item);
    }
};

restoreDataBackup = async function restoreDataBackupV23(backup) {
    if (!backup?.name || state.restoringBackupName || state.backupCreating || longtermState.backupComparingName) return;
    if (state.pendingOperations.length > 0) { window.alert("아직 저장 대기 중인 작업이 있습니다. 저장 완료 후 다시 복구해주세요."); return; }
    const generation = ++longtermState.backupCompareGeneration;
    longtermState.backupComparingName = backup.name;
    longtermState.backupToRestore = backup;
    if (state.adminDashboard) renderAdminDashboard();
    openModal(document.getElementById("backupCompareModal"));
    renderBackupCompareLoading();
    try {
        const response = await requestApi("compareBackup", { backupName: backup.name, adminToken: requireAdminToken() });
        if (generation !== longtermState.backupCompareGeneration || longtermState.backupToRestore?.name !== backup.name) return;
        renderBackupComparison(response?.data || response);
    } catch (error) {
        if (generation !== longtermState.backupCompareGeneration) return;
        document.getElementById("backupCompareStatus").textContent = `비교 실패: ${error.message}`;
        document.getElementById("backupCompareRestoreBtn").disabled = true;
    } finally {
        if (generation === longtermState.backupCompareGeneration) {
            longtermState.backupComparingName = "";
            if (state.adminDashboard) renderAdminDashboard();
        }
    }
};

closeBackupCompareModal = function closeBackupCompareModalV23() {
    longtermState.backupCompareGeneration += 1;
    longtermState.backupComparingName = "";
    longtermState.backupToRestore = null;
    closeModal(document.getElementById("backupCompareModal"));
    if (state.adminDashboard) renderAdminDashboard();
};

/* 다시 점검은 서버 관리자 상태 + 서버 무결성 + 기기 상태를 모두 새로 확인합니다. */
refreshAdminDiagnostics = async function refreshAdminDiagnosticsV23() {
    if (longtermState.diagnosticsRefreshing || longtermState.diagnosticRepairing) return;
    const button = document.getElementById("adminDiagnosticsRefreshBtn");
    longtermState.diagnosticsRefreshing = true;
    if (button) { button.disabled = true; button.textContent = "점검중…"; }
    setDiagnosticActionButtonsDisabled(true);
    try {
        try { await loadAdminDashboard(false); } catch (error) { if (!state.adminDashboard) throw error; }
        const integrity = await runDailyDataIntegrityValidation(true);
        if (integrity?.success) clearResolvedTransientNetworkErrors();
        await renderAdminDiagnostics(true);
        if (!integrity?.success && integrity?.reason === "offline") showToast("인터넷 연결 후 다시 점검해주세요.");
        else if (!integrity?.success && integrity?.reason === "busy") showToast("저장 작업이 끝난 뒤 다시 점검해주세요.");
        else if (integrity?.success) showToast("✅ 최신 상태로 다시 점검했습니다.");
    } catch (error) {
        logLocalError("diagnostics", error);
        window.alert(`다시 점검에 실패했습니다.\n${error.message}`);
    } finally {
        longtermState.diagnosticsRefreshing = false;
        if (button) { button.disabled = false; button.textContent = "다시 점검"; }
        setDiagnosticActionButtonsDisabled(false);
    }
};

/* 저장 대기 재전송은 실제 완료·충돌·다음 재시도 확정까지 기다립니다. */
retryPendingOperationsFromDiagnostics = async function retryPendingOperationsFromDiagnosticsV23() {
    if (!state.pendingOperations.length) return "저장 대기 작업이 없습니다.";
    const conflicts = state.pendingOperations.filter(item => item?.conflict);
    if (conflicts.length > 0) {
        window.alert(`충돌 작업 ${conflicts.length}건은 자동으로 덮어쓸 수 없습니다.\n서버의 최신 데이터를 확인한 뒤 해당 비밀번호를 다시 입력해주세요.`);
        return "충돌 작업의 해결 방법을 표시했습니다.";
    }
    if (navigator.onLine === false) throw new Error("인터넷 연결이 필요합니다.");
    const targetIds = new Set(state.pendingOperations.map(item => item.id));
    for (const operation of state.pendingOperations) operation.nextAttemptAt = 0;
    savePendingOperations();
    wakePendingSync();
    const startedAt = Date.now();
    while (Date.now() - startedAt < FINAL_DIAGNOSTIC_CONFIG.PENDING_RETRY_WAIT_MS) {
        const remaining = state.pendingOperations.filter(item => targetIds.has(item.id));
        if (remaining.length === 0 && !state.syncProcessing) return "저장 대기 작업을 모두 전송했습니다.";
        const conflict = remaining.find(item => item?.conflict);
        if (conflict) throw new Error(cleanText(conflict.conflictMessage) || "다른 수정과 충돌했습니다.");
        await new Promise(resolve => window.setTimeout(resolve, 250));
    }
    const remaining = state.pendingOperations.filter(item => targetIds.has(item.id));
    if (remaining.length) {
        const nextAt = Math.min(...remaining.map(item => Number(item.nextAttemptAt) || Number.MAX_SAFE_INTEGER));
        const nextText = Number.isFinite(nextAt) && nextAt < Number.MAX_SAFE_INTEGER ? formatLocalDateTime(nextAt) : "자동 재시도 예정";
        throw new Error(`아직 ${remaining.length}건이 전송되지 않았습니다. 다음 재시도: ${nextText}`);
    }
    return "저장 대기 작업을 모두 전송했습니다.";
};

function getRecentSyncDiagnosticItemV23() {
    const syncedAt = Number(state.lastSuccessfulSyncAt) || 0;
    if (!syncedAt) return diagnosticItem("최근 동기화", "확인 전", "warning", "서버 데이터 동기화 성공 기록이 없습니다.", "full-sync", "지금 전체 동기화", "동기화중…");
    const age = Date.now() - syncedAt;
    if (navigator.onLine === false) return { label: "최근 동기화", status: "오프라인", level: "good", detail: `마지막 동기화 ${formatLocalDateTime(syncedAt)} · 저장 데이터 사용 중`, actions: [] };
    if (state.dataSyncState === "error" || age > FINAL_DIAGNOSTIC_CONFIG.SYNC_FRESH_MS) return diagnosticItem("최근 동기화", "확인 필요", "warning", `${formatRelativeAge(syncedAt)} · ${formatLocalDateTime(syncedAt)}`, "full-sync", "지금 전체 동기화", "동기화중…");
    return { label: "최근 동기화", status: "정상", level: "good", detail: `${formatRelativeAge(syncedAt)} · ${formatLocalDateTime(syncedAt)}`, actions: [] };
}

async function cacheContainsExact(cacheName, urls) {
    if (!("caches" in window)) return false;
    const cache = await caches.open(cacheName);
    for (const url of urls) {
        const absoluteUrl = new URL(url, window.location.href).href;
        const match = await cache.match(new Request(absoluteUrl), { ignoreSearch: false });
        if (!match) return false;
    }
    return true;
}

getServiceWorkerHealth = async function getServiceWorkerHealthV23() {
    if (!("serviceWorker" in navigator)) return { label: "서비스워커", status: "미지원", level: "warning", detail: "현재 브라우저가 오프라인 앱 기능을 지원하지 않습니다.", actions: [] };
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        const controller = navigator.serviceWorker.controller;
        const active = registration?.active;
        const expectedScript = active?.scriptURL?.includes("service-worker.js");
        if (!controller || !active || !expectedScript) return diagnosticItem("서비스워커", "복구 필요", "warning", "현재 페이지를 제어하는 활성 서비스워커를 확인하지 못했습니다.", "repair-service-worker", "앱 캐시 복구", "복구중…");
        const appExact = await cacheContainsExact(DIAGNOSTIC_CACHE_NAMES.app, DIAGNOSTIC_APP_SHELL);
        const imagesExact = await cacheContainsExact(DIAGNOSTIC_CACHE_NAMES.images, DIAGNOSTIC_GATE_IMAGES);
        const dataExact = await cacheContainsExact(DIAGNOSTIC_CACHE_NAMES.data, ["./locations.json"]);
        const waitingText = registration.waiting ? " · 새 버전 대기 중" : "";
        const detail = `${FINAL_BUILD_INFO.serviceWorkerVersion} 제어 중 · 앱 ${appExact ? "정상" : "누락"} · 이미지 ${imagesExact ? "정상" : "누락"} · 좌표 ${dataExact ? "정상" : "누락"}${waitingText}`;
        return appExact && imagesExact && dataExact
            ? { label: "서비스워커", status: registration.waiting ? "업데이트 대기" : "정상", level: registration.waiting ? "warning" : "good", detail, actions: registration.waiting ? [{ key: "repair-service-worker", label: "앱 캐시 확인", busyLabel: "확인중…" }] : [] }
            : diagnosticItem("서비스워커", "캐시 복구 필요", "warning", detail, "repair-service-worker", "앱 캐시 복구", "복구중…");
    } catch (error) {
        return diagnosticItem("서비스워커", "오류", "error", cleanText(error.message) || "서비스워커 상태를 읽지 못했습니다.", "repair-service-worker", "앱 캐시 복구", "복구중…");
    }
};

/* 기존 진단 수집 결과에서 GPS·동기화 항목을 실제 상태 기반 결과로 교체합니다. */
const originalCollectDiagnosticsV23 = collectDiagnostics;
collectDiagnostics = async function collectDiagnosticsV23() {
    const diagnostics = await originalCollectDiagnosticsV23();
    const gpsItem = await getGpsDiagnosticItemV23();
    const syncItem = getRecentSyncDiagnosticItemV23();
    return diagnostics.map(item => item.label === "GPS 감시" ? gpsItem : item.label === "최근 동기화" ? syncItem : item);
};

/* 빠른 재실행이 아니라 실제 초기화 오류가 반복될 때만 안전모드 후보로 기록합니다. */
(function initializeRobustBootFailureTrackingV23() {
    try {
        sessionStorage.setItem(LONGTERM_CONFIG.BOOT_FAILURE_KEY, JSON.stringify({ count: 0, at: Date.now() }));
        if (localStorage.getItem(LONGTERM_CONFIG.SAFE_MODE_KEY) !== "1") longtermState.safeMode = false;
    } catch (error) {}
    const bootStartedAt = Date.now();
    const recordFailure = value => {
        if (Date.now() - bootStartedAt > FINAL_DIAGNOSTIC_CONFIG.BOOT_ERROR_WINDOW_MS) return;
        const message = cleanText(value?.message || value) || "초기화 오류";
        try {
            const previous = JSON.parse(localStorage.getItem(FINAL_DIAGNOSTIC_CONFIG.BOOT_ERROR_STATE_KEY) || "{}");
            const same = cleanText(previous.message) === message && Date.now() - Number(previous.at) < 10 * 60 * 1000;
            const next = { message, count: same ? (Number(previous.count) || 0) + 1 : 1, at: Date.now() };
            localStorage.setItem(FINAL_DIAGNOSTIC_CONFIG.BOOT_ERROR_STATE_KEY, JSON.stringify(next));
            if (next.count >= 3) localStorage.setItem(LONGTERM_CONFIG.SAFE_MODE_KEY, "1");
        } catch (error) {}
    };
    window.addEventListener("error", event => recordFailure(event.error || event.message));
    window.addEventListener("unhandledrejection", event => recordFailure(event.reason));
    window.setTimeout(() => {
        try { localStorage.removeItem(FINAL_DIAGNOSTIC_CONFIG.BOOT_ERROR_STATE_KEY); } catch (error) {}
    }, FINAL_DIAGNOSTIC_CONFIG.BOOT_ERROR_WINDOW_MS + 1000);
})();


/* ========================= v25 전체 UI 정합성 최적화 ========================= */
const V25_UI_CONFIG = Object.freeze({
    fileVersion: "20260716-11",
    serviceWorkerVersion: "v36",
    statusTimestampMaxAge: 10 * 60 * 1000,
    minimumBusyMs: 450
});
const v25UiState = {
    buttonLocks: new WeakMap(),
    lastStatusAt: new WeakMap(),
    currentOperationButton: null,
    operationButtons: new Map(),
    statusObserver: null
};

function getSemanticLevelFromText(value) {
    const text = cleanText(value);
    if (!text) return "neutral";
    if (/실패|오류|충돌|느림|비정상|복구 필요|차단|만료/u.test(text)) return "danger";
    if (/주의|확인 필요|지연|오래됨|오프라인|대기|재시도|없음/u.test(text)) return "warning";
    if (/중|확인 중|분석 중|불러오는 중|저장중|전송중|점검중|복구중|동기화중|백업중|비교중/u.test(text)) return "progress";
    if (/정상|최신|완료|성공|일치|사용 중/u.test(text)) return "good";
    return "neutral";
}

function applySemanticStatus(element, explicitLevel = "", checkedAt = 0) {
    if (!element) return;
    const level = explicitLevel || getSemanticLevelFromText(element.textContent);
    element.classList.remove("status-good", "status-warning", "status-danger", "status-progress", "status-neutral");
    element.classList.add(`status-${level}`);
    const timestamp = Number(checkedAt) || Number(element.dataset.checkedAt) || Date.now();
    element.dataset.checkedAt = String(timestamp);
    const age = Date.now() - timestamp;
    element.classList.toggle("status-stale", age > V25_UI_CONFIG.statusTimestampMaxAge && ["good", "neutral"].includes(level));
    const timeText = formatLocalDateTime(timestamp);
    element.title = `${cleanText(element.textContent)} · 확인 ${timeText}`;
}

function initializeSemanticStatusSystem() {
    const targets = [elements.gpsStatusBadge, elements.dataSyncStatus, elements.historyStatus, elements.adminStatus,
        elements.adminPerformanceStatus, elements.adminDataQualityStatus, document.getElementById("adminDiagnosticsStatus"),
        elements.autoBackupStatus, elements.adminStatsCheckedAt].filter(Boolean);
    for (const target of targets) applySemanticStatus(target);
    v25UiState.statusObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            const target = mutation.target.nodeType === Node.TEXT_NODE ? mutation.target.parentElement : mutation.target;
            if (targets.includes(target)) applySemanticStatus(target);
        }
    });
    for (const target of targets) v25UiState.statusObserver.observe(target, { childList: true, characterData: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => window.setTimeout(initializeSemanticStatusSystem, 0), { once: true });

function setButtonBusy(button, busyText, options = {}) {
    if (!button || v25UiState.buttonLocks.has(button)) return () => {};
    const original = { text: button.textContent, disabled: button.disabled, ariaBusy: button.getAttribute("aria-busy") };
    const startedAt = performance.now();
    v25UiState.buttonLocks.set(button, original);
    button.disabled = true;
    button.classList.add("is-processing");
    button.setAttribute("aria-busy", "true");
    if (busyText) button.textContent = busyText;
    return async (finalText = "") => {
        const elapsed = performance.now() - startedAt;
        const minimum = Number(options.minimumMs ?? V25_UI_CONFIG.minimumBusyMs);
        if (elapsed < minimum) await new Promise(resolve => setTimeout(resolve, minimum - elapsed));
        const saved = v25UiState.buttonLocks.get(button) || original;
        button.disabled = saved.disabled;
        button.classList.remove("is-processing");
        if (saved.ariaBusy === null) button.removeAttribute("aria-busy"); else button.setAttribute("aria-busy", saved.ariaBusy);
        button.textContent = finalText || saved.text;
        v25UiState.buttonLocks.delete(button);
    };
}

function updateDataSyncRetryStatus(attempts, delay) {
    if (!elements.dataSyncStatus) return;
    const seconds = Math.max(1, Math.ceil(Number(delay) / 1000));
    elements.dataSyncStatus.textContent = `연결 지연 · ${seconds}초 후 다시 시도 (${attempts}회)`;
    applySemanticStatus(elements.dataSyncStatus, "warning", Date.now());
}

function showOperationSummary(title, details = []) {
    const lines = [cleanText(title), ...details.map(cleanText).filter(Boolean)];
    showToast(lines.filter(Boolean).join(" · "));
}

function standardizedConfirm({ title, target = "", effect = "", reversible = false, keyword = "" }) {
    const lines = [cleanText(title), cleanText(target), cleanText(effect), reversible ? "수정기록에서 되돌릴 수 있습니다." : "이 작업은 자동으로 되돌릴 수 없습니다."].filter(Boolean);
    if (!keyword) return window.confirm(lines.join("\n"));
    const value = window.prompt(`${lines.join("\n")}\n\n계속하려면 '${keyword}'를 입력하세요.`);
    return cleanText(value) === keyword;
}

/* 핵심 저장 버튼은 기기 반영과 서버 반영을 구분해 표시합니다. */
function markQueuedButton(button, busyText) {
    if (!button) return;
    const release = setButtonBusy(button, busyText, { minimumMs: 500 });
    window.setTimeout(() => release(), 550);
}
const v25SubmitCommon = submitCommonPwdForm;
submitCommonPwdForm = function submitCommonPwdFormV25() { markQueuedButton(elements.commonSaveBtn, navigator.onLine === false ? "기기에 저장중…" : "저장 요청중…"); return v25SubmitCommon(); };
const v25SubmitAdd = submitAddPwd;
submitAddPwd = function submitAddPwdV25() { markQueuedButton(elements.addPwdSubmitBtn, navigator.onLine === false ? "기기에 저장중…" : "추가 요청중…"); return v25SubmitAdd(); };
const v25SubmitUpdate = submitUpdatePassword;
submitUpdatePassword = function submitUpdatePasswordV25() { markQueuedButton(elements.updateSelectedPwdBtn, navigator.onLine === false ? "기기에 저장중…" : "수정 요청중…"); return v25SubmitUpdate(); };
const v25SubmitDelete = confirmDeleteSelectedPassword;
confirmDeleteSelectedPassword = function confirmDeleteSelectedPasswordV25() {
    const password = cleanText(elements.selectedPwdOriginal?.value);
    if (!password) return v25SubmitDelete();
    if (!standardizedConfirm({ title: "선택한 비밀번호를 삭제합니다.", target: password, effect: "해당 라인에서 이 비밀번호 1개가 제거됩니다.", reversible: true })) return;
    markQueuedButton(elements.deleteSelectedPwdBtn, navigator.onLine === false ? "기기에 저장중…" : "삭제 요청중…");
    // 기존 확인창을 다시 띄우지 않도록 임시 대체
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try { return v25SubmitDelete(); } finally { window.confirm = originalConfirm; }
};

/* 비동기 관리자 작업은 실제 완료 후에만 완료 요약을 표시합니다. */
const v25CreateBackup = createDataBackup;
createDataBackup = async function createDataBackupV25() {
    const release = setButtonBusy(elements.createBackupBtn, "백업중…", { minimumMs: 700 });
    const before = Array.isArray(state.adminDashboard?.backups) ? state.adminDashboard.backups.length : 0;
    try {
        const result = await v25CreateBackup();
        const after = Array.isArray(state.adminDashboard?.backups) ? state.adminDashboard.backups.length : before;
        showOperationSummary("백업 확인 완료", [`현재 백업 ${after}개`, "최근 5개 유지"]);
        return result;
    } finally { await release(); }
};

const v25SetupBackup = setupAutomaticBackup;
setupAutomaticBackup = async function setupAutomaticBackupV25() {
    const release = setButtonBusy(elements.setupAutoBackupBtn, "설정중…", { minimumMs: 700 });
    try { return await v25SetupBackup(); } finally { await release(); }
};

/* 빈 상태는 로딩/오류/데이터 없음이 구분되도록 공통 속성을 부여합니다. */
function decorateEmptyStates() {
    document.querySelectorAll(".status-msg,.backup-empty,.admin-stats-empty,.admin-quality-empty").forEach(node => {
        const text = cleanText(node.textContent);
        node.dataset.emptyReason = /불러오|확인 중|로딩/u.test(text) ? "loading" : /실패|오류|못했습니다/u.test(text) ? "error" : "empty";
        node.setAttribute("role", "status");
    });
}
const v25EmptyObserver = new MutationObserver(decorateEmptyStates);
document.addEventListener("DOMContentLoaded", () => {
    decorateEmptyStates();
    v25EmptyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}, { once: true });

/* 실제 배포 버전은 단일 상수에서 관리자 화면과 진단에 전달합니다. */
window.GIMPO_B_BUILD_INFO = V25_UI_CONFIG;

/* 접근성: 모달이 열릴 때 첫 사용 가능한 컨트롤로 초점을 이동합니다. */
const v25OpenModal = openModal;
openModal = function openModalV25(modal) {
    const result = v25OpenModal(modal);
    window.setTimeout(() => {
        const focusTarget = modal?.querySelector('input:not([disabled]),button:not([disabled]):not([aria-label*="닫기"])');
        focusTarget?.focus({ preventScroll: true });
    }, 60);
    return result;
};

/* 실패 메시지를 유형별로 분류해 사용자에게 다음 행동을 안내합니다. */
function classifyUserFacingError(error) {
    const message = cleanText(error?.message || error);
    if (/PIN|인증|만료/u.test(message)) return { type: "인증", advice: "관리자 인증을 다시 진행해주세요." };
    if (/충돌|먼저 변경|최신 데이터/u.test(message)) return { type: "데이터 충돌", advice: "최신 데이터를 확인한 뒤 다시 입력해주세요." };
    if (isTransientNetworkErrorMessage(message)) return { type: "네트워크", advice: "연결 상태를 확인하면 자동으로 다시 시도합니다." };
    if (/입력|필수|숫자|선택/u.test(message)) return { type: "입력", advice: "입력 내용을 확인해주세요." };
    return { type: "시스템", advice: "관리자 진단 보고서에서 상태를 확인해주세요." };
}

window.addEventListener("unhandledrejection", event => {
    const info = classifyUserFacingError(event.reason);
    logLocalError(`unhandled-${info.type}`, event.reason || new Error("비동기 작업 오류"), { advice: info.advice });
});

/* 모든 주요 버튼의 최소 터치 크기와 실행 상태를 최종 확인합니다. */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("button").forEach(button => {
        button.classList.add("touch-target");
        if (!button.hasAttribute("aria-label") && cleanText(button.textContent)) button.setAttribute("aria-label", cleanText(button.textContent));
    });
}, { once: true });


/* ========================= v33 공동비번 수정·삭제 ========================= */
/* 저장 작업은 로컬 대기열 등록과 화면 반영이 동기식이므로, 검증 실패에도 표시되던 임시 진행 상태를 제거합니다. */
submitCommonPwdForm = v25SubmitCommon;
submitAddPwd = v25SubmitAdd;
submitUpdatePassword = v25SubmitUpdate;
confirmDeleteSelectedPassword = function confirmDeleteSelectedPasswordV29() {
    const rowId = cleanText(elements.deletePwdRowId.value);
    const password = cleanText(elements.selectedPwdOriginal?.value);
    const record = findRecordByRowId(rowId);
    if (!record || !password) return showToast("삭제할 비밀번호를 선택해주세요.");
    if (!standardizedConfirm({
        title: "선택한 비밀번호를 삭제합니다.",
        target: password,
        effect: "해당 라인에서 이 비밀번호 1개가 제거됩니다.",
        reversible: true
    })) return;
    enqueuePendingOperation("deletePassword", { rowId, password });
    record.password = sortPasswords(splitPasswords(record.password)
        .filter(item => normalizePasswordForCompare(item) !== normalizePasswordForCompare(password)))
        .join(" / ");
    saveRecordsToCache(state.records);
    closeDeletePwdModal();
    refreshPasswordCard(rowId);
};

/* 기존 백업 함수는 오류를 내부에서 처리해 성공 여부를 반환하지 않았으므로, 완료 안내가 실패 뒤에도 나올 수 있었습니다. */
createDataBackup = async function createDataBackupV29() {
    if (state.backupCreating || state.restoringBackupName) return false;
    const release = setButtonBusy(elements.createBackupBtn, "백업중…", { minimumMs: 700 });
    state.backupCreating = true;
    if (state.adminDashboard) renderAdminDashboard();
    try {
        const response = await requestApi("createBackup", {
            operationId: createOperationId(),
            adminToken: requireAdminToken()
        });
        await loadAdminDashboard(false);
        const count = Array.isArray(state.adminDashboard?.backups) ? state.adminDashboard.backups.length : 0;
        showOperationSummary("백업 생성 완료", [response?.backup?.name || "새 백업", `현재 백업 ${count}개`, "최근 5개 유지"]);
        return true;
    } catch (error) {
        console.error("백업 생성 실패:", error);
        if (!handleAdminAuthError(error)) window.alert(`백업 생성에 실패했습니다.\n${error.message}`);
        return false;
    } finally {
        state.backupCreating = false;
        if (state.adminDashboard) renderAdminDashboard();
        await release();
    }
};

/* 관리자 버튼의 상태등은 시각적 신호만 제공하며 공개 화면의 접근성 이름에도 상태를 노출하지 않습니다. */
document.addEventListener("DOMContentLoaded", () => {
    const badge = elements.adminPerformanceAlertBadge;
    if (badge) {
        badge.setAttribute("aria-hidden", "true");
        badge.removeAttribute("aria-label");
        badge.removeAttribute("title");
    }
}, { once: true });
