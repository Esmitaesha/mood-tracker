

Skip to content
Using Gmail with screen readers
Enable desktop notifications for Gmail.
   OK  No thanks
Conversations
9% of 15 GB used
Terms · Privacy · Program Policies
Last account activity: 0 minutes ago
Currently being used in 1 other location · Details
const STORAGE_KEY = 'mindspaceMoodLogs';

const MOODS = [
    { name: 'Excellent', score: 5, emoji: '🤩' },
    { name: 'Good', score: 4, emoji: '🙂' },
    { name: 'Neutral', score: 3, emoji: '😐' },
    { name: 'Down', score: 2, emoji: '🙁' },
    { name: 'Awful', score: 1, emoji: '😭' }
];

let moodLogs = loadMoodLogs();
let selectedMood = null;

const trackerSection = document.getElementById('tracker-section');
const infoSection = document.getElementById('info-section');
const btnTracker = document.getElementById('btn-tracker');
const btnInfo = document.getElementById('btn-info');
const emojiButtons = document.querySelectorAll('.emoji-btn');
const moodNoteInput = document.getElementById('mood-note');
const selectedMoodText = document.getElementById('selected-mood-text');
const saveMoodBtn = document.getElementById('save-mood-btn');
const historyList = document.getElementById('history-list');
const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const statBest = document.getElementById('stat-best');
const statRange = document.getElementById('stat-range');
const lastEntry = document.getElementById('last-entry');
const moodInsight = document.getElementById('mood-insight');
const trendSummary = document.getElementById('trend-summary');
const customChart = document.getElementById('custom-chart');
const clearDataBtn = document.getElementById('clear-data-btn');

btnTracker.addEventListener('click', () => switchSection('tracker'));
btnInfo.addEventListener('click', () => switchSection('info'));

emojiButtons.forEach((button) => {
    button.addEventListener('click', () => {
        emojiButtons.forEach((btn) => btn.classList.remove('selected'));
        button.classList.add('selected');

        selectedMood = {
            mood: button.dataset.mood,
            score: Number(button.dataset.score)
        };

        selectedMoodText.textContent = `${selectedMood.mood} selected`;
    });
});

saveMoodBtn.addEventListener('click', () => {
    if (!selectedMood) {
        selectedMoodText.textContent = 'Please select a mood first';
        selectedMoodText.classList.add('error-text');
        return;
    }

    const now = new Date();
    const logEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        mood: selectedMood.mood,
        score: selectedMood.score,
        note: moodNoteInput.value.trim().slice(0, 240),
        createdAt: now.toISOString(),
        displayDate: now.toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    };

    moodLogs.unshift(logEntry);
    saveMoodLogs();
    resetForm();
    updateUI();
});

clearDataBtn.addEventListener('click', () => {
    if (!moodLogs.length) {
        return;
    }

    if (confirm('Are you sure you want to delete all mood logs? This cannot be undone.')) {
        moodLogs = [];
        saveMoodLogs();
        updateUI();
    }
});

function switchSection(section) {
    const showingTracker = section === 'tracker';

    btnTracker.classList.toggle('active', showingTracker);
    btnInfo.classList.toggle('active', !showingTracker);
    trackerSection.classList.toggle('hidden', !showingTracker);
    infoSection.classList.toggle('hidden', showingTracker);
}

function loadMoodLogs() {
    try {
        const savedLogs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const oldLogs = JSON.parse(localStorage.getItem('moodLogs')) || [];
        const sourceLogs = savedLogs.length ? savedLogs : oldLogs;

        return sourceLogs
            .filter((log) => log && log.mood && Number.isFinite(Number(log.score)))
            .map((log) => ({
                id: String(log.id || Date.now()),
                mood: log.mood,
                score: Number(log.score),
                note: String(log.note || ''),
                createdAt: log.createdAt || new Date(log.date || Date.now()).toISOString(),
                displayDate: log.displayDate || log.date || new Date().toLocaleString()
            }));
    } catch {
        return [];
    }
}

function saveMoodLogs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moodLogs));
}

function resetForm() {
    emojiButtons.forEach((btn) => btn.classList.remove('selected'));
    selectedMood = null;
    moodNoteInput.value = '';
    selectedMoodText.textContent = 'Choose one mood to continue';
    selectedMoodText.classList.remove('error-text');
}

function updateUI() {
    const stats = calculateStats(moodLogs);

    renderHistory(moodLogs);
    renderStats(stats);
    renderChart(stats.distribution, stats.total);
}

function calculateStats(logs) {
    const total = logs.length;
    const distribution = Object.fromEntries(MOODS.map((mood) => [mood.name, 0]));

    logs.forEach((log) => {
        if (distribution[log.mood] !== undefined) {
            distribution[log.mood] += 1;
        }
    });

    if (!total) {
        return {
            total,
            average: null,
            commonMood: null,
            min: null,
            max: null,
            trend: 'Log at least two moods to see a trend.',
            insight: 'Waiting for data',
            distribution
        };
    }

    const scores = logs.map((log) => log.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / total;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const commonMood = MOODS.reduce((topMood, mood) => {
        return distribution[mood.name] > distribution[topMood.name] ? mood : topMood;
    }, MOODS[0]);

    return {
        total,
        average,
        commonMood,
        min,
        max,
        trend: getTrendText(logs),
        insight: getInsightText(average),
        distribution
    };
}

function getTrendText(logs) {
    if (logs.length < 2) {
        return 'Log at least two moods to see a trend.';
    }

    const latest = logs[0].score;
    const previous = logs[1].score;

    if (latest > previous) {
        return `Your latest mood improved by ${latest - previous} point(s).`;
    }

    if (latest < previous) {
        return `Your latest mood dropped by ${previous - latest} point(s).`;
    }

    return 'Your latest mood is steady compared with the previous log.';
}

function getInsightText(average) {
    if (average >= 4.5) return 'Strong positive pattern';
    if (average >= 3.5) return 'Mostly balanced';
    if (average >= 2.5) return 'Mixed mood pattern';
    return 'Needs extra care';
}

function renderHistory(logs) {
    historyList.replaceChildren();

    if (!logs.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-msg';
        emptyMessage.textContent = 'No logs yet. Start tracking your day.';
        historyList.appendChild(emptyMessage);
        lastEntry.textContent = 'No entries yet';
        return;
    }

    lastEntry.textContent = `Last: ${logs[0].displayDate}`;

    logs.forEach((log) => {
        const mood = MOODS.find((item) => item.name === log.mood);
        const item = document.createElement('article');
        item.className = 'history-item';

        const emoji = document.createElement('div');
        emoji.className = 'history-emoji';
        emoji.textContent = mood ? mood.emoji : '•';

        const details = document.createElement('div');
        details.className = 'history-details';

        const meta = document.createElement('div');
        meta.className = 'history-meta';
        meta.textContent = `${log.mood} (${log.score}/5) - ${log.displayDate}`;
        details.appendChild(meta);

        if (log.note) {
            const note = document.createElement('p');
            note.className = 'history-note';
            note.textContent = `"${log.note}"`;
            details.appendChild(note);
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-log';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteLog(log.id));

        item.append(emoji, details, deleteButton);
        historyList.appendChild(item);
    });
}

function renderStats(stats) {
    statTotal.textContent = stats.total;
    statAvg.textContent = stats.average === null ? '-' : `${stats.average.toFixed(1)} / 5`;
    statBest.textContent = stats.commonMood ? stats.commonMood.name : '-';
    statRange.textContent = stats.min === null ? '-' : `${stats.min}-${stats.max}`;
    moodInsight.textContent = stats.insight;
    trendSummary.textContent = stats.trend;
    clearDataBtn.disabled = stats.total === 0;
}

function renderChart(distribution, total) {
    customChart.replaceChildren();

    MOODS.forEach((mood) => {
        const count = distribution[mood.name] || 0;
        const percentage = total ? Math.round((count / total) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'chart-row';

        const label = document.createElement('span');
        label.className = 'chart-label';
        label.textContent = mood.name;

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.width = `${percentage}%`;
        wrapper.appendChild(bar);

        const countText = document.createElement('span');
        countText.className = 'chart-count';
        countText.textContent = `${count} (${percentage}%)`;

        row.append(label, wrapper, countText);
        customChart.appendChild(row);
    });
}

function deleteLog(id) {
    moodLogs = moodLogs.filter((log) => log.id !== id);
    saveMoodLogs();
    updateUI();
}

updateUI();
script.txt
Displaying script.txt.
