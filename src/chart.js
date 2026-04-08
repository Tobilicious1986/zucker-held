// ═══════════════════════════════════════════════════════════
//  BZ-CHART — Canvas-basierte Visualisierungen
// ═══════════════════════════════════════════════════════════

/**
 * Zeichnet einen BZ-Sparkline auf einem Canvas.
 * Zeigt die letzten `maxPoints` Messungen als Linie mit farbigen Punkten.
 */
export function renderSparkline(canvas, bzEntries, settings = {}) {
  const min = settings.min || 70;
  const max = settings.max || 180;

  const ctx    = canvas.getContext('2d');
  const W      = canvas.width;
  const H      = canvas.height;
  const PAD    = 12;

  ctx.clearRect(0, 0, W, H);

  const points = bzEntries.slice(-20); // Letzte 20 Messungen
  if (points.length < 2) {
    ctx.fillStyle = '#ccc';
    ctx.font      = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Noch wenig Daten', W / 2, H / 2);
    return;
  }

  // BZ-Werte für die Y-Achse skalieren
  const vals   = points.map(p => p.value);
  const dataMin = Math.min(40,  ...vals);
  const dataMax = Math.max(400, ...vals);

  const toX = (i) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const toY = (v) => H - PAD - ((v - dataMin) / (dataMax - dataMin)) * (H - 2 * PAD);

  // ── Zielbereich-Band (grün/transparent) ────────────────
  const yMin = toY(min);
  const yMax = toY(max);
  ctx.fillStyle = 'rgba(46,204,113,0.12)';
  ctx.fillRect(0, yMax, W, yMin - yMax);

  // Zielbereich-Linien (gestrichelt)
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;

  ctx.strokeStyle = 'rgba(46,204,113,0.5)';
  ctx.beginPath(); ctx.moveTo(0, yMin); ctx.lineTo(W, yMin); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, yMax); ctx.lineTo(W, yMax); ctx.stroke();
  ctx.setLineDash([]);

  // ── Verbindungslinie ─────────────────────────────────
  ctx.lineWidth   = 2.5;
  ctx.strokeStyle = 'rgba(108, 99, 255, 0.6)';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.value);
    if (i === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ── Datenpunkte ───────────────────────────────────────
  points.forEach((p, i) => {
    const x     = toX(i);
    const y     = toY(p.value);
    const color = getBZColor(p.value, min, max);

    ctx.beginPath();
    ctx.arc(x, y, i === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Letzten Wert beschriften
    if (i === points.length - 1) {
      ctx.fillStyle = color;
      ctx.font      = 'bold 13px sans-serif';
      ctx.textAlign = x > W * 0.85 ? 'right' : 'left';
      ctx.fillText(p.value, x + (x > W * 0.85 ? -8 : 8), y - 7);
    }
  });
}

/**
 * Zeichnet einen vollen 7-Tage BZ-Chart auf einem größeren Canvas.
 */
export function renderFullChart(canvas, bzEntries, settings = {}) {
  const min     = settings.min || 70;
  const max     = settings.max || 180;
  const ctx     = canvas.getContext('2d');
  const W       = canvas.width;
  const H       = canvas.height;
  const PAD_L   = 40;
  const PAD_R   = 16;
  const PAD_T   = 16;
  const PAD_B   = 30;

  ctx.clearRect(0, 0, W, H);

  // Letzte 7 Tage
  const cutoff = Date.now() - 7 * 86400000;
  const points = bzEntries
    .filter(e => e.type === 'bz' && e.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (points.length === 0) {
    ctx.fillStyle = '#aaa';
    ctx.font      = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Noch keine Daten der letzten 7 Tage', W / 2, H / 2);
    return;
  }

  const dataMin  = Math.min(40,  ...points.map(p => p.value));
  const dataMax  = Math.max(400, ...points.map(p => p.value));
  const timeMin  = points[0].timestamp;
  const timeMax  = Math.max(points[points.length - 1].timestamp, timeMin + 86400000);

  const toX = (ts) => PAD_L + ((ts - timeMin) / (timeMax - timeMin)) * (W - PAD_L - PAD_R);
  const toY = (v)  => PAD_T + (1 - (v - dataMin) / (dataMax - dataMin)) * (H - PAD_T - PAD_B);

  // ── Y-Achse Beschriftung ───────────────────────────────
  ctx.fillStyle = '#999';
  ctx.font      = '11px sans-serif';
  ctx.textAlign = 'right';
  [50, 100, 150, 200, 300].forEach(v => {
    if (v < dataMin - 20 || v > dataMax + 20) return;
    const y = toY(v);
    ctx.fillText(v, PAD_L - 5, y + 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD_L, y);
    ctx.lineTo(W - PAD_R, y);
    ctx.stroke();
  });

  // ── Zielbereich ────────────────────────────────────────
  const yBandTop    = toY(max);
  const yBandBottom = toY(min);
  ctx.fillStyle = 'rgba(46,204,113,0.12)';
  ctx.fillRect(PAD_L, yBandTop, W - PAD_L - PAD_R, yBandBottom - yBandTop);

  // Zielbereich-Linien
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  [min, max].forEach(v => {
    ctx.strokeStyle = 'rgba(46,204,113,0.7)';
    const y = toY(v);
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
  });
  ctx.setLineDash([]);

  // ── Linie ─────────────────────────────────────────────
  ctx.lineWidth   = 2;
  ctx.strokeStyle = 'rgba(108,99,255,0.7)';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = toX(p.timestamp);
    const y = toY(p.value);
    if (i === 0) ctx.moveTo(x, y);
    else         ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ── Punkte ────────────────────────────────────────────
  points.forEach(p => {
    const x = toX(p.timestamp);
    const y = toY(p.value);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = getBZColor(p.value, min, max);
    ctx.fill();
  });

  // ── X-Achse: Tages-Labels ────────────────────────────
  ctx.fillStyle = '#999';
  ctx.font      = '10px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 7; i++) {
    const ts  = timeMin + i * 86400000;
    const x   = toX(ts);
    const d   = new Date(ts);
    const lbl = d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
    ctx.fillText(lbl, x, H - 6);
  }
}

// ── Farb-Helper ───────────────────────────────────────────
function getBZColor(val, min, max) {
  if (val < 55)   return '#C0392B';  // Kritisch
  if (val < min)  return '#E74C3C';  // Niedrig
  if (val <= max) return '#2ECC71';  // Super
  if (val <= 300) return '#F39C12';  // Hoch
  return '#7D3C98';                   // Sehr hoch
}
