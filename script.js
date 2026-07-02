// Application State Management
let moodLogs = JSON.parse(localStorage.getItem('moodLogs')) || [];
let selectedMood = null;
let selectedScore = null;

// DOM Elements
const trackerSection = document.getElementById('tracker-section');
const infoSection = document.getElementById('info-section');
const btnTracker = document.getElementById('btn-tracker');
const btnInfo = document.getElementById('btn-info');

const emojiButtons = document.querySelectorAll('.emoji-btn');
const moodNoteInput = document.getElementById('mood-note');
const saveMoodBtn = document.getElementById('save-mood-btn');
const historyList = document.getElementById('history-list');

const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const customChart = document.getElementById('custom-chart');
const clearDataBtn = document.getElementById('clear-data-btn');

// --- Navigation Feature ---
btnTracker.addEventListener('click', () => {
    btnTracker.classList.add('active');
    btnInfo.classList.remove('active');
    trackerSection.classList.remove('hidden');
    infoSection.classList.add('hidden');
});

btnInfo.addEventListener('click', () => {
    btnInfo.classList.add('active');
    btnTracker.classList.remove('active');
    infoSection.classList.remove('hidden');
    trackerSection.classList.add('hidden');
});

// --- Mood Logger Interactions ---
emojiButtons.forEach(button => {
    button.addEventListener('click', () => {
        emojiButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedMood = button.getAttribute('data-mood');
        selectedScore = parseInt(button.getAttribute('data-score'));
    });
});

saveMoodBtn.addEventListener('click', () => {
    if (!selectedMood) {
        alert('Please select an emoji representing your current mood first!');
        return;
    }

    const logEntry = {
        id: Date.now(),
        mood: selectedMood,
        score: selectedScore,
        note: moodNoteInput.value.trim(),
        date: new Date().toLocaleString()
    };

    moodLogs.unshift(logEntry); // Add newest logs to front
    saveToLocalStorage();
    updateUI();
    resetForm();
});

function resetForm() {
    emojiButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = null;
    selectedScore = null;
    moodNoteInput.value = '';
}

// --- Data Persistence and UI Rendering ---
function saveToLocalStorage() {
    localStorage.setItem('moodLogs', JSON.stringify(moodLogs));
}

function updateUI() {
    renderHistory();
    calculateStats();
}

function renderHistory() {
    if (moodLogs.length === 0) {
        historyList.innerHTML = <p class="empty-msg">No logs yet. Start tracking your day!</p>;
        return;
    }

    const emojiMapping = {
        'Excellent': '🤩', 'Good': '🙂', 'Neutral': '😐', 'Down': '🙁', 'Awful': '😭'
    };

    historyList.innerHTML = moodLogs.map(log => `
        <div class="history-item">
            <div class="history-emoji">${emojiMapping[log.mood] || '⚫'}</div>
            <div class="history-details">
                <div class="history-meta"><strong>${log.mood}</strong> — ${log.date}</div>
                ${log.note ? <div class="history-note">"${log.note}"</div> : ''}
            </div>
            <button class="delete-log" onclick="deleteLog(${log.id})">✕</button>
        </div>
    `).join('');
}

// Window scoped for the dynamic template literal buttons to call it
window.deleteLog = function(id) {
    moodLogs = moodLogs.filter(log => log.id !== id);
    saveToLocalStorage();
    updateUI();
}

function calculateStats() {
    const total = moodLogs.length;
    statTotal.textContent = total;

    if (total === 0) {
        statAvg.textContent = '-';
        renderChart({ 'Excellent': 0, 'Good': 0, 'Neutral': 0, 'Down': 0, 'Awful': 0 }, 0);
        return;
    }

    // Compute average score
    const sum = moodLogs.reduce((acc, log) => acc + log.score, 0);
    const avg = (sum / total).toFixed(1);
    statAvg.textContent = avg + " / 5";


    // Compute distribution metrics
    const distribution = { 'Excellent': 0, 'Good': 0, 'Neutral': 0, 'Down': 0, 'Awful': 0 };
    moodLogs.forEach(log => {
        if (distribution[log.mood] !== undefined) {
            distribution[log.mood]++;
        }
    });

    renderChart(distribution, total);
}

function renderChart(dist, total) {
    const moodsArray = ['Excellent', 'Good', 'Neutral', 'Down', 'Awful'];
    
    customChart.innerHTML = moodsArray.map(mood => {
        const count = dist[mood];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return `
            <div class="chart-row">
                <span class="chart-label">${mood}</span>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="width: ${percentage}%"></div>
                </div>
                <span class="chart-count">${count}</span>
            </div>
        `;
    }).join('');
}

// --- Data Cleanse ---
clearDataBtn.addEventListener('click', () => {
    if (confirm('Are you absolute certain you want to wipe clean all logged emotional history logs? This action is irreversible.')) {
        moodLogs = [];
        saveToLocalStorage();
        updateUI();
    }
});

// App Initiation Initializer
updateUI();

