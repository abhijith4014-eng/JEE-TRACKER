// JEE Preparation Tracker - Local Offline Script
const CHAPTERS = {
    physics: [
        "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane",
        "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion",
        "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
        "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations",
        "Waves", "Electric Charges and Fields", "Electrostatic Potential and Capacitance",
        "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter",
        "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves",
        "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter",
        "Atoms", "Nuclei", "Semiconductor Electronics"
    ],
    chemistry: [
        "Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity",
        "Chemical Bonding and Molecular Structure", "Thermodynamics",
        "Equilibrium", "Redox Reactions", "The p-Block Elements (XI)",
        "Organic Chemistry – Basic Principles", "Hydrocarbons",
        "Solutions", "Electrochemistry", "Chemical Kinetics",
        "The p-Block Elements (XII)", "The d- and f-Block Elements",
        "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
        "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"
    ],
    maths: [
        "Sets", "Relations and Functions (XI)", "Trigonometric Functions",
        "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations",
        "Binomial Theorem", "Sequence and Series", "Straight Lines", "Conic Sections",
        "Intro to 3D Geometry", "Limits and Derivatives", "Statistics",
        "Probability (XI)", "Relations and Functions (XII)", "Inverse Trigonometric Functions",
        "Matrices", "Determinants", "Continuity and Differentiability", "Applications of Derivatives",
        "Integrals", "Applications of the Integrals", "Differential Equations", "Vector Algebra",
        "Three-dimensional Geometry", "Linear Programming", "Probability (XII)"
    ]
};

const STORAGE_KEY = 'jee_tracker_state';
const EXAM_DATE_KEY = 'jee_exam_date';

let state = {
    physics: [],
    chemistry: [],
    maths: []
};

// Update header and page title with dynamic year from selected date
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
    document.title = `JEE ${year} Preparation Tracker`;
}

// Reset state arrays to match current syllabus counts
function resetState() {
    state.physics = new Array(CHAPTERS.physics.length).fill(false);
    state.chemistry = new Array(CHAPTERS.chemistry.length).fill(false);
    state.maths = new Array(CHAPTERS.maths.length).fill(false);
}

// Validate loaded state
function validateState() {
    ['physics', 'chemistry', 'maths'].forEach(subject => {
        if (!state[subject] || state[subject].length !== CHAPTERS[subject].length) {
            const newArr = new Array(CHAPTERS[subject].length).fill(false);
            const oldArr = state[subject] || [];
            for (let i = 0; i < Math.min(oldArr.length, newArr.length); i++) {
                newArr[i] = !!oldArr[i];
            }
            state[subject] = newArr;
        }
    });
}

// Save state to localStorage
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }
}

// Load state from localStorage
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                state = parsed;
                validateState();
                return;
            }
        }
    } catch (e) {
        console.warn("Error reading local state:", e);
    }
    resetState();
}

// Render chapter items
function renderChapters() {
    const subjects = ['physics', 'chemistry', 'maths'];

    subjects.forEach(subject => {
        const container = document.getElementById(`${subject}-list`);
        if (!container) return;
        container.innerHTML = '';

        CHAPTERS[subject].forEach((chapter, index) => {
            const isChecked = !!state[subject][index];

            const div = document.createElement('div');
            div.className = `chapter-item ${isChecked ? 'completed' : ''}`;
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');

            div.innerHTML = `
                <div class="checkbox-container">
                    <input type="checkbox" class="custom-checkbox" 
                        ${isChecked ? 'checked' : ''} disabled style="pointer-events: none;">
                    <svg class="checkbox-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <span class="chapter-name">${index + 1}. ${chapter}</span>
            `;

            div.addEventListener('click', (e) => {
                e.preventDefault();
                toggleChapter(subject, index);
            });

            div.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleChapter(subject, index);
                }
            });

            container.appendChild(div);
        });
    });
}

function toggleChapter(subject, index) {
    if (!state[subject]) return;
    state[subject][index] = !state[subject][index];

    renderChapters();
    updateStats();
    saveState();
}

function updateStats() {
    const subjects = ['physics', 'chemistry', 'maths'];
    let totalChapters = 0;
    let totalCompleted = 0;

    subjects.forEach(subject => {
        const total = CHAPTERS[subject].length;
        const completed = (state[subject] || []).filter(Boolean).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        const pEl = document.getElementById(`${subject}-percent`);
        const bEl = document.getElementById(`${subject}-bar`);
        if (pEl) pEl.textContent = `${percent}%`;
        if (bEl) bEl.style.width = `${percent}%`;

        totalChapters += total;
        totalCompleted += completed;
    });

    const globalPercent = totalChapters === 0 ? 0 : Math.round((totalCompleted / totalChapters) * 100);
    const totP = document.getElementById('total-percent');
    const totB = document.getElementById('total-bar');
    if (totP) totP.textContent = `${globalPercent}%`;
    if (totB) totB.style.width = `${globalPercent}%`;
}

function init() {
    updateTargetYear();
    loadState();
    renderChapters();
    updateStats();

    // Listen for storage updates across open tabs
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            loadState();
            renderChapters();
            updateStats();
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
