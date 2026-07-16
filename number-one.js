"use strict";

/* 넘버원 전용 주간 수행·추가금 계산기 */
const NUMBER_ONE_API_URL = "https://script.google.com/macros/s/AKfycbxMc74RsguWtr-4Nx3w2OeTctpb8-ILGN5j41kW97YNY-0KMX4FOfdvQUKDL0UGTbxk/exec";
const NUMBER_ONE_KEYS = Object.freeze({
    TOKEN: "gimpoB_number_one_token_v1",
    TOKEN_EXPIRES: "gimpoB_number_one_token_expires_v1",
    CLIENT_ID: "gimpoB_number_one_client_id_v1",
    CACHE: "gimpoB_number_one_week_cache_v1",
    PENDING: "gimpoB_number_one_pending_v1"
});
const numberOneState = {
    token: "",
    expiresAt: 0,
    data: null,
    selectedWorkDate: "",
    loading: false,
    saving: false,
    detailsOpen: false,
    pendingSync: false,
    screenOpen: false,
    saveButtonTimer: 0
};
const numberOneElements = {};

document.addEventListener("DOMContentLoaded", initializeNumberOne, { once: true });

function initializeNumberOne() {
    [
        "numberOneSection", "numberOneOpenBtn", "numberOneHomeBtn", "numberOneLocked", "numberOneApp", "numberOneLoginBtn", "numberOneRetryBtn",
        "numberOneWeekRange", "numberOneUserCode", "numberOneTotal", "numberOnePeak", "numberOneBonus",
        "numberOneCondition150", "numberOneConditionPeak", "numberOneStartPart", "numberOneStartCurrent", "numberOneWeekCurrent",
        "numberOnePeakPart", "numberOnePeakCurrent", "numberOneStandardCurrent", "numberOnePremiumCurrent", "numberOneInputTitle",
        "numberOneDayStatus", "numberOneTotalInput", "numberOneTen17Input", "numberOneSeventeen24Input",
        "numberOneInputGuide", "numberOneSaveBtn", "numberOneDeleteBtn",
        "numberOneDetailsToggle", "numberOneDetails", "numberOneSyncNote", "numberOnePinModal",
        "numberOnePinInput", "numberOnePinError", "numberOnePinSubmitBtn", "numberOnePinCancelBtn"
    ].forEach(id => { numberOneElements[id] = document.getElementById(id); });
    if (!numberOneElements.numberOneSection) return;

    numberOneElements.numberOneOpenBtn?.addEventListener("click", openNumberOneScreen);
    numberOneElements.numberOneHomeBtn?.addEventListener("click", closeNumberOneScreen);
    numberOneElements.numberOneLoginBtn?.addEventListener("click", openNumberOnePinModal);
    numberOneElements.numberOneRetryBtn?.addEventListener("click", refreshNumberOneWeek);
    numberOneElements.numberOnePinSubmitBtn?.addEventListener("click", submitNumberOnePin);
    numberOneElements.numberOnePinCancelBtn?.addEventListener("click", closeNumberOnePinModal);
    numberOneElements.numberOnePinInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") submitNumberOnePin();
        if (event.key === "Escape") closeNumberOnePinModal();
    });
    numberOneElements.numberOneSaveBtn?.addEventListener("click", saveNumberOneDay);
    numberOneElements.numberOneDeleteBtn?.addEventListener("click", deleteNumberOneDay);
    numberOneElements.numberOneDetailsToggle?.addEventListener("click", toggleNumberOneDetails);
    numberOneElements.numberOneUserCode?.addEventListener("click", copyNumberOneUserCode);
    ["numberOneTotalInput", "numberOneTen17Input", "numberOneSeventeen24Input"].forEach(id => {
        numberOneElements[id]?.addEventListener("input", validateNumberOneInputs);
    });
    window.addEventListener("online", flushNumberOnePending);

    restoreNumberOneSession();
    const cached = loadNumberOneCache();
    if (cached) {
        numberOneState.data = normalizeNumberOneSummary(cached);
        numberOneState.selectedWorkDate = cached.context?.currentWorkDate || "";
        renderNumberOneApp();
    } else if (!numberOneState.token) {
        renderNumberOneLocked();
    }
    numberOneElements.numberOneSection.hidden = true;
}

function openNumberOneScreen() {
    numberOneState.screenOpen = true;
    numberOneElements.numberOneSection.style.removeProperty("display");
    document.body.classList.add("number-one-screen-active");
    numberOneElements.numberOneSection.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
    if (numberOneState.data) renderNumberOneApp();
    else renderNumberOneLocked();
    if (numberOneState.token) refreshNumberOneWeek();
}

function closeNumberOneScreen() {
    numberOneState.screenOpen = false;
    document.body.classList.remove("number-one-screen-active");
    closeNumberOnePinModal(true);
    try {
        if (typeof resetSteps === "function") resetSteps();
    } catch (error) {}
    numberOneElements.numberOneSection.hidden = true;
    numberOneElements.numberOneSection.style.display = "none";
    window.scrollTo({ top: 0, behavior: "auto" });
}

function restoreNumberOneSession() {
    const token = localStorage.getItem(NUMBER_ONE_KEYS.TOKEN) || "";
    const expiresAt = Number(localStorage.getItem(NUMBER_ONE_KEYS.TOKEN_EXPIRES)) || 0;
    if (!token || (expiresAt && expiresAt <= Date.now())) {
        clearNumberOneSession();
        return;
    }
    numberOneState.token = token;
    numberOneState.expiresAt = expiresAt;
}

function saveNumberOneSession(token, expiresAt) {
    numberOneState.token = String(token || "");
    numberOneState.expiresAt = new Date(expiresAt || 0).getTime() || 0;
    localStorage.setItem(NUMBER_ONE_KEYS.TOKEN, numberOneState.token);
    localStorage.setItem(NUMBER_ONE_KEYS.TOKEN_EXPIRES, String(numberOneState.expiresAt));
}

function clearNumberOneSession() {
    numberOneState.token = "";
    numberOneState.expiresAt = 0;
    localStorage.removeItem(NUMBER_ONE_KEYS.TOKEN);
    localStorage.removeItem(NUMBER_ONE_KEYS.TOKEN_EXPIRES);
}

function getNumberOneClientId() {
    let clientId = localStorage.getItem(NUMBER_ONE_KEYS.CLIENT_ID) || "";
    if (clientId.length >= 12) return clientId;
    clientId = `no_${Date.now()}_${cryptoRandomText(28)}`;
    localStorage.setItem(NUMBER_ONE_KEYS.CLIENT_ID, clientId);
    return clientId;
}

function cryptoRandomText(length) {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (window.crypto?.getRandomValues) {
        const values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        return Array.from(values, value => alphabet[value % alphabet.length]).join("");
    }
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

async function numberOneRequest(action, payload = {}) {
    const response = await fetch(NUMBER_ONE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload }),
        cache: "no-store",
        redirect: "follow"
    });
    if (!response.ok) throw new Error(`서버 연결 실패 (${response.status})`);
    const result = await response.json();
    if (!result?.success) throw new Error(result?.message || "요청을 처리하지 못했습니다.");
    return result;
}

function renderNumberOneLocked(message = "") {
    numberOneElements.numberOneLocked.hidden = false;
    numberOneElements.numberOneApp.hidden = true;
    if (numberOneElements.numberOneRetryBtn) numberOneElements.numberOneRetryBtn.hidden = !message;
}

function renderNumberOneApp() {
    const data = numberOneState.data;
    if (!data) return;
    numberOneElements.numberOneLocked.hidden = true;
    numberOneElements.numberOneApp.hidden = false;
    const context = data.context || {};
    const summary = data.summary || {};
    if (!numberOneState.selectedWorkDate) numberOneState.selectedWorkDate = context.currentWorkDate || context.weekStart || "";

    numberOneElements.numberOneWeekRange.textContent = `${formatNumberOneDate(context.weekStart)} 06시 ~ ${formatNumberOneDate(context.weekEnd)} 05시`;
    numberOneElements.numberOneUserCode.textContent = data.userCode || "익명 사용자";
    numberOneElements.numberOneUserCode.title = "눌러서 익명 코드 복사";
    numberOneElements.numberOneTotal.textContent = `${formatNumber(summary.totalCount)}건`;
    numberOneElements.numberOnePeak.textContent = `${formatNumber(summary.tenToSeventeenCount)}건`;
    numberOneElements.numberOneBonus.textContent = formatMoney(summary.totalBonus);

    renderNumberOneConditionStatus(summary);
    renderNumberOneSelectedDay();
    renderNumberOneDetails();

    const pendingCount = loadNumberOnePending().length;
    numberOneElements.numberOneSyncNote.textContent = pendingCount
        ? `기기에 임시 저장된 기록 ${pendingCount}건 · 연결 시 자동 전송`
        : `기타시간 ${formatNumber(summary.otherTimeCount)}건 · 저장한 값은 내 기록에만 반영됩니다.`;
    numberOneElements.numberOneSyncNote.classList.toggle("warning", pendingCount > 0);
}

function renderNumberOneConditionStatus(summary = {}) {
    const totalCount = Math.max(0, Number(summary.totalCount) || 0);
    const peakCount = Math.max(0, Number(summary.tenToSeventeenCount) || 0);
    const premiumCount = Math.max(0, Number(summary.premiumEligibleCount) || 0);
    const standardCount = Math.max(0, Number(summary.standardEligibleCount) || 0);

    if (numberOneElements.numberOneStartCurrent) {
        numberOneElements.numberOneStartCurrent.textContent = formatNumber(totalCount);
    }
    if (numberOneElements.numberOneWeekCurrent) {
        numberOneElements.numberOneWeekCurrent.textContent = formatNumber(totalCount);
    }
    if (numberOneElements.numberOnePeakCurrent) {
        numberOneElements.numberOnePeakCurrent.textContent = formatNumber(peakCount);
    }
    if (numberOneElements.numberOneStandardCurrent) {
        numberOneElements.numberOneStandardCurrent.textContent = formatNumber(standardCount);
    }
    if (numberOneElements.numberOnePremiumCurrent) {
        numberOneElements.numberOnePremiumCurrent.textContent = formatNumber(premiumCount);
    }
    numberOneElements.numberOneStartPart?.classList.toggle("done", totalCount >= 151);
    numberOneElements.numberOnePeakPart?.classList.toggle("done", peakCount >= 100);
}

function renderNumberOneSelectedDay() {
    const data = numberOneState.data;
    if (!data) return;
    const workDate = numberOneState.selectedWorkDate || data.context?.currentWorkDate;
    const day = (data.days || []).find(item => item.workDate === workDate) || { workDate };
    const isToday = workDate === data.context?.currentWorkDate;
    numberOneElements.numberOneInputTitle.textContent = `${isToday ? "오늘" : getNumberOneWeekday(workDate)} · ${formatNumberOneDate(workDate)} 수행`;
    setNumberInput(numberOneElements.numberOneTotalInput, day.totalCount);
    setNumberInput(numberOneElements.numberOneTen17Input, day.tenToSeventeen);
    setNumberInput(numberOneElements.numberOneSeventeen24Input, getNumberOneSeventeenToTwentyFour(day));

    const hasAny = hasNumberOneDayValues(day);
    const complete = [day.totalCount, day.tenToSeventeen, day.tenToTwentyFour]
        .every(value => value !== null && value !== undefined);
    numberOneElements.numberOneDayStatus.textContent = complete ? "입력 완료" : (hasAny ? "입력 중" : "미입력");
    numberOneElements.numberOneDayStatus.className = `number-one-day-status ${complete ? "complete" : (hasAny ? "partial" : "")}`;
    if (numberOneElements.numberOneDeleteBtn) numberOneElements.numberOneDeleteBtn.disabled = !hasAny;
    validateNumberOneInputs();
}

function setNumberInput(element, value) {
    if (!element) return;
    element.value = value === null || value === undefined ? "" : String(value);
}

function hasNumberOneDayValues(day) {
    return [day?.totalCount, day?.tenToSeventeen, day?.tenToTwentyFour, day?.sixToTen]
        .some(value => value !== null && value !== undefined && value !== "");
}

function validateNumberOneInputs() {
    const values = readNumberOneInputs();
    let message = "기타시간(06~10시 + 00~05시)은 총건수에서 자동 계산됩니다.";
    let level = "";
    const invalidInput = [
        [numberOneElements.numberOneTotalInput, "총건수"],
        [numberOneElements.numberOneTen17Input, "10~17시"],
        [numberOneElements.numberOneSeventeen24Input, "17~24시"]
    ].find(([element]) => {
        const text = String(element?.value ?? "").trim();
        if (!text) return false;
        const number = Number(text);
        return !Number.isInteger(number) || number < 0 || number > 999;
    });
    const total = values.totalCount;
    const ten17 = values.tenToSeventeen;
    const seventeen24 = values.seventeenToTwentyFour;
    const ten24 = values.tenToTwentyFour;

    if (invalidInput || [total, ten17, seventeen24, ten24].some(value => value === null)) {
        message = `${invalidInput?.[1] || "입력값"}는 0~999 사이의 정수로 입력해주세요.`;
        level = "error";
    } else if (ten24 > total) {
        message = "10~17시와 17~24시 합계가 총건수를 초과합니다.";
        level = "error";
    } else {
        message = `기타시간 ${formatNumber(total - ten24)}건 자동 반영 · 공란은 0건`;
    }
    numberOneElements.numberOneInputGuide.textContent = message;
    numberOneElements.numberOneInputGuide.className = `number-one-input-guide ${level}`;
    numberOneElements.numberOneSaveBtn.disabled = numberOneState.saving || level === "error";
    return level !== "error";
}

function readNumberOneInputs() {
    const totalCount = parseCountOrZero(numberOneElements.numberOneTotalInput?.value);
    const tenToSeventeen = parseCountOrZero(numberOneElements.numberOneTen17Input?.value);
    const seventeenToTwentyFour = parseCountOrZero(numberOneElements.numberOneSeventeen24Input?.value);
    return {
        totalCount,
        tenToSeventeen,
        seventeenToTwentyFour,
        tenToTwentyFour: tenToSeventeen === null || seventeenToTwentyFour === null ? null : tenToSeventeen + seventeenToTwentyFour
    };
}

function getNumberOneStoredValues(values) {
    return {
        totalCount: values.totalCount,
        tenToSeventeen: values.tenToSeventeen,
        tenToTwentyFour: values.tenToTwentyFour,
        sixToTen: 0
    };
}

function parseCountOrZero(value) {
    const text = String(value ?? "").trim();
    if (!text) return 0;
    const number = Number(text);
    if (!Number.isInteger(number) || number < 0 || number > 999) return null;
    return number;
}

function getNumberOneSeventeenToTwentyFour(day) {
    const ten17 = day?.tenToSeventeen;
    const ten24 = day?.tenToTwentyFour;
    if (ten17 === null || ten17 === undefined || ten24 === null || ten24 === undefined) return null;
    return Math.max(0, (Number(ten24) || 0) - (Number(ten17) || 0));
}

async function refreshNumberOneWeek() {
    if (!numberOneState.token || numberOneState.loading) return;
    numberOneState.loading = true;
    try {
        const result = await numberOneRequest("numberOneGetWeek", { token: numberOneState.token });
        numberOneState.data = normalizeNumberOneSummary(result.data);
        numberOneState.selectedWorkDate = result.data?.context?.currentWorkDate || numberOneState.selectedWorkDate;
        reapplyNumberOnePendingLocally();
        saveNumberOneCache(numberOneState.data);
        renderNumberOneApp();
        await flushNumberOnePending();
    } catch (error) {
        if (/인증|토큰|만료|사용 중지/.test(error.message)) {
            clearNumberOneSession();
            renderNumberOneLocked();
            numberOneToast("전용 인증이 만료되었습니다.");
        } else if (numberOneState.data) {
            renderNumberOneApp();
            numberOneElements.numberOneSyncNote.textContent = "오프라인 저장본을 표시 중입니다.";
            numberOneElements.numberOneSyncNote.classList.add("warning");
        } else {
            renderNumberOneLocked(error.message);
        }
    } finally {
        numberOneState.loading = false;
    }
}

function openNumberOnePinModal() {
    numberOneElements.numberOnePinError.hidden = true;
    numberOneElements.numberOnePinError.textContent = "";
    numberOneElements.numberOnePinInput.value = "";
    numberOneElements.numberOnePinModal.style.display = "flex";
    window.setTimeout(() => numberOneElements.numberOnePinInput.focus(), 50);
}

function closeNumberOnePinModal(force = false) {
    if (numberOneState.loading && !force) return;
    numberOneElements.numberOnePinModal.style.display = "none";
}

async function submitNumberOnePin() {
    if (numberOneState.loading) return;
    const pin = String(numberOneElements.numberOnePinInput.value || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(pin)) {
        showNumberOnePinError("전용 PIN 숫자 6자리를 입력해주세요.");
        return;
    }
    numberOneState.loading = true;
    numberOneElements.numberOnePinSubmitBtn.disabled = true;
    numberOneElements.numberOnePinSubmitBtn.textContent = "인증 중…";
    try {
        const result = await numberOneRequest("numberOneLogin", { pin, clientId: getNumberOneClientId() });
        saveNumberOneSession(result.token, result.expiresAt);
        numberOneState.data = normalizeNumberOneSummary(result.data);
        numberOneState.selectedWorkDate = result.data?.context?.currentWorkDate || "";
        reapplyNumberOnePendingLocally();
        saveNumberOneCache(numberOneState.data);
        closeNumberOnePinModal(true);
        renderNumberOneApp();
        numberOneToast(`인증 완료 · ${result.data?.userCode || "익명 사용자"}`);
    } catch (error) {
        showNumberOnePinError(error.message);
    } finally {
        numberOneState.loading = false;
        numberOneElements.numberOnePinSubmitBtn.disabled = false;
        numberOneElements.numberOnePinSubmitBtn.textContent = "확인";
    }
}

function showNumberOnePinError(message) {
    numberOneElements.numberOnePinError.textContent = message;
    numberOneElements.numberOnePinError.hidden = false;
}

async function saveNumberOneDay() {
    if (numberOneState.saving || !numberOneState.token || !numberOneState.data) return;
    if (!validateNumberOneInputs()) return;
    const inputValues = readNumberOneInputs();
    const values = getNumberOneStoredValues(inputValues);
    const workDate = numberOneState.selectedWorkDate || numberOneState.data.context?.currentWorkDate;
    if (!workDate) return;

    numberOneState.saving = true;
    queueNumberOnePending("save", workDate, values);
    applyNumberOneLocalSave(workDate, values);
    renderNumberOneApp();
    showNumberOneSavedButton();
    numberOneToast("기기에 바로 저장했습니다.");
    numberOneState.saving = false;
    validateNumberOneInputs();
    void flushNumberOnePending();
}

function showNumberOneSavedButton() {
    const button = numberOneElements.numberOneSaveBtn;
    if (!button) return;
    window.clearTimeout(numberOneState.saveButtonTimer);
    button.textContent = "저장됨";
    button.classList.add("saved");
    numberOneState.saveButtonTimer = window.setTimeout(() => {
        button.textContent = "저장";
        button.classList.remove("saved");
    }, 900);
}

function deleteNumberOneDay() {
    if (!numberOneState.token || !numberOneState.data) return;
    const workDate = numberOneState.selectedWorkDate || numberOneState.data.context?.currentWorkDate;
    const day = (numberOneState.data.days || []).find(item => item.workDate === workDate);
    if (!day || !hasNumberOneDayValues(day)) {
        numberOneToast("삭제할 입력기록이 없습니다.");
        return;
    }
    if (!window.confirm(`${formatNumberOneDate(workDate)} 입력기록을 전부 삭제할까요?`)) return;
    queueNumberOnePending("delete", workDate, null);
    applyNumberOneLocalDelete(workDate);
    renderNumberOneApp();
    numberOneToast("입력기록을 삭제했습니다.");
    void flushNumberOnePending();
}

function toggleNumberOneDetails() {
    numberOneState.detailsOpen = !numberOneState.detailsOpen;
    numberOneElements.numberOneDetails.hidden = !numberOneState.detailsOpen;
    numberOneElements.numberOneDetailsToggle.textContent = numberOneState.detailsOpen ? "이번 주 기록 접기" : "이번 주 기록 보기";
    if (numberOneState.detailsOpen) renderNumberOneDetails();
}

function renderNumberOneDetails() {
    if (!numberOneState.data || !numberOneElements.numberOneDetails) return;
    numberOneElements.numberOneDetails.hidden = !numberOneState.detailsOpen;
    if (!numberOneState.detailsOpen) return;
    const context = numberOneState.data.context || {};
    const daysMap = new Map((numberOneState.data.days || []).map(day => [day.workDate, day]));
    const dates = makeNumberOneWeekDates(context.weekStart);
    numberOneElements.numberOneDetails.innerHTML = `
        <div class="number-one-details-head"><span>요일</span><span>총</span><span>10~17</span><span>17~24</span><span></span></div>
        ${dates.map(workDate => {
            const day = daysMap.get(workDate) || {};
            const selected = workDate === numberOneState.selectedWorkDate;
            return `<button class="number-one-day-row${selected ? " selected" : ""}" type="button" data-work-date="${workDate}">
                <span class="number-one-day-name">${getNumberOneWeekday(workDate)} ${formatNumberOneDate(workDate, true)}</span>
                <span class="number-one-day-value">${displayDayValue(day.totalCount)}</span>
                <span class="number-one-day-value">${displayDayValue(day.tenToSeventeen)}</span>
                <span class="number-one-day-value">${displayDayValue(getNumberOneSeventeenToTwentyFour(day))}</span>
                <span class="number-one-day-edit">수정</span>
            </button>`;
        }).join("")}`;
    numberOneElements.numberOneDetails.querySelectorAll("[data-work-date]").forEach(button => {
        button.addEventListener("click", () => {
            numberOneState.selectedWorkDate = button.dataset.workDate || "";
            renderNumberOneSelectedDay();
            renderNumberOneDetails();
            numberOneElements.numberOneInputTitle?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });
}

function displayDayValue(value) {
    return value === null || value === undefined ? "-" : String(value);
}

function makeNumberOneWeekDates(weekStart) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(weekStart || ""))) return [];
    const base = new Date(`${weekStart}T00:00:00Z`);
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(base.getTime() + index * 86400000);
        return date.toISOString().slice(0, 10);
    });
}

function getNumberOneWeekday(dateText) {
    if (!dateText) return "";
    const names = ["일", "월", "화", "수", "목", "금", "토"];
    return `${names[new Date(`${dateText}T00:00:00Z`).getUTCDay()]}요일`;
}

function formatNumberOneDate(dateText, compact = false) {
    const match = String(dateText || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "-";
    return compact ? `${Number(match[2])}.${Number(match[3])}` : `${Number(match[2])}월 ${Number(match[3])}일`;
}

function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString("ko-KR");
}

function formatMoney(value) {
    return `${Math.max(0, Number(value) || 0).toLocaleString("ko-KR")}원`;
}

function copyNumberOneUserCode() {
    const code = numberOneState.data?.userCode;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => numberOneToast("익명 코드를 복사했습니다.")).catch(() => numberOneToast(code));
}

function saveNumberOneCache(data) {
    try { localStorage.setItem(NUMBER_ONE_KEYS.CACHE, JSON.stringify(data)); } catch (error) {}
}

function loadNumberOneCache() {
    try {
        const data = JSON.parse(localStorage.getItem(NUMBER_ONE_KEYS.CACHE) || "null");
        return data && typeof data === "object" ? data : null;
    } catch (error) { return null; }
}

function loadNumberOnePending() {
    try {
        const values = JSON.parse(localStorage.getItem(NUMBER_ONE_KEYS.PENDING) || "[]");
        return Array.isArray(values) ? values : [];
    } catch (error) { return []; }
}

function queueNumberOnePending(type, workDate, values) {
    const pending = loadNumberOnePending().filter(item => item.workDate !== workDate);
    pending.push({ type: type === "delete" ? "delete" : "save", workDate, values, savedAt: Date.now() });
    localStorage.setItem(NUMBER_ONE_KEYS.PENDING, JSON.stringify(pending));
}

function removeNumberOnePending(workDate, savedAt) {
    const pending = loadNumberOnePending().filter(item => {
        if (item.workDate !== workDate) return true;
        if (savedAt && Number(item.savedAt) !== Number(savedAt)) return true;
        return false;
    });
    localStorage.setItem(NUMBER_ONE_KEYS.PENDING, JSON.stringify(pending));
}

async function flushNumberOnePending() {
    if (numberOneState.pendingSync || !numberOneState.token || navigator.onLine === false) return;
    numberOneState.pendingSync = true;
    if (numberOneElements.numberOneSyncNote) {
        numberOneElements.numberOneSyncNote.textContent = "서버에 동기화 중…";
        numberOneElements.numberOneSyncNote.classList.add("syncing");
    }
    try {
        while (true) {
            const pending = loadNumberOnePending();
            if (!pending.length) break;
            const item = pending[0];
            const action = item.type === "delete" ? "numberOneDeleteDay" : "numberOneSaveDay";
            const payload = item.type === "delete"
                ? { token: numberOneState.token, workDate: item.workDate }
                : { token: numberOneState.token, workDate: item.workDate, values: item.values };
            await numberOneRequest(action, payload);
            removeNumberOnePending(item.workDate, item.savedAt);
        }
        if (numberOneState.data) saveNumberOneCache(numberOneState.data);
        renderNumberOneApp();
    } catch (error) {
        if (/인증|토큰|만료|사용 중지/.test(error.message)) {
            clearNumberOneSession();
            renderNumberOneLocked();
            numberOneToast("전용 인증이 만료되었습니다.");
        } else if (numberOneElements.numberOneSyncNote) {
            numberOneElements.numberOneSyncNote.textContent = "서버 연결 시 자동으로 다시 동기화합니다.";
            numberOneElements.numberOneSyncNote.classList.add("warning");
        }
    } finally {
        numberOneState.pendingSync = false;
        numberOneElements.numberOneSyncNote?.classList.remove("syncing");
        const remaining = loadNumberOnePending();
        if (remaining.length && navigator.onLine !== false && numberOneState.token) {
            window.setTimeout(() => void flushNumberOnePending(), 1200);
        }
    }
}

function reapplyNumberOnePendingLocally() {
    if (!numberOneState.data) return;
    const pending = loadNumberOnePending().slice().sort((a, b) => Number(a.savedAt) - Number(b.savedAt));
    for (const item of pending) {
        if (item.type === "delete") applyNumberOneLocalDelete(item.workDate);
        else applyNumberOneLocalSave(item.workDate, item.values || {});
    }
}

function applyNumberOneLocalSave(workDate, values) {
    if (!numberOneState.data) return;
    const days = Array.isArray(numberOneState.data.days) ? numberOneState.data.days : [];
    let day = days.find(item => item.workDate === workDate);
    if (!day) {
        day = { workDate, totalCount: null, tenToSeventeen: null, tenToTwentyFour: null, sixToTen: null };
        days.push(day);
    }
    Object.keys(values).forEach(key => {
        if (values[key] !== null) day[key] = values[key];
    });
    days.sort((a, b) => String(a.workDate).localeCompare(String(b.workDate)));
    numberOneState.data.days = days;
    numberOneState.data.summary = calculateNumberOneLocalSummary(days);
    saveNumberOneCache(numberOneState.data);
}

function applyNumberOneLocalDelete(workDate) {
    if (!numberOneState.data) return;
    const days = (Array.isArray(numberOneState.data.days) ? numberOneState.data.days : [])
        .filter(item => item.workDate !== workDate);
    numberOneState.data.days = days;
    numberOneState.data.summary = calculateNumberOneLocalSummary(days);
    saveNumberOneCache(numberOneState.data);
}

function calculateNumberOneLocalSummary(days) {
    const sorted = (days || []).slice().sort((a, b) => String(a.workDate).localeCompare(String(b.workDate)));
    let totalCount = 0;
    let tenToSeventeenCount = 0;
    let tenToTwentyFourCount = 0;
    for (const day of sorted) {
        totalCount += Math.max(0, Number(day.totalCount) || 0);
        tenToSeventeenCount += Math.max(0, Number(day.tenToSeventeen) || 0);
        tenToTwentyFourCount += Math.max(0, Number(day.tenToTwentyFour) || 0);
    }
    tenToTwentyFourCount = Math.min(totalCount, tenToTwentyFourCount);
    const otherTimeCount = Math.max(0, totalCount - tenToTwentyFourCount);
    const additionalCount = Math.max(0, totalCount - 150);
    const premiumQualified = totalCount >= 250 && tenToSeventeenCount >= 100;
    const standardEligibleCount = premiumQualified ? Math.min(additionalCount, otherTimeCount) : additionalCount;
    const premiumEligibleCount = premiumQualified ? Math.max(0, additionalCount - standardEligibleCount) : 0;
    const baseBonus = additionalCount * 1000;
    const premiumBonus = premiumEligibleCount * 500;
    return {
        totalCount,
        tenToSeventeenCount,
        tenToTwentyFourCount,
        otherTimeCount,
        additionalCount,
        standardEligibleCount,
        premiumEligibleCount,
        baseBonus,
        premiumBonus,
        totalBonus: baseBonus + premiumBonus,
        premiumQualified,
        bonusExact: true,
        hasMissingTotal: false,
        crossingWorkDate: "",
        needsSixToTen: false
    };
}

function normalizeNumberOneSummary(data) {
    if (!data || typeof data !== "object") return data;
    data.summary = calculateNumberOneLocalSummary(Array.isArray(data.days) ? data.days : []);
    return data;
}

function numberOneToast(message) {
    if (typeof showToast === "function") {
        showToast(message);
        return;
    }
    const toast = document.getElementById("toast");
    const text = document.getElementById("toastMessage");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
}
