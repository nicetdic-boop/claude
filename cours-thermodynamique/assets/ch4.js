/* Chapitre 4 — Machines thermiques : simulations */
(function () {
  "use strict";
  const { anim, draw, plot, curve, fr, sci, si, range, choice, K } = window.Cours;
  const GAM = 1.4, CV = 2.5 * K.R, CP = 3.5 * K.R;

  /* =================================================================
     Simulation 4.1 — Les quatre transformations (1 L d'air, 1 bar, 20 °C)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-transfo");
    if (!cv) return;
    const V1 = 1, p1 = 1, T1 = 293.15; /* L, bar, K */
    const n = p1 * 1e5 * V1 * 1e-3 / (K.R * T1);
    const st = { type: "isotherme", x: 589, s: 1, mol: [] };
    for (let i = 0; i < 26; i++) st.mol.push({ x: Math.random(), y: Math.random(), a: Math.random() * 6.28 });
    const LAB = { isochore: "Température finale", isobare: "Volume final", isotherme: "Volume final", adiabatique: "Volume final" };
    function final() {
      const x = st.x / 1000;
      if (st.type === "isochore") return { V: V1, T: 100 + 800 * x };
      const V = st.type === "isobare" ? 0.3 * Math.pow(2.5 / 0.3, x) : 0.05 * Math.pow(50, x);
      if (st.type === "isobare") return { V, T: T1 * V / V1 };
      if (st.type === "isotherme") return { V, T: T1 };
      return { V, T: T1 * Math.pow(V1 / V, GAM - 1) };
    }
    /* état à la progression s (0 → 1) le long du chemin */
    function at(s) {
      const f = final();
      if (st.type === "isochore") { const T = T1 + (f.T - T1) * s; return { V: V1, T, p: p1 * T / T1 }; }
      const V = V1 * Math.pow(f.V / V1, s);
      if (st.type === "isobare") return { V, T: T1 * V / V1, p: p1 };
      if (st.type === "isotherme") return { V, T: T1, p: p1 * V1 / V };
      return { V, T: T1 * Math.pow(V1 / V, GAM - 1), p: p1 * Math.pow(V1 / V, GAM) };
    }
    function energies(s) {
      const e = at(s);
      const dU = n * CV * (e.T - T1);
      let W;
      if (st.type === "isochore") W = 0;
      else if (st.type === "isobare") W = -p1 * 1e5 * (e.V - V1) * 1e-3;
      else if (st.type === "isotherme") W = n * K.R * T1 * Math.log(V1 / e.V);
      else W = dU;
      return { W, Q: dU - W, dU, e };
    }
    function update(A, dt) {
      st.s += dt / 2.2;
      if (st.s > 1.35) st.s = 0;
      st.mol.forEach((m) => { m.a += (Math.random() - 0.5) * 0.6; });
    }
    function render(ctx, A, P, dt) {
      const land = A.W / A.H > 1.25;
      const s = Math.min(1, st.s);
      const E = energies(s), e = E.e;
      /* cylindre */
      const cb = land ? { x: 40, y: 40, w: 150, h: A.H - 130 } : { x: 60, y: 40, w: 220, h: A.H * 0.4 };
      const hgas = Math.max(6, e.V / 2.6 * cb.h);
      const ytop = cb.y + cb.h - hgas;
      ctx.fillStyle = draw.alpha(draw.heat((e.T - 150) / 800), 0.55);
      ctx.fillRect(cb.x, ytop, cb.w, hgas);
      const sp = Math.sqrt(e.T / 293);
      st.mol.forEach((m) => {
        m.x += Math.cos(m.a) * sp * (dt || 0) * 0.5; m.y += Math.sin(m.a) * sp * (dt || 0) * 0.5;
        if (m.x < 0 || m.x > 1) { m.a = Math.PI - m.a; m.x = Math.max(0, Math.min(1, m.x)); }
        if (m.y < 0 || m.y > 1) { m.a = -m.a; m.y = Math.max(0, Math.min(1, m.y)); }
        ctx.fillStyle = draw.alpha(P.ink, 0.55);
        ctx.beginPath(); ctx.arc(cb.x + 5 + m.x * (cb.w - 10), ytop + 3 + m.y * Math.max(0, hgas - 6), 2.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cb.x, cb.y - 10); ctx.lineTo(cb.x, cb.y + cb.h); ctx.lineTo(cb.x + cb.w, cb.y + cb.h); ctx.lineTo(cb.x + cb.w, cb.y - 10); ctx.stroke();
      ctx.fillStyle = P.metal; ctx.fillRect(cb.x + 2, ytop - 12, cb.w - 4, 12); ctx.fillRect(cb.x + cb.w / 2 - 5, cb.y - 30, 10, Math.max(0, ytop - 12 - cb.y + 30));
      if (st.type === "isochore") { ctx.fillStyle = P.ink; [cb.x - 6, cb.x + cb.w - 2].forEach((x) => ctx.fillRect(x, ytop - 18, 8, 6)); draw.text(ctx, A, "piston bloqué", cb.x + cb.w / 2, ytop - 40, { size: 11, color: P.ink2, align: "center" }); }
      if (st.type === "adiabatique") {
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
        for (let y = cb.y - 10; y < cb.y + cb.h; y += 9) { ctx.beginPath(); ctx.moveTo(cb.x - 12, y + 9); ctx.lineTo(cb.x - 4, y); ctx.moveTo(cb.x + cb.w + 4, y + 9); ctx.lineTo(cb.x + cb.w + 12, y); ctx.stroke(); }
        ctx.fillStyle = P.ink3; ctx.fillRect(cb.x - 12, cb.y + cb.h + 4, cb.w + 24, 8);
        draw.text(ctx, A, "parois isolantes", cb.x + cb.w / 2, cb.y + cb.h + 26, { size: 11, color: P.ink2, align: "center" });
        if (e.T > 533) {
          draw.flame(ctx, cb.x + cb.w / 2, cb.y + cb.h - 2, 50, Math.min(26, hgas - 4), A.t, true);
          draw.text(ctx, A, "le coton s'enflamme !", cb.x + cb.w / 2, cb.y + cb.h + 44, { size: 12, weight: 700, color: P.hot, align: "center" });
        }
      } else if (Math.abs(E.Q) > 0.5 && st.s > 0 && st.s < 1.02) {
        if (E.Q > 0) draw.flame(ctx, cb.x + cb.w / 2, cb.y + cb.h + 28, 80, 22, A.t, true);
        else { ctx.fillStyle = P.ice; ctx.fillRect(cb.x, cb.y + cb.h + 6, cb.w, 16); draw.text(ctx, A, "source froide", cb.x + cb.w / 2, cb.y + cb.h + 36, { size: 11, color: P.cold, align: "center" }); }
      }
      const lh = draw.fs(A, 13) * 1.3, ly = Math.min(ytop + 10, cb.y + cb.h - 2.2 * lh);
      draw.text(ctx, A, fr(e.T - 273.15, 0) + " °C", cb.x + cb.w + 18, ly, { size: 14, weight: 700, family: "mono", color: P.hot });
      draw.text(ctx, A, fr(e.p, 2) + " bar", cb.x + cb.w + 18, ly + lh, { size: 12, family: "mono", color: P.ink2 });
      draw.text(ctx, A, fr(e.V, 2) + " L", cb.x + cb.w + 18, ly + 2 * lh, { size: 12, family: "mono", color: P.ink2 });
      /* diagramme p-V */
      const gb = land ? { x: 320, y: 40, w: 260, h: A.H - 100 } : { x: 70, y: A.H * 0.55, w: A.W - 100, h: A.H * 0.36 };
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 2.6, ymin: 0, ymax: 5, xstep: 0.5, ystep: 1, xlabel: "V (L)", ylabel: "p (bar)", xfmt: (v) => fr(v, 1) });
      ctx.save(); ctx.beginPath(); ctx.rect(gb.x, gb.y, gb.w, gb.h); ctx.clip();
      [200, 293.15, 500, 800].forEach((T) => { const pts = []; for (let V = 0.05; V <= 2.6; V += 0.02) pts.push([V, n * K.R * T / (V * 1e-3) / 1e5]); curve(ctx, pts, pl.X, pl.Y, P.rule, 1, [3, 4]); });
      const path = []; for (let k = 0; k <= 60; k++) { const q = at(k / 60 * s); path.push([q.V, q.p]); }
      if (st.type !== "isochore") {
        ctx.fillStyle = draw.alpha(P.work, 0.16);
        ctx.beginPath(); ctx.moveTo(pl.X(V1), pl.Y(0)); path.forEach((q) => ctx.lineTo(pl.X(q[0]), pl.Y(Math.min(q[1], 6)))); ctx.lineTo(pl.X(e.V), pl.Y(0)); ctx.closePath(); ctx.fill();
      }
      curve(ctx, path, pl.X, pl.Y, P.ink, 2.5);
      ctx.restore();
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(pl.X(V1), pl.Y(p1), 4.5, 0, Math.PI * 2); ctx.fill();
      draw.text(ctx, A, "départ", pl.X(V1) + 6, pl.Y(p1) - 10, { size: 11, color: P.ink2 });
      if (e.p <= 5) { ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(pl.X(e.V), pl.Y(e.p), 5.5, 0, Math.PI * 2); ctx.fill(); }
      else draw.text(ctx, A, "↑ " + fr(e.p, 1) + " bar", pl.X(e.V) + 4, gb.y + 10, { size: 12, color: P.hot, weight: 700 });
      draw.text(ctx, A, "pointillés : isothermes", gb.x + gb.w - 4, gb.y + gb.h - 12, { size: 10, color: P.ink3, align: "right" });
      /* barres d'énergie */
      const bb = land ? { x: 640, y: 96, w: 120, h: A.H - 180 } : { x: A.W - 230, y: 96, w: 180, h: A.H * 0.33 };
      const items = [["W", E.W, P.work], ["Q", E.Q, P.hot], ["ΔU", E.dU, P.energy]];
      const vmax = Math.max(20, ...items.map((i) => Math.abs(i[1])));
      const y0 = bb.y + bb.h / 2, bw = bb.w / 3 - 8;
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bb.x - 4, y0); ctx.lineTo(bb.x + bb.w, y0); ctx.stroke();
      items.forEach(([lab, v, col], i) => {
        const x = bb.x + i * (bb.w / 3) + 4, hh = v / vmax * (bb.h / 2 - 10);
        ctx.fillStyle = col; ctx.fillRect(x, hh > 0 ? y0 - hh : y0, bw, Math.abs(hh));
        draw.text(ctx, A, lab, x + bw / 2, bb.y + bb.h + 14, { size: 14, weight: 700, color: col, align: "center" });
        draw.text(ctx, A, (v > 0.5 ? "+" : v < -0.5 ? "−" : "") + fr(Math.abs(v), 0), x + bw / 2, hh > 0 ? y0 - hh - 10 : y0 - hh + 12, { size: 11, family: "mono", align: "center" });
      });
      draw.text(ctx, A, "énergies reçues (J)", bb.x - 4, bb.y - 54, { size: 11, color: P.ink2 });
      draw.text(ctx, A, "ΔU = W + Q", bb.x - 4, bb.y - 36, { size: 11, color: P.ink3 });
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("tr-play"));
    const slider = document.getElementById("tr-x");
    function out() {
      const E = energies(1), f = E.e;
      const o = document.querySelector('output[for="tr-x"]');
      if (o) o.textContent = st.type === "isochore" ? fr(f.T, 0) + " K (" + fr(f.T - 273.15, 0) + " °C)" : fr(f.V, 2) + " L";
      document.getElementById("tr-read").innerHTML =
        "<span>état final <b>" + fr(f.p, 2) + " bar, " + fr(f.V, 2) + " L, " + fr(f.T - 273.15, 0) + " °C</b></span>" +
        "<span>W = <b>" + fr(E.W, 1) + " J</b></span><span>Q = <b>" + fr(E.Q, 1) + " J</b></span><span>ΔU = <b>" + fr(E.dU, 1) + " J</b></span>";
      A.redraw();
    }
    slider.addEventListener("input", () => { st.x = parseFloat(slider.value); st.s = 1; out(); });
    choice("tr-type", (v) => {
      st.type = v; st.s = 1;
      document.getElementById("tr-xlab").textContent = LAB[v];
      slider.value = v === "isochore" ? 600 : v === "isobare" ? 800 : v === "adiabatique" ? 0 : 589;
      st.x = parseFloat(slider.value);
      out();
    });
  })();

  /* =================================================================
     Simulation 4.2 — Le moteur à quatre temps (cycle d'Otto)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-otto");
    if (!cv) return;
    const VD = 0.5, P1 = 1, T1 = 300, DTC = 2000, LAM = 0.3;
    const st = { r: 10, phi: 30, speed: 0.5 };
    const vc = () => VD / (st.r - 1);
    const pos = (phi) => { const a = phi * Math.PI / 180; return ((1 - Math.cos(a)) + (1 - Math.sqrt(1 - LAM * LAM * Math.sin(a) * Math.sin(a))) / LAM) / 2; };
    const vol = (phi) => vc() + VD * pos(phi);
    function states() {
      const V1 = vc() + VD, p2 = P1 * Math.pow(st.r, GAM), T2 = T1 * Math.pow(st.r, GAM - 1);
      const T3 = T2 + DTC, p3 = p2 * T3 / T2, T4 = T3 / Math.pow(st.r, GAM - 1), p4 = p3 / Math.pow(st.r, GAM);
      return { V1, p2, T2, T3, p3, T4, p4 };
    }
    function pAt(phi) {
      const S = states(), V = vol(phi);
      const ph = ((phi % 720) + 720) % 720;
      if (ph < 180) return P1;
      if (ph < 360) return P1 * Math.pow(S.V1 / V, GAM);
      if (ph < 540) return S.p3 * Math.pow(vc() / V, GAM);
      return P1;
    }
    function TAt(phi) {
      const S = states(), ph = ((phi % 720) + 720) % 720, V = vol(phi);
      if (ph < 180) return T1;
      if (ph < 360) return T1 * Math.pow(S.V1 / V, GAM - 1);
      if (ph < 540) return S.T3 * Math.pow(vc() / V, GAM - 1);
      return S.T4 * (1 - (ph - 540) / 180 * 0.3);
    }
    const TEMPS = ["1 · Admission", "2 · Compression", "3 · Explosion et détente", "4 · Échappement"];
    function update(A, dt) { st.phi = (st.phi + 360 * st.speed * dt) % 720; if (A.t % 0.2 < 0.02) out(); }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const ph = st.phi, k = Math.floor(ph / 180);
      /* moteur */
      const ex = land ? 170 : 200, top = land ? 70 : 80, cw = land ? 130 : 160, stroke = land ? 100 : 140;
      const vcpx = stroke * vc() / VD;
      const ypist = top + vcpx + stroke * pos(ph);
      const T = TAt(ph);
      ctx.fillStyle = k === 3 ? draw.alpha(P.ink3, 0.35) : draw.alpha(draw.heat((T - 250) / 1500), 0.75);
      ctx.fillRect(ex - cw / 2, top, cw, ypist - top);
      if (ph > 355 && ph < 380) { ctx.fillStyle = draw.alpha(P.glow, 0.9); ctx.beginPath(); ctx.arc(ex, top + 6, 26 * (1 - (ph - 355) / 25) + 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ex - cw / 2, top); ctx.lineTo(ex - cw / 2, top + vcpx + stroke + 40); ctx.moveTo(ex + cw / 2, top); ctx.lineTo(ex + cw / 2, top + vcpx + stroke + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex - cw / 2 - 30, top); ctx.lineTo(ex + cw / 2 + 30, top); ctx.stroke();
      /* soupapes */
      const vopen = (a, b) => ph > a && ph < b ? Math.sin((ph - a) / (b - a) * Math.PI) * 14 : 0;
      const oi = vopen(0, 180), oe = vopen(540, 720);
      [[ex - cw / 4, oi, P.cold, "admission"], [ex + cw / 4, oe, P.ink3, "échappement"]].forEach(([x, o, col, lab]) => {
        ctx.strokeStyle = P.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top - 50); ctx.lineTo(x, top + o - 2); ctx.stroke();
        ctx.fillStyle = P.ink2; ctx.fillRect(x - 14, top + o - 4, 28, 5);
        ctx.fillStyle = draw.alpha(col, 0.3); ctx.fillRect(x - 16, top - 50, 32, 46);
        draw.text(ctx, A, lab, x, top - 60, { size: 10, color: P.ink2, align: "center" });
        if (o > 2) draw.arrow(ctx, x + (lab === "admission" ? -26 : 26), top - (lab === "admission" ? 40 : 10), x + (lab === "admission" ? -26 : 26), top - (lab === "admission" ? 10 : 40), { color: col === P.cold ? P.cold : P.ink2, width: 2, head: 7 });
      });
      ctx.fillStyle = P.ink3; ctx.fillRect(ex - 4, top - 34, 8, 30);
      draw.text(ctx, A, "bougie", ex, top - 42, { size: 10, color: P.ink3, align: "center" });
      /* piston, bielle, vilebrequin */
      ctx.fillStyle = P.metal; ctx.fillRect(ex - cw / 2 + 3, ypist, cw - 6, 34);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(ex - cw / 2 + 3, ypist, cw - 6, 34);
      const rc = stroke / 2, cy = top + vcpx + 17 + rc / LAM + rc;
      const a = ph * Math.PI / 180;
      const pinY = ypist + 17, crx = ex + rc * Math.sin(a), cry = cy - rc * Math.cos(a);
      ctx.strokeStyle = P.ink2; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ex, pinY); ctx.lineTo(crx, cry); ctx.stroke();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex, cy, rc, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ex, cy); ctx.lineTo(crx, cry); ctx.stroke(); ctx.lineCap = "butt";
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(ex, cy, 8, 0, Math.PI * 2); ctx.fill();
      draw.text(ctx, A, TEMPS[k], 20, land ? A.H - 20 : A.H * 0.6 - 56, { size: 16, weight: 700, color: k === 2 ? P.hot : P.ink });
      /* diagramme p-V */
      const S = states();
      const gb = land ? { x: 400, y: 40, w: A.W - 430, h: A.H - 100 } : { x: 70, y: A.H * 0.6, w: A.W - 100, h: A.H * 0.32 };
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 0.65, ymin: 0, ymax: 140, xstep: 0.1, ystep: 20, xlabel: "V (L)", ylabel: "p (bar)", xfmt: (v) => fr(v, 1) });
      const comp = [], det = [];
      for (let i = 0; i <= 60; i++) { const f = 180 + i * 3; comp.push([vol(f), pAt(f)]); const g = 360 + i * 3; det.push([vol(g), pAt(g + 1e-6)]); }
      ctx.fillStyle = draw.alpha(P.work, 0.15);
      ctx.beginPath(); comp.forEach((q, i) => i ? ctx.lineTo(pl.X(q[0]), pl.Y(q[1])) : ctx.moveTo(pl.X(q[0]), pl.Y(q[1])));
      det.forEach((q) => ctx.lineTo(pl.X(q[0]), pl.Y(Math.min(140, q[1])))); ctx.closePath(); ctx.fill();
      curve(ctx, [[vc(), P1], [S.V1, P1]], pl.X, pl.Y, P.cold, 2);
      curve(ctx, comp, pl.X, pl.Y, P.ink, 2);
      curve(ctx, [[vc(), S.p2], [vc(), Math.min(140, S.p3)]], pl.X, pl.Y, P.hot, 2.5);
      curve(ctx, det.map((q) => [q[0], Math.min(140, q[1])]), pl.X, pl.Y, P.hot, 2);
      curve(ctx, [[S.V1, S.p4], [S.V1, P1]], pl.X, pl.Y, P.ink3, 2);
      draw.text(ctx, A, "Q_c (combustion)", pl.X(vc()) + 8, pl.Y(Math.min(130, S.p3 * 0.6)), { size: 11, color: P.hot, weight: 600 });
      draw.text(ctx, A, "aire = travail par cycle", pl.X(0.3), pl.Y(30), { size: 11, color: P.work, weight: 600, align: "center" });
      const p = pAt(ph);
      ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(pl.X(vol(ph)), pl.Y(Math.min(140, p)), 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
    }
    const A = anim(cv, { draw: render, update });
    A.bindPlay(document.getElementById("otto-play"));
    function out() {
      const S = states(), n = P1 * 1e5 * S.V1 * 1e-3 / (K.R * T1);
      const Qc = n * CV * DTC, eta = 1 - Math.pow(st.r, 1 - GAM), W = eta * Qc;
      document.getElementById("otto-read").innerHTML =
        "<span>rendement théorique <b>η = " + fr(eta * 100, 1) + " %</b></span>" +
        "<span>pression max <b>" + fr(S.p3, 0) + " bar</b>, température max <b>" + fr(S.T3 - 273.15, 0) + " °C</b></span>" +
        "<span>travail par cycle <b>" + fr(W, 0) + " J</b></span>" +
        "<span>un cylindre à 3000 tr/min <b>" + fr(W * 25 / 1000, 1) + " kW</b></span>";
      A.redraw();
    }
    range("otto-r", (v) => fr(v, 1), (v) => { st.r = v; out(); });
    range("otto-v", (v) => fr(v * 60, 0) + " tr/min", (v) => { st.speed = v; });
    out();
  })();

  /* =================================================================
     Simulation 4.3 — Où va l'énergie ? (diagramme de flux)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-flux");
    if (!cv) return;
    const DEF = { moteur: [300, 20], frigo: [25, 5], pac: [35, 0] };
    const st = { type: "moteur", tc: 300, tf: 20, q: 100, ph: 0 };
    function calc() {
      const Tc = st.tc + 273.15, Tf = st.tf + 273.15, q = st.q / 100;
      if (Tc <= Tf + 0.5) return { ok: false };
      if (st.type === "moteur") { const eC = 1 - Tf / Tc, e = q * eC; return { ok: true, Qc: 100, W: 100 * e, Qf: 100 - 100 * e, eC, e }; }
      if (st.type === "frigo") { const cC = Tf / (Tc - Tf), c = Math.max(0.05, q * cC); const W = 100 / (1 + c); return { ok: true, Qc: 100, W, Qf: 100 - W, cC, c }; }
      const cC = Tc / (Tc - Tf), c = Math.max(1, q * cC); const W = 100 / c; return { ok: true, Qc: 100, W, Qf: 100 - W, cC, c };
    }
    function band(ctx, x1, y1, x2, y2, w, col) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 1 || w < 0.5) return;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, h = Math.min(L * 0.45, Math.max(14, w * 0.7));
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * w / 2, y1 + ny * w / 2);
      ctx.lineTo(x2 - ux * h + nx * w / 2, y2 - uy * h + ny * w / 2);
      ctx.lineTo(x2 - ux * h + nx * (w / 2 + 8), y2 - uy * h + ny * (w / 2 + 8));
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - ux * h - nx * (w / 2 + 8), y2 - uy * h - ny * (w / 2 + 8));
      ctx.lineTo(x2 - ux * h - nx * w / 2, y2 - uy * h - ny * w / 2);
      ctx.lineTo(x1 - nx * w / 2, y1 - ny * w / 2);
      ctx.closePath(); ctx.fill();
    }
    function packets(ctx, x1, y1, x2, y2, n, P) {
      for (let i = 0; i < n; i++) {
        const f = ((st.ph * 0.5 + i / n) % 1) * 0.8;
        ctx.fillStyle = draw.alpha(P.card, 0.85);
        ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    function update(A, dt) { st.ph += dt; }
    function render(ctx, A, P) {
      const c = calc();
      const land = A.W / A.H > 1.25;
      const cx = A.W / 2, top = 30, bot = A.H - 30, mid = (top + bot) / 2, rw = land ? 420 : 560, rh = 54;
      ctx.fillStyle = draw.alpha(P.hot, 0.18); draw.roundRect(ctx, cx - rw / 2, top, rw, rh, 8); ctx.fill();
      ctx.strokeStyle = P.hot; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = draw.alpha(P.cold, 0.18); draw.roundRect(ctx, cx - rw / 2, bot - rh, rw, rh, 8); ctx.fill();
      ctx.strokeStyle = P.cold; ctx.stroke();
      const names = { moteur: ["source chaude (combustion, vapeur)", "source froide (air, rivière)"], frigo: ["source chaude : la cuisine", "source froide : l'intérieur du frigo"], pac: ["source chaude : l'eau du chauffage", "source froide : l'air extérieur"] }[st.type];
      draw.text(ctx, A, names[0] + " · " + fr(st.tc, 0) + " °C", cx, top + rh / 2, { size: 13, weight: 600, align: "center" });
      draw.text(ctx, A, names[1] + " · " + fr(st.tf, 0) + " °C", cx, bot - rh / 2, { size: 13, weight: 600, align: "center" });
      const R = land ? 54 : 70;
      ctx.fillStyle = P.card; ctx.beginPath(); ctx.arc(cx, mid, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      if (!c.ok) { draw.text(ctx, A, "Il faut une source chaude plus chaude que la source froide.", cx, mid, { size: 13, color: P.hot, align: "center", weight: 600 }); return; }
      const sc = (land ? 0.9 : 1.1);
      const wQc = c.Qc * sc, wQf = c.Qf * sc, wW = c.W * sc;
      const lab = (t, x, y, col, al) => draw.text(ctx, A, t, x, y, { size: 14, weight: 700, color: col, align: al || "left", family: "mono" });
      const workSide = cx + (land ? 230 : 240);
      if (st.type === "moteur") {
        band(ctx, cx, top + rh, cx, mid - R + 2, wQc, P.hot);
        band(ctx, cx, mid + R - 2, cx, bot - rh, wQf, P.cold);
        band(ctx, cx + R - 2, mid, workSide, mid, wW, P.work);
        packets(ctx, cx, top + rh, cx, mid - R, 4, P); packets(ctx, cx, mid + R, cx, bot - rh, 4, P); packets(ctx, cx + R, mid, workSide, mid, 4, P);
        lab("Q_c = " + fr(c.Qc, 0), cx + wQc / 2 + 14, (top + rh + mid - R) / 2, P.hot);
        lab("|Q_f| = " + fr(c.Qf, 0), cx + wQf / 2 + 14, (mid + R + bot - rh) / 2, P.cold);
        lab("|W| = " + fr(c.W, 1), workSide - 4, mid - wW / 2 - 20, P.work, "right");
        draw.text(ctx, A, "η = " + fr(c.e * 100, 1) + " %", cx, mid - 8, { size: 15, weight: 700, align: "center" });
        draw.text(ctx, A, "Carnot : " + fr(c.eC * 100, 1) + " %", cx, mid + 14, { size: 11, color: P.ink2, align: "center" });
      } else {
        band(ctx, cx, mid - R + 2, cx, top + rh, wQc, P.hot);
        band(ctx, cx, bot - rh, cx, mid + R - 2, wQf, P.cold);
        const ws = cx - (land ? 230 : 240);
        band(ctx, ws, mid, cx - R + 2, mid, wW, P.work);
        packets(ctx, cx, mid - R, cx, top + rh, 4, P); packets(ctx, cx, bot - rh, cx, mid + R, 4, P); packets(ctx, ws, mid, cx - R, mid, 4, P);
        lab("|Q_c| = " + fr(c.Qc, 0), cx + wQc / 2 + 14, (top + rh + mid - R) / 2, P.hot);
        lab("Q_f = " + fr(c.Qf, 1), cx + wQf / 2 + 14, (mid + R + bot - rh) / 2, P.cold);
        lab("W = " + fr(c.W, 1), ws + 4, mid - wW / 2 - 20, P.work);
        draw.text(ctx, A, "COP = " + fr(c.c, 1), cx, mid - 8, { size: 15, weight: 700, align: "center" });
        draw.text(ctx, A, "Carnot : " + fr(c.cC, 1), cx, mid + 14, { size: 11, color: P.ink2, align: "center" });
        draw.text(ctx, A, "électricité", ws, mid + wW / 2 + 18, { size: 11, color: P.ink2 });
      }
    }
    const A = anim(cv, { draw: render, update });
    const rTc = range("flux-tc", (v) => fr(v, 0) + " °C", (v) => { st.tc = v; out(); });
    const rTf = range("flux-tf", (v) => fr(v, 0) + " °C", (v) => { st.tf = v; out(); });
    range("flux-q", (v) => v + " % de Carnot", (v) => { st.q = v; out(); });
    function out() {
      const c = calc();
      let s = "";
      if (!c.ok) s = "<span><b>source chaude ≤ source froide</b></span>";
      else if (st.type === "moteur") s = "<span>rendement <b>" + fr(c.e * 100, 1) + " %</b></span><span>limite de Carnot <b>" + fr(c.eC * 100, 1) + " %</b></span><span>chaleur rejetée <b>" + fr(c.Qf, 0) + " % de Q_c</b></span>";
      else if (st.type === "frigo") s = "<span>COP <b>" + fr(c.c, 2) + "</b></span><span>limite de Carnot <b>" + fr(c.cC, 1) + "</b></span><span>pour 1 kWh d'électricité : <b>" + fr(c.c, 2) + " kWh retirés du frigo</b></span>";
      else s = "<span>COP <b>" + fr(c.c, 2) + "</b></span><span>limite de Carnot <b>" + fr(c.cC, 1) + "</b></span><span>pour 1 kWh d'électricité : <b>" + fr(c.c, 2) + " kWh de chaleur</b>, dont " + fr(c.c - 1, 2) + " pris dehors</span>";
      document.getElementById("flux-read").innerHTML = s;
      A.redraw();
    }
    choice("flux-type", (v) => { st.type = v; rTc.set(DEF[v][0]); rTf.set(DEF[v][1]); out(); });
  })();

  /* =================================================================
     Simulation 4.4 — La pompe à chaleur en hiver
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-pac");
    if (!cv) return;
    const QUAL = 0.45;
    const st = { te: 0, ts: 35, ph: 0 };
    const cop = (te, ts) => QUAL * (ts + 273.15) / Math.max(1, ts - te);
    const besoin = (te) => Math.max(0, (20 - te) / 3); /* kW */
    function update(A, dt) { st.ph += dt; }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const sb = land ? { x: 30, y: 50, w: 400, h: A.H - 120 } : { x: 60, y: 60, w: A.W - 120, h: A.H * 0.42 };
      const C = cop(st.te, st.ts), Pc = besoin(st.te), Pe = Pc / C, Pf = Pc - Pe;
      /* murs de la maison */
      const xm = sb.x + sb.w * 0.5;
      ctx.fillStyle = draw.alpha(P.cold, 0.1); ctx.fillRect(sb.x - 20, sb.y - 30, xm - sb.x + 20, sb.h + 60);
      ctx.fillStyle = draw.alpha(P.hot, 0.1); ctx.fillRect(xm, sb.y - 30, sb.x + sb.w - xm + 20, sb.h + 60);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(xm, sb.y - 30); ctx.lineTo(xm, sb.y + sb.h + 30); ctx.stroke(); ctx.setLineDash([]);
      draw.text(ctx, A, "dehors · " + fr(st.te, 0) + " °C", sb.x - 14, sb.y - 16, { size: 12, weight: 700, color: P.cold });
      draw.text(ctx, A, "maison · eau à " + st.ts + " °C", sb.x + sb.w + 14, sb.y - 16, { size: 12, weight: 700, color: P.hot, align: "right" });
      /* circuit : évaporateur (gauche), compresseur (haut), condenseur (droite), détendeur (bas) */
      const L = sb.x + 50, R = sb.x + sb.w - 50, T = sb.y + 40, B = sb.y + sb.h - 30;
      const segs = [
        [[L, B], [L, T], P.cold, "évaporateur"],
        [[L, T], [R, T], P.hot, "compresseur"],
        [[R, T], [R, B], P.hot, "condenseur"],
        [[R, B], [L, B], P.cold, "détendeur"]
      ];
      segs.forEach(([a, b, col], i) => {
        ctx.strokeStyle = draw.alpha(col, 0.35); ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -st.ph * 40;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
        void i;
      });
      /* échangeurs (serpentins) */
      [[L, P.cold], [R, P.hot]].forEach(([x, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let y = T + 20; y <= B - 20; y += 4) { const xx = x + Math.sin((y - T) / 8) * 14; y === T + 20 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y); }
        ctx.stroke();
      });
      /* compresseur */
      const cxm = (L + R) / 2;
      ctx.fillStyle = P.card; ctx.beginPath(); ctx.arc(cxm, T, 24, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cxm, T); ctx.rotate(st.ph * 3); ctx.strokeStyle = P.work; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke(); ctx.restore();
      /* détendeur */
      ctx.fillStyle = P.ink2; ctx.beginPath(); ctx.moveTo(cxm - 14, B - 12); ctx.lineTo(cxm + 14, B + 12); ctx.lineTo(cxm + 14, B - 12); ctx.lineTo(cxm - 14, B + 12); ctx.closePath(); ctx.fill();
      draw.text(ctx, A, "compresseur", cxm, T - 36, { size: 11, color: P.ink2, align: "center" });
      draw.text(ctx, A, "détendeur", cxm, B + 26, { size: 11, color: P.ink2, align: "center" });
      draw.text(ctx, A, "évaporateur", L + 22, B - 8, { size: 11, color: P.cold });
      draw.text(ctx, A, "condenseur", R - 22, B - 8, { size: 11, color: P.hot, align: "right" });
      /* flux d'énergie */
      const k = 3.2;
      if (Pc > 0) {
        draw.arrow(ctx, sb.x - 10, (T + B) / 2, L - 18, (T + B) / 2, { color: P.cold, width: Math.max(2, Pf * k), head: 14 });
        draw.arrow(ctx, R + 18, (T + B) / 2, sb.x + sb.w + 10, (T + B) / 2, { color: P.hot, width: Math.max(2, Pc * k), head: 14 });
        draw.arrow(ctx, cxm, T - 70, cxm, T - 26, { color: P.work, width: Math.max(2, Pe * k), head: 12 });
        draw.text(ctx, A, fr(Pf, 1) + " kW", sb.x - 10, (T + B) / 2 + Pf * k / 2 + 16, { size: 12, weight: 700, color: P.cold, family: "mono" });
        draw.text(ctx, A, fr(Pc, 1) + " kW", sb.x + sb.w + 10, (T + B) / 2 + Pc * k / 2 + 16, { size: 12, weight: 700, color: P.hot, family: "mono", align: "right" });
        draw.text(ctx, A, fr(Pe, 2) + " kW élec.", cxm - 14, T - 62, { size: 12, weight: 700, color: P.work, family: "mono", align: "right" });
      } else draw.text(ctx, A, "il fait assez chaud : pas besoin de chauffer", cxm, (T + B) / 2, { size: 12, color: P.ink2, align: "center" });
      /* graphique COP */
      const gb = land ? { x: 520, y: 40, w: A.W - 545, h: A.H - 110 } : { x: 70, y: A.H * 0.58, w: A.W - 100, h: A.H * 0.32 };
      const pl = plot(ctx, A, gb, { xmin: -15, xmax: 15, ymin: 0, ymax: 7, xstep: 5, ystep: 1, xlabel: "θ extérieure (°C)", ylabel: "COP" });
      [[35, P.energy, "sol 35 °C"], [55, P.flame, "radiateurs 55 °C"]].forEach(([ts, col, lab]) => {
        const pts = []; for (let t = -15; t <= 15; t += 0.5) pts.push([t, cop(t, ts)]);
        curve(ctx, pts, pl.X, pl.Y, col, ts === st.ts ? 3 : 1.5, ts === st.ts ? [] : [5, 4]);
        draw.text(ctx, A, lab, pl.X(-14.5), pl.Y(cop(-14.5, ts)) - 12, { size: 11, color: col, align: "left", weight: 600 });
      });
      curve(ctx, [[st.te, 0], [st.te, 7]], pl.X, pl.Y, P.ink3, 1, [2, 4]);
      ctx.fillStyle = st.ts === 35 ? P.energy : P.flame; ctx.beginPath(); ctx.arc(pl.X(st.te), pl.Y(C), 6, 0, Math.PI * 2); ctx.fill();
      draw.text(ctx, A, "COP = " + fr(C, 2), pl.X(st.te) + 8, pl.Y(C) + 14, { size: 12, weight: 700, family: "mono" });
    }
    const A = anim(cv, { draw: render, update });
    A.bindPlay(document.getElementById("pac-play"));
    function out() {
      const C = cop(st.te, st.ts), Pc = besoin(st.te), Pe = Pc / C;
      document.getElementById("pac-read").innerHTML =
        "<span>COP <b>" + fr(C, 2) + "</b> (Carnot : " + fr(C / QUAL, 1) + ")</span>" +
        "<span>besoin de la maison <b>" + fr(Pc, 1) + " kW</b></span>" +
        "<span>électricité <b>" + fr(Pe, 2) + " kW</b>, soit <b>" + fr(Pe * 24, 0) + " kWh/jour</b></span>" +
        "<span>pris à l'air extérieur <b>" + fr(Pc - Pe, 1) + " kW</b></span>";
      A.redraw();
    }
    range("pac-te", (v) => fr(v, 0) + " °C", (v) => { st.te = v; out(); });
    choice("pac-emet", (v) => { st.ts = Number(v); out(); });
  })();

  /* =================================================================
     Simulation 4.5 — La détente dans le vide
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-det");
    if (!cv) return;
    const st = { N: 40, wall: true, p: [], hist: [], counts: [], t: 0, tOpen: -1, allLeft: 0, samples: 0, init: false };
    let L = null;
    function layout(A) {
      const land = A.W / A.H > 1.25;
      L = land ? { bx: 30, by: 40, bw: 380, bh: A.H - 90, g1: { x: 490, y: 36, w: A.W - 515, h: (A.H - 130) / 2 }, g2: { x: 490, y: 36 + (A.H - 130) / 2 + 60, w: A.W - 515, h: (A.H - 130) / 2 } }
        : { bx: 40, by: 40, bw: A.W - 80, bh: A.H * 0.36, g1: { x: 80, y: A.H * 0.36 + 100, w: A.W - 110, h: A.H * 0.2 }, g2: { x: 80, y: A.H * 0.62 + 110, w: A.W - 110, h: A.H * 0.2 } };
    }
    function reset() {
      st.p = [];
      for (let i = 0; i < st.N; i++) {
        const a = Math.random() * 6.283;
        st.p.push({ x: L.bx + 8 + Math.random() * (L.bw / 2 - 16), y: L.by + 8 + Math.random() * (L.bh - 16), vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 });
      }
      st.wall = true; st.hist = []; st.counts = new Array(st.N + 1).fill(0); st.t = 0; st.tOpen = -1; st.allLeft = 0; st.samples = 0;
      st.init = true;
    }
    const nLeft = () => st.p.reduce((a, q) => a + (q.x < L.bx + L.bw / 2 ? 1 : 0), 0);
    function update(A, dt) {
      if (!st.init) reset();
      const r = 3, mid = L.bx + L.bw / 2;
      for (const q of st.p) {
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < L.bx + r) { q.x = L.bx + r; q.vx = Math.abs(q.vx); }
        if (q.x > L.bx + L.bw - r) { q.x = L.bx + L.bw - r; q.vx = -Math.abs(q.vx); }
        if (q.y < L.by + r) { q.y = L.by + r; q.vy = Math.abs(q.vy); }
        if (q.y > L.by + L.bh - r) { q.y = L.by + L.bh - r; q.vy = -Math.abs(q.vy); }
        if (st.wall && q.x > mid - r - 2) { q.x = mid - r - 2; q.vx = -Math.abs(q.vx); }
        if (Math.random() < dt * 0.6) { const a = Math.random() * 6.283, v = Math.hypot(q.vx, q.vy); q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; }
      }
      st.t += dt;
      const last = st.hist[st.hist.length - 1];
      if (!last || st.t - last[0] > 0.1) {
        const nl = nLeft();
        st.hist.push([st.t, nl]); if (st.hist.length > 600) st.hist.shift();
        if (!st.wall) { st.counts[nl]++; st.samples++; if (nl === st.N && st.t - st.tOpen > 2) st.allLeft++; }
      }
      if (A.t % 0.2 < 0.02) out();
    }
    function binom(N, k) { let lg = 0; for (let i = 1; i <= k; i++) lg += Math.log(N - k + i) - Math.log(i); return lg; }
    function render(ctx, A, P) {
      if (!L) layout(A);
      if (!st.init) reset();
      const mid = L.bx + L.bw / 2;
      ctx.fillStyle = P.paper; ctx.fillRect(L.bx, L.by, L.bw, L.bh);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.strokeRect(L.bx, L.by, L.bw, L.bh);
      if (st.wall) { ctx.fillStyle = P.ink2; ctx.fillRect(mid - 3, L.by, 6, L.bh); }
      else { ctx.setLineDash([4, 6]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mid, L.by); ctx.lineTo(mid, L.by + L.bh); ctx.stroke(); ctx.setLineDash([]); }
      const rad = st.N <= 10 ? 7 : st.N <= 40 ? 5 : 3;
      st.p.forEach((q) => { ctx.fillStyle = q.x < mid ? P.particle : P.hot; ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, Math.PI * 2); ctx.fill(); });
      const nl = nLeft();
      draw.text(ctx, A, "gauche : " + nl, L.bx + 4, L.by - 14, { size: 13, weight: 700, color: P.particle });
      draw.text(ctx, A, "droite : " + (st.N - nl), L.bx + L.bw - 4, L.by - 14, { size: 13, weight: 700, color: P.hot, align: "right" });
      /* n gauche au cours du temps */
      const tmax = Math.max(30, st.t);
      const p1 = plot(ctx, A, L.g1, { xmin: tmax - 30, xmax: tmax, ymin: 0, ymax: st.N, xstep: 10, ystep: st.N / 2, xlabel: "t (s)", ylabel: "molécules à gauche" });
      ctx.save(); ctx.beginPath(); ctx.rect(L.g1.x, L.g1.y - 2, L.g1.w, L.g1.h + 4); ctx.clip();
      curve(ctx, [[tmax - 30, st.N / 2], [tmax, st.N / 2]], p1.X, p1.Y, P.ink3, 1, [4, 4]);
      curve(ctx, st.hist, p1.X, p1.Y, P.particle, 2);
      ctx.restore();
      /* histogramme */
      const ymaxF = Math.exp(binom(st.N, Math.floor(st.N / 2)) - st.N * Math.LN2) * 1.25;
      const p2 = plot(ctx, A, L.g2, { xmin: -0.5, xmax: st.N + 0.5, ymin: 0, ymax: ymaxF, xstep: st.N <= 10 ? 1 : st.N / 4, ystep: ymaxF, xlabel: "molécules à gauche", ylabel: "fréquence", yfmt: () => "" });
      const bw = Math.max(1, p2.X(1) - p2.X(0) - (st.N <= 40 ? 2 : 0));
      if (st.samples) for (let k = 0; k <= st.N; k++) {
        const f = st.counts[k] / st.samples; if (!f) continue;
        ctx.fillStyle = draw.alpha(P.particle, 0.6); ctx.fillRect(p2.X(k) - bw / 2, p2.Y(Math.min(f, ymaxF)), bw, p2.Y(0) - p2.Y(Math.min(f, ymaxF)));
      }
      const th = []; for (let k = 0; k <= st.N; k++) th.push([k, Math.exp(binom(st.N, k) - st.N * Math.LN2)]);
      curve(ctx, th, p2.X, p2.Y, P.hot, 1.8);
      draw.text(ctx, A, "barres : observé · courbe : théorie (loi binomiale)", L.g2.x + L.g2.w - 4, L.g2.y + 8, { size: 11, color: P.ink2, align: "right" });
      if (st.wall && st.tOpen < 0) draw.text(ctx, A, "toutes à gauche, cloison fermée", L.bx + L.bw * 0.75, L.by + L.bh / 2, { size: 12, color: P.ink3, align: "center" });
    }
    const A = anim(cv, { draw: render, update, onResize: (A2) => { layout(A2); st.init = false; } });
    A.bindPlay(document.getElementById("det-play"));
    function out() {
      if (!L) return;
      const nl = st.init ? nLeft() : st.N;
      const lgP = -st.N * Math.log10(2);
      const wait = Math.pow(2, st.N) * 1.5; /* s, une configuration « nouvelle » toutes les 1,5 s environ */
      const ans = wait / 3.156e7;
      const lnOmega = binom(st.N, nl);
      document.getElementById("det-read").innerHTML =
        "<span>P(toutes à gauche) = (1/2)<sup>" + st.N + "</sup> = <b>" + (st.N <= 20 ? "1/" + fr(Math.pow(2, st.N), 0) : sci(Math.pow(10, lgP), 2)) + "</b></span>" +
        "<span>attente typique <b>" + (wait < 3600 ? fr(wait, 0) + " s" : ans < 1e9 ? sci(ans, 1) + " ans" : sci(ans, 1) + " ans (l'Univers a 1,4·10¹⁰ ans)") + "</b></span>" +
        "<span>configurations pour l'état actuel Ω = <b>" + sci(Math.exp(lnOmega), 2) + "</b>, S/k = ln Ω = <b>" + fr(lnOmega, 1) + "</b></span>" +
        "<span>retours observés « toutes à gauche » <b>" + st.allLeft + "</b></span>";
    }
    choice("det-n", (v) => { st.N = Number(v); if (L) reset(); out(); A.redraw(); });
    document.getElementById("det-go").addEventListener("click", () => { if (!st.init) reset(); st.wall = false; st.tOpen = st.t; st.counts = new Array(st.N + 1).fill(0); st.samples = 0; A.play(); });
    document.getElementById("det-reset").addEventListener("click", () => { reset(); out(); A.redraw(); });
  })();
})();
