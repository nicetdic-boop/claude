/* =====================================================================
   Dynamique au gymnase — utilitaires communs
   - couleurs du thème pour les canvas (clair et sombre)
   - scènes canvas : coordonnées en pixels CSS, largeur virtuelle minimale
     pour rester lisible sur téléphone, pause hors de l'écran
   - dessin de vecteurs, d'étiquettes et de petits graphiques
   - formatage des nombres à la française
   - correction des exercices et surlignage du sommaire
   ===================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const G = 9.81;

  /* ---------- Couleurs du thème ---------- */
  const TOKENS = ["paper", "card", "ink", "ink-2", "ink-3", "rule", "rule-2", "accent", "accent-soft", "signal", "ok", "bad",
    "v-poids", "v-normale", "v-frott", "v-tension", "v-app", "v-ressort", "v-vit", "v-acc", "v-res",
    "ice", "snow", "wood", "wood-2", "metal", "road", "grass", "skin"];
  const C = {};
  function readPalette() {
    const cs = getComputedStyle(root);
    TOKENS.forEach((t) => {
      const key = t.replace(/^v-/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      C[key] = cs.getPropertyValue("--" + t).trim() || "#888";
    });
  }
  readPalette();
  const themeCbs = [];
  function themeChanged() { readPalette(); themeCbs.forEach((cb) => cb()); }
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", themeChanged);
    else if (mq.addListener) mq.addListener(themeChanged);
  }
  new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });

  /* ---------- Formatage ---------- */
  function fr(x, d) {
    if (x == null || !isFinite(x)) return "—";
    const digits = d == null ? 2 : d;
    let s = Math.abs(x) < 0.5 * Math.pow(10, -digits) ? (0).toFixed(digits) : Number(x).toFixed(digits);
    let [ent, dec] = s.split(".");
    const neg = ent.startsWith("-");
    if (neg) ent = ent.slice(1);
    if (ent.length > 4) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (neg ? "−" : "") + ent + (dec ? "," + dec : "");
  }
  /* trois chiffres significatifs, sans notation scientifique */
  function sig(x, n) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    const k = n || 3;
    const e = Math.floor(Math.log10(Math.abs(x)));
    const d = Math.max(0, k - 1 - e);
    return fr(x, d);
  }
  function parseNum(s) {
    if (s == null) return NaN;
    let t = String(s).trim().replace(/\s| | |'/g, "").replace("−", "-").replace(",", ".");
    t = t.replace(/[a-zA-Z°/²%]+$/, "");
    if (t === "" || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
    return parseFloat(t);
  }

  /* ---------- Scènes canvas ---------- */
  const stages = [];
  let raf = null;
  let last = 0;

  function Stage(canvas, opts) {
    const st = this;
    opts = opts || {};
    st.canvas = canvas;
    st.ctx = canvas.getContext("2d");
    st.minW = opts.minW || 480;
    st.W = 800; st.H = 450; st.k = 1;
    st.visible = true;
    st.running = false;
    st.dirty = true;
    st.draw = opts.draw || function () {};
    st.update = opts.update || null;
    st.onResize = opts.onResize || null;
    st.resize = function () {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      st.k = r.width / Math.max(r.width, st.minW);
      st.W = r.width / st.k;
      st.H = r.height / st.k;
      st.dpr = dpr;
      if (st.onResize) st.onResize(st.W, st.H);
      st.render();
    };
    st.render = function () {
      const ctx = st.ctx;
      ctx.setTransform(st.dpr * st.k, 0, 0, st.dpr * st.k, 0, 0);
      ctx.clearRect(0, 0, st.W, st.H);
      ctx.fillStyle = C.card;
      ctx.fillRect(0, 0, st.W, st.H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      st.draw(ctx, st.W, st.H);
      st.dirty = false;
    };
    st.invalidate = function () { st.dirty = true; kick(); };
    st.start = function () { st.running = true; kick(); };
    st.stop = function () { st.running = false; st.invalidate(); };
    st.toLocal = function (e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / st.k, y: (e.clientY - r.top) / st.k };
    };
    stages.push(st);
    if ("ResizeObserver" in window) new ResizeObserver(() => st.resize()).observe(canvas);
    else window.addEventListener("resize", st.resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => {
        ents.forEach((en) => { st.visible = en.isIntersecting; if (st.visible) st.invalidate(); });
      }, { rootMargin: "100px" }).observe(canvas);
    }
    themeCbs.push(() => st.invalidate());
    st.dpr = Math.min(window.devicePixelRatio || 1, 2);
    requestAnimationFrame(st.resize);
  }

  function frame(t) {
    let dt = (t - last) / 1000;
    last = t;
    if (!(dt > 0)) dt = 0;
    dt = Math.min(dt, 0.05);
    let any = false;
    for (const st of stages) {
      if (st.running && st.update) {
        if (st.visible) { st.update(dt); st.dirty = true; }
        any = true;
      }
      if (st.dirty && st.visible) st.render();
    }
    raf = any ? requestAnimationFrame(frame) : null;
  }
  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Dessin ---------- */
  function font(px, kind, weight) {
    const fam = kind === "mono" ? '"IBM Plex Mono", ui-monospace, monospace'
      : kind === "vec" ? '"Source Serif 4", Georgia, serif'
      : kind === "display" ? '"Barlow Condensed", "Arial Narrow", sans-serif'
      : '"Barlow", "Segoe UI", system-ui, sans-serif';
    const style = kind === "vec" ? "italic " : "";
    return style + (weight || (kind === "vec" ? 600 : 500)) + " " + px + "px " + fam;
  }
  function text(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = font(o.size || 13, o.kind, o.weight);
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "alphabetic";
    if (o.halo) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = o.halo;
      ctx.strokeText(s, x, y);
    }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  /* Vecteur de (x1,y1) à (x2,y2) avec étiquette en italique ; sub = indice */
  function arrow(ctx, x1, y1, x2, y2, color, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    const w = o.width || 3;
    const head = Math.min(o.head || (8 + w * 1.6), len * 0.6);
    const ux = dx / len, uy = dy / len;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * head - uy * head * 0.45, y2 - uy * head + ux * head * 0.45);
    ctx.lineTo(x2 - ux * head + uy * head * 0.45, y2 - uy * head - ux * head * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (o.label) {
      const off = o.labelOff == null ? 14 : o.labelOff;
      let lx, ly;
      if (o.labelAt === "mid") {
        lx = (x1 + x2) / 2 - uy * off; ly = (y1 + y2) / 2 + ux * off;
      } else {
        lx = x2 + ux * off * 0.9 + (o.side || 0) * -uy * off;
        ly = y2 + uy * off * 0.9 + (o.side || 0) * ux * off;
      }
      vlabel(ctx, o.label, o.sub, lx, ly, color, o.labelSize);
    }
  }
  function vlabel(ctx, name, sub, x, y, color, size) {
    const s = size || 16;
    ctx.save();
    ctx.font = font(s, "vec");
    const w1 = ctx.measureText(name).width;
    ctx.font = font(Math.round(s * 0.68), "ui", 600);
    const w2 = sub ? ctx.measureText(sub).width + 1 : 0;
    const x0 = x - (w1 + w2) / 2;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.card;
    ctx.font = font(s, "vec");
    ctx.strokeText(name, x0, y);
    ctx.fillStyle = color;
    ctx.fillText(name, x0, y);
    if (sub) {
      ctx.font = font(Math.round(s * 0.68), "ui", 600);
      ctx.strokeText(sub, x0 + w1 + 1, y + s * 0.3);
      ctx.fillText(sub, x0 + w1 + 1, y + s * 0.3);
    }
    ctx.restore();
  }
  function line(ctx, x1, y1, x2, y2, color, w, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = w || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  /* Cadre de graphique : renvoie les fonctions d'échelle */
  function niceStep(span, n) {
    const raw = span / (n || 5);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function axes(ctx, box, o) {
    const { x, y, w, h } = box;
    const xmin = o.xmin || 0, xmax = o.xmax, ymin = o.ymin || 0, ymax = o.ymax;
    const X = (v) => x + (v - xmin) / (xmax - xmin) * w;
    const Y = (v) => y + h - (v - ymin) / (ymax - ymin) * h;
    ctx.save();
    const sx = o.xstep || niceStep(xmax - xmin, 5);
    const sy = o.ystep || niceStep(ymax - ymin, 4);
    ctx.lineWidth = 1;
    for (let v = Math.ceil(xmin / sx) * sx; v <= xmax + 1e-9; v += sx) {
      line(ctx, X(v), y, X(v), y + h, C.rule2, 1);
      text(ctx, fr(v, sx < 1 ? 1 : 0), X(v), y + h + 14, { size: 11, color: C.ink3, align: "center", kind: "mono" });
    }
    for (let v = Math.ceil(ymin / sy) * sy; v <= ymax + 1e-9; v += sy) {
      line(ctx, x, Y(v), x + w, Y(v), C.rule2, 1);
      text(ctx, fr(v, sy < 1 ? 1 : 0), x - 6, Y(v) + 4, { size: 11, color: C.ink3, align: "right", kind: "mono" });
    }
    line(ctx, x, y + h, x + w, y + h, C.ink3, 1.2);
    line(ctx, x, y, x, y + h, C.ink3, 1.2);
    if (ymin < 0 && ymax > 0) line(ctx, x, Y(0), x + w, Y(0), C.ink3, 1);
    if (o.xlabel) text(ctx, o.xlabel, x + w, y + h + 28, { size: 12, color: C.ink2, align: "right" });
    if (o.ylabel) text(ctx, o.ylabel, x, y - 8, { size: 12, color: C.ink2, align: "left" });
    ctx.restore();
    return { X, Y };
  }
  function polyline(ctx, pts, X, Y, color, w, dash) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = w || 2;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.stroke();
    ctx.restore();
  }
  function hatch(ctx, x1, x2, y, color, step) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x1; x < x2; x += step || 12) { ctx.moveTo(x + 8, y); ctx.lineTo(x, y + 8); }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Liaison des contrôles ---------- */
  function $(id) { return document.getElementById(id); }
  function bindRange(id, fmt, cb) {
    const el = $(id);
    const out = $(id + "-out");
    const upd = () => { const v = parseFloat(el.value); if (out) out.textContent = fmt(v); cb && cb(v); };
    el.addEventListener("input", upd);
    if (out) out.textContent = fmt(parseFloat(el.value));
    return el;
  }
  function readouts(el, items) {
    el.innerHTML = items.filter(Boolean).map((it) => {
      if (it.state) return '<span class="state' + (it.cls ? " " + it.cls : "") + '">' + it.state + "</span>";
      return "<span>" + it[0] + " <b>" + it[1] + "</b></span>";
    }).join("");
  }

  /* ---------- Exercices ---------- */
  function checkValue(given, expected, tol) {
    if (!isFinite(given)) return { ok: false, hint: "Entre un nombre." };
    const t = tol || 0.02;
    const rel = Math.abs(given - expected) / Math.max(Math.abs(expected), 1e-9);
    if (rel <= t) return { ok: true };
    const r = given / expected;
    const near = (f) => Math.abs(r / f - 1) < 0.03;
    let hint = "";
    if (near(-1)) hint = "Bonne valeur, mauvais signe.";
    else if (near(G) || near(1 / G)) hint = "Un facteur g de trop ou en moins ?";
    else if (near(3.6) || near(1 / 3.6)) hint = "Attention à la conversion km/h ↔ m/s (÷ 3,6).";
    else if (near(1000) || near(0.001) || near(100) || near(0.01)) hint = "Vérifie les unités (g → kg, cm → m, ms → s).";
    else if (near(2) || near(0.5)) hint = "Il y a un facteur 2 de différence.";
    return { ok: false, hint };
  }

  function initExercises() {
    document.querySelectorAll(".exo").forEach((exo) => {
      const btn = exo.querySelector("[data-check]");
      if (!btn) return;
      const fb = exo.querySelector(".fb");
      btn.addEventListener("click", () => {
        let total = 0, good = 0;
        const hints = [];
        exo.querySelectorAll(".answer[data-ans]").forEach((a) => {
          const inp = a.querySelector("input");
          total++;
          const res = checkValue(parseNum(inp.value), parseFloat(a.dataset.ans), parseFloat(a.dataset.tol) || 0.02);
          inp.classList.toggle("is-ok", res.ok);
          inp.classList.toggle("is-bad", !res.ok);
          if (res.ok) good++;
          else if (res.hint && hints.indexOf(res.hint) < 0) hints.push(res.hint);
        });
        exo.querySelectorAll(".qcm[data-ans]").forEach((q) => {
          total++;
          const sel = q.querySelector("input:checked");
          q.querySelectorAll("label").forEach((l) => l.classList.remove("is-ok", "is-bad"));
          if (!sel) { hints.push("Choisis une réponse."); return; }
          const ok = sel.value === q.dataset.ans;
          sel.closest("label").classList.add(ok ? "is-ok" : "is-bad");
          if (ok) good++;
        });
        fb.classList.remove("is-ok", "is-bad", "is-hint");
        if (good === total) {
          fb.textContent = total > 1 ? "Tout juste (" + good + "/" + total + ")." : "Juste.";
          fb.classList.add("is-ok");
        } else {
          fb.textContent = (total > 1 ? good + "/" + total + " juste" + (good > 1 ? "s" : "") + ". " : "Pas encore. ") + hints.join(" ");
          fb.classList.add("is-bad");
        }
      });
      exo.querySelectorAll("input[type=text]").forEach((inp) => {
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
        inp.addEventListener("input", () => inp.classList.remove("is-ok", "is-bad"));
      });
    });
  }

  /* ---------- Sommaire et navigation ---------- */
  function initNav() {
    const ids = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "formulaire", "evaluation"];
    const links = {};
    document.querySelectorAll('.toc a, .chapnav a').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      (links[id] = links[id] || []).push(a);
    });
    const secs = ids.map((id) => $(id)).filter(Boolean);
    function upd() {
      const y = window.scrollY + window.innerHeight * 0.3;
      let cur = null;
      secs.forEach((s) => { if (s.offsetTop <= y) cur = s.id; });
      Object.keys(links).forEach((id) => links[id].forEach((a) => a.classList.toggle("is-active", id === cur)));
    }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
    const toc = $("toc");
    if (toc && window.matchMedia && window.matchMedia("(max-width: 960px)").matches) toc.open = false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.documentElement.lang) document.documentElement.lang = "fr";
    initExercises();
    initNav();
  });

  window.Dyn = {
    C, G, fr, sig, parseNum, checkValue, Stage, reduceMotion,
    text, arrow, vlabel, line, rrect, axes, polyline, hatch, font,
    $, bindRange, readouts, onTheme: (cb) => themeCbs.push(cb)
  };
})();
