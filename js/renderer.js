import { getRatingColor, getContrastColor } from './utils.js';

const LOGICAL_SIZE = 638;

export function drawRatingGraph(canvasId, data, currentRating) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const { rectangles, meta } = data;
    const { minQValue, maxQValue, minXLogical } = meta;

    // Viewport Calculations
    const devicePixelRatio = window.devicePixelRatio || 1;
    const containerWidth = canvas.parentElement.clientWidth;
    const canvasScale = containerWidth / LOGICAL_SIZE;

    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerWidth}px`;
    canvas.width = containerWidth * devicePixelRatio;
    canvas.height = containerWidth * devicePixelRatio;

    ctx.scale(canvasScale * devicePixelRatio, canvasScale * devicePixelRatio);

    ctx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);

    if (rectangles.length === 0) {
        drawEmptyState(ctx);
        return;
    }

    const margin = { top: LOGICAL_SIZE * 0.08, right: LOGICAL_SIZE * 0.06, bottom: LOGICAL_SIZE * 0.08, left: LOGICAL_SIZE * 0.1 };
    const drawW = LOGICAL_SIZE - margin.left - margin.right;
    const drawH = LOGICAL_SIZE - margin.top - margin.bottom;
    const xScale = drawW / (1 - minXLogical);

    const minY = Math.min(0, Math.floor(minQValue / 400) * 400);
    const maxY = Math.max(0, Math.ceil((maxQValue + (maxQValue - minY) * 0.1) / 100) * 100);

    // Draw Background Bands
    drawBackgroundBands(ctx, minY, maxY, margin, drawW, drawH);

    // Draw Rectangles
    drawRectangles(ctx, rectangles, minY, maxY, drawH, margin, xScale);

    // Draw Grid
    drawGrid(ctx, minY, maxY, margin, drawH);

    // Draw Rating Line
    drawRatingLine(ctx, currentRating, minY, maxY, margin, drawH);

    // Draw Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, drawW, drawH);
}

function drawEmptyState(ctx) {
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No contests evaluated yet.", LOGICAL_SIZE / 2, LOGICAL_SIZE / 2);
}

function drawBackgroundBands(ctx, minY, maxY, margin, drawW, drawH) {
    const startBandY = Math.floor(minY / 400) * 400;
    for (let bandY = startBandY; bandY < maxY; bandY += 400) {
        ctx.fillStyle = getRatingColor(bandY);
        const bandTop = Math.min(bandY + 400, maxY);
        const bandBottom = Math.max(bandY, minY);
        if (bandTop <= bandBottom) continue;

        const py_top = margin.top + drawH - ((bandTop - minY) / (maxY - minY) * drawH);
        const py_bottom = margin.top + drawH - ((bandBottom - minY) / (maxY - minY) * drawH);
        const rectHeight = py_bottom - py_top;
        
        ctx.fillRect(margin.left, py_top, drawW, rectHeight);
    }
}

function drawRectangles(ctx, rectangles, minY, maxY, drawH, margin, xScale) {
    const MIN_FONT_SIZE = 8;

    rectangles.forEach(rect => {
        const px_screen_left = (1 - rect.x_start) * xScale + margin.left;
        const px_screen_right = (1 - rect.x_end) * xScale + margin.left;
        const rect_w = px_screen_right - px_screen_left;
        
        const rect_h = ((rect.y - minY) / (maxY - minY)) * drawH;
        const py = margin.top + drawH - rect_h;

        if (rect_h <= 0) return;

        // Fill & Stroke
        ctx.fillStyle = rect.color;
        ctx.fillRect(px_screen_left, py, rect_w, rect_h);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px_screen_left, py, rect_w, rect_h);

        // Labels
        if (rect_w > MIN_FONT_SIZE) {
            drawLabel(ctx, rect, px_screen_left, py, rect_w, rect_h, MIN_FONT_SIZE);
        }

        // Perf Number
        let perfFontSize = Math.max(rect_w * 0.2, MIN_FONT_SIZE);
        ctx.font = `${perfFontSize}px Arial`;
        ctx.fillStyle = "#555";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const textMetrics = ctx.measureText(Math.round(rect.y));
        if (textMetrics.width <= rect_w * 0.9) {
            ctx.fillText(Math.round(rect.y), px_screen_left + rect_w / 2, py - 5);
        }
    });

    // J=1 extra border
    rectangles.forEach(rect => {
        const px_screen_left = (1 - rect.x_start) * xScale + margin.left;
        const px_screen_right = (1 - rect.x_end) * xScale + margin.left;
        const rect_w = px_screen_right - px_screen_left;

        if (rect.j === 1) {
            const rect_h2 = ((rect.y2 - minY) / (maxY - minY)) * drawH;
            const py2 = margin.top + drawH - rect_h2;
            if (rect_h2 > 0) {
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 1;
                ctx.strokeRect(px_screen_left, py2, rect_w, rect_h2);
            }
        }
    })
}

function drawLabel(ctx, rect, x, y, w, h, minFont) {
    const label = `${rect.name} (${rect.j})`;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = getContrastColor(rect.color);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);

    let fontSize = Math.max(w * 0.5, minFont);
    ctx.font = `${fontSize}px sans-serif`;
    let textMetrics = ctx.measureText(label);
    let actualTextWidth = textMetrics.width;

    while (actualTextWidth > h * 0.8 && fontSize > minFont) {
        fontSize -= 1;
        ctx.font = `${fontSize}px sans-serif`;
        textMetrics = ctx.measureText(label);
        actualTextWidth = textMetrics.width;
    }

    if (w * 0.5 >= minFont) {
        ctx.fillText(label, 0, 0);
    }
    ctx.restore();
}

function drawGrid(ctx, minY, maxY, margin, drawH) {
    ctx.lineWidth = 1;
    ctx.font = "15px Arial";
    ctx.fillStyle = "#555";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const gridStart = Math.floor(minY / 400) * 400;
    const gridEnd = Math.ceil(maxY / 400) * 400;

    for (let y = gridStart; y <= gridEnd; y += 400) {
        if (y < minY || y > maxY) continue;
        const py = margin.top + drawH - ((y - minY) / (maxY - minY) * drawH);

        ctx.strokeStyle = "#60606050";
        ctx.beginPath();
        ctx.moveTo(margin.left, py);
        ctx.lineTo(LOGICAL_SIZE - margin.right, py);
        ctx.stroke();
        ctx.fillText(y, margin.left - 10, py);
    }
}

function drawRatingLine(ctx, currentRating, minY, maxY, margin, drawH) {
    if (currentRating >= minY && currentRating <= maxY) {
        const rate_py = margin.top + drawH - (((currentRating - minY) / (maxY - minY)) * drawH);
        ctx.strokeStyle = "#303030a0";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(margin.left, rate_py);
        ctx.lineTo(LOGICAL_SIZE - margin.right, rate_py);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.font = "25px Arial";
        ctx.fillStyle = "#303030d0";
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`Rate: ${Math.round(currentRating)}`, LOGICAL_SIZE - margin.right - 5, rate_py - 5);
    }
}