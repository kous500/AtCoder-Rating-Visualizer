export function toMidnight(d) {
    const newDate = new Date(d);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function stringToColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    const colorInt = (h >>> 0) & 0xFFFFFF;
    return '#' + colorInt.toString(16).padStart(6, '0');
}

export function getContrastColor(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export function getRatingColor(rate) {
    if (2800 <= rate) return "#FFB2B2";
    else if (2400 <= rate) return "#FFD9B2";
    else if (2000 <= rate) return "#ECECB2";
    else if (1600 <= rate) return "#B2B2FF";
    else if (1200 <= rate) return "#B2ECEC";
    else if (800 <= rate) return "#B2D9B2";
    else if (400 <= rate) return "#D9C5B2";
    else return "#D9D9D9";
}