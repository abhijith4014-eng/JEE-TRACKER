// JEE Mock Tests Dashboard - Local Offline Script
const STORAGE_KEY = 'jee_mock_tests';
const EXAM_DATE_KEY = 'jee_exam_date';

const form = document.getElementById('mockTestForm');
const testListContainer = document.getElementById('testList');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

let tests = [];
let deleteTargetId = null;

let totalChart = null;
let phyChart = null;
let chemChart = null;
let mathChart = null;

function updateTargetYear() {
    let year = '2026';
    const savedDate = localStorage.getItem(EXAM_DATE_KEY);
    if (savedDate) {
        const parts = savedDate.split('-');
        if (parts[0] && parts[0].length === 4) {
            year = parts[0];
        }
    }

    document.querySelectorAll('.jee-year').forEach(el => {
        el.textContent = year;
    });
    document.title = `JEE ${year} - Mock Tests`;

    // Set default year input in form if empty
    const yearInput = document.getElementById('year');
    if (yearInput && !yearInput.value) {
        yearInput.value = year;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = String(dateString).split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB');
}

function saveTests() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
    } catch (e) {
        console.warn("Error saving tests to localStorage:", e);
    }
}

function loadTests() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                tests = parsed;
                normalizeTests();
                return;
            }
        }
    } catch (e) {
        console.warn("Error reading tests from localStorage:", e);
    }
    tests = [];
}

function normalizeTests() {
    tests.forEach(t => {
        t.physics = parseInt(t.physics || 0, 10);
        t.chemistry = parseInt(t.chemistry || 0, 10);
        t.maths = parseInt(t.maths || 0, 10);
    });
    tests.sort((a, b) => (a.dateObj > b.dateObj ? 1 : (a.dateObj < b.dateObj ? -1 : 0)));
}

// Chart Configurations
const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            labels: { color: '#94a3b8' }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 300,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#94a3b8' }
        },
        x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        }
    }
};

const subjectOptions = {
    ...commonOptions,
    scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, max: 100 }
    }
};

function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded.");
        return;
    }
    const totalEl = document.getElementById('totalMarksChart');
    if (!totalEl) return;

    const labels = tests.map(t => formatDate(t.dateObj));
    const totalData = tests.map(t => t.physics + t.chemistry + t.maths);
    const phyData = tests.map(t => t.physics);
    const chemData = tests.map(t => t.chemistry);
    const mathData = tests.map(t => t.maths);

    if (totalChart) { totalChart.destroy(); totalChart = null; }
    if (phyChart) { phyChart.destroy(); phyChart = null; }
    if (chemChart) { chemChart.destroy(); chemChart = null; }
    if (mathChart) { mathChart.destroy(); mathChart = null; }

    totalChart = new Chart(totalEl.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Marks',
                data: totalData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: commonOptions
    });

    const phyEl = document.getElementById('phyChart');
    if (phyEl) {
        phyChart = new Chart(phyEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Physics', data: phyData, borderColor: '#22a4f5', borderWidth: 2, tension: 0.3 }]
            },
            options: subjectOptions
        });
    }

    const chemEl = document.getElementById('chemChart');
    if (chemEl) {
        chemChart = new Chart(chemEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Chemistry', data: chemData, borderColor: '#238531', borderWidth: 2, tension: 0.3 }]
            },
            options: subjectOptions
        });
    }

    const mathEl = document.getElementById('mathChart');
    if (mathEl) {
        mathChart = new Chart(mathEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Maths', data: mathData, borderColor: '#b91c1c', borderWidth: 2, tension: 0.3 }]
            },
            options: subjectOptions
        });
    }
}

function updateCharts() {
    if (typeof Chart === 'undefined') return;
    if (!totalChart) {
        initCharts();
        return;
    }

    const labels = tests.map(t => formatDate(t.dateObj));

    totalChart.data.labels = labels;
    totalChart.data.datasets[0].data = tests.map(t => t.physics + t.chemistry + t.maths);
    totalChart.update();

    if (phyChart) {
        phyChart.data.labels = labels;
        phyChart.data.datasets[0].data = tests.map(t => t.physics);
        phyChart.update();
    }

    if (chemChart) {
        chemChart.data.labels = labels;
        chemChart.data.datasets[0].data = tests.map(t => t.chemistry);
        chemChart.update();
    }

    if (mathChart) {
        mathChart.data.labels = labels;
        mathChart.data.datasets[0].data = tests.map(t => t.maths);
        mathChart.update();
    }
}

function renderTestList() {
    if (!testListContainer) return;
    testListContainer.innerHTML = '';

    if (tests.length === 0) {
        testListContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic;">
                No mock tests recorded yet. Add your first test above!
            </div>
        `;
        return;
    }

    const displayTests = [...tests].reverse();

    displayTests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';
        const total = test.physics + test.chemistry + test.maths;

        card.innerHTML = `
            <button class="delete-btn" title="Delete Test" aria-label="Delete Test">×</button>
            <h3 class="test-title">${test.name}</h3>
            <p class="test-date">${formatDate(test.dateObj)}</p>
            <div class="test-marks">
                <div class="mark-item phy">
                    <span>Physics</span>
                    <strong>${test.physics}</strong>
                </div>
                <div class="mark-item chem">
                    <span>Chemistry</span>
                    <strong>${test.chemistry}</strong>
                </div>
                <div class="mark-item math">
                    <span>Maths</span>
                    <strong>${test.maths}</strong>
                </div>
            </div>
            <div class="test-total">
                <span>Total</span>
                <strong>${total} / 300</strong>
            </div>
        `;

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTargetId = test.id;
            showModal();
        });

        testListContainer.appendChild(card);
    });
}

function showModal() {
    if (deleteModal) deleteModal.style.display = 'block';
}

function hideModal() {
    if (deleteModal) deleteModal.style.display = 'none';
    deleteTargetId = null;
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteTargetId) {
            tests = tests.filter(t => t.id !== deleteTargetId);
            saveTests();
            renderTestList();
            updateCharts();
            hideModal();
        }
    });
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', hideModal);
}

window.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        hideModal();
    }
});

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('testName');
        const dayInput = document.getElementById('day');
        const monthInput = document.getElementById('month');
        const yearInput = document.getElementById('year');
        const phyInput = document.getElementById('phyMarks');
        const chemInput = document.getElementById('chemMarks');
        const mathsInput = document.getElementById('mathsMarks');

        const name = nameInput ? nameInput.value.trim() : 'Test';
        const day = String(dayInput ? dayInput.value : '01').padStart(2, '0');
        const month = String(monthInput ? monthInput.value : '01').padStart(2, '0');
        const year = yearInput ? yearInput.value : new Date().getFullYear();
        const dateVal = `${year}-${month}-${day}`;

        const phy = parseInt(phyInput ? phyInput.value : 0, 10) || 0;
        const chem = parseInt(chemInput ? chemInput.value : 0, 10) || 0;
        const maths = parseInt(mathsInput ? mathsInput.value : 0, 10) || 0;

        if (phy < 0 || chem < 0 || maths < 0 || phy > 100 || chem > 100 || maths > 100) {
            alert('Marks must be between 0 and 100 per subject!');
            return;
        }

        const newTest = {
            id: 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name,
            dateObj: dateVal,
            physics: phy,
            chemistry: chem,
            maths: maths,
            createdAt: new Date().toISOString()
        };

        tests.push(newTest);
        normalizeTests();
        saveTests();
        renderTestList();
        updateCharts();

        form.reset();
        const today = new Date();
        if (dayInput) dayInput.value = String(today.getDate()).padStart(2, '0');
        if (monthInput) monthInput.value = String(today.getMonth() + 1).padStart(2, '0');
        if (yearInput) yearInput.value = year;
    });
}

function init() {
    updateTargetYear();

    const d = new Date();
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = val;
    };
    setVal('day', String(d.getDate()).padStart(2, '0'));
    setVal('month', String(d.getMonth() + 1).padStart(2, '0'));

    loadTests();
    renderTestList();
    initCharts();

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            loadTests();
            renderTestList();
            updateCharts();
        } else if (e.key === EXAM_DATE_KEY) {
            updateTargetYear();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
