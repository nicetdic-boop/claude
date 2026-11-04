/* Chapitre 1 — Température et dilatation : simulations */
(function () {
  "use strict";
  const { anim, draw, plot, curve, fr, range, choice } = window.Cours;

  /* =================================================================
     Simulation 1.1 — Les trois états de la matière
     Dynamique moléculaire 2D (potentiel de Lennard-Jones), gravité
     faible, thermostat de Berendsen. Unités réduites (σ = ε = m = 1).
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-etats");
    if (!cv) return;
    const N = 90, G = 0.1, DT = 0.004, SUB = 12, RC2 = 6.25;
    const st = { T: 0.15, color: true, p: [], init: false, sc: 24, Wb: 30, Hb: 17, Tm: 0.15, z: 0, vap: 0 };
    let geo = { x0: 20, y0: 20, w: 700, h: 400 };

    function layout(A) {
      geo = { x0: 20, y0: 16, w: A.W - 110, h: A.H - 32 };
      st.Wb = geo.w / st.sc;
      st.Hb = geo.h / st.sc;
      if (st.init) st.p.forEach((q) => { q.x = Math.min(q.x, st.Wb - 0.5); q.y = Math.min(q.y, st.Hb - 0.5); });
    }
    function init() {
      st.p = [];
      const a = 1.12, cols = 11;
      for (let k = 0; k < N; k++) {
        const r = Math.floor(k / cols), c = k % cols;
        st.p.push({
          x: st.Wb / 2 - (cols - 1) * a / 2 + c * a + (r % 2) * a / 2,
          y: 0.6 + r * a * 0.866,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, ax: 0, ay: 0
        });
      }
      forces();
      st.init = true;
    }
    function forces() {
      const p = st.p;
      for (let i = 0; i < N; i++) { p[i].ax = 0; p[i].ay = -G; }
      for (let i = 0; i < N; i++) {
        const a = p[i];
        for (let j = i + 1; j < N; j++) {
          const b = p[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          let r2 = dx * dx + dy * dy;
          if (r2 > RC2) continue;
          if (r2 < 0.6) r2 = 0.6;
          const ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2;
          const f = 24 * ir2 * ir6 * (2 * ir6 - 1);
          a.ax += f * dx; a.ay += f * dy;
          b.ax -= f * dx; b.ay -= f * dy;
        }
      }
    }
    function walls(q) {
      if (q.x < 0.5) { q.x = 0.5; q.vx = Math.abs(q.vx); }
      if (q.x > st.Wb - 0.5) { q.x = st.Wb - 0.5; q.vx = -Math.abs(q.vx); }
      if (q.y < 0.5) { q.y = 0.5; q.vy = Math.abs(q.vy); }
      if (q.y > st.Hb - 0.5) { q.y = st.Hb - 0.5; q.vy = -Math.abs(q.vy); }
    }
    function update(A) {
      if (!st.init) init();
      const p = st.p;
      for (let s = 0; s < SUB; s++) {
        for (const q of p) {
          q.vx += 0.5 * q.ax * DT; q.vy += 0.5 * q.ay * DT;
          q.x += q.vx * DT; q.y += q.vy * DT;
          walls(q);
        }
        forces();
        for (const q of p) { q.vx += 0.5 * q.ax * DT; q.vy += 0.5 * q.ay * DT; }
      }
      /* thermostat */
      let ke = 0;
      for (const q of p) ke += 0.5 * (q.vx * q.vx + q.vy * q.vy);
      const Tc = ke / N;
      let lam = Math.sqrt(1 + (DT * SUB / 0.4) * (st.T / Math.max(Tc, 1e-4) - 1));
      lam = Math.max(0.93, Math.min(1.07, lam));
      for (const q of p) { q.vx *= lam; q.vy *= lam; }
      st.Tm += (Tc - st.Tm) * 0.05;
      /* voisins et vapeur */
      let z = 0, iso = 0;
      for (let i = 0; i < N; i++) {
        let n = 0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx = p[i].x - p[j].x, dy = p[i].y - p[j].y;
          if (dx * dx + dy * dy < 2.25) n++;
        }
        z += n; if (n <= 1) iso++;
      }
      st.z += (z / N - st.z) * 0.08;
      st.vap += (iso / N - st.vap) * 0.08;
      if (A.t % 0.25 < 0.02) out();
    }
    function render(ctx, A, P) {
      if (!st.init) init();
      const { x0, y0, w, h } = geo;
      ctx.fillStyle = P.paper;
      ctx.fillRect(x0, y0, w, h);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, y0, w, h);
      /* plaque thermostatée */
      ctx.fillStyle = draw.heat(st.T / 2.5);
      ctx.fillRect(x0, y0 + h, w, 5);
      const r = st.sc * 0.46;
      for (const q of st.p) {
        const X = x0 + q.x * st.sc, Y = y0 + h - q.y * st.sc;
        const v = Math.hypot(q.vx, q.vy);
        ctx.beginPath();
        ctx.arc(X, Y, r, 0, Math.PI * 2);
        ctx.fillStyle = st.color ? draw.heat(v / 2.4) : P.particle;
        ctx.fill();
        ctx.strokeStyle = draw.alpha(P.ink, 0.35); ctx.lineWidth = 1; ctx.stroke();
      }
      /* jauge du thermostat */
      const gx = A.W - 60, gy0 = y0 + 20, gy1 = y0 + h - 10;
      const grd = ctx.createLinearGradient(0, gy1, 0, gy0);
      [0, 0.35, 0.7, 1].forEach((f) => grd.addColorStop(f, draw.heat(f)));
      ctx.fillStyle = P.rule2;
      draw.roundRect(ctx, gx, gy0, 16, gy1 - gy0, 8); ctx.fill();
      const yT = gy1 - (st.T / 2.5) * (gy1 - gy0);
      ctx.save(); draw.roundRect(ctx, gx, gy0, 16, gy1 - gy0, 8); ctx.clip();
      ctx.fillStyle = grd; ctx.fillRect(gx, yT, 16, gy1 - yT); ctx.restore();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; draw.roundRect(ctx, gx, gy0, 16, gy1 - gy0, 8); ctx.stroke();
      const yM = gy1 - Math.min(1, st.Tm / 2.5) * (gy1 - gy0);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - 6, yM); ctx.lineTo(gx + 22, yM); ctx.stroke();
      draw.text(ctx, A, "T*", gx + 8, gy0 - 10, { size: 12, color: P.ink2, align: "center", weight: 600 });
      draw.text(ctx, A, "froid", gx + 8, gy1 + 12, { size: 10, color: P.ink3, align: "center" });
    }
    const A = anim(cv, { draw: render, update, onResize: layout });
    A.bindPlay(document.getElementById("etats-play"));
    function etat() {
      if (st.vap > 0.6) return "gaz";
      if (st.T < 0.36 && st.vap < 0.1) return "solide (cristal)";
      if (st.vap < 0.35) return "liquide (plus un peu de vapeur)";
      return "liquide et vapeur";
    }
    function out() {
      document.getElementById("etats-read").innerHTML =
        "<span>thermostat <b>T* = " + fr(st.T, 2) + "</b></span>" +
        "<span>agitation mesurée <b>⟨E<sub>c</sub>⟩ = " + fr(st.Tm, 2) + "</b></span>" +
        "<span>voisins par particule <b>" + fr(st.z, 1) + "</b></span>" +
        "<span>particules isolées (vapeur) <b>" + fr(st.vap * 100, 0) + " %</b></span>" +
        "<span>on dirait : <b>" + etat() + "</b></span>";
    }
    const rT = range("etats-t", (v) => fr(v, 2), (v) => { st.T = v; out(); A.redraw(); });
    document.querySelectorAll("#etats-preset button").forEach((b) => b.addEventListener("click", () => { rT.set(parseFloat(b.dataset.v)); A.play(); }));
    const cb = document.getElementById("etats-col");
    cb.addEventListener("click", () => { st.color = !st.color; cb.setAttribute("aria-pressed", st.color ? "true" : "false"); A.redraw(); });
    out();
  })();

  /* =================================================================
     Simulation 1.2 — Équilibre thermique entre deux gaz
     Gaz parfaits 2D, parois extérieures diffusantes. Paroi centrale
     conductrice : la composante normale de la vitesse est retirée selon
     la température de la paroi, qui stocke l'énergie échangée.
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-equi");
    if (!cv) return;
    const SC = 55, NL = 40, NW = 4;
    const st = { TL: 600, TR: 150, NR: 40, cond: true, p: [], Ew: 0, hist: [], t: 0, init: false, mL: 600, mR: 150, Q: 0 };
    let L = null;
    function layout(A) {
      const land = A.W / A.H > 1.25;
      if (land) L = { bx: 20, by: 30, bw: 440, bh: A.H - 60, gx: 530, gy: 40, gw: A.W - 550, gh: A.H - 100 };
      else L = { bx: 20, by: 20, bw: A.W - 40, bh: A.H * 0.48, gx: 70, gy: A.H * 0.48 + 80, gw: A.W - 100, gh: A.H * 0.52 - 140 };
    }
    function rnd(T) { /* composante gaussienne */ const u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * Math.sqrt(T * SC); }
    function init() {
      st.p = [];
      const half = L.bw / 2;
      for (let i = 0; i < NL; i++) st.p.push({ s: 0, x: L.bx + 6 + Math.random() * (half - 14), y: L.by + 6 + Math.random() * (L.bh - 12), vx: rnd(st.TL), vy: rnd(st.TL) });
      for (let i = 0; i < st.NR; i++) st.p.push({ s: 1, x: L.bx + half + 8 + Math.random() * (half - 14), y: L.by + 6 + Math.random() * (L.bh - 12), vx: rnd(st.TR), vy: rnd(st.TR) });
      /* normalise l'énergie initiale de chaque côté pour partir exactement des températures demandées */
      [0, 1].forEach((s) => {
        const g = st.p.filter((q) => q.s === s);
        const T0 = s ? st.TR : st.TL;
        const e = g.reduce((a, q) => a + 0.5 * (q.vx * q.vx + q.vy * q.vy), 0) / g.length;
        const f = Math.sqrt(T0 * SC / e);
        g.forEach((q) => { q.vx *= f; q.vy *= f; });
      });
      const Tf = (NL * st.TL + st.NR * st.TR) / (NL + st.NR);
      st.Ew = NW * SC * Tf;
      st.hist = []; st.t = 0; st.Q = 0;
      st.init = true;
      measure();
    }
    function measure() {
      let eL = 0, eR = 0, nL = 0, nR = 0;
      for (const q of st.p) { const e = 0.5 * (q.vx * q.vx + q.vy * q.vy); if (q.s) { eR += e; nR++; } else { eL += e; nL++; } }
      st.mL = eL / nL / SC; st.mR = eR / nR / SC;
    }
    function diffuse(q, nx, ny) {
      const v = Math.hypot(q.vx, q.vy);
      const a = Math.asin(2 * Math.random() - 1);
      const c = Math.cos(a), s = Math.sin(a);
      q.vx = v * (nx * c - ny * s); q.vy = v * (ny * c + nx * s);
    }
    function update(A, dt) {
      if (!st.init) init();
      const mid = L.bx + L.bw / 2, r = 4;
      const steps = 3, h = dt / steps;
      for (let k = 0; k < steps; k++) {
        for (const q of st.p) {
          q.x += q.vx * h; q.y += q.vy * h;
          const xmin = q.s ? mid + 3 + r : L.bx + r, xmax = q.s ? L.bx + L.bw - r : mid - 3 - r;
          if (q.y < L.by + r) { q.y = L.by + r; diffuse(q, 0, 1); }
          if (q.y > L.by + L.bh - r) { q.y = L.by + L.bh - r; diffuse(q, 0, -1); }
          const outer = q.s ? q.x > xmax : q.x < xmin;
          const inner = q.s ? q.x < xmin : q.x > xmax;
          if (outer) { q.x = q.s ? xmax : xmin; diffuse(q, q.s ? -1 : 1, 0); }
          if (inner) {
            q.x = q.s ? xmin : xmax;
            const dir = q.s ? 1 : -1;
            if (st.cond) {
              const Tw = st.Ew / (NW * SC);
              const vn = Math.sqrt(-2 * Tw * SC * Math.log(Math.random() || 1e-9));
              const dE = 0.5 * (vn * vn - q.vx * q.vx);
              st.Ew -= dE;
              if (st.Ew < 0) st.Ew = 0;
              if (!q.s) st.Q -= dE;
              q.vx = dir * vn;
            } else q.vx = dir * Math.abs(q.vx);
          }
        }
      }
      st.t += dt;
      measure();
      const last = st.hist[st.hist.length - 1];
      if (!last || st.t - last[0] > 0.15) { st.hist.push([st.t, st.mL, st.mR]); if (st.hist.length > 400) st.hist.shift(); }
      if (A.t % 0.3 < 0.02) out();
    }
    function render(ctx, A, P) {
      if (!L) layout(A);
      if (!st.init) init();
      const mid = L.bx + L.bw / 2;
      ctx.fillStyle = draw.alpha(draw.heat((st.mL - 100) / 700), 0.14);
      ctx.fillRect(L.bx, L.by, L.bw / 2, L.bh);
      ctx.fillStyle = draw.alpha(draw.heat((st.mR - 100) / 700), 0.14);
      ctx.fillRect(mid, L.by, L.bw / 2, L.bh);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.strokeRect(L.bx, L.by, L.bw, L.bh);
      /* paroi */
      if (st.cond) { ctx.fillStyle = draw.heat((st.Ew / (NW * SC) - 100) / 700); ctx.fillRect(mid - 3, L.by, 6, L.bh); }
      else {
        ctx.fillStyle = P.card; ctx.fillRect(mid - 5, L.by, 10, L.bh);
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
        for (let y = L.by; y < L.by + L.bh; y += 8) { ctx.beginPath(); ctx.moveTo(mid - 5, y + 8); ctx.lineTo(mid + 5, y); ctx.stroke(); }
        ctx.strokeRect(mid - 5, L.by, 10, L.bh);
      }
      for (const q of st.p) {
        const v2 = (q.vx * q.vx + q.vy * q.vy) / (2 * SC);
        ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = draw.heat((v2 - 50) / 900); ctx.fill();
        ctx.strokeStyle = draw.alpha(P.ink, 0.3); ctx.lineWidth = 0.8; ctx.stroke();
      }
      draw.text(ctx, A, "gauche : " + fr(st.mL, 0) + " K", L.bx + 6, L.by - 12, { size: 13, weight: 600, color: P.ink });
      draw.text(ctx, A, "droite : " + fr(st.mR, 0) + " K", L.bx + L.bw - 6, L.by - 12, { size: 13, weight: 600, color: P.ink, align: "right" });
      /* graphique */
      const tmax = Math.max(30, st.t);
      const pl = plot(ctx, A, { x: L.gx, y: L.gy, w: L.gw, h: L.gh }, { xmin: tmax - 30, xmax: tmax, ymin: 0, ymax: 900, ystep: 200, xstep: 10, xlabel: "t (s)", ylabel: "T (K)" });
      ctx.save(); ctx.beginPath(); ctx.rect(L.gx, L.gy - 2, L.gw, L.gh + 4); ctx.clip();
      const Tf = (NL * st.TL + st.NR * st.TR) / (NL + st.NR);
      if (st.cond) curve(ctx, [[tmax - 30, Tf], [tmax, Tf]], pl.X, pl.Y, P.ink3, 1.2, [5, 5]);
      curve(ctx, st.hist.map((hh) => [hh[0], hh[1]]), pl.X, pl.Y, P.hot, 2.2);
      curve(ctx, st.hist.map((hh) => [hh[0], hh[2]]), pl.X, pl.Y, P.cold, 2.2);
      ctx.restore();
      if (st.cond) draw.text(ctx, A, "équilibre prévu " + fr(Tf, 0) + " K", L.gx + L.gw - 4, pl.Y(Tf) - 10, { size: 11, color: P.ink2, align: "right" });
      draw.legend(ctx, A, L.gx + 10, L.gy + 10, [["gauche", P.hot], ["droite", P.cold]]);
    }
    const A = anim(cv, { draw: render, update, onResize: (A2) => { layout(A2); st.init = false; } });
    A.bindPlay(document.getElementById("equi-play"));
    function out() {
      const Tf = (NL * st.TL + st.NR * st.TR) / (NL + st.NR);
      document.getElementById("equi-read").innerHTML =
        "<span>T gauche <b>" + fr(st.mL, 0) + " K</b></span>" +
        "<span>T droite <b>" + fr(st.mR, 0) + " K</b></span>" +
        "<span>équilibre attendu <b>" + (st.cond ? fr(Tf, 0) + " K" : "aucun échange") + "</b></span>" +
        "<span>énergie passée à droite <b>" + fr(st.Q / SC, 0) + " unités k·K</b></span>";
    }
    const reset = () => { st.init = false; if (L) init(); out(); A.redraw(); };
    range("equi-tg", (v) => fr(v, 0) + " K", (v) => { st.TL = v; reset(); });
    range("equi-td", (v) => fr(v, 0) + " K", (v) => { st.TR = v; reset(); });
    range("equi-n", (v) => fr(v, 0) + " (gauche : 40)", (v) => { st.NR = v; reset(); });
    choice("equi-paroi", (v) => { st.cond = v === "cond"; out(); A.redraw(); });
    document.getElementById("equi-reset").addEventListener("click", () => { reset(); A.play(); });
  })();

  /* =================================================================
     Simulation 1.3 — Le thermomètre à trois échelles
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-thermo");
    if (!cv) return;
    const REFS = [
      ["Hélium liquide", 4.2, "ext"],
      ["Azote liquide", 77.35, "ext"],
      ["Glace carbonique", 194.65, "ext"],
      ["La Brévine, 1987", 273.15 - 41.8, "vie"],
      ["Glace fondante", 273.15, "vie"],
      ["Corps humain", 310.15, "vie"],
      ["Grono, 2003", 273.15 + 41.5, "vie"],
      ["Eau bouillante", 373.15, "vie"],
      ["Four à pizza", 273.15 + 450, "ext"],
      ["Fusion du fer", 273.15 + 1538, "ext"],
      ["Filament d'ampoule", 2700, "ext"],
      ["Surface du Soleil", 5772, "ext"]
    ];
    const st = { TK: 293.15, mode: "vie" };
    const pos = (TK) => st.mode === "vie" ? ((TK - 273.15) + 60) / 180 : Math.log10(Math.max(TK, 1)) / 4;
    const fromS = (s) => st.mode === "vie" ? 273.15 - 60 + 180 * s / 1000 : Math.pow(10, 4 * s / 1000);
    const toS = (TK) => Math.max(0, Math.min(1000, pos(TK) * 1000));
    const C = (TK) => TK - 273.15, F = (TK) => (TK - 273.15) * 1.8 + 32, KfromC = (c) => c + 273.15, KfromF = (f) => (f - 32) / 1.8 + 273.15;

    function ticks() {
      if (st.mode === "vie") return {
        c: [-60, -40, -20, 0, 20, 40, 60, 80, 100, 120].map((v) => [KfromC(v), String(v).replace("-", "−")]),
        k: [220, 240, 260, 280, 300, 320, 340, 360, 380].map((v) => [v, String(v)]),
        f: [-75, -50, -25, 0, 32, 50, 75, 100, 125, 150, 175, 200, 225, 248].filter((v) => v >= -76 && v <= 248).map((v) => [KfromF(v), String(v).replace("-", "−")])
      };
      return {
        c: [-272, -270, -250, -200, -100, 0, 100, 1000, 5000].map((v) => [KfromC(v), (v > 999 ? fr(v, 0) : String(v)).replace("-", "−")]),
        k: [1, 10, 100, 1000, 10000].map((v) => [v, fr(v, 0)]),
        f: [-455, -450, -400, -300, 0, 212, 1000, 10000].map((v) => [KfromF(v), (v > 999 ? fr(v, 0) : String(v)).replace("-", "−")])
      };
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const yTop = 40, yBot = A.H - 70;
      const cols = land ? [150, 300, 450] : [120, 270, 420];
      const names = ["°C", "K", "°F"];
      const tk = ticks();
      const sets = [tk.c, tk.k, tk.f];
      const Y = (TK) => yBot - pos(TK) * (yBot - yTop);
      const p = Math.max(0, Math.min(1, pos(st.TK)));
      const yv = yBot - p * (yBot - yTop);
      cols.forEach((x, i) => {
        /* tube */
        ctx.fillStyle = P.rule2;
        draw.roundRect(ctx, x - 9, yTop - 14, 18, yBot - yTop + 30, 9); ctx.fill();
        ctx.beginPath(); ctx.arc(x, yBot + 30, 20, 0, Math.PI * 2); ctx.fill();
        const col = draw.heat(p);
        ctx.fillStyle = col;
        ctx.fillRect(x - 5, yv, 10, yBot + 20 - yv);
        ctx.beginPath(); ctx.arc(x, yBot + 30, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2;
        draw.roundRect(ctx, x - 9, yTop - 14, 18, yBot - yTop + 30, 9); ctx.stroke();
        /* graduations */
        sets[i].forEach(([TK, lab]) => {
          const pp = pos(TK);
          if (pp < -0.001 || pp > 1.001) return;
          const y = Y(TK);
          ctx.strokeStyle = P.ink2; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 20, y); ctx.stroke();
          draw.text(ctx, A, lab, x + 24, y, { size: 11, family: "mono", color: P.ink2 });
        });
        if (st.mode === "ext" && i === 1) {
          for (let d = 0; d < 4; d++) for (let m = 2; m < 10; m++) {
            const y = Y(m * Math.pow(10, d));
            ctx.strokeStyle = P.ink3; ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 15, y); ctx.stroke();
          }
        }
        draw.text(ctx, A, names[i], x, yTop - 28, { size: 16, weight: 700, align: "center" });
      });
      /* niveau courant */
      ctx.strokeStyle = draw.alpha(P.ink, 0.5); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cols[0] - 30, yv); ctx.lineTo(cols[2] + 70, yv); ctx.stroke(); ctx.setLineDash([]);
      const vals = [fr(C(st.TK), 1) + " °C", fr(st.TK, 1) + " K", fr(F(st.TK), 1) + " °F"];
      cols.forEach((x, i) => {
        ctx.font = draw.font(A, 13, 600, "mono");
        const w = ctx.measureText(vals[i]).width + 12;
        ctx.fillStyle = P.ink;
        draw.roundRect(ctx, x - w / 2, yv - 26, w, 20, 4); ctx.fill();
        draw.text(ctx, A, vals[i], x, yv - 16, { size: 13, weight: 600, family: "mono", color: P.card, align: "center" });
      });
      /* repères */
      const lx = cols[2] + 85;
      const items = REFS.filter((r) => { const pp = pos(r[1]); return pp >= 0 && pp <= 1; }).map((r) => ({ n: r[0], y: Y(r[1]), y0: Y(r[1]), TK: r[1] }));
      items.sort((a, b) => b.y - a.y);
      for (let i = 1; i < items.length; i++) if (items[i - 1].y - items[i].y < 17) items[i].y = items[i - 1].y - 17;
      items.forEach((it) => {
        const near = Math.abs(it.TK - st.TK) / it.TK < 0.004;
        ctx.strokeStyle = near ? P.accent : P.ink3; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cols[2] + 52, it.y0); ctx.lineTo(lx - 6, it.y); ctx.stroke();
        draw.text(ctx, A, it.n, lx, it.y, { size: 12, color: near ? P.accent : P.ink2, weight: near ? 700 : 500 });
      });
      if (st.mode === "ext") draw.text(ctx, A, "0 K : infiniment loin en dessous (échelle log)", cols[0] - 40, A.H - 14, { size: 11, color: P.ink3 });
    }
    const A = anim(cv, { draw: render, autoplay: false });
    const slider = document.getElementById("thermo-t");
    function out() {
      document.getElementById("thermo-read").innerHTML =
        "<span>θ = <b>" + fr(C(st.TK), 2) + " °C</b></span>" +
        "<span>T = θ + 273,15 = <b>" + fr(st.TK, 2) + " K</b></span>" +
        "<span>θ<sub>F</sub> = 1,8 θ + 32 = <b>" + fr(F(st.TK), 1) + " °F</b></span>";
      A.redraw();
    }
    const outS = document.querySelector('output[for="thermo-t"]');
    function setTK(TK) { st.TK = TK; slider.value = toS(TK); if (outS) outS.textContent = fr(C(TK), 1) + " °C"; out(); }
    slider.addEventListener("input", () => { st.TK = fromS(parseFloat(slider.value)); if (outS) outS.textContent = fr(C(st.TK), 1) + " °C"; out(); });
    const modeCtl = choice("thermo-mode", (v) => { st.mode = v; setTK(st.TK); });
    const box = document.getElementById("thermo-ref");
    REFS.forEach((r) => {
      const b = document.createElement("button");
      b.className = "btn"; b.type = "button"; b.textContent = r[0];
      b.addEventListener("click", () => {
        const need = (r[2] === "vie") ? (st.mode === "vie" ? "vie" : "ext") : "ext";
        if (need !== st.mode) modeCtl.set(need);
        setTK(r[1]);
      });
      box.appendChild(b);
    });
    setTK(293.15);
  })();

  /* =================================================================
     Simulation 1.4 — Le bilame et le thermostat
     Courbure (lames de même épaisseur) : κ = 1,5 Δα ΔT / h
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-bilame");
    if (!cv) return;
    const PAIRS = {
      li: { bas: "laiton", haut: "invar", ab: 19e-6, ah: 1.2e-6 },
      aa: { bas: "aluminium", haut: "acier", ab: 23e-6, ah: 12e-6 },
      la: { bas: "laiton", haut: "acier", ab: 19e-6, ah: 12e-6 }
    };
    const Lmm = 60, hmm = 0.5;
    const st = { mode: "man", T: 20, Tb: 20, Tf: 20, gap: 6, pair: "li", on: true, hist: [], t: 0 };
    const kappa = (T) => 1.5 * (PAIRS[st.pair].ab - PAIRS[st.pair].ah) * (T - 20) / hmm; /* 1/mm */
    const defl = (T) => { const k = kappa(T); return Math.abs(k) < 1e-9 ? 0 : (1 - Math.cos(k * Lmm)) / k; };
    const Topen = () => 20 + st.gap / (1.5 * (PAIRS[st.pair].ab - PAIRS[st.pair].ah) / hmm * Lmm * Lmm / 2);

    function update(A, dt) {
      if (st.mode !== "reg") return;
      const sdt = dt * 1.0;
      st.on = defl(st.Tb) < st.gap;
      st.Tf += (st.on ? 16 : 0) * sdt - 0.055 * (st.Tf - 20) * sdt;
      st.Tb += (st.Tf - st.Tb) / 1.6 * sdt;
      st.t += sdt;
      const last = st.hist[st.hist.length - 1];
      if (!last || st.t - last[0] > 0.1) { st.hist.push([st.t, st.Tf, st.on ? 1 : 0]); if (st.hist.length > 600) st.hist.shift(); }
      if (A.t % 0.25 < 0.02) out();
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const sc = land ? 6.4 : 9;
      const cx = 50, cy = land ? A.H * 0.68 : A.H * 0.36;
      const T = st.mode === "reg" ? st.Tb : st.T;
      const k = kappa(T) / sc; /* courbure par px */
      const Lpx = Lmm * sc;
      const d = defl(T);
      const closed = d < st.gap;
      const kk = closed && d < st.gap ? null : k;
      /* support */
      ctx.fillStyle = P.metal; ctx.fillRect(cx - 34, cy - 40, 34, 80);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(cx - 34, cy - 40, 34, 80);
      for (let y = cy - 40; y < cy + 40; y += 8) { ctx.beginPath(); ctx.moveTo(cx - 34, y + 8); ctx.lineTo(cx - 26, y); ctx.stroke(); }
      /* lame : on dessine l'arc ; si le contact est fermé, la pointe est retenue par la vis */
      function pt(s, off) {
        let x, y, nx, ny;
        let kc = k;
        if (closed) { /* lame contrainte : on ajuste la courbure pour que la pointe touche la vis */
          kc = (2 * st.gap * sc) / (Lpx * Lpx);
        }
        if (Math.abs(kc) < 1e-9) { x = cx + s; y = cy; nx = 0; ny = -1; }
        else { x = cx + Math.sin(kc * s) / kc; y = cy - (1 - Math.cos(kc * s)) / kc; nx = -Math.sin(kc * s); ny = -Math.cos(kc * s); }
        return [x + nx * off, y + ny * off];
      }
      const th = 7;
      const layer = (o1, o2, col) => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const p = pt(Lpx * i / 40, o1); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        for (let i = 40; i >= 0; i--) { const p = pt(Lpx * i / 40, o2); ctx.lineTo(p[0], p[1]); }
        ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = P.ink3; ctx.lineWidth = 0.8; ctx.stroke();
      };
      const pr = PAIRS[st.pair];
      layer(-th, 0, draw.mix(P.flame, P.card, 0.25));
      layer(0, th, draw.mix(P.metal, P.card, 0.1));
      const tip = pt(Lpx, -th);
      draw.text(ctx, A, pr.bas + " (α = " + fr(pr.ab * 1e6, 1) + "·10⁻⁶ K⁻¹)", cx + 10, cy + 22, { size: 12, color: P.ink2 });
      draw.text(ctx, A, pr.haut + " (α = " + fr(pr.ah * 1e6, 1) + "·10⁻⁶ K⁻¹)", cx + 10, cy - 50 - (closed ? st.gap * sc * 0.25 : Math.max(0, d * sc * 0.25)), { size: 12, color: P.ink2 });
      /* position de repos */
      ctx.setLineDash([4, 4]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy - th / 2); ctx.lineTo(cx + Lpx + 14, cy - th / 2); ctx.stroke(); ctx.setLineDash([]);
      draw.text(ctx, A, "pointillés : lame libre à 20 °C", cx + Lpx * 0.3, cy + 46, { size: 11, color: P.ink3 });
      /* vis de contact */
      const vx = cx + Lpx - 6, vyTop = cy + th - st.gap * sc;
      ctx.fillStyle = P.metal;
      ctx.fillRect(vx - 5, vyTop, 10, cy + 60 - vyTop);
      ctx.fillStyle = closed ? P.hot : P.ink3;
      ctx.beginPath(); ctx.arc(vx, vyTop, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.metal; ctx.fillRect(vx - 22, cy + 60, 44, 10);
      draw.text(ctx, A, closed ? "contact fermé" : "contact ouvert", vx, cy + 86, { size: 12, weight: 600, color: closed ? P.hot : P.ink2, align: "center" });
      /* flèche mesurée */
      if (!closed && d * sc > 14) {
        draw.arrow(ctx, cx + Lpx + 18, cy - th / 2, cx + Lpx + 18, tip[1] + 2, { color: P.accent, width: 1.5, head: 7 });
        draw.text(ctx, A, fr(d, 1) + " mm", cx + Lpx + 24, (cy + tip[1]) / 2, { size: 12, color: P.accent, weight: 600, family: "mono" });
      }
      /* graphique */
      const gb = land ? { x: 540, y: 34, w: A.W - 560, h: A.H - 90 } : { x: 80, y: A.H * 0.62, w: A.W - 110, h: A.H * 0.3 };
      if (st.mode === "man") {
        const pl = plot(ctx, A, gb, { xmin: -20, xmax: 220, ymin: -5, ymax: 25, xstep: 40, ystep: 5, xlabel: "θ (°C)", ylabel: "flèche (mm)" });
        Object.keys(PAIRS).forEach((key) => {
          const sp = st.pair; st.pair = key;
          const pts = []; for (let t = -20; t <= 220; t += 4) pts.push([t, Math.min(25, defl(t))]);
          st.pair = sp;
          curve(ctx, pts, pl.X, pl.Y, key === st.pair ? P.accent : P.ink3, key === st.pair ? 2.5 : 1, key === st.pair ? [] : [4, 4]);
        });
        curve(ctx, [[-20, st.gap], [220, st.gap]], pl.X, pl.Y, P.hot, 1, [2, 4]);
        draw.text(ctx, A, "écart du contact", pl.X(-16), pl.Y(st.gap) - 9, { size: 11, color: P.hot });
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(pl.X(st.T), pl.Y(Math.min(25, d)), 5, 0, Math.PI * 2); ctx.fill();
      } else {
        const tmax = Math.max(40, st.t);
        const pl = plot(ctx, A, gb, { xmin: tmax - 40, xmax: tmax, ymin: 0, ymax: 300, xstep: 10, ystep: 50, xlabel: "t (s)", ylabel: "θ semelle (°C)" });
        ctx.save(); ctx.beginPath(); ctx.rect(gb.x, gb.y, gb.w, gb.h); ctx.clip();
        /* bandes de chauffe */
        ctx.fillStyle = draw.alpha(P.hot, 0.1);
        for (let i = 1; i < st.hist.length; i++) if (st.hist[i][2]) { const x1 = pl.X(st.hist[i - 1][0]), x2 = pl.X(st.hist[i][0]); ctx.fillRect(x1, gb.y, x2 - x1 + 0.5, gb.h); }
        curve(ctx, [[tmax - 40, Topen()], [tmax, Topen()]], pl.X, pl.Y, P.ink3, 1, [5, 5]);
        curve(ctx, st.hist.map((h) => [h[0], h[1]]), pl.X, pl.Y, P.hot, 2.2);
        ctx.restore();
        draw.text(ctx, A, "consigne " + fr(Topen(), 0) + " °C", gb.x + gb.w - 4, pl.Y(Topen()) - 10, { size: 11, color: P.ink2, align: "right" });
        draw.text(ctx, A, "zones teintées : résistance allumée", gb.x + 6, gb.y + 10, { size: 11, color: P.ink3 });
        /* résistance chauffante sous la lame */
        const ry = cy + 92;
        ctx.strokeStyle = closed ? P.hot : P.ink3; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) { const x = cx + i * (Lpx / 24); const y = ry + (i % 2 ? -6 : 6); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        draw.text(ctx, A, closed ? "résistance : chauffe" : "résistance : coupée", cx, ry + 22, { size: 12, color: closed ? P.hot : P.ink3, weight: 600 });
      }
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("bil-play"));
    function out() {
      const T = st.mode === "reg" ? st.Tb : st.T;
      document.getElementById("bil-read").innerHTML =
        (st.mode === "reg" ? "<span>semelle du fer <b>" + fr(st.Tf, 0) + " °C</b></span><span>bilame <b>" + fr(st.Tb, 0) + " °C</b></span>" : "<span>θ = <b>" + fr(T, 0) + " °C</b></span>") +
        "<span>flèche libre de la pointe <b>" + fr(defl(T), 1) + " mm</b></span>" +
        "<span>rayon de courbure <b>" + (Math.abs(kappa(T)) < 1e-7 ? "∞ (droit)" : fr(Math.abs(1 / kappa(T)) / 10, 0) + " cm") + "</b></span>" +
        "<span>le contact s'ouvre à <b>" + fr(Topen(), 0) + " °C</b></span>";
      A.redraw();
    }
    range("bil-t", (v) => fr(v, 0) + " °C", (v) => { st.T = v; out(); });
    range("bil-gap", (v) => fr(v, 1) + " mm", (v) => { st.gap = v; out(); });
    choice("bil-pair", (v) => { st.pair = v; out(); });
    choice("bil-mode", (v) => {
      st.mode = v;
      document.getElementById("bil-t-box").hidden = v === "reg";
      if (v === "reg") { st.Tf = 20; st.Tb = 20; st.hist = []; st.t = 0; A.play(); } else A.pause();
      out();
    });
  })();

  /* =================================================================
     Simulation 1.5 — Un lac au fil des saisons
     Masse volumique : formule de Thiesen. Profils simplifiés.
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-lac");
    if (!cv) return;
    const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const LACS = {
      sils: { nom: "Lac de Sils", prof: 71, deep: 4, ts: [0, 0, 0, 0, 3, 8, 13, 14.5, 11.5, 7.5, 4.2, 1.5], zth: [0, 0, 0, 0, 3, 5, 7, 9, 12, 18, 30, 0], w: 2.2 },
      leman: { nom: "Léman", prof: 309, deep: 5.6, ts: [6.3, 5.8, 6.0, 8.5, 13, 18, 21.5, 22, 19.5, 15.5, 11, 8], zth: [100, 150, 120, 6, 8, 10, 12, 14, 18, 25, 40, 70], w: 3 }
    };
    const st = { m: 1, lac: "sils", ph: 0 };
    const rho = (t) => 1000 * (1 - (t + 288.9414) / (508929.2 * (t + 68.12963)) * (t - 3.9863) * (t - 3.9863));
    const interp = (arr, m) => { const i = Math.floor(m), f = m - i; return arr[i % 12] * (1 - f) + arr[(i + 1) % 12] * f; };
    /* valeurs mensuelles = milieu du mois */
    const at = (arr, m) => interp(arr, ((m - 0.5) % 12 + 12) % 12);
    const surf = (m) => at(LACS[st.lac].ts, m == null ? st.m : m);
    const zthAt = () => Math.max(1, at(LACS[st.lac].zth, st.m));
    function ice() { return st.lac === "sils" && surf() < 0.25; }
    function profile(z) {
      const L = LACS[st.lac];
      const Ts = Math.max(0, surf());
      const zth = zthAt();
      if (Ts >= L.deep) return L.deep + (Ts - L.deep) / (1 + Math.exp((z - zth) / L.w));
      return Ts + (L.deep - Ts) * (1 - Math.exp(-z / 7));
    }
    function regime() {
      const L = LACS[st.lac], Ts = surf();
      const prev = surf(st.m - 0.7);
      if (ice()) return "lac gelé : stratification inverse (0 °C sous la glace, 4 °C au fond)";
      if (Math.abs(Ts - L.deep) < 1.3) return "brassage : toute la colonne d'eau a presque la même densité";
      if (Ts > L.deep && Ts < prev) return "automne : la surface refroidit, devient plus dense et coule";
      if (Ts > L.deep) return "stratification d'été : l'eau chaude et légère flotte";
      return "eau de surface sous 4 °C : elle reste en haut";
    }
    function update(A, dt) {
      st.m = (st.m + dt * 0.45) % 12;
      st.ph += dt;
      const sl = document.getElementById("lac-m");
      sl.value = st.m;
      const o = document.querySelector('output[for="lac-m"]');
      if (o) o.textContent = MOIS[Math.floor(st.m)];
      if (A.t % 0.2 < 0.02) out();
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const L = LACS[st.lac];
      const gb = land ? { x: 70, y: 40, w: 250, h: A.H - 110 } : { x: 80, y: 40, w: A.W - 120, h: A.H * 0.32 };
      const lb = land ? { x: 360, y: 40, w: A.W - 380, h: A.H - 80 } : { x: 30, y: A.H * 0.32 + 110, w: A.W - 60, h: A.H * 0.68 - 140 };
      /* graphique de ρ(θ) */
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 16, ymin: 998.9, ymax: 1000.05, xstep: 2, ystep: 0.2, xlabel: "θ (°C)", ylabel: "ρ (kg/m³)", yfmt: (v) => fr(v, 1) });
      const pts = []; for (let t = 0; t <= 16; t += 0.2) pts.push([t, rho(t)]);
      curve(ctx, pts, pl.X, pl.Y, P.water, 2.5);
      curve(ctx, [[3.98, 998.9], [3.98, rho(3.98)]], pl.X, pl.Y, P.ink3, 1, [3, 4]);
      draw.text(ctx, A, "max à 4 °C", pl.X(4.3), pl.Y(999.3), { size: 11, color: P.ink2 });
      draw.text(ctx, A, "glace : 917 kg/m³ (bien plus bas)", gb.x + 4, gb.y + gb.h - 12, { size: 11, color: P.ink3 });
      const Ts = Math.max(0, surf()), Tf = profile(L.prof);
      [[Ts, "surface", P.hot], [Tf, "fond", P.cold]].forEach(([t, lab, col], i) => {
        if (t > 16) return;
        const x = pl.X(t), y = pl.Y(rho(t));
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
        draw.text(ctx, A, lab, x + 9, y + (i ? 14 : -12), { size: 12, color: col, weight: 600 });
      });
      if (Ts > 16) draw.text(ctx, A, "surface : " + fr(Ts, 0) + " °C →", gb.x + gb.w - 4, pl.Y(999.0), { size: 11, color: P.hot, align: "right" });
      /* coupe du lac */
      const top = lb.y + 26, bot = lb.y + lb.h;
      const path = new Path2D();
      path.moveTo(lb.x, top);
      path.lineTo(lb.x + lb.w, top);
      path.bezierCurveTo(lb.x + lb.w * 0.92, top + (bot - top) * 0.3, lb.x + lb.w * 0.8, bot, lb.x + lb.w * 0.55, bot);
      path.bezierCurveTo(lb.x + lb.w * 0.3, bot, lb.x + lb.w * 0.1, top + (bot - top) * 0.4, lb.x, top);
      path.closePath();
      ctx.save(); ctx.clip(path);
      const n = 70;
      for (let i = 0; i < n; i++) {
        const z = L.prof * (i + 0.5) / n;
        ctx.fillStyle = draw.heat(profile(z) / 24);
        ctx.fillRect(lb.x, top + (bot - top) * i / n, lb.w, (bot - top) / n + 1);
      }
      /* brassage */
      const r = regime();
      const mixing = r.startsWith("brassage") || r.startsWith("automne");
      if (mixing) {
        const zmax = r.startsWith("brassage") ? 1 : Math.min(1, zthAt() / L.prof * 1.6);
        const hz = (bot - top) * zmax;
        for (let k = 0; k < 4; k++) {
          const cx0 = lb.x + lb.w * (0.18 + k * 0.2);
          const rr = Math.min(hz * 0.4, 70);
          const a = st.ph * 1.5 + k;
          ctx.strokeStyle = draw.alpha(P.ink, 0.45); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(cx0, top + hz / 2, 18, Math.max(10, hz / 2 - 6), 0, a, a + 4.5); ctx.stroke();
          const ex = cx0 + 18 * Math.cos(a + 4.5), ey = top + hz / 2 + Math.max(10, hz / 2 - 6) * Math.sin(a + 4.5);
          ctx.fillStyle = draw.alpha(P.ink, 0.55); ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
          void rr;
        }
      }
      ctx.restore();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.stroke(path);
      /* glace */
      if (ice()) {
        ctx.fillStyle = P.ice; ctx.fillRect(lb.x - 4, top - 10, lb.w + 8, 12);
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(lb.x - 4, top - 10, lb.w + 8, 12);
        draw.text(ctx, A, "glace (épaisseur exagérée)", lb.x + lb.w / 2, top - 20, { size: 11, color: P.ink2, align: "center" });
      } else {
        ctx.strokeStyle = P.water; ctx.lineWidth = 2;
        ctx.beginPath(); for (let x = lb.x; x <= lb.x + lb.w; x += 6) { const y = top - 2 + Math.sin(x / 14 + st.ph * 2) * 1.5; x === lb.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      }
      /* profondeurs */
      [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
        const y = top + (bot - top) * f * 0.98;
        draw.text(ctx, A, fr(L.prof * f, 0) + " m", lb.x + lb.w * 0.5 + 4, y + (f === 0 ? 10 : 0), { size: 10, color: draw.alpha(P.ink, 0.75), family: "mono" });
        const T = profile(L.prof * f);
        draw.text(ctx, A, fr(T, 1) + " °C", lb.x + lb.w * 0.5 - 6, y + (f === 0 ? 10 : 0), { size: 10, color: draw.alpha(P.ink, 0.75), family: "mono", align: "right" });
      });
      draw.text(ctx, A, L.nom + " · " + MOIS[Math.floor(st.m)], lb.x, lb.y + 4, { size: 14, weight: 700 });
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("lac-play"));
    function out() {
      const L = LACS[st.lac];
      document.getElementById("lac-read").innerHTML =
        "<span>surface <b>" + fr(Math.max(0, surf()), 1) + " °C</b></span>" +
        "<span>fond (" + L.prof + " m) <b>" + fr(profile(L.prof), 1) + " °C</b></span>" +
        "<span><b>" + regime() + "</b></span>";
      A.redraw();
    }
    range("lac-m", (v) => MOIS[Math.floor(v)], (v) => { st.m = v; out(); });
    choice("lac-choix", (v) => { st.lac = v; out(); });
  })();
})();
