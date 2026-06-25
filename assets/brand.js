/* ============================================================================
   LEGAL M1ND — SHARED PRESENTATION JS
   Reused by both decks, the index, and the briefing prototype.
   WHY shared: one animation/init implementation so behaviour is identical
   everywhere and a co-founder edits motion in exactly one place.
   No external dependencies — everything here is vanilla JS, fully offline.
   ============================================================================ */

/* ---- 1. KPI COUNT-UP -------------------------------------------------------
   Any element with class .count-up and data-target="157508" (optional
   data-suffix, data-decimals, data-prefix) animates from 0 to target when it
   first scrolls/reveals into view. Used for the big headline numbers. */
function animateCount(el) {
  if (el.dataset.done) return;
  el.dataset.done = "1";
  const target  = parseFloat(el.dataset.target);
  const dec      = parseInt(el.dataset.decimals || "0", 10);
  const prefix   = el.dataset.prefix || "";
  const suffix   = el.dataset.suffix || "";
  const dur      = parseInt(el.dataset.dur || "1300", 10);
  const start    = performance.now();
  function fmt(n) {
    return prefix + n.toLocaleString("en-IN", {
      minimumFractionDigits: dec, maximumFractionDigits: dec
    }) + suffix;
  }
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);     // easeOutCubic
    el.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  }
  requestAnimationFrame(tick);
}

/* IntersectionObserver fires counters + bar fills when they enter view.
   Works for both Reveal slides and the scrolling briefing prototype. */
function observeAnimables(root) {
  root = root || document;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.classList.contains("count-up")) animateCount(el);
      if (el.classList.contains("bar-fill")) el.style.width = el.dataset.w + "%";
      if (el.classList.contains("dv-fill"))  applyDiverge(el);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  root.querySelectorAll(".count-up, .bar-fill, .dv-fill").forEach((el) => io.observe(el));
}

/* Diverging psychometric bar: positive = gold to the right, negative = blue to
   the left of centre. data-v in [-1,1]. */
function applyDiverge(el) {
  const v = parseFloat(el.dataset.v);           // -1..1
  const pct = Math.min(50, Math.abs(v) * 50);
  if (v >= 0) { el.style.left = "50%";  el.style.width = pct + "%";
                el.style.background = "linear-gradient(90deg,var(--gold),var(--gold-soft))"; }
  else        { el.style.right = "50%"; el.style.width = pct + "%";
                el.style.background = "linear-gradient(90deg,#5C8FE0,#2E5FB0)"; }
}

/* ---- 2. REVEAL INIT --------------------------------------------------------
   Both decks call LM1ND.initDeck(). Centralises config + re-fires counters and
   bar fills each time a slide becomes current (so animations replay on revisit).
   Reveal is loaded as a global (vendored assets/reveal/reveal.js). */
const LM1ND = {
  initDeck() {
    Reveal.initialize({
      hash: true,
      slideNumber: "c/t",
      transition: "slide",
      transitionSpeed: "default",
      backgroundTransition: "fade",
      controlsTutorial: false,
      width: 1280, height: 720,
      margin: 0.045,
      minScale: 0.2, maxScale: 1.6,
      pdfMaxPagesPerSlide: 1,
    });
    // when a slide is shown, animate any counters/bars inside it
    Reveal.on("slidechanged", (ev) => fireSlide(ev.currentSlide));
    Reveal.on("ready",        (ev) => fireSlide(ev.currentSlide));
    // bars inside Reveal fragments: animate when the fragment shows
    Reveal.on("fragmentshown", (ev) => {
      ev.fragment.querySelectorAll(".bar-fill").forEach((b)=> b.style.width=b.dataset.w+"%");
      ev.fragment.querySelectorAll(".dv-fill").forEach(applyDiverge);
      if (ev.fragment.classList.contains("bar-fill")) ev.fragment.style.width = ev.fragment.dataset.w+"%";
    });
  }
};
function fireSlide(slide) {
  if (!slide) return;
  slide.querySelectorAll(".count-up").forEach((el)=>{ delete el.dataset.done; animateCount(el); });
  slide.querySelectorAll(".bar-fill").forEach((b)=> b.style.width = b.dataset.w + "%");
  slide.querySelectorAll(".dv-fill").forEach(applyDiverge);
  slide.querySelectorAll(".flow").forEach((f)=>{ delete f.dataset.done; staggerFlow(f); });
}

/* ---- 2b. BRAND v2 HELPERS (Editorial-Modern layer) -------------------------
   staggerFlow: reveals "old way vs M1ND" workflow steps one-by-one (WS-D).
   Re-runs on each slide view so the comparison replays. */
function staggerFlow(flow) {
  if (flow.dataset.done) return;
  flow.dataset.done = "1";
  const steps = flow.querySelectorAll(".step");
  steps.forEach((s, i) => {
    s.classList.remove("visible");
    setTimeout(() => s.classList.add("visible"), 180 * i + 120);
  });
}

/* ---- 3. BRAND FURNITURE INJECTION -----------------------------------------
   Injects the fixed logo + footer so each deck's HTML stays clean.
   pathToAssets lets nested folders (deck-investors/) point back to /assets. */
function injectBrandFurniture(pathToAssets, footerLeft) {
  const logo = document.createElement("img");
  logo.src = pathToAssets + "logo-transparent.png";
  logo.className = "brand-logo"; logo.alt = "Legal M1ND";
  document.body.appendChild(logo);

  const f = document.createElement("div");
  // NOTE: do NOT add the reveal framework class here — reveal.css styles `.reveal`
  // with top:0/height:100%, which would stretch this fixed footer full-height and
  // (via align-items:center) park its text dead-centre over the slide. Plain class only.
  f.className = "brand-footer";
  f.innerHTML = `<span class="conf">CONFIDENTIAL · NIPUN JAIN</span>
                 <span>${footerLeft || ""}</span>
                 <span class="wm">www.m1nd.in</span>`;
  document.body.appendChild(f);
}

/* ---- 2c. EXPANDABLE CARD → shared detail PANE -----------------------------
   onclick="toggleCard(this)" on a .xcard inside a .xwrap (which also holds a
   .xpane). Clicking renders that card's .xc-detail into the single .xpane below
   the grid and scrolls internally — so content is always fully visible and never
   overflows Reveal's fixed-height slide. Click the active card again to collapse.
   (Fallback: if there's no .xwrap/.xpane, just toggle an "open" class.) */
function toggleCard(el) {
  if (!el) return;
  const wrap = el.closest(".xwrap");
  if (!wrap) { el.classList.toggle("open"); return; }
  const pane   = wrap.querySelector(".xpane");
  const detail = el.querySelector(".xc-detail");
  const wasActive = el.classList.contains("active");
  wrap.querySelectorAll(".xcard").forEach((c) => c.classList.remove("active"));
  if (wasActive) {                       // second click → collapse
    if (pane) { pane.classList.remove("show"); pane.innerHTML = ""; }
    return;
  }
  el.classList.add("active");
  if (pane && detail) { pane.innerHTML = detail.innerHTML; pane.classList.add("show"); }
}

/* ---- 2e. CLICK FIX (capture-phase delegation) -----------------------------
   THE BUG: in Reveal presentation mode, Reveal's own click/touch handling on the
   slide container could swallow clicks on a card, so inline onclick="toggleCard(this)"
   sometimes never fired and cards wouldn't expand.
   THE FIX: listen at document level in the CAPTURE phase (runs before Reveal and
   before the card's own inline handler). If the click is inside an .xcard, we stop
   the event reaching Reveal AND the inline handler (so it can't double-toggle), and
   drive the toggle ourselves. One handler here fixes every deck + the prototype. */
document.addEventListener("click", (e) => {
  const card = e.target.closest && e.target.closest(".xcard");
  if (!card) return;
  if (e.target.closest("a[href]")) return;   // let real links inside a card still work
  e.stopPropagation();
  e.preventDefault();
  toggleCard(card);
}, true);  // capture phase = the key to beating Reveal to the click

/* auto-run for non-Reveal pages (briefing prototype / index / profile pages / reports) */
document.addEventListener("DOMContentLoaded", () => {
  if (!window.Reveal) {
    observeAnimables(document);
    // reveal workflow steps + gauges on scroll for non-deck surfaces too
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { staggerFlow(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    document.querySelectorAll(".flow").forEach((f) => io.observe(f));
  }
});
