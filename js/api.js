const ATCODER_PROXY_URL = "https://script.google.com/macros/s/AKfycby-CKUsGoe7YZBeIf9FMwvCK6JIfqnVkN-8764iNkRApGPns158Q6vJPxpDdnGfsDXU/exec";
const ATCODER_PROBLEMS_URL = "https://kenkoooo.com/atcoder/resources/contests.json";

export async function fetchAtCoderData(userId) {
    if (!userId) {
        throw new Error("Please enter an AtCoder ID.");
    }

    const [historyRes, metadataRes] = await Promise.all([
        fetch(`${ATCODER_PROXY_URL}?type=heuristic&id=${userId}`),
        fetch(ATCODER_PROBLEMS_URL)
    ]);

    if (!historyRes.ok) throw new Error("Failed to fetch user history");
    if (!metadataRes.ok) throw new Error("Failed to fetch contest metadata");

    const history = await historyRes.json();
    const metadata = await metadataRes.json();

    if (!Array.isArray(history) || history.length === 0) {
        throw new Error("No heuristic contest history found for this user.");
    }

    return processFetchedData(history, metadata);
}

function processFetchedData(history, metadata) {
    const contestMap = new Map(metadata.map(c => [c.id, c]));
    const ratedHistory = history.filter(h => h.IsRated && h.Performance > 0);
    
    let latestDate = new Date(0); 
    const csvLines = [];

    ratedHistory.forEach(h => {
        const contestId = h.ContestScreenName.split('.')[0];
        const meta = contestMap.get(contestId);
        
        let weight = 1.0;
        if (meta) {
            const startTime = new Date(meta.start_epoch_second * 1000);
            const startYear = startTime.getFullYear();
            const duration = meta.duration_second;

            if (startYear >= 2025) {
                weight = (duration < 24 * 60 * 60) ? 0.5 : 1.0;
            } else {
                weight = 1.0;
            }
        }

        const endDate = new Date(h.EndTime);
        if (endDate > latestDate) latestDate = endDate;
        
        const dateStr = endDate.toISOString().split('.')[0]; 
        csvLines.push(`${contestId.toUpperCase()}, ${weight}, ${h.Performance}, ${dateStr}`);
    });

    return {
        csvText: csvLines.join('\n'),
        latestDate: latestDate.getTime() > 0 ? latestDate : null
    };
}