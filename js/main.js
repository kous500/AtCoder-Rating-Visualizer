import { fetchAtCoderData } from './api.js';
import { parseContestData, calculateRating } from './logic.js';
import { drawRatingGraph } from './renderer.js';
import { formatDate, toMidnight, getRatingTextColor } from './utils.js';

// State
let isPlaying = false;
let animationReqId = null;
let cachedContests = [];
let timelineStart = 0;
let timelineEnd = 0;

// Elements
const refDateInput = document.getElementById('refDate');
const playPauseBtn = document.getElementById('playPauseBtn');
const timelineSlider = document.getElementById('timelineSlider');
const speedSelect = document.getElementById('speedSelect');
const currentDateLabel = document.getElementById('currentDateLabel');
const fetchBtn = document.getElementById('fetchButton');
const loadBtn = document.getElementById('loadButton');

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    refDateInput.value = formatDate(today);
    prepareAndRun(); 
});

window.onresize = () => {
    if(cachedContests.length > 0) {
        updateVisualization(new Date(parseInt(timelineSlider.value)));
    }
};

// Event Listeners
fetchBtn.addEventListener('click', handleFetch);
loadBtn.addEventListener('click', prepareAndRun);
playPauseBtn.addEventListener('click', toggleAnimation);
timelineSlider.addEventListener('input', () => {
    updateVisualization(new Date(parseInt(timelineSlider.value)));
});

// Handlers
async function handleFetch() {
    const userId = document.getElementById('atcoderId').value.trim();
    const statusDiv = document.getElementById('fetchStatus');

    try {
        statusDiv.innerText = "Fetching data...";
        statusDiv.style.color = "#666";
        fetchBtn.disabled = true;

        const { csvText, latestDate } = await fetchAtCoderData(userId);

        document.getElementById('contestData').value = csvText;
        document.getElementById('statUsername').innerText = userId;
        
        if (latestDate) {
            refDateInput.value = formatDate(latestDate);
        }

        statusDiv.innerText = "Successfully fetched data.";
        statusDiv.style.color = "green";
        prepareAndRun();

    } catch (error) {
        console.error(error);
        statusDiv.innerText = `Error: ${error.message}`;
        statusDiv.style.color = "red";
    } finally {
        fetchBtn.disabled = false;
    }
}

function prepareAndRun() {
    if (isPlaying) toggleAnimation();

    const rawText = document.getElementById('contestData').value.trim();
    cachedContests = parseContestData(rawText);
    
    // Sort for timeline logic
    cachedContests.sort((a, b) => a.endDate - b.endDate);

    const refDateVal = refDateInput.value;
    let targetEndDate = refDateVal ? new Date(refDateVal) : new Date();
    
    if (cachedContests.length > 0) {
        const firstContestDate = cachedContests[0].endDate;
        const lastContestDate = cachedContests[cachedContests.length - 1].endDate;
        
        timelineStart = toMidnight(firstContestDate).getTime();
        let userEnd = toMidnight(targetEndDate).getTime();
        
        if (userEnd < timelineStart) userEnd = timelineStart;
        timelineEnd = userEnd;
        
        if (toMidnight(lastContestDate).getTime() > timelineEnd) {
            timelineEnd = toMidnight(lastContestDate).getTime();
        }
    } else {
        timelineStart = toMidnight(new Date()).getTime();
        timelineEnd = timelineStart;
    }

    timelineSlider.min = timelineStart;
    timelineSlider.max = timelineEnd;
    timelineSlider.value = timelineEnd;
    
    updateVisualization(new Date(parseInt(timelineSlider.value)));
}

function updateVisualization(currentDate) {
    currentDateLabel.innerText = formatDate(currentDate);
    document.getElementById('statBaseDate').innerText = formatDate(currentDate);

    const data = calculateRating(cachedContests, currentDate);
    const { stats, rectangles } = data;

    // Update DOM Stats
    document.getElementById('statMatches').innerText = stats.matches;
    document.getElementById('statSystem').innerText = stats.system;
    
    if (rectangles.length > 0) {
        const statRating = Math.round(stats.rating);
        document.getElementById('statRating').innerText = statRating;
        document.getElementById('statRating').style.color = getRatingTextColor(statRating);
        document.getElementById('statRawRating').innerText = stats.rawRating;
    } else {
        document.getElementById('statRating').innerText = "-";
        document.getElementById('statRating').style.color = null;
        document.getElementById('statRawRating').innerText = "-";
    }

    // Manual Username fallback
    const statUser = document.getElementById('statUsername');
    if(statUser.innerText === '-') {
        const inputId = document.getElementById('atcoderId').value;
        if(inputId) statUser.innerText = inputId + " (Manual)";
    }

    drawRatingGraph('ratingCanvas', data, stats.rawRating);
}

// Animation Loop
function toggleAnimation() {
    const btn = document.getElementById('playPauseBtn');

    if (isPlaying) {
        isPlaying = false;
        cancelAnimationFrame(animationReqId);
        btn.classList.remove('playing');
    } else {
        if (parseInt(timelineSlider.value) >= parseInt(timelineSlider.max)) {
            timelineSlider.value = timelineSlider.min;
        }
        isPlaying = true;
        btn.classList.add('playing');
        loop();
    }
}

function loop() {
    if (!isPlaying) return;

    const speedVal = parseInt(speedSelect.value);
    let current = parseInt(timelineSlider.value);
    let next = current + (speedVal * 60 * 60 * 1000);
    
    if (next >= timelineEnd) {
        next = timelineEnd;
        isPlaying = false;
        
        document.getElementById('playPauseBtn').classList.remove('playing');
    }

    timelineSlider.value = next;
    updateVisualization(toMidnight(new Date(next)));

    if (isPlaying) {
        animationReqId = requestAnimationFrame(loop);
    }
}