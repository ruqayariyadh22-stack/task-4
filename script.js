const $ = id => document.getElementById(id);
const counterValue      = $("counterValue");
const increaseButton    = $("increaseButton");
const decreaseButton    = $("decreaseButton");
const resetButton       = $("resetButton");
const undoButton        = $("undoButton");
const redoButton        = $("redoButton");
const counterCircle     = $("counterCircle");
const progressFill      = $("progressFill");
const progressText      = $("progressText");
const highestValue      = $("highestValue");
const lowestValue       = $("lowestValue");
const increaseValue     = $("increaseValue");
const decreaseValue     = $("decreaseValue");
const statusValue       = $("statusValue");
const lastUpdated       = $("lastUpdated");
const themeButton       = $("themeButton");
const menuButton        = $("menuButton");
const sidebar           = $("sidebar");
const closeSidebar      = $("closeSidebar");
const overlay           = $("overlay");
const todayValue        = $("todayValue");
const weekValue         = $("weekValue");
const monthValue        = $("monthValue");
const allTimeValue      = $("allTimeValue");
const goalValue         = $("goalValue");


const GOAL = 50;
const LIMIT_MIN = -100;
const LIMIT_MAX = 100;

let state = {
    count: 0,
    highest: 0,
    lowest: 0,
    increases: 0,
    decreases: 0,
    history: [],
    redoHistory: [],
    stats: {
        today: 0,
        week: 0,
        month: 0,
        allTime: 0,
        lastDate: null
    }
};

function getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getWeekKey(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); 
    d.setDate(d.getDate() - day);
    return getDateKey(d);
}

function getMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}


function checkDateReset() {
    const now = new Date();
    const today = getDateKey(now);
    const week  = getWeekKey(now);
    const month = getMonthKey(now);

    if (state.stats.lastDate) {
        const last = new Date(state.stats.lastDate);
        
        if (getDateKey(last) !== today) {
            state.stats.today = 0;
        }
        if (getWeekKey(last) !== week) {
            state.stats.week = 0;
        }
        if (getMonthKey(last) !== month) {
            state.stats.month = 0;
        }
    }
    state.stats.lastDate = now.toISOString();
}

function saveState() {
    try {
        localStorage.setItem("counterData", JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save:", e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem("counterData");
        if (!raw) return; 
        const data = JSON.parse(raw);
        if (data && typeof data.count === "number") {
            state = { ...state, ...data };
            if (!state.stats) {
                state.stats = { today:0, week:0, month:0, allTime:0, lastDate:null };
            }
            checkDateReset();
        }
    } catch (e) {
        console.warn("Failed to load:", e);
        localStorage.removeItem("counterData");
    }
}
function pushHistory() {
    state.redoHistory = [];
    state.history.push({
        count: state.count,
        highest: state.highest,
        lowest: state.lowest,
        increases: state.increases,
        decreases: state.decreases,
        stats: JSON.parse(JSON.stringify(state.stats))
    });
    if (state.history.length > 50) state.history.shift();
}

function popHistory() {
    if (!state.history.length) return false;
    state.redoHistory.push({
        count: state.count,
        highest: state.highest,
        lowest: state.lowest,
        increases: state.increases,
        decreases: state.decreases,
        stats: JSON.parse(JSON.stringify(state.stats))
    });
    const prev = state.history.pop();
    state.count     = prev.count;
    state.highest   = prev.highest;
    state.lowest    = prev.lowest;
    state.increases = prev.increases;
    state.decreases = prev.decreases;
    state.stats     = prev.stats;
    return true;
}

function popRedo() {
    if (!state.redoHistory.length) return false;
    state.history.push({
        count: state.count,
        highest: state.highest,
        lowest: state.lowest,
        increases: state.increases,
        decreases: state.decreases,
        stats: JSON.parse(JSON.stringify(state.stats))
    });
    const next = state.redoHistory.pop();
    state.count     = next.count;
    state.highest   = next.highest;
    state.lowest    = next.lowest;
    state.increases = next.increases;
    state.decreases = next.decreases;
    state.stats     = next.stats;
    return true;
}

function updateCircle() {
    const pct = Math.max(0, Math.min((state.count / GOAL) * 100, 100));
    const deg = (pct / 100) * 360;
    const gap = 15;
    const c1 = Math.max(0, deg - gap / 2);
    const c2 = Math.min(360, deg + gap / 2);

    counterCircle.style.background = `conic-gradient(
        var(--green) 0deg ${c1}deg,
        rgba(255,255,255,0.8) ${c1}deg ${c2}deg,
        var(--green) ${c2}deg 360deg
    )`;
}

function updateUI() {
    counterValue.textContent  = state.count;
    highestValue.textContent  = state.highest;
    lowestValue.textContent   = state.lowest;
    increaseValue.textContent = state.increases;
    decreaseValue.textContent = state.decreases;
    todayValue.textContent    = state.stats.today;
    weekValue.textContent     = state.stats.week;
    monthValue.textContent    = state.stats.month;
    allTimeValue.textContent  = state.stats.allTime;
    goalValue.textContent     = GOAL;

    const pct = Math.max(0, Math.min((state.count / GOAL) * 100, 100));
    progressFill.style.width = pct + "%";
    progressText.textContent = Math.round(pct) + "%";

    if (state.count >= GOAL)      statusValue.textContent = "Excellent";
    else if (state.count >= 30)   statusValue.textContent = "Good";
    else if (state.count >= 0)    statusValue.textContent = "Normal";
    else                          statusValue.textContent = "Low";

    updateCircle();
    saveState();
}

function animateCounter() {
    counterCircle.classList.remove("bump");
    void counterCircle.offsetWidth;
    counterCircle.classList.add("bump");
}

function updateTime() {
    lastUpdated.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function increase() {
    if (state.count >= LIMIT_MAX) return;
    checkDateReset();
    pushHistory();
    state.count++;
    state.increases++;
    state.stats.today++;
    state.stats.week++;
    state.stats.month++;
    state.stats.allTime++;
    state.highest = Math.max(state.highest, state.count);
    animateCounter();
    updateTime();
    updateUI();
}
function decrease() {
    if (state.count <= LIMIT_MIN) return;
    checkDateReset();
    pushHistory();
    state.count--;
    state.decreases++;
    state.stats.today++;
    state.stats.week++;
    state.stats.month++;
    state.stats.allTime++;
    state.lowest = Math.min(state.lowest, state.count);
    animateCounter();
    updateTime();
    updateUI();
}

function reset() {
    if (!confirm("Are you sure you want to reset everything?")) return;
    pushHistory();
    state.count = 0;
    state.highest = 0;
    state.lowest = 0;
    state.increases = 0;
    state.decreases = 0;
    state.stats.today = 0;
    state.stats.week = 0;
    state.stats.month = 0;
    animateCounter();
    updateTime();
    updateUI();
}

function undo() {
    if (popHistory()) { animateCounter(); updateUI(); }
}

function redo() {
    if (popRedo()) { animateCounter(); updateUI(); }
}

function initTheme() {
    const saved = localStorage.getItem("counterTheme");
    if (saved === "dark") {
        document.body.classList.add("dark");
        themeButton.textContent = "☽";
    } else {
        themeButton.textContent = "☼";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("counterTheme", isDark ? "dark" : "light");
    themeButton.textContent = isDark ? "☽" : "☼";
}

function openMenu()  { sidebar.classList.add("active"); overlay.classList.add("active"); }
function closeMenu() { sidebar.classList.remove("active"); overlay.classList.remove("active"); }

increaseButton.addEventListener("click", increase);
decreaseButton.addEventListener("click", decrease);
resetButton.addEventListener("click", reset);
undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);
themeButton.addEventListener("click", toggleTheme);
menuButton.addEventListener("click", openMenu);
closeSidebar.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowUp"   || e.key === "+") increase();
    if (e.key === "ArrowDown" || e.key === "-") decrease();
    if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    if (e.key === "Escape") closeMenu();
});

loadState();
initTheme();
updateUI();
updateTime();