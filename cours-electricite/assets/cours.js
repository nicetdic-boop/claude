/* =====================================================================
   Cours d'électricité — utilitaires communs
   - lecture des couleurs du thème (clair/sombre) pour les canvas
   - moteur d'animation (coordonnées virtuelles, pause hors écran,
     respect de prefers-reduced-motion)
   - formatage des nombres à la française
   - surlignage du sommaire
   ===================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Couleurs du thème ---------- */
  const TOKENS = [
    "paper", "card", "ink", "ink-2", "ink-3", "rule", "rule-2", "accent", "accent-soft",
    "signal", "plus", "minus", "plus-soft", "minus-soft", "field", "metal", "glow", "water",
    "wire-phase", "wire-neutral", "wire-earth", "s-acc", "s-fil", "s-nuc", "s-aut", "s-pv", "s-imp"
  ];
  let palette = {};
  function readPalette() {
    const cs = getComputedStyle(root);
    const p = {};
    TOKENS.forEach((t) => { p[t.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())] = cs.getPropertyValue("--" + t).trim(); });
    palette = p;
    return p;
  }
  readPalette();
  const themeListeners = [];
  function onTheme(cb) { themeListeners.push(cb); }
  function themeChanged() { readPalette(); themeListeners.forEach((cb) => cb(palette)); }
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", themeChanged);
    else if (mq.addListener) mq.addListener(themeChanged);
  }
  new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });

  /* ---------- Formatage ---------- */
  const SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function fr(x, digits) {
    if (!isFinite(x)) return "—";
    const d = digits == null ? 2 : digits;
    let s = Number(x).toFixed(d);
    let [ent, dec] = s.split(".");
    const neg = ent.startsWith("-");
    if (neg) ent = ent.slice(1);
    ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (neg ? "−" : "") + ent + (dec ? "," + dec : "");
  }
  /* Notation scientifique : 8,99·10⁹ (texte brut, utilisable dans canvas et HTML) */
  function sci(x, digits) {
    if (x === 0) return "0";
    if (!isFinite(x)) return "—";
    const d = digits == null ? 2 : digits;
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 3) return fr(x, Math.max(0, d - Math.max(0, e)));
    let m = x / Math.pow(10, e);
    if (Math.abs(Number(m.toFixed(d))) >= 10) { m /= 10; return fr(m, d) + "·10" + String(e + 1).split("").map((c) => SUP[c]).join(""); }
    return fr(m, d) + "·10" + String(e).split("").map((c) => SUP[c]).join("");
  }
  /* Valeur avec préfixe SI : 0,0123 A -> 12,3 mA */
  function si(x, unit, digits) {
    const d = digits == null ? 3 : digits;
    if (x === 0) return "0 " + unit;
    if (!isFinite(x)) return "∞ " + unit;
    const prefixes = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
    const a = Math.abs(x);
    for (const [f, p] of prefixes) {
      if (a >= f * 0.9995) {
        const v = x / f;
        const dec = Math.max(0, d - 1 - Math.floor(Math.log10(Math.abs(v) || 1)));
        return fr(v, dec) + " " + p + unit;
      }
    }
    return sci(x, 2) + " " + unit;
  }

  /* ---------- Moteur d'animation ----------
     Coordonnées virtuelles : largeur fixe (vw, 800 par défaut), hauteur
     déduite du rapport d'aspect réel du canvas. */
  const allAnims = [];
  function anim(canvas, opts) {
    const o = Object.assign({ vw: 800, autoplay: true, draw: () => {}, update: null }, opts);
    const ctx = canvas.getContext("2d");
    const A = {
      canvas, ctx, W: o.vw, H: o.vw * 9 / 16, s: 1, t: 0,
      playing: false, visible: true, wantPlay: o.autoplay && !reduceMotion,
      opts: o, buttons: []
    };
    let raf = 0, last = 0;

    function resize() {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      A.s = cw / o.vw;
      A.W = o.vw;
      A.H = o.vw * ch / cw;
      ctx.setTransform(dpr * A.s, 0, 0, dpr * A.s, 0, 0);
      if (o.onResize) o.onResize(A);
      render(0);
    }
    function render(dt) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      o.draw(ctx, A, palette, dt);
    }
    function frame(ts) {
      raf = 0;
      if (!A.playing) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      A.t += dt;
      if (o.update) o.update(A, dt);
      render(dt);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (A.playing) return;
      A.playing = true; last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      A.playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function sync() {
      if (A.wantPlay && A.visible && !document.hidden) start(); else stop();
      A.buttons.forEach(updateBtn);
    }
    function updateBtn(b) {
      b.textContent = A.wantPlay ? "❚❚ Pause" : "▶ Lecture";
      b.setAttribute("aria-pressed", A.wantPlay ? "true" : "false");
    }
    A.play = () => { A.wantPlay = true; sync(); };
    A.pause = () => { A.wantPlay = false; sync(); };
    A.toggle = () => { A.wantPlay = !A.wantPlay; sync(); };
    A.redraw = () => { if (!A.playing) render(0); };
    A.bindPlay = (btn) => {
      if (!btn) return;
      A.buttons.push(btn);
      btn.classList.add("btn--play");
      btn.addEventListener("click", A.toggle);
      updateBtn(btn);
    };
    /* Coordonnées virtuelles d'un événement pointeur */
    A.pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / A.s, y: (e.clientY - r.top) / A.s };
    };

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { A.visible = en.isIntersecting; sync(); });
      }, { rootMargin: "80px" }).observe(canvas);
    }
    document.addEventListener("visibilitychange", sync);
    onTheme(() => A.redraw());
    allAnims.push(A);
    resize();
    sync();
    return A;
  }

  /* ---------- Aides de dessin ---------- */
  const draw = {
    /* Taille de police en unités virtuelles, jamais sous ~11 px réels */
    fs(A, px) { return Math.max(px, 11 / A.s); },
    font(A, px, weight, family) {
      const fam = family === "mono" ? "'IBM Plex Mono', ui-monospace, monospace" : "Barlow, 'Segoe UI', system-ui, sans-serif";
      return (weight || 500) + " " + draw.fs(A, px) + "px " + fam;
    },
    text(ctx, A, str, x, y, o) {
      o = o || {};
      ctx.font = draw.font(A, o.size || 14, o.weight, o.family);
      ctx.fillStyle = o.color || palette.ink;
      ctx.textAlign = o.align || "left";
      ctx.textBaseline = o.baseline || "middle";
      ctx.fillText(str, x, y);
    },
    arrow(ctx, x1, y1, x2, y2, o) {
      o = o || {};
      const head = o.head || 10, w = o.width || 2;
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 0.5) return;
      const ux = dx / L, uy = dy / L;
      const h = Math.min(head, L * 0.6);
      ctx.strokeStyle = o.color || palette.ink;
      ctx.fillStyle = o.color || palette.ink;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - ux * h * 0.8, y2 - uy * h * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5);
      ctx.lineTo(x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5);
      ctx.closePath();
      ctx.fill();
    },
    /* Particule chargée : cercle coloré avec + ou − */
    charge(ctx, x, y, r, sign, o) {
      o = o || {};
      const col = sign > 0 ? palette.plus : palette.minus;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (r >= 5) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1.2, r * 0.22);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y);
        if (sign > 0) { ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.5); }
        ctx.stroke();
      }
    },
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    /* Mélange simple de deux couleurs hexadécimales (t entre 0 et 1) */
    mix(a, b, t) {
      const pa = hex(a), pb = hex(b);
      if (!pa || !pb) return a;
      const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
      return "rgb(" + c.join(",") + ")";
    },
    alpha(a, al) {
      const p = hex(a);
      return p ? "rgba(" + p.join(",") + "," + al + ")" : a;
    }
  };
  function hex(c) {
    if (!c) return null;
    c = c.trim();
    if (c[0] !== "#") {
      const m = c.match(/rgba?\(([^)]+)\)/);
      return m ? m[1].split(",").slice(0, 3).map(Number) : null;
    }
    if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }

  /* ---------- Curseurs ---------- */
  /* Relie un <input type=range> à son <output> et à une fonction. */
  function range(id, format, onInput) {
    const el = document.getElementById(id);
    if (!el) return { value: () => 0 };
    const out = document.querySelector('output[for="' + id + '"]');
    const update = () => {
      const v = parseFloat(el.value);
      if (out) out.textContent = format ? format(v) : String(v);
      if (onInput) onInput(v);
    };
    el.addEventListener("input", update);
    update();
    return { el, value: () => parseFloat(el.value), set: (v) => { el.value = v; update(); } };
  }
  /* Groupe de boutons exclusifs (data-value) */
  function choice(container, onChange) {
    const box = typeof container === "string" ? document.getElementById(container) : container;
    if (!box) return;
    const btns = Array.from(box.querySelectorAll("button[data-value]"));
    const set = (v) => {
      btns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === v ? "true" : "false"));
      onChange(v);
    };
    btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.value)));
    const init = btns.find((b) => b.getAttribute("aria-pressed") === "true") || btns[0];
    if (init) set(init.dataset.value);
    return { set };
  }

  /* ---------- Sommaire : section active ---------- */
  function initToc() {
    const links = Array.from(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const s = document.getElementById(a.getAttribute("href").slice(1));
      if (s) map.set(s, a);
    });
    let current = null;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          if (current) current.classList.remove("is-active");
          current = map.get(en.target);
          if (current) current.classList.add("is-active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    map.forEach((_, s) => io.observe(s));
    /* Sur petit écran, le sommaire se replie après un clic */
    const det = document.querySelector("details.toc");
    if (det) {
      const mq = window.matchMedia("(min-width: 961px)");
      const setOpen = () => { det.open = mq.matches ? true : det.open; };
      setOpen();
      if (mq.addEventListener) mq.addEventListener("change", setOpen);
      det.querySelector("summary").addEventListener("click", (e) => { if (mq.matches) e.preventDefault(); });
      links.forEach((a) => a.addEventListener("click", () => { if (!mq.matches) det.open = false; }));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initToc);
  else initToc();

  window.Cours = { anim, draw, fr, sci, si, range, choice, onTheme, get colors() { return palette; }, reduceMotion };
})();
