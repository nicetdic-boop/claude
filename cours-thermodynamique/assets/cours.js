/* =====================================================================
   Thermodynamique au gymnase — utilitaires communs
   - couleurs du thème (clair/sombre) pour les canvas
   - moteur d'animation (coordonnées virtuelles, pause hors écran,
     respect de prefers-reduced-motion)
   - graphiques : axes, graduations, palette froid → chaud
   - formatage des nombres à la française
   - QCM « Teste-toi » et vérification des réponses numériques
   - surlignage du sommaire
   ===================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Couleurs du thème ---------- */
  const TOKENS = [
    "paper", "card", "ink", "ink-2", "ink-3", "rule", "rule-2", "accent", "accent-soft",
    "signal", "signal-soft", "hot", "hot-soft", "cold", "cold-soft", "work", "work-soft",
    "energy", "energy-soft", "particle", "metal", "water", "ice", "steam", "flame", "glow"
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
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    let [ent, dec] = s.split(".");
    const neg = ent.startsWith("-");
    if (neg) ent = ent.slice(1);
    ent = ent.length > 4 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ent;
    return (neg ? "−" : "") + ent + (dec ? "," + dec : "");
  }
  function sci(x, digits) {
    if (x === 0) return "0";
    if (!isFinite(x)) return "—";
    const d = digits == null ? 2 : digits;
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 4) return fr(x, Math.max(0, d - Math.max(0, e)));
    let m = x / Math.pow(10, e);
    let ee = e;
    if (Math.abs(Number(m.toFixed(d))) >= 10) { m /= 10; ee += 1; }
    return fr(m, d) + "·10" + String(ee).split("").map((c) => SUP[c]).join("");
  }
  function si(x, unit, digits) {
    const d = digits == null ? 3 : digits;
    if (x === 0) return "0 " + unit;
    if (!isFinite(x)) return "∞ " + unit;
    const prefixes = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"]];
    const a = Math.abs(x);
    for (const [f, p] of prefixes) {
      if (a >= f * 0.9995) {
        const v = x / f;
        const dec = Math.max(0, d - 1 - Math.floor(Math.log10(Math.abs(v) || 1)));
        return fr(v, dec) + " " + p + unit;
      }
    }
    return sci(x, 2) + " " + unit;
  }

  /* ---------- Moteur d'animation ----------
     Coordonnées virtuelles : largeur fixe (vw, 800 par défaut), hauteur
     déduite du rapport d'aspect réel du canvas. */
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
    resize();
    sync();
    return A;
  }

  /* ---------- Aides de dessin ---------- */
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
  const draw = {
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
    roundRect(ctx, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    mix(a, b, t) {
      const pa = hex(a), pb = hex(b);
      if (!pa || !pb) return a;
      const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
      return "rgb(" + c.join(",") + ")";
    },
    alpha(a, al) {
      const p = hex(a);
      return p ? "rgba(" + p.join(",") + "," + al + ")" : a;
    },
    /* Échelle froid → chaud : f entre 0 (froid) et 1 (chaud) */
    heat(f) {
      f = Math.max(0, Math.min(1, f));
      const P = palette;
      const MID = "#e8e2d8"; /* neutre clair, lisible sur les deux thèmes */
      if (f < 0.3) return draw.mix(P.cold, P.ice, f / 0.3);
      if (f < 0.5) return draw.mix(P.ice, MID, (f - 0.3) / 0.2);
      if (f < 0.72) return draw.mix(MID, P.flame, (f - 0.5) / 0.22);
      return draw.mix(P.flame, P.hot, (f - 0.72) / 0.28);
    },
    /* Légende en ligne : items = [[texte, couleur], …] ; renvoie la largeur utilisée */
    legend(ctx, A, x, y, items, size) {
      const sz = size || 12;
      ctx.font = draw.font(A, sz, 600);
      let cx = x;
      items.forEach(([t, col]) => {
        ctx.fillStyle = col;
        ctx.fillRect(cx, y - 1.5, 14, 3);
        draw.text(ctx, A, t, cx + 18, y, { size: sz, weight: 600, color: col });
        ctx.font = draw.font(A, sz, 600);
        cx += 18 + ctx.measureText(t).width + 14;
      });
      return cx - x;
    },
    /* Flamme stylisée (brûleur) */
    flame(ctx, x, y, w, h, t, on) {
      if (!on) return;
      const P = palette;
      for (let i = 0; i < 3; i++) {
        const fx = x + (i - 1) * w * 0.32;
        const fh = h * (0.75 + 0.25 * Math.sin(t * 13 + i * 2.1));
        ctx.beginPath();
        ctx.moveTo(fx - w * 0.16, y);
        ctx.quadraticCurveTo(fx - w * 0.18, y - fh * 0.5, fx, y - fh);
        ctx.quadraticCurveTo(fx + w * 0.18, y - fh * 0.5, fx + w * 0.16, y);
        ctx.closePath();
        ctx.fillStyle = draw.alpha(P.flame, 0.9);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fx - w * 0.07, y);
        ctx.quadraticCurveTo(fx - w * 0.08, y - fh * 0.3, fx, y - fh * 0.55);
        ctx.quadraticCurveTo(fx + w * 0.08, y - fh * 0.3, fx + w * 0.07, y);
        ctx.closePath();
        ctx.fillStyle = draw.alpha(P.hot, 0.9);
        ctx.fill();
      }
    }
  };

  /* ---------- Graphiques ---------- */
  function niceStep(range, target) {
    const raw = range / (target || 5);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
  }
  /* Dessine un repère dans la boîte {x, y, w, h} et renvoie les
     fonctions de conversion. cfg : xmin, xmax, ymin, ymax, xstep, ystep,
     xlabel, ylabel, xfmt, yfmt, grid (true par défaut). */
  function plot(ctx, A, box, cfg) {
    const P = palette;
    const c = Object.assign({ grid: true, xfmt: (v) => fr(v, 0), yfmt: (v) => fr(v, 0) }, cfg);
    const X = (v) => box.x + (v - c.xmin) / (c.xmax - c.xmin) * box.w;
    const Y = (v) => box.y + box.h - (v - c.ymin) / (c.ymax - c.ymin) * box.h;
    const xs = c.xstep || niceStep(c.xmax - c.xmin, 6);
    const ys = c.ystep || niceStep(c.ymax - c.ymin, 5);
    ctx.lineWidth = 1;
    ctx.font = draw.font(A, 11, 400, "mono");
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    for (let v = Math.ceil(c.xmin / xs - 1e-9) * xs; v <= c.xmax + xs * 1e-6; v += xs) {
      const px = X(v);
      if (c.grid) { ctx.strokeStyle = P.rule2; ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke(); }
      ctx.fillStyle = P.ink3;
      ctx.fillText(c.xfmt(v), px, box.y + box.h + 5);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = Math.ceil(c.ymin / ys - 1e-9) * ys; v <= c.ymax + ys * 1e-6; v += ys) {
      const py = Y(v);
      if (c.grid) { ctx.strokeStyle = P.rule2; ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke(); }
      ctx.fillStyle = P.ink3;
      ctx.fillText(c.yfmt(v), box.x - 6, py);
    }
    ctx.strokeStyle = P.ink3;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h);
    ctx.stroke();
    if (c.xlabel) draw.text(ctx, A, c.xlabel, box.x + box.w, box.y + box.h + 26, { size: 12, color: P.ink2, align: "right" });
    if (c.ylabel) draw.text(ctx, A, c.ylabel, box.x - 4, box.y - 14, { size: 12, color: P.ink2, align: "left" });
    return { X, Y, box, cfg: c };
  }
  /* Trace une courbe à partir d'une liste de points [x, y] */
  function curve(ctx, pts, X, Y, color, width, dash) {
    if (!pts.length) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineJoin = "round";
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    pts.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ---------- Curseurs ---------- */
  function range(id, format, onInput) {
    const el = document.getElementById(id);
    if (!el) return { value: () => 0, set: () => {} };
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
  function choice(container, onChange) {
    const box = typeof container === "string" ? document.getElementById(container) : container;
    if (!box) return { set: () => {} };
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

  /* ---------- QCM « Teste-toi » ----------
     <div class="quiz"> contient des <div class="qcm"> ; la bonne option
     porte data-ok, l'explication est dans <p class="fb" hidden>. */
  function initQuiz() {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      const items = Array.from(quiz.querySelectorAll(".qcm"));
      const score = quiz.querySelector(".quiz__score");
      let done = 0, good = 0;
      const show = () => { if (score) score.textContent = done ? "Score : " + good + " / " + done + (done === items.length ? " · " + verdict(good, items.length) : "") : items.length + " questions · une seule réponse juste à chaque fois"; };
      items.forEach((q) => {
        const btns = Array.from(q.querySelectorAll(".opts button"));
        btns.forEach((b, i) => {
          if (!b.querySelector(".k")) {
            const k = document.createElement("span");
            k.className = "k"; k.textContent = String.fromCharCode(97 + i) + ")";
            const t = document.createElement("span");
            while (b.firstChild) t.appendChild(b.firstChild);
            b.appendChild(k); b.appendChild(t);
          }
          b.type = "button";
          b.addEventListener("click", () => {
            const ok = b.hasAttribute("data-ok");
            btns.forEach((x) => {
              x.disabled = true;
              if (x.hasAttribute("data-ok")) x.classList.add("is-right");
            });
            if (!ok) b.classList.add("is-wrong");
            const fb = q.querySelector(".fb");
            if (fb) {
              fb.hidden = false;
              if (!fb.querySelector("b.verdict")) {
                const v = document.createElement("b");
                v.className = "verdict";
                v.textContent = ok ? "Juste. " : "Pas tout à fait. ";
                fb.insertBefore(v, fb.firstChild);
              }
            }
            done++; if (ok) good++;
            show();
          });
        });
      });
      const reset = quiz.querySelector(".quiz__reset");
      if (reset) reset.addEventListener("click", () => {
        done = 0; good = 0;
        items.forEach((q) => {
          q.querySelectorAll(".opts button").forEach((x) => { x.disabled = false; x.classList.remove("is-right", "is-wrong"); });
          const fb = q.querySelector(".fb");
          if (fb) { fb.hidden = true; const v = fb.querySelector("b.verdict"); if (v) v.remove(); }
        });
        show();
      });
      show();
    });
  }
  function verdict(g, n) {
    const r = g / n;
    if (r === 1) return "sans faute, chapeau !";
    if (r >= 0.8) return "très bien";
    if (r >= 0.5) return "pas mal, relis les points ratés";
    return "relis le chapitre, puis réessaie";
  }

  /* ---------- Vérification d'une réponse numérique ----------
     <div class="check" data-answer="1.25e5" data-tol="0.02" data-unit="J"></div>
     Accepte la virgule, les espaces, « e », « ·10^ » et « x10^ ». */
  function parseNum(s) {
    if (!s) return NaN;
    let t = String(s).trim().replace(/−/g, "-").replace(/[\s  ']/g, "").replace(/,/g, ".");
    t = t.replace(/(?:[·*x×])10\^?\(?(-?\d+)\)?/i, "e$1");
    t = t.replace(/[a-zA-Z°%µ/]+$/, "");
    return t === "" ? NaN : Number(t);
  }
  let checkId = 0;
  function initChecks() {
    document.querySelectorAll(".check[data-answer]").forEach((box) => {
      const ans = Number(box.dataset.answer);
      const tol = Number(box.dataset.tol || 0.02);
      const id = "chk-" + (++checkId);
      box.innerHTML = '<label for="' + id + '">' + (box.dataset.label || "Ta réponse") + '</label>' +
        '<input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" placeholder="ex. 2,5e3">' +
        (box.dataset.unit ? '<span class="unit">' + box.dataset.unit + '</span>' : "") +
        '<button class="btn" type="button">Vérifier</button><span class="res" aria-live="polite"></span>';
      const inp = box.querySelector("input"), res = box.querySelector(".res");
      const go = () => {
        const v = parseNum(inp.value);
        if (!isFinite(v)) { res.className = "res ko"; res.textContent = "Écris un nombre, par exemple 4,2 ou 1,5e3."; return; }
        const err = Math.abs(v - ans) / Math.max(Math.abs(ans), 1e-30);
        if (err <= tol) { res.className = "res ok"; res.textContent = "✓ Juste."; }
        else if (Math.abs(v / ans) > 9.5 && Math.abs(v / ans) < 1050 || Math.abs(ans / v) > 9.5 && Math.abs(ans / v) < 1050) { res.className = "res ko"; res.textContent = "✗ Ordre de grandeur faux : vérifie tes unités (g ou kg ? °C ou K ? kJ ou J ?)."; }
        else if (Math.abs(v + ans) / Math.abs(ans) <= tol) { res.className = "res ko"; res.textContent = "✗ Presque : le signe est faux."; }
        else { res.className = "res ko"; res.textContent = "✗ Pas encore. Reprends le calcul."; }
      };
      box.querySelector("button").addEventListener("click", go);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    });
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
  function initAll() { initToc(); initQuiz(); initChecks(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();

  /* ---------- Constantes physiques ---------- */
  const K = { R: 8.314, kB: 1.381e-23, NA: 6.022e23, T0: 273.15, g: 9.81, p0: 101325 };

  window.Cours = { anim, draw, plot, curve, niceStep, fr, sci, si, range, choice, onTheme, parseNum, K, get colors() { return palette; }, reduceMotion };
})();
