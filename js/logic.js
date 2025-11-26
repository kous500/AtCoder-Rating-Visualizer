import { toMidnight, stringToColor } from './utils.js';

const R = 0.8271973364;
const S = 724.4744301;
const V2_BASE_DATE = new Date("2025-01-01T00:00:00");

export function parseContestData(rawText) {
    const lines = rawText.split('\n');
    const contests = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 4) continue;

        const name = parts[0];
        const weight = parseFloat(parts[1]);
        const perf = parseFloat(parts[2]);
        const endDateStr = parts[3];
        const endDate = new Date(endDateStr);

        if (!isNaN(weight) && !isNaN(perf) && endDate instanceof Date && !isNaN(endDate)) {
            contests.push({ name, weight, perf, endDate });
        }
    }
    return contests;
}

export function calculateRating(allContests, currentDate) {
    const currentDateMidnight = toMidnight(currentDate);
    const v2_base_midnight = toMidnight(V2_BASE_DATE);
    const isV2 = v2_base_midnight <= currentDateMidnight;

    // Filter and decay
    const processedContests = [];
    allContests.forEach(c => {
        const cEndMidnight = toMidnight(c.endDate);
        
        if (currentDateMidnight < cEndMidnight) {
            return;
        }

        if (isV2) {
            const d = (currentDateMidnight - cEndMidnight) / (1000 * 60 * 60 * 24);
            const decayedPerf = c.perf + 150 - 100 * (d / 365);
            processedContests.push({ ...c, decayedPerf });
        } else {
            const decayedPerf = c.perf;
            processedContests.push({ ...c, decayedPerf });
        }
    });

    // Generate Q List (Rectangles)
    let Q = [];
    processedContests.forEach(c => {
        const color = stringToColor(c.name);
        for (let j = 1; j <= 100; j++) {
            const q_val = c.decayedPerf - S * Math.log(j);
            const bef_q_val = c.perf - S * Math.log(j);
            Q.push({
                q: q_val,
                bef_q: bef_q_val,
                w: c.weight,
                name: c.name,
                j: j,
                color: color,
            });
        }
    });

    Q.sort((a, b) => b.q - a.q);

    // Calculate Coordinates
    let currentRating = 0;
    let s_prev = 0;
    let si = 0;
    let rectangles = [];
    let maxQValue = Q.length > 0 ? Q[0].q : 0;
    let minQValue = 0;

    // Range detection helper
    for (let i = 0; i < Q.length; i++) {
        const item = Q[i];
        maxQValue = Math.max(maxQValue, item.bef_q);
        const s_curr = si + item.w;
        const r_pow = Math.pow(R, s_curr);
        if (r_pow > 0.01) {
            minQValue = item.q;
        }
        si = s_curr;
    }

    let s_total = 0;
    for (const item of Q) s_total += item.w;
    const minXLogical = Math.pow(R, s_total);

    for (let i = 0; i < Q.length; i++) {
        const item = Q[i];
        const s_curr = s_prev + item.w;
        const r_pow_prev = Math.pow(R, s_prev);
        const r_pow_curr = Math.pow(R, s_curr);

        const term = item.q * (r_pow_prev - r_pow_curr);
        currentRating += term;

        rectangles.push({
            x_start: r_pow_prev,
            x_end: r_pow_curr,  
            y: item.q,
            y2: item.bef_q,
            name: item.name,
            j: item.j,
            color: item.color
        });
        s_prev = s_curr;
    }

    let finalRating = currentRating;
    if (finalRating < 400) {
        finalRating = 400 / Math.exp((400 - finalRating) / 400);
    }

    return {
        rectangles,
        stats: {
            matches: processedContests.length,
            system: isV2 ? 'AHC (v2)' : 'AHC (v1)',
            rawRating: currentRating,
            rating: finalRating,
        },
        meta: {
            minQValue,
            maxQValue,
            minXLogical
        }
    };
}