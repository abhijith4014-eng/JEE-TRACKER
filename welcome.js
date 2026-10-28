// JEE Welcome & Countdown - Local Offline Script
const CHAPTERS_COUNT = {
    physics: 28,
    chemistry: 21,
    maths: 27
};
const TOTAL_CHAPTERS = CHAPTERS_COUNT.physics + CHAPTERS_COUNT.chemistry + CHAPTERS_COUNT.maths;

const TRACKER_STORAGE_KEY = 'jee_tracker_state';
const TESTS_STORAGE_KEY = 'jee_mock_tests';
const EXAM_DATE_KEY = 'jee_exam_date';

let countdownInterval = null;

// Dynamically update the year in headers and title based on selected date
function updateTargetYear(customYear) {
    let year = customYear;
    if (!year) {
        year = '2026';
        const savedDate = localStorage.getItem(EXAM_DATE_KEY);
        if (savedDate) {
            const parts = savedDate.split('-');
            if (parts[0] && parts[0].length === 4) {
                year = parts[0];
            }
        }
    }

    document.querySelectorAll('.jee-year').forEach(el => {
        el.textContent = year;
    });
    document.title = `JEE ${year} - Welcome`;
}

function updatePotion(percentage) {
    const liquid = document.getElementById('syllabus-liquid');
    const percentText = document.getElementById('welcome-percent');

    const safePercent = Math.min(100, Math.max(0, percentage));
    if (percentText) percentText.textContent = `${safePercent}%`;
    if (liquid) liquid.style.top = `${100 - safePercent}%`;
}

function loadPotionProgress() {
    try {
        const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            let completedCount = 0;
            if (data.physics) completedCount += data.physics.filter(Boolean).length;
            if (data.chemistry) completedCount += data.chemistry.filter(Boolean).length;
            if (data.maths) completedCount += data.maths.filter(Boolean).length;

            const percentage = Math.round((completedCount / TOTAL_CHAPTERS) * 100);
            updatePotion(percentage);
            return;
        }
    } catch (e) {
        console.warn("Error reading potion progress:", e);
    }
    updatePotion(0);
}

function updateWelcomeGraph(tests) {
    const graphContainer = document.getElementById('welcomeRightPanel');
    if (graphContainer) graphContainer.style.display = 'flex';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const parts = String(dateString).split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    };

    const validTests = Array.isArray(tests) ? tests : [];
    const labels = validTests.map(t => formatDate(t.dateObj));
    const totalData = validTests.map(t => parseInt(t.physics || 0, 10) + parseInt(t.chemistry || 0, 10) + parseInt(t.maths || 0, 10));

    const scoreDisplay = document.getElementById('latestScoreDisplay');
    if (scoreDisplay) {
        if (validTests.length > 0) {
            const latestTest = validTests[validTests.length - 1];
            const latestTotal = parseInt(latestTest.physics || 0, 10) + parseInt(latestTest.chemistry || 0, 10) + parseInt(latestTest.maths || 0, 10);
            scoreDisplay.innerHTML = `
                <span class="label">Latest Score</span>
                <span class="value">${latestTotal} / 300</span>
            `;
        } else {
            scoreDisplay.innerHTML = `
                <span class="label">Latest Score</span>
                <span class="value">-- / 300</span>
            `;
        }
    }

    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('welcomeTotalChart');
    if (!canvas) return;

    const existingChart = Chart.getChart("welcomeTotalChart");
    if (existingChart) existingChart.destroy();

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mock Test Progress',
                data: totalData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f59e0b',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 300,
                    display: false,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
                }
            }
        }
    });
}

function loadMockTests() {
    try {
        const raw = localStorage.getItem(TESTS_STORAGE_KEY);
        if (raw) {
            const tests = JSON.parse(raw);
            if (Array.isArray(tests)) {
                updateWelcomeGraph(tests);
                return;
            }
        }
    } catch (e) {
        console.warn("Error reading mock tests:", e);
    }
    updateWelcomeGraph([]);
}

function startCountdown(dateString) {
    if (!dateString) return;

    const examDateLabel = document.getElementById('exam-date-label');
    const parts = String(dateString).split('-');
    let dateObj;
    let selectedYear = '2026';

    if (parts.length === 3) {
        selectedYear = parts[0];
        dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
        dateObj = new Date(dateString);
        if (!isNaN(dateObj.getFullYear())) {
            selectedYear = String(dateObj.getFullYear());
        }
    }

    // Update dynamic year across the page
    updateTargetYear(selectedYear);

    if (examDateLabel) {
        examDateLabel.textContent = `Target: ${dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (click to edit)`;
        examDateLabel.title = "Click to change exam date";
    }

    const targetTime = dateObj.getTime();

    if (countdownInterval) clearInterval(countdownInterval);

    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetTime - now;

        const dEl = document.getElementById('days');
        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('minutes');
        const sEl = document.getElementById('seconds');

        if (distance < 0) {
            if (dEl) dEl.textContent = '00';
            if (hEl) hEl.textContent = '00';
            if (mEl) mEl.textContent = '00';
            if (sEl) sEl.textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (dEl) dEl.textContent = days < 10 ? '0' + days : days;
        if (hEl) hEl.textContent = hours < 10 ? '0' + hours : hours;
        if (mEl) mEl.textContent = minutes < 10 ? '0' + minutes : minutes;
        if (sEl) sEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

function initCountdown() {
    const dateModal = document.getElementById('dateModal');
    const saveDateBtn = document.getElementById('saveDateBtn');
    const examDateInput = document.getElementById('examDateInput');
    const examDateLabel = document.getElementById('exam-date-label');
    const countdownContainer = document.getElementById('countdown-container');

    const showDateModal = () => {
        if (dateModal) {
            const saved = localStorage.getItem(EXAM_DATE_KEY);
            if (saved && examDateInput) examDateInput.value = saved;
            dateModal.style.display = 'block';
        }
    };

    const hideDateModal = () => {
        if (dateModal) dateModal.style.display = 'none';
    };

    if (examDateLabel) {
        examDateLabel.addEventListener('click', showDateModal);
    }

    // Long press (1.5s) on countdown to edit
    let pressTimer;
    if (countdownContainer) {
        countdownContainer.addEventListener('mousedown', () => {
            pressTimer = setTimeout(showDateModal, 1500);
        });
        countdownContainer.addEventListener('mouseup', () => clearTimeout(pressTimer));
        countdownContainer.addEventListener('mouseleave', () => clearTimeout(pressTimer));
        countdownContainer.addEventListener('touchstart', () => {
            pressTimer = setTimeout(showDateModal, 1500);
        });
        countdownContainer.addEventListener('touchend', () => clearTimeout(pressTimer));
    }

    // Close modal if clicking outside when a date is already saved
    window.addEventListener('click', (e) => {
        if (e.target === dateModal && localStorage.getItem(EXAM_DATE_KEY)) {
            hideDateModal();
        }
    });

    if (examDateInput) {
        examDateInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (saveDateBtn) saveDateBtn.click();
            }
        });
    }

    if (saveDateBtn) {
        saveDateBtn.addEventListener('click', () => {
            const dateVal = examDateInput ? examDateInput.value : '';
            if (dateVal) {
                localStorage.setItem(EXAM_DATE_KEY, dateVal);
                hideDateModal();
                startCountdown(dateVal);
            }
        });
    }

    const savedDate = localStorage.getItem(EXAM_DATE_KEY);
    if (savedDate) {
        startCountdown(savedDate);
    } else {
        updateTargetYear('2026');
        showDateModal();
    }
}

function init() {
    updateTargetYear();
    loadPotionProgress();
    loadMockTests();
    initCountdown();

    window.addEventListener('storage', (e) => {
        if (e.key === TRACKER_STORAGE_KEY) {
            loadPotionProgress();
        } else if (e.key === TESTS_STORAGE_KEY) {
            loadMockTests();
        } else if (e.key === EXAM_DATE_KEY) {
            const saved = localStorage.getItem(EXAM_DATE_KEY);
            if (saved) startCountdown(saved);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
