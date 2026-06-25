/* ============================================================================
   LEGAL M1ND — BRIEFING VISUALISATION LIBRARY
   Reusable, dependency-free SVG visualisations + motion for the Intelligence
   Briefing prototype (and reusable by the decks). Pairs with brand.js
   (animateCount / applyDiverge) and brand.css design tokens.
   WHY a separate file: keeps the "product UI" viz concerns out of brand.js,
   matching the folder-per-concern preference, so a co-founder finds chart code
   in one obvious place.
   ============================================================================ */

/* ---- 1. RADIAL GAUGE -------------------------------------------------------
   Animated circular arc. Used for headline scores (rigidity, settlement prob…).
   svg: target <svg>; value/max define fill fraction; opts.display = big label. */
function drawGauge(svg, value, max, opts = {}) {
  const r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  const color = opts.color || "var(--gold)";
  svg.setAttribute("viewBox", "0 0 140 140");
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="11"/>
    <circle class="g-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="11"
      stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#fff"
      style="font-family:var(--serif);font-weight:700" font-size="30">${opts.display ?? value}</text>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="var(--grey)" font-size="11.5"
      style="letter-spacing:.06em;text-transform:uppercase">${opts.sub || ""}</text>`;
  const arc = svg.querySelector(".g-arc");
  arc.style.transition = "stroke-dashoffset 1.5s cubic-bezier(.2,.7,.2,1)";
  raf2(() => { arc.style.strokeDashoffset = circ * (1 - frac); });
}

/* ---- 2. RADAR / SPIDER CHART ----------------------------------------------
   axes: [labels]; values: [0..1]. Animated scale-in from centre. */
function drawRadar(svg, axes, values, opts = {}) {
  const N = axes.length, cx = 165, cy = 158, R = 108;
  const color = opts.color || "var(--gold)";
  const pt = (i, rad) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / N;
    return [cx + R * rad * Math.cos(a), cy + R * rad * Math.sin(a)];
  };
  svg.setAttribute("viewBox", "0 0 330 300");
  let g = "";
  [0.25, 0.5, 0.75, 1].forEach((rr) => {
    g += `<polygon points="${axes.map((_, i) => pt(i, rr).join(",")).join(" ")}"
            fill="none" stroke="rgba(255,255,255,.08)"/>`;
  });
  axes.forEach((lab, i) => {
    const [x, y] = pt(i, 1);
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.08)"/>`;
    const [lx, ly] = pt(i, 1.16);
    g += `<text x="${lx}" y="${ly}" fill="var(--ice)" font-size="12" text-anchor="middle"
            dominant-baseline="middle">${lab}</text>`;
  });
  const dpts = values.map((v, i) => pt(i, clamp(v, 0.02, 1)).join(",")).join(" ");
  g += `<polygon class="r-poly" points="${dpts}" fill="rgba(200,155,32,.26)"
          stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  values.forEach((v, i) => {
    const [x, y] = pt(i, clamp(v, 0.02, 1));
    g += `<circle cx="${x}" cy="${y}" r="3.6" fill="var(--gold-soft)"/>`;
  });
  svg.innerHTML = g;
  const poly = svg.querySelector(".r-poly");
  poly.style.transformOrigin = `${cx}px ${cy}px`;
  poly.style.transform = "scale(0)";
  poly.style.transition = "transform 1.05s cubic-bezier(.2,.8,.2,1)";
  raf2(() => { poly.style.transform = "scale(1)"; });
}

/* ---- 3. DONUT --------------------------------------------------------------
   segments: [{label, value, color}]. Animated sweep + centre total. */
function drawDonut(svg, segments, opts = {}) {
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  svg.setAttribute("viewBox", "0 0 140 140");
  let g = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="14"/>`;
  let offset = 0;
  segments.forEach((seg, i) => {
    const frac = seg.value / total, len = circ * frac;
    g += `<circle class="d-seg" data-len="${len}" data-circ="${circ}" data-off="${offset}"
            cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="14"
            stroke-dasharray="0 ${circ}" stroke-dashoffset="${-offset}"
            transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dasharray .9s cubic-bezier(.2,.7,.2,1) ${i * .12}s"/>`;
    offset += len;
  });
  g += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="#fff"
          style="font-family:var(--serif);font-weight:700" font-size="22">${opts.center || total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--grey)" font-size="10.5"
          style="letter-spacing:.05em;text-transform:uppercase">${opts.centerSub || ""}</text>`;
  svg.innerHTML = g;
  raf2(() => svg.querySelectorAll(".d-seg").forEach((s) => {
    s.setAttribute("stroke-dasharray", `${s.dataset.len} ${s.dataset.circ}`);
  }));
}

/* ---- 4. STAGGERED ENTRANCE -------------------------------------------------
   Fades + lifts every .anim inside a container in sequence (the "settle" feel). */
function staggerIn(container, step = 65) {
  const els = [...container.querySelectorAll(".anim")];
  els.forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1)";
    setTimeout(() => { el.style.opacity = 1; el.style.transform = "none"; }, 70 + i * step);
  });
}

/* ---- 5. SCAN PULSE ---------------------------------------------------------
   Brief "analysing N judgments…" overlay sweep on view load — pure demo theatre,
   reads beautifully on the screen-recorded video. ~900ms then fades. */
function scanPulse(host, label) {
  const ov = document.createElement("div");
  ov.className = "scan-ov";
  ov.innerHTML = `<div class="scan-line"></div><div class="scan-txt">${label}</div>`;
  host.appendChild(ov);
  setTimeout(() => { ov.style.opacity = "0"; }, 850);
  setTimeout(() => ov.remove(), 1250);
}

/* ---- helpers --------------------------------------------------------------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function raf2(fn) { requestAnimationFrame(() => requestAnimationFrame(fn)); } // wait 2 frames so transitions fire
