/* Chapitre 2 — Chaleur et changements d'état : simulations */
(function () {
  "use strict";
  const { anim, draw, plot, curve, fr, si, range, choice } = window.Cours;

  /* =================================================================
     Simulation 2.1 — Deux casseroles sur la même plaque
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-cas");
    if (!cv) return;
    const SUB = {
      eau: { n: "Eau", c: 4186, eb: 100, L: 2257e3, liq: true },
      huile: { n: "Huile de cuisine", c: 1900, stop: 220, stopTxt: "point de fumée", liq: true },
      ethanol: { n: "Éthanol (alcool)", c: 2440, eb: 78, L: 846e3, liq: true },
      sable: { n: "Sable sec", c: 830, liq: false },
      alu: { n: "Bloc d'aluminium", c: 900, liq: false },
      fer: { n: "Bloc de fer", c: 450, liq: false },
      cuivre: { n: "Bloc de cuivre", c: 385, liq: false }
    };
    const TMAX = 250, TSPEED = 20;
    const st = { a: "eau", b: "huile", m: 1, P: 1000, t: 0, pots: [], hist: [] };
    function reset() {
      st.t = 0;
      st.pots = [st.a, st.b].map((k) => ({ k, T: 20, m: st.m, done: false, msg: "" }));
      st.hist = [[0, 20, 20]];
    }
    function step(p, dt) {
      const s = SUB[p.k];
      if (p.done) return;
      if (s.eb && p.T >= s.eb) {
        p.T = s.eb;
        p.m -= st.P * dt / s.L;
        p.msg = "ébullition : " + fr(Math.max(0, p.m) * 1000, 0) + " g restants";
        if (p.m <= 0) { p.m = 0; p.done = true; p.msg = "tout s'est évaporé"; }
        return;
      }
      p.T += st.P * dt / (p.m * s.c);
      if (s.eb && p.T > s.eb) p.T = s.eb;
      const lim = s.stop || TMAX;
      if (p.T >= lim) { p.T = lim; p.done = true; p.msg = s.stop ? s.stopTxt + " : on arrête !" : "on arrête à " + TMAX + " °C"; }
    }
    function update(A, dt) {
      const sdt = dt * TSPEED;
      st.pots.forEach((p) => step(p, sdt));
      st.t += sdt;
      const last = st.hist[st.hist.length - 1];
      if (st.t - last[0] > 2) st.hist.push([st.t, st.pots[0].T, st.pots[1].T]);
      if (st.t > 900 || st.pots.every((p) => p.done)) A.pause();
      if (A.t % 0.2 < 0.02) out();
    }
    function render(ctx, A, P, dt) {
      if (!st.pots.length) reset();
      const land = A.W / A.H > 1.25;
      const cols = [P.accent, P.work];
      /* casseroles */
      st.pots.forEach((p, i) => {
        const s = SUB[p.k];
        const k = land ? 1 : 1.45;
        const cx = land ? 100 + i * 170 : 200 + i * 400, base = land ? A.H - 70 : A.H * 0.38;
        const w = 120 * k, h = 90 * k;
        ctx.fillStyle = P.metal; ctx.fillRect(cx - 70 * k, base + 26, 140 * k, 10);
        draw.flame(ctx, cx, base + 24, 70 * k, 22, A.t, !p.done && st.t > 0 && A.playing);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - w / 2, base - h); ctx.lineTo(cx - w / 2, base); ctx.lineTo(cx + w / 2, base); ctx.lineTo(cx + w / 2, base - h); ctx.stroke();
        const fill = s.liq ? Math.max(0, p.m / st.m) * h * 0.7 : h * 0.55;
        ctx.fillStyle = draw.heat(p.T / 130);
        if (s.liq) ctx.fillRect(cx - w / 2 + 2, base - fill, w - 4, fill - 2);
        else { draw.roundRect(ctx, cx - w / 2 + 14, base - fill, w - 28, fill - 2, 4); ctx.fill(); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.stroke(); }
        if (s.eb && p.T >= s.eb && !p.done) {
          for (let k = 0; k < 7; k++) {
            const bx = cx - w / 2 + 12 + ((k * 37 + A.t * 60) % (w - 24));
            const by = base - 6 - ((A.t * 80 + k * 23) % Math.max(10, fill - 8));
            ctx.strokeStyle = draw.alpha(P.card, 0.9); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(bx, by, 3 + (k % 3), 0, Math.PI * 2); ctx.stroke();
          }
        }
        draw.text(ctx, A, (i ? "B · " : "A · ") + s.n, cx, base - h - 34, { size: 13, weight: 700, align: "center", color: cols[i] });
        draw.text(ctx, A, fr(p.T, 1) + " °C", cx, base - h - 14, { size: 14, weight: 600, family: "mono", align: "center" });
        if (p.msg) draw.text(ctx, A, p.msg, cx, base + 52, { size: 11, color: P.ink2, align: "center" });
      });
      /* graphique */
      const gb = land ? { x: 420, y: 36, w: A.W - 440, h: A.H - 96 } : { x: 70, y: A.H * 0.5, w: A.W - 100, h: A.H * 0.42 };
      const tmax = Math.max(300, Math.ceil(st.t / 100) * 100);
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: tmax, ymin: 0, ymax: TMAX, ystep: 50, xlabel: "t (s, temps réel)", ylabel: "θ (°C)" });
      curve(ctx, [[0, 100], [tmax, 100]], pl.X, pl.Y, P.rule, 1, [3, 4]);
      curve(ctx, st.hist.map((h) => [h[0], h[1]]).concat([[st.t, st.pots[0].T]]), pl.X, pl.Y, cols[0], 2.5);
      curve(ctx, st.hist.map((h) => [h[0], h[2]]).concat([[st.t, st.pots[1].T]]), pl.X, pl.Y, cols[1], 2.5);
      draw.text(ctx, A, "A", pl.X(st.t) + 6, pl.Y(st.pots[0].T), { size: 12, weight: 700, color: cols[0] });
      draw.text(ctx, A, "B", pl.X(st.t) + 6, pl.Y(st.pots[1].T) + (Math.abs(st.pots[0].T - st.pots[1].T) < 6 ? 12 : 0), { size: 12, weight: 700, color: cols[1] });
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("cas-play"));
    function out() {
      document.getElementById("cas-read").innerHTML = st.pots.map((p, i) => {
        const s = SUB[p.k];
        return "<span>" + (i ? "B" : "A") + " : pente <b>" + fr(st.P / (st.m * s.c), 2) + " K/s</b>, θ = <b>" + fr(p.T, 1) + " °C</b></span>";
      }).join("") + "<span>temps écoulé <b>" + fr(st.t / 60, 1) + " min</b></span>";
    }
    ["cas-a", "cas-b"].forEach((id, i) => {
      const sel = document.getElementById(id);
      Object.keys(SUB).forEach((k) => { const o = document.createElement("option"); o.value = k; o.textContent = SUB[k].n + " (c = " + SUB[k].c + ")"; sel.appendChild(o); });
      sel.value = i ? st.b : st.a;
      sel.addEventListener("change", () => { st[i ? "b" : "a"] = sel.value; reset(); out(); A.redraw(); });
    });
    range("cas-m", (v) => fr(v, 1) + " kg", (v) => { st.m = v; reset(); out(); A.redraw(); });
    range("cas-p", (v) => fr(v, 0) + " W", (v) => { st.P = v; out(); A.redraw(); });
    document.getElementById("cas-reset").addEventListener("click", () => { reset(); out(); A.play(); });
    reset(); out();
  })();

  /* =================================================================
     Simulation 2.2 — Le calorimètre
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-calo");
    if (!cv) return;
    const MET = { al: ["aluminium", 900], fe: ["fer", 450], cu: ["cuivre", 385], pb: ["plomb", 130] };
    const MYST = [["argent", 235], ["titane", 523], ["magnésium", 1020]];
    const CE = 4186, TAU = 1.6;
    const st = { met: "al", mb: 300, tb: 100, me: 300, te: 20, phase: 0, y: 0, tt: 0, Tb: 100, Te: 20, hist: [], myst: MYST[0], shown: false };
    const cb = () => st.met === "x" ? st.myst[1] : MET[st.met][1];
    const nom = () => st.met === "x" ? (st.shown ? st.myst[0] + " (c = " + st.myst[1] + ")" : "métal mystère") : MET[st.met][0];
    const Tf = () => (st.mb / 1000 * cb() * st.tb + st.me / 1000 * CE * st.te) / (st.mb / 1000 * cb() + st.me / 1000 * CE);
    function reset() { st.phase = 0; st.y = 0; st.tt = 0; st.Tb = st.tb; st.Te = st.te; st.hist = []; }
    function update(A, dt) {
      if (st.phase === 1) { st.y += dt * 2.2; if (st.y >= 1) { st.y = 1; st.phase = 2; st.tt = 0; } }
      else if (st.phase === 2) {
        st.tt += dt;
        const f = Math.exp(-st.tt / TAU), T = Tf();
        st.Tb = T + (st.tb - T) * f; st.Te = T + (st.te - T) * f;
        const last = st.hist[st.hist.length - 1];
        if (!last || st.tt - last[0] > 0.05) st.hist.push([st.tt, st.Tb, st.Te]);
        if (st.tt > 8 * TAU) { st.phase = 3; A.pause(); }
      }
      out();
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const cx = land ? 170 : 220, top = land ? 120 : 150, bw = 200, bh = land ? A.H - top - 40 : 300;
      /* calorimètre à double paroi */
      ctx.fillStyle = P.rule2; draw.roundRect(ctx, cx - bw / 2 - 14, top - 8, bw + 28, bh + 22, 14); ctx.fill();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; draw.roundRect(ctx, cx - bw / 2 - 14, top - 8, bw + 28, bh + 22, 14); ctx.stroke();
      ctx.fillStyle = P.card; draw.roundRect(ctx, cx - bw / 2, top, bw, bh, 8); ctx.fill(); ctx.stroke();
      const lvl = Math.min(0.85, 0.25 + st.me / 1000 * 0.6);
      const wy = top + bh * (1 - lvl);
      ctx.fillStyle = draw.alpha(draw.heat((st.Te - 0) / 110), 0.85);
      ctx.fillRect(cx - bw / 2 + 2, wy, bw - 4, top + bh - wy - 2);
      /* bloc */
      const side = 30 + Math.cbrt(st.mb) * 5;
      const y0 = top - side - 40, y1 = top + bh - side - 8;
      const by = st.phase === 0 ? y0 : y0 + (y1 - y0) * (st.phase === 1 ? st.y * st.y : 1);
      if (st.phase === 0) { ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, by); ctx.stroke(); }
      ctx.fillStyle = draw.heat(st.Tb / 210);
      draw.roundRect(ctx, cx - side / 2, by, side, side, 4); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.stroke();
      draw.text(ctx, A, fr(st.Tb, 1) + " °C", cx + side / 2 + 8, by + side / 2, { size: 13, weight: 600, family: "mono", color: P.hot });
      draw.text(ctx, A, "eau " + fr(st.Te, 1) + " °C", cx - bw / 2 + 10, top + bh - 16, { size: 13, weight: 600, family: "mono", color: P.ink });
      draw.text(ctx, A, "bloc : " + nom() + ", " + st.mb + " g", cx - bw / 2 - 14, top - 24, { size: 12, color: P.ink2, align: "left" });
      /* graphique et bilan */
      const gx = land ? 360 : 70, gy = land ? 40 : top + bh + 70, gw = land ? A.W - 380 : A.W - 100, gh = land ? A.H * 0.5 : 220;
      const ymax = Math.max(st.tb, st.te, 40) + 10;
      const pl = plot(ctx, A, { x: gx, y: gy, w: gw, h: gh }, { xmin: 0, xmax: 8 * TAU, ymin: 0, ymax: ymax, xstep: 2, xlabel: "temps après immersion (s)", ylabel: "θ (°C)" });
      const T = Tf();
      curve(ctx, [[0, T], [8 * TAU, T]], pl.X, pl.Y, P.ink3, 1, [5, 5]);
      if (st.phase >= 2) {
        curve(ctx, st.hist.map((h) => [h[0], h[1]]), pl.X, pl.Y, P.hot, 2.4);
        curve(ctx, st.hist.map((h) => [h[0], h[2]]), pl.X, pl.Y, P.cold, 2.4);
      }
      draw.text(ctx, A, "équilibre " + (st.met === "x" && !st.shown && st.phase < 3 ? "?" : fr(T, 1) + " °C"), gx + gw - 4, pl.Y(T) - 10, { size: 11, color: P.ink2, align: "right" });
      /* barres d'énergie */
      const Qb = st.mb / 1000 * cb() * (st.Tb - st.tb), Qe = st.me / 1000 * CE * (st.Te - st.te);
      const Qmax = Math.max(1, Math.abs(st.mb / 1000 * cb() * (T - st.tb)));
      const by2 = gy + gh + 56, bx = gx + 100, bwid = gw - 110;
      [[Qb, "Q bloc", P.hot], [Qe, "Q eau", P.cold]].forEach(([q, lab, col], i) => {
        const y = by2 + i * 30;
        draw.text(ctx, A, lab, gx, y, { size: 12, color: P.ink2 });
        ctx.fillStyle = P.rule2; ctx.fillRect(bx, y - 8, bwid, 16);
        ctx.fillStyle = col; ctx.fillRect(bx, y - 8, bwid * Math.min(1, Math.abs(q) / Qmax), 16);
        draw.text(ctx, A, (q < 0 ? "−" : q > 0 ? "+" : "") + si(Math.abs(q), "J", 3), bx + 6, y, { size: 12, family: "mono", weight: 600, color: P.ink });
      });
      if (T > 100) draw.text(ctx, A, "Attention : l'eau atteindrait plus de 100 °C et bouillirait. Le calcul simple ne suffit plus.", gx, by2 + 62, { size: 12, color: P.hot, weight: 600 });
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    const rev = document.getElementById("calo-rev");
    function out() {
      const T = Tf();
      const hide = st.met === "x" && !st.shown;
      document.getElementById("calo-read").innerHTML =
        "<span>bloc <b>" + fr(st.Tb, 1) + " °C</b></span><span>eau <b>" + fr(st.Te, 1) + " °C</b></span>" +
        "<span>capacités : bloc <b>" + (hide ? "?" : fr(st.mb / 1000 * cb(), 0) + " J/K") + "</b>, eau <b>" + fr(st.me / 1000 * CE, 0) + " J/K</b></span>" +
        "<span>θ finale prévue <b>" + (hide && st.phase < 3 ? "à toi de jouer" : fr(T, 1) + " °C") + "</b></span>";
      A.redraw();
    }
    const changed = () => { reset(); out(); };
    choice("calo-met", (v) => { st.met = v; if (v === "x") { st.myst = MYST[Math.floor(Math.random() * MYST.length)]; st.shown = false; } rev.hidden = v !== "x"; changed(); });
    range("calo-mb", (v) => fr(v, 0) + " g", (v) => { st.mb = v; changed(); });
    range("calo-tb", (v) => fr(v, 0) + " °C", (v) => { st.tb = v; changed(); });
    range("calo-me", (v) => fr(v, 0) + " g", (v) => { st.me = v; changed(); });
    range("calo-te", (v) => fr(v, 0) + " °C", (v) => { st.te = v; changed(); });
    document.getElementById("calo-go").addEventListener("click", () => { reset(); st.phase = 1; A.play(); });
    rev.addEventListener("click", () => { st.shown = true; out(); });
  })();

  /* =================================================================
     Simulation 2.3 — Courbe de chauffe de l'eau (1 kg, de −30 °C)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-chauffe");
    if (!cv) return;
    const CG = 2100, CL = 4186, CV = 2010, LF = 334e3, LV = 2257e3;
    const E1 = CG * 30, E2 = E1 + LF, E3 = E2 + CL * 100, E4 = E3 + LV, E5 = E4 + CV * 50;
    const SEG = [[0, E1, "glace"], [E1, E2, "fusion"], [E2, E3, "eau liquide"], [E3, E4, "vaporisation"], [E4, E5, "vapeur"]];
    const st = { E: 0, P: 2000, sens: 1, mol: [], init: false };
    function etat(E) {
      if (E <= E1) return { T: -30 + E / CG, s: 1, l: 0, g: 0, ph: "glace qui se réchauffe" };
      if (E <= E2) { const f = (E - E1) / LF; return { T: 0, s: 1 - f, l: f, g: 0, ph: "fusion (palier à 0 °C)" }; }
      if (E <= E3) return { T: (E - E2) / CL, s: 0, l: 1, g: 0, ph: "eau liquide qui se réchauffe" };
      if (E <= E4) { const f = (E - E3) / LV; return { T: 100, s: 0, l: 1 - f, g: f, ph: "ébullition (palier à 100 °C)" }; }
      return { T: 100 + (E - E4) / CV, s: 0, l: 0, g: 1, ph: "vapeur qui se réchauffe" };
    }
    const NM = 42;
    function initMol() {
      st.mol = [];
      for (let i = 0; i < NM; i++) st.mol.push({ i, x: 0, y: 0, vx: 0, vy: 0, mode: 0, ph: Math.random() * 6 });
      st.init = true;
    }
    function update(A, dt) {
      st.E += st.sens * st.P * dt * 60;
      if (st.E >= E5) { st.E = E5; A.pause(); }
      if (st.E <= 0 && st.sens < 0) { st.E = 0; A.pause(); }
      if (st.E < 0) st.E = 0;
      if (A.t % 0.15 < 0.02) out();
    }
    function molView(ctx, A, P, box, e, dt) {
      if (!st.init) initMol();
      ctx.fillStyle = P.paper; ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
      const ns = Math.round(e.s * NM), ng = Math.round(e.g * NM);
      const cols = 7, sp = Math.min(box.w / (cols + 1), 22);
      const kT = Math.max(0.05, (e.T + 273) / 373);
      st.mol.forEach((m, k) => {
        const want = k < ns ? 0 : (k >= NM - ng ? 2 : 1);
        const gx = box.x + box.w / 2 - (cols - 1) * sp / 2 + (k % cols) * sp + (Math.floor(k / cols) % 2) * sp / 2;
        const gy = box.y + box.h - 14 - Math.floor(k / cols) * sp * 0.87;
        if (want !== m.mode) {
          if (m.mode === 0) { m.x = gx; m.y = gy; }
          m.mode = want;
          const a = Math.random() * 6.28, v = want === 2 ? 160 : 40;
          m.vx = Math.cos(a) * v; m.vy = Math.sin(a) * v;
        }
        m.ph += dt * 30;
        if (m.mode === 0) {
          const amp = 1 + 3.5 * kT;
          m.x = gx + Math.sin(m.ph + k) * amp; m.y = gy + Math.cos(m.ph * 1.3 + k * 2) * amp;
        } else {
          const vmax = m.mode === 2 ? 120 + 100 * kT : 30 + 30 * kT;
          const top = m.mode === 2 ? box.y + 8 : box.y + box.h * 0.45;
          m.vx += (Math.random() - 0.5) * (m.mode === 1 ? 200 : 20) * dt; m.vy += (Math.random() - 0.5) * (m.mode === 1 ? 200 : 20) * dt;
          const v = Math.hypot(m.vx, m.vy) || 1;
          m.vx *= vmax / v; m.vy *= vmax / v;
          m.x += m.vx * dt; m.y += m.vy * dt;
          if (m.x < box.x + 8) { m.x = box.x + 8; m.vx = Math.abs(m.vx); }
          if (m.x > box.x + box.w - 8) { m.x = box.x + box.w - 8; m.vx = -Math.abs(m.vx); }
          if (m.y < top) { m.y = top; m.vy = Math.abs(m.vy); }
          if (m.y > box.y + box.h - 8) { m.y = box.y + box.h - 8; m.vy = -Math.abs(m.vy); }
        }
        ctx.beginPath(); ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = m.mode === 0 ? P.ice : m.mode === 1 ? P.water : P.steam;
        ctx.fill(); ctx.strokeStyle = draw.alpha(P.ink, 0.4); ctx.lineWidth = 1; ctx.stroke();
      });
      draw.text(ctx, A, "vue des molécules", box.x + 6, box.y - 10, { size: 11, color: P.ink3 });
    }
    function render(ctx, A, P, dt) {
      const land = A.W / A.H > 1.25;
      const e = etat(st.E);
      const gb = land ? { x: 70, y: 40, w: A.W - 330, h: A.H - 100 } : { x: 70, y: 40, w: A.W - 100, h: A.H * 0.5 };
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 3200, ymin: -40, ymax: 160, xstep: 400, ystep: 20, xlabel: "énergie reçue Q (kJ)", ylabel: "θ (°C)" });
      /* bandes des étapes */
      SEG.forEach(([a, b, n], i) => {
        const x1 = pl.X(a / 1000), x2 = pl.X(b / 1000);
        ctx.fillStyle = draw.alpha(i % 2 ? P.accent : P.ink3, i % 2 ? 0.08 : 0.04);
        ctx.fillRect(x1, gb.y, x2 - x1, gb.h);
        if (x2 - x1 > 60) draw.text(ctx, A, n + " : " + fr((b - a) / 1000, 0) + " kJ", (x1 + x2) / 2, gb.y + 12 + (i % 2) * 16, { size: 11, color: P.ink2, align: "center" });
      });
      draw.text(ctx, A, "glace " + fr(E1 / 1000, 0) + " kJ, fusion " + fr(LF / 1000, 0) + " kJ", pl.X(0) + 4, gb.y + gb.h - 12, { size: 10, color: P.ink3 });
      const pts = [];
      for (let E = 0; E <= st.E; E += 8000) pts.push([E / 1000, etat(E).T]);
      pts.push([st.E / 1000, e.T]);
      curve(ctx, pts, pl.X, pl.Y, P.hot, 2.6);
      ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(pl.X(st.E / 1000), pl.Y(e.T), 5, 0, Math.PI * 2); ctx.fill();
      const box = land ? { x: A.W - 230, y: 60, w: 200, h: 220 } : { x: 120, y: A.H * 0.5 + 100, w: A.W - 240, h: A.H * 0.5 - 140 };
      molView(ctx, A, P, box, e, dt || 0);
      if (land) {
        const y = 310;
        [["glace", e.s, P.ice], ["eau", e.l, P.water], ["vapeur", e.g, P.steam]].forEach(([n, f, c], i) => {
          const yy = y + i * 26;
          ctx.fillStyle = c; ctx.fillRect(A.W - 230, yy - 7, 14, 14);
          draw.text(ctx, A, n + " : " + fr(f * 1000, 0) + " g", A.W - 208, yy, { size: 12, family: "mono" });
        });
      }
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("ch-play"));
    function out() {
      const e = etat(st.E);
      document.getElementById("ch-read").innerHTML =
        "<span>θ = <b>" + fr(e.T, 1) + " °C</b></span>" +
        "<span>Q reçue <b>" + fr(st.E / 1000, 0) + " kJ</b></span>" +
        "<span>temps réel à " + fr(st.P, 0) + " W <b>" + fr(st.E / st.P / 60, 1) + " min</b></span>" +
        "<span>glace / eau / vapeur <b>" + fr(e.s * 1000, 0) + " / " + fr(e.l * 1000, 0) + " / " + fr(e.g * 1000, 0) + " g</b></span>" +
        "<span><b>" + e.ph + "</b></span>";
      A.redraw();
    }
    range("ch-p", (v) => fr(v, 0) + " W", (v) => { st.P = v; out(); });
    choice("ch-sens", (v) => { st.sens = Number(v); out(); });
    document.getElementById("ch-reset").addEventListener("click", () => { st.E = 0; st.init = false; out(); });
    out();
  })();

  /* =================================================================
     Simulation 2.4 — Le mur de la maison
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-mur");
    if (!cv) return;
    const RSI = 0.13, RSE = 0.04, LAM_ISO = 0.035, TI = 20, DJ = 3500, FACADE = 150;
    const MURS = {
      brique: [["enduit", 0.015, 0.7, "enduit"], ["brique", 0.30, 0.45, "brique"], ["enduit", 0.02, 0.87, "enduit"]],
      beton: [["enduit", 0.015, 0.7, "enduit"], ["béton", 0.20, 2.1, "beton"]],
      bois: [["madriers", 0.12, 0.13, "bois"]]
    };
    const st = { type: "brique", iso: 0, te: -5 };
    function layers() {
      const L = MURS[st.type].slice();
      if (st.iso > 0) { L.push(["laine de roche", st.iso / 100, LAM_ISO, "iso"]); L.push(["crépi", 0.01, 0.87, "enduit"]); }
      return L;
    }
    function calc() {
      const L = layers();
      const R = RSI + RSE + L.reduce((a, l) => a + l[1] / l[2], 0);
      const U = 1 / R, q = U * (TI - st.te);
      const temps = [TI];
      let t = TI - q * RSI;
      temps.push(t);
      L.forEach((l) => { t -= q * l[1] / l[2]; temps.push(t); });
      temps.push(st.te);
      return { L, R, U, q, temps };
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const c = calc();
      const box = land ? { x: 70, y: 50, w: A.W - 110, h: A.H - 120 } : { x: 70, y: 60, w: A.W - 100, h: A.H * 0.62 };
      const air = 60;
      const totalE = c.L.reduce((a, l) => a + l[1], 0);
      const pxm = Math.min((box.w - 2 * air) / Math.max(totalE, 0.3), 1300);
      const wallW = totalE * pxm;
      const x0 = box.x + air + (box.w - 2 * air - wallW) / 2;
      const Y = (T) => box.y + box.h - (T + 20) / 45 * box.h;
      /* couches */
      let x = x0;
      const xs = [box.x, x0];
      c.L.forEach((l) => {
        const w = l[1] * pxm;
        let col;
        if (l[3] === "brique") col = draw.mix(P.hot, P.card, 0.55);
        else if (l[3] === "beton") col = draw.mix(P.metal, P.card, 0.25);
        else if (l[3] === "bois") col = draw.mix(P.flame, P.ink, 0.35);
        else if (l[3] === "iso") col = draw.mix(P.signal, P.card, 0.45);
        else col = draw.mix(P.ink3, P.card, 0.6);
        ctx.fillStyle = col; ctx.fillRect(x, box.y, w, box.h);
        ctx.strokeStyle = draw.alpha(P.ink, 0.35); ctx.lineWidth = 1;
        if (l[3] === "iso") {
          ctx.beginPath();
          for (let yy = box.y + 8; yy < box.y + box.h; yy += 14) { ctx.moveTo(x + 3, yy); ctx.bezierCurveTo(x + w * 0.3, yy - 8, x + w * 0.7, yy + 8, x + w - 3, yy); }
          ctx.stroke();
        } else if (l[3] === "brique") {
          for (let yy = box.y; yy < box.y + box.h; yy += 24) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
        } else if (l[3] === "bois") {
          for (let yy = box.y + 6; yy < box.y + box.h; yy += 9) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 2); ctx.stroke(); }
        }
        ctx.strokeStyle = P.ink3; ctx.strokeRect(x, box.y, w, box.h);
        if (w > 34) {
          ctx.save(); ctx.translate(x + w / 2, box.y + box.h - 10); ctx.rotate(-Math.PI / 2);
          draw.text(ctx, A, l[0] + " " + fr(l[1] * 100, l[1] < 0.05 ? 1 : 0) + " cm", 0, 0, { size: 11, color: P.ink, weight: 600 });
          ctx.restore();
        }
        x += w; xs.push(x);
      });
      xs.push(box.x + box.w);
      draw.text(ctx, A, "intérieur", box.x + 4, box.y - 14, { size: 12, weight: 700, color: P.hot });
      draw.text(ctx, A, "extérieur", box.x + box.w - 4, box.y - 14, { size: 12, weight: 700, color: P.cold, align: "right" });
      /* axe des températures */
      ctx.font = draw.font(A, 11, 400, "mono"); ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let T = -15; T <= 25; T += 5) {
        const y = Y(T);
        ctx.strokeStyle = draw.alpha(P.ink3, 0.25); ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
        ctx.fillStyle = P.ink3; ctx.fillText(String(T).replace("-", "−"), box.x - 6, y);
      }
      draw.text(ctx, A, "θ (°C)", box.x - 40, box.y - 14, { size: 11, color: P.ink2 });
      /* profil de température */
      const pts = [[box.x, c.temps[0]], [x0, c.temps[1]]];
      for (let i = 0; i < c.L.length; i++) pts.push([xs[i + 2], c.temps[i + 2]]);
      pts.push([box.x + box.w, c.temps[c.temps.length - 1]]);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.lineJoin = "round";
      ctx.beginPath(); pts.forEach((p, i) => { const yy = Y(p[1]); i ? ctx.lineTo(p[0], yy) : ctx.moveTo(p[0], yy); }); ctx.stroke();
      pts.slice(1, -1).forEach((p) => {
        ctx.fillStyle = P.card; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p[0], Y(p[1]), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      draw.text(ctx, A, fr(c.temps[1], 1) + " °C", x0 + 6, Y(c.temps[1]) - 12, { size: 12, weight: 700, family: "mono" });
      /* flux */
      const wq = Math.max(2, Math.min(26, c.q / 3));
      const ay = land ? box.y + box.h + 34 : box.y + box.h + 40;
      draw.arrow(ctx, box.x + 10, ay, box.x + box.w - 10, ay, { color: P.hot, width: wq, head: Math.max(12, wq * 1.4) });
      draw.text(ctx, A, "flux de chaleur : " + fr(c.q, 1) + " W/m²", box.x + box.w / 2, ay - wq / 2 - 12, { size: 12, weight: 600, align: "center", color: P.hot });
      if (!land) {
        const yy = ay + 50;
        draw.text(ctx, A, "U = " + fr(c.U, 2) + " W/(m²·K)", box.x, yy, { size: 15, weight: 700 });
        draw.text(ctx, A, "pertes de la façade : " + fr(c.q * FACADE / 1000, 2) + " kW", box.x, yy + 26, { size: 13 });
      }
    }
    const A = anim(cv, { draw: render, autoplay: false });
    function out() {
      const c = calc();
      const kwh = c.U * FACADE * DJ * 24 / 1000;
      document.getElementById("mur-read").innerHTML =
        "<span>U = <b>" + fr(c.U, 2) + " W/(m²·K)</b></span>" +
        "<span>pertes, façade de 150 m² <b>" + fr(c.q * FACADE, 0) + " W</b></span>" +
        "<span>face intérieure du mur <b>" + fr(c.temps[1], 1) + " °C</b>" + (c.temps[1] < 16 ? " (paroi froide, inconfort)" : "") + "</span>" +
        "<span>par an <b>" + fr(kwh, 0) + " kWh ≈ " + fr(kwh / 10 / 0.9, 0) + " L de mazout</b></span>";
      A.redraw();
    }
    choice("mur-type", (v) => { st.type = v; out(); });
    range("mur-iso", (v) => v + " cm", (v) => { st.iso = v; out(); });
    range("mur-te", (v) => fr(v, 0) + " °C", (v) => { st.te = v; out(); });
  })();

  /* =================================================================
     Simulation 2.5 — Le café et le lait (refroidissement de Newton)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-cafe");
    if (!cv) return;
    const TA = 20, T0 = 85, MC = 200, TL = 6;
    const st = { tau: 25, tb: 10, ml: 30 };
    const mix = (T) => (MC * T + st.ml * TL) / (MC + st.ml);
    const tauFor = (m) => st.tau * m / MC;
    const A_ = (t) => TA + (mix(T0) - TA) * Math.exp(-t / tauFor(MC + st.ml));
    const noir = (t) => TA + (T0 - TA) * Math.exp(-t / tauFor(MC));
    const B_ = (t) => t < st.tb ? noir(t) : (function () { const Tm = mix(noir(st.tb)); return TA + (Tm - TA) * Math.exp(-(t - st.tb) / tauFor(MC + st.ml)); })();
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const gb = land ? { x: 70, y: 40, w: A.W - 100, h: A.H - 100 } : { x: 70, y: 40, w: A.W - 100, h: A.H - 130 };
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 45, ymin: 20, ymax: 90, xstep: 5, ystep: 10, xlabel: "t (min)", ylabel: "θ du café (°C)" });
      ctx.fillStyle = draw.alpha(P.energy, 0.12);
      ctx.fillRect(gb.x, pl.Y(65), gb.w, pl.Y(55) - pl.Y(65));
      draw.text(ctx, A, "zone idéale pour boire (55 à 65 °C)", gb.x + gb.w - 6, pl.Y(65) - 10, { size: 11, color: P.energy, align: "right", weight: 600 });
      const pa = [], pb1 = [], pb2 = [];
      for (let t = 0; t <= 45; t += 0.25) pa.push([t, A_(t)]);
      for (let t = 0; t <= st.tb; t += 0.25) pb1.push([t, noir(t)]);
      pb1.push([st.tb, noir(st.tb)]);
      for (let t = st.tb; t <= 45; t += 0.25) pb2.push([t, B_(t + 1e-9)]);
      curve(ctx, pa, pl.X, pl.Y, P.accent, 2.6);
      curve(ctx, pb1, pl.X, pl.Y, P.hot, 2.6);
      curve(ctx, [[st.tb, noir(st.tb)], [st.tb, B_(st.tb + 1e-9)]], pl.X, pl.Y, P.hot, 1.4, [3, 3]);
      curve(ctx, pb2, pl.X, pl.Y, P.hot, 2.6, [7, 4]);
      curve(ctx, [[st.tb, 20], [st.tb, 90]], pl.X, pl.Y, P.ink3, 1, [2, 4]);
      const a = A_(st.tb), b = B_(st.tb + 1e-9);
      [[a, P.accent, "lait tout de suite : " + fr(a, 1) + " °C"], [b, P.hot, "lait à la fin : " + fr(b, 1) + " °C"]].forEach(([T, col, lab], i) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(pl.X(st.tb), pl.Y(T), 5.5, 0, Math.PI * 2); ctx.fill();
        const right = st.tb < 28;
        const dy = (a > b ? (i ? 14 : -14) : (i ? -14 : 14));
        draw.text(ctx, A, lab, pl.X(st.tb) + (right ? 10 : -10), pl.Y(T) + dy, { size: 12, weight: 700, color: col, align: right ? "left" : "right" });
      });
      draw.text(ctx, A, "je bois", pl.X(st.tb) + 4, gb.y + 8, { size: 11, color: P.ink3 });
      draw.legend(ctx, A, gb.x + 10, pl.Y(23), [["lait au début", P.accent], ["café noir, lait à la fin", P.hot]]);
    }
    const A = anim(cv, { draw: render, autoplay: false });
    function out() {
      const a = A_(st.tb), b = B_(st.tb + 1e-9);
      document.getElementById("cafe-read").innerHTML =
        "<span>constante de temps (café noir) <b>τ = " + fr(st.tau, 0) + " min</b></span>" +
        "<span>lait au début <b>" + fr(a, 1) + " °C</b></span><span>lait à la fin <b>" + fr(b, 1) + " °C</b></span>" +
        "<span>gagnant <b>" + (st.ml === 0 ? "égalité, pas de lait" : a > b ? "lait au début (+" + fr(a - b, 1) + " °C)" : "lait à la fin") + "</b></span>";
      A.redraw();
    }
    choice("cafe-tasse", (v) => { st.tau = Number(v); out(); });
    range("cafe-t", (v) => v + " min", (v) => { st.tb = v; out(); });
    range("cafe-lait", (v) => v + " mL", (v) => { st.ml = v; out(); });
  })();
})();
