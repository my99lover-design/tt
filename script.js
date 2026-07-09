const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyFbQUILKYrMZEfGl8tXPHThYEK1ncyU0JV36Dbfiqi5cdFRKY06PQUS4IwHDDLW8boIA/exec";
const LOCATIONS_JSON_URL = "locations.json"; 
let data = []; let locations = {}; let gpsWatchId = null; 
let currentStep = 1; let selectedRegion = ""; let selectedApt = ""; let selectedDong = "";

const buttonGrid = document.getElementById('buttonGrid');
const cardList = document.getElementById('cardList');
const themeToggle = document.getElementById('themeToggle');
const navContainer = document.getElementById('navContainer');
const stepContainer = document.getElementById('stepContainer');
const commonPwdStandalone = document.getElementById('commonPwdStandalone');
const gpsStatusBadge = document.getElementById('gpsStatusBadge');
const headerArea = document.querySelector(".header-area");
const themeButton = document.getElementById("themeToggle");
const gpsSection = document.getElementById("gpsSection");
const titleMain = document.getElementById("titleMain");
const titleSub = document.getElementById("titleSub");

const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '☀️ 밝기전환' : '🌙 밝기전환';
themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️ 밝기전환' : '🌙 밝기전환';
});

function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function initGPS() {
    if (!navigator.geolocation) return;
    if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
    const gpsOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    gpsWatchId = navigator.geolocation.watchPosition((position) => {
        const uLat = position.coords.latitude; const uLon = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        if (accuracy <= 15) gpsStatusBadge.innerHTML = `<span style="color:#22c55e;">🟢 강함 (${Math.round(accuracy)}m)</span>`;
        else if (accuracy <= 40) gpsStatusBadge.innerHTML = `<span style="color:#eab308;">🟡 중간 (${Math.round(accuracy)}m)</span>`;
        else gpsStatusBadge.innerHTML = `<span style="color:#ef4444;">🔴 약함 (${Math.round(accuracy)}m)</span>`;
        if (accuracy > 60) return; 
        const targetList = [];
        for (const key in locations) {
            const hasApt = data.some(item => item.아파트 && item.아파트 === key);
            const hasDong = data.some(item => item.동 && String(item.동) === key);
            if (!hasApt && !hasDong) continue;
            const coordsArray = Array.isArray(locations[key]) ? locations[key] : [locations[key]];
            let minDistance = Infinity;
            coordsArray.forEach(loc => {
                const dist = getDistance(uLat, uLon, Number(loc.lat), Number(loc.lon));
                if (dist < minDistance) minDistance = dist;
            });
            if (minDistance === Infinity) continue;
            if (hasApt) {
                const sample = data.find(item => item.아파트 === key);
                targetList.push({ name: key, realName: key, type: 'apt', region: sample ? sample.지역 : '', parentApt: '', dist: minDistance });
            } else if (hasDong) {
                const sample = data.find(item => String(item.동) === key);
                targetList.push({ name: key, realName: key, type: 'officetel', region: sample ? sample.지역 : '', parentApt: sample ? sample.아파트 : '', dist: minDistance });
            }
        }
        const sortedList = targetList.sort((a, b) => a.dist - b.dist).slice(0, 4);
        if (sortedList.length > 0) {
            const btnArea = document.getElementById('gpsButtons');
            btnArea.innerHTML = '';
            sortedList.forEach(target => {
                const btn = document.createElement('button'); btn.className = 'gps-btn';
                let distanceText = target.dist < 1 ? `${Math.round(target.dist * 1000)}m` : `${target.dist.toFixed(2)}km`;
                btn.innerHTML = `${target.realName}<br><span style="font-size:0.8em; opacity:0.8;">(${distanceText})</span>`;
                btn.addEventListener('click', () => {
                    selectedRegion = target.region;
                    if (target.type === 'officetel') { selectedApt = target.parentApt; selectDongStep(target.realName); }
                    else { selectAptStep(target.realName); }
                });
                btnArea.appendChild(btn);
            });
            if (currentStep === 1) {
    document.getElementById('gpsSection').style.display = 'block';
} else {
    document.getElementById('gpsSection').style.display = 'none';
}
        }
    }, (err) => { gpsStatusBadge.innerHTML = `<span style="color:#ef4444;">🔴 끊김 (오류)</span>`; }, gpsOptions);
}

async function loadData(silent = false) {
    const cachedData = localStorage.getItem('pwd_data_cache');
    const cachedLoc = localStorage.getItem('loc_data_cache');
    if (cachedData) {
        data = JSON.parse(cachedData); if (cachedLoc) locations = JSON.parse(cachedLoc);
        if (!silent) { refreshUIByCurrentStep(); initGPS(); }
    } else buttonGrid.innerHTML = '<div class="status-msg">데이터 동기화 중... ⏳</div>';
    try {
        const [sheetRes, locRes] = await Promise.all([fetch(GAS_WEB_APP_URL), fetch(LOCATIONS_JSON_URL + `?_=${Date.now()}`).catch(() => ({}))]);
        const newData = await sheetRes.json(); const newLoc = await (locRes.json ? locRes.json() : {});
        if (JSON.stringify(data) !== JSON.stringify(newData) || JSON.stringify(locations) !== JSON.stringify(newLoc)) {
            data = newData; locations = newLoc;
            localStorage.setItem('pwd_data_cache', JSON.stringify(newData)); localStorage.setItem('loc_data_cache', JSON.stringify(newLoc));
            if (!silent) { refreshUIByCurrentStep(); initGPS(); }
        }
    } catch (error) { if (!cachedData) buttonGrid.innerHTML = '<div class="status-msg">통신 실패 ❌ 연결을 확인하세요.</div>'; }
}

function refreshUIByCurrentStep() {
    if (currentStep === 1) resetSteps(); else if (currentStep === 2) selectRegionStep(selectedRegion);
    else if (currentStep === 3) selectAptStep(selectedApt); else if (currentStep === 4) selectDongStep(selectedDong);
}
function updateNav() {

    navContainer.style.display =
        currentStep > 1 ? "grid" : "none";

    updateHeader();

}
function updateHeader() {

    if (currentStep === 1) {

        headerArea.classList.remove("header-single");

        themeButton.style.display = "inline-flex";
        gpsSection.style.display = "block";

        titleMain.innerHTML = "넘버원🥇";
        titleSub.style.display = "block";

    } else {

        headerArea.classList.add("header-single");

        themeButton.style.display = "none";
        gpsSection.style.display = "none";

        titleMain.innerHTML = "넘버원🥇 김포B 공비";
        titleSub.style.display = "none";
    }
}
function goBack() {
    if (currentStep === 2) resetSteps(); else if (currentStep === 3) selectRegionStep(selectedRegion);
    else if (currentStep === 4) { if(selectedApt && data.some(d => d.아파트 === selectedApt && d.동 === selectedDong)) selectAptStep(selectedApt); else resetSteps(); }
}
function renderFinalCards(apt, dong) {
    cardList.innerHTML = '';
    const filtered = data.filter(item => apt ? item.아파트 === apt && String(item.동) === String(dong) : String(item.동) === String(dong));
    if (filtered.length === 0) { cardList.innerHTML = '<div class="status-msg">등록된 정보가 없습니다. 🔍</div>'; return; }
    const groupedByLine = filtered.reduce((acc, curr) => {
        let lineText = String(curr.라인).includes('라인') ? curr.라인 : `${curr.라인}라인`;
        if (!acc[lineText]) acc[lineText] = []; acc[lineText].push(curr); return acc;
    }, {});
    Object.keys(groupedByLine).sort((a, b) => (parseInt(a.match(/\d+/)?.[0]) || 0) - (parseInt(b.match(/\d+/)?.[0]) || 0)).forEach(lineText => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `<div class="line-info">&lt;${lineText}&gt;</div><div class="pwd-container">${groupedByLine[lineText].map(item => `<div class="pwd-row"><div class="pwd-box"><span class="pwd-highlight">${item.비번 || '-'}</span></div><div class="card-footer"><button class="edit-trigger-btn" onclick="openEditModal(${item.rowId})">수정</button></div></div>`).join('')}</div>`;
        cardList.appendChild(card);
    });
}
function showCommonPwdHeader(aptName) {
    const commonData = data.filter(item => item.아파트 === aptName).find(item => String(item.공동 || "").trim() !== "");
    const commonValue = commonData ? commonData.공동 : "등록 없음";
    commonPwdStandalone.innerHTML = `<div class="common-pwd-title">&lt;공동비번&gt;</div><div class="common-pwd-row"><div class="common-pwd-value">${commonValue}</div><button class="common-edit-btn" onclick="openCommonPwdModal('${aptName}', '${commonValue}')">수정</button></div>`;
    commonPwdStandalone.style.display = 'block';
}
function openCommonPwdModal(aptName, currentValue) { document.getElementById('commonModalAptLabel').textContent = `🏢 ${aptName} 공동비번`; document.getElementById('formCommonPwdValue').value = currentValue === "등록 없음" ? "" : currentValue; document.getElementById('commonEditorModal').style.display = 'flex'; }
function closeCommonModal() { document.getElementById('commonEditorModal').style.display = 'none'; }
async function submitCommonPwdForm() {
    const newValue = document.getElementById('formCommonPwdValue').value;
    data.filter(item => item.아파트 === selectedApt).forEach(item => item.공동 = newValue);
    localStorage.setItem('pwd_data_cache', JSON.stringify(data)); showCommonPwdHeader(selectedApt); closeCommonModal();
    try { await fetch(GAS_WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'updateCommonPwd', 아파트: selectedApt, 공동: newValue }) }); }
    catch (e) { alert("저장 실패!"); await loadData(); }
}
function resetSteps() {
    currentStep = 1; selectedRegion = ""; selectedApt = ""; selectedDong = ""; updateNav(); commonPwdStandalone.style.display = 'none'; stepContainer.style.display = 'block'; cardList.innerHTML = ''; 
    const regions = [...new Set(data.map(item => item.지역).filter(Boolean))]; buttonGrid.innerHTML = '';
    regions.forEach(region => { const btn = document.createElement('button'); btn.className = 'select-btn'; btn.textContent = region; btn.addEventListener('click', () => selectRegionStep(region)); buttonGrid.appendChild(btn); });
}
function selectRegionStep(region) {
    currentStep = 2; selectedRegion = region; selectedApt = ""; selectedDong = ""; updateNav(); commonPwdStandalone.style.display = 'none'; stepContainer.style.display = 'block'; cardList.innerHTML = ''; 
    const apts = [...new Set(data.filter(item => item.지역 === region).map(item => item.아파트).filter(Boolean))]; buttonGrid.innerHTML = '';
    apts.forEach(apt => { const btn = document.createElement('button'); btn.className = 'select-btn'; btn.textContent = apt; btn.addEventListener('click', () => selectAptStep(apt)); buttonGrid.appendChild(btn); });
}
function selectAptStep(apt) {
    currentStep = 3; selectedApt = apt; selectedDong = ""; updateNav(); showCommonPwdHeader(apt); stepContainer.style.display = 'block'; cardList.innerHTML = ''; 
    const dongs = [...new Set(data.filter(item => item.아파트 === apt).map(item => item.동).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b)); buttonGrid.innerHTML = '';
    dongs.forEach(dong => { const btn = document.createElement('button'); btn.className = 'select-btn'; btn.textContent = String(dong).replace(/동/g, '').trim(); btn.addEventListener('click', () => selectDongStep(dong)); buttonGrid.appendChild(btn); });
}
function selectDongStep(dong) { currentStep = 4; selectedDong = dong; updateNav(); commonPwdStandalone.style.display = 'none'; stepContainer.style.display = 'none'; renderFinalCards(selectedApt, dong); }
function openEditModal(rowId) {
    const item = data.find(d => d.rowId === rowId); if (!item) return;
    document.getElementById('formRowId').value = item.rowId; document.getElementById('readOnlyInfo').textContent = `${item.아파트} ${item.동}동 ${item.라인}`; document.getElementById('formPwd').value = item.비번 || '';
    document.getElementById('editorModal').style.display = 'flex'; document.getElementById('formPwd').focus(); 
}
function closeModal() { document.getElementById('editorModal').style.display = 'none'; }
async function submitForm() {
    const rowId = document.getElementById('formRowId').value; const newPwd = document.getElementById('formPwd').value;
    const item = data.find(d => d.rowId == rowId);
    if (item) { item.비번 = newPwd; localStorage.setItem('pwd_data_cache', JSON.stringify(data)); refreshUIByCurrentStep(); }
    closeModal();
    try { await fetch(GAS_WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'update', rowId, 비번: newPwd }) }); }
    catch (e) { alert("저장 실패!"); await loadData(); }
}
async function deleteData() {
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const rowId = document.getElementById('formRowId').value;
    data = data.filter(d => d.rowId != rowId); localStorage.setItem('pwd_data_cache', JSON.stringify(data)); closeModal(); refreshUIByCurrentStep();
    try { await fetch(GAS_WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', rowId: rowId }) }); }
    catch (e) { alert("삭제 실패!"); await loadData(); }
}
loadData();
