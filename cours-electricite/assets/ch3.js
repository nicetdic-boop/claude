/* Chapitre 3 — Lois des circuits : animations */
(function () {
  "use strict";
  const { anim, draw, fr, si, range, choice } = window.Cours;

  /* ---------- outils communs : segments parcourus par des points ---------- */
  function segLength(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  function pointAt(pts, d) {
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= l) { const t = l ? d / l : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
      d -= l;
    }
    return pts[pts.length - 1];
  }
  function strokePath(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  function drawDots(ctx, seg, color, spacing) {
    if (!seg.I || Math.abs(seg.I) < 1e-6) return;
    const L = segLength(seg.pts);
    const sp = spacing || 26;
    let off = ((seg.off % sp) + sp) % sp;
    ctx.fillStyle = color;
    for (let d = off; d < L; d += sp) {
      const [x, y] = pointAt(seg.pts, d);
      ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  /* générateur vertical : grand trait (+) en haut */
  function battery(ctx, A, P, x, y, label) {
    ctx.fillStyle = P.card; ctx.fillRect(x - 26, y - 22, 52, 44);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 22, y - 8); ctx.lineTo(x + 22, y - 8); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 11, y + 8); ctx.lineTo(x + 11, y + 8); ctx.stroke();
    draw.text(ctx, A, "+", x + 30, y - 14, { size: 16, weight: 700, color: P.plus });
    draw.text(ctx, A, "−", x + 30, y + 14, { size: 16, weight: 700, color: P.minus });
    if (label) draw.text(ctx, A, label, x - 34, y, { size: 15, weight: 600, color: P.ink, align: "right" });
  }
  function resistor(ctx, A, P, x, y, vertical, power, name, value, maxP) {
    const w = vertical ? 26 : 64, h = vertical ? 64 : 26;
    const b = Math.max(0, Math.min(1, power / (maxP || 8)));
    if (b > 0.01) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, 56);
      g.addColorStop(0, draw.alpha(P.glow, 0.9 * b));
      g.addColorStop(1, draw.alpha(P.glow, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 56, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = b > 0.01 ? draw.mix(P.card, P.glow, Math.min(1, b * 0.9)) : P.card;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
    ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    if (name) {
      if (vertical) {
        draw.text(ctx, A, name, x + 22, y - 10, { size: 15, weight: 700, color: P.ink });
        draw.text(ctx, A, value, x + 22, y + 12, { size: 13, color: P.ink2 });
      } else {
        draw.text(ctx, A, name + "  " + value, x, y - 30, { size: 14, weight: 600, color: P.ink, align: "center" });
      }
    }
  }

  /* =================================================================
     Animation 3.1 — La guirlande : série contre parallèle
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-guirlande");
    if (!cv) return;
    const st = { s: [0, 0, 0, 0, 0, 0], p: [0, 0, 0, 0, 0, 0], segS: [], segP: [], lampsS: [], lampsP: [] };
    const RL_S = Math.pow(230 / 6, 2) / 10, RL_P = 230 * 230 / 10; /* lampes de 10 W */

    function layout(A) {
      const side = A.H < A.W * 0.75;
      const pS = side ? { x: 0, y: 0, w: A.W / 2, h: A.H } : { x: 0, y: 0, w: A.W, h: A.H / 2 };
      const pP = side ? { x: A.W / 2, y: 0, w: A.W / 2, h: A.H } : { x: 0, y: A.H / 2, w: A.W, h: A.H / 2 };
      return { pS, pP };
    }
    function build(A) {
      const { pS, pP } = layout(A);
      /* série : boucle, lampes sur le haut */
      {
        const xL = pS.x + 50, xR = pS.x + pS.w - 30, yT = pS.y + pS.h * 0.32, yB = pS.y + pS.h * 0.8;
        st.lampsS = [];
        for (let k = 0; k < 6; k++) st.lampsS.push([xL + 50 + (xR - xL - 80) * (k + 0.5) / 6, yT]);
        st.segS = [{ pts: [[xL, (yT + yB) / 2], [xL, yT], [xR, yT], [xR, yB], [xL, yB], [xL, (yT + yB) / 2]], I: 0, off: 0 }];
        st.geoS = { xL, xR, yT, yB };
      }
      /* parallèle : deux rails, lampes verticales */
      {
        const xL = pP.x + 50, xR = pP.x + pP.w - 30, yT = pP.y + pP.h * 0.32, yB = pP.y + pP.h * 0.8, yM = (yT + yB) / 2;
        st.lampsP = [];
        const bx = [];
        for (let k = 0; k < 6; k++) { const x = xL + 95 + (xR - xL - 95) * k / 5; bx.push(x); st.lampsP.push([x, yM]); }
        st.geoP = { xL, xR, yT, yB, bx };
        st.segP = [];
        st.segP.push({ pts: [[xL, yB], [xL, yT]], key: "tot" });
        st.segP.push({ pts: [[xL, yT], [bx[0], yT]], key: "r0" });
        for (let k = 0; k < 5; k++) st.segP.push({ pts: [[bx[k], yT], [bx[k + 1], yT]], key: "r" + (k + 1) });
        for (let k = 0; k < 6; k++) st.segP.push({ pts: [[bx[k], yT], [bx[k], yB]], key: "b" + k });
        for (let k = 5; k > 0; k--) st.segP.push({ pts: [[bx[k], yB], [bx[k - 1], yB]], key: "r" + k });
        st.segP.push({ pts: [[bx[0], yB], [xL, yB]], key: "r0" });
        st.segP.forEach((s) => { s.off = 0; s.I = 0; });
      }
      st.W = A.W; st.H = A.H;
    }
    function solve() {
      const okS = st.s.every((b) => !b);
      const IS = okS ? 230 / (6 * RL_S) : 0;
      st.segS.forEach((s) => (s.I = IS));
      const Ib = st.p.map((b) => (b ? 0 : 230 / RL_P));
      st.segP.forEach((s) => {
        if (s.key === "tot") s.I = Ib.reduce((a, b) => a + b, 0);
        else if (s.key[0] === "b") s.I = Ib[+s.key.slice(1)];
        else { const k = +s.key.slice(1); s.I = Ib.slice(k).reduce((a, b) => a + b, 0); }
      });
      const n = st.p.filter((b) => !b).length;
      document.getElementById("gu-read").innerHTML =
        "<span>Série : <b>" + (okS ? "I = " + fr(IS * 1000, 0) + " mA, toutes allumées" : "circuit ouvert, I = 0, tout est éteint") + "</b></span>" +
        "<span>Parallèle : <b>" + n + " lampe" + (n > 1 ? "s" : "") + " allumée" + (n > 1 ? "s" : "") + ", I totale = " + n + " × " + fr(230 / RL_P * 1000, 0) + " mA = " + fr(n * 230 / RL_P * 1000, 0) + " mA</b></span>";
      return { IS, Ib };
    }
    function update(A, dt) {
      if (st.W !== A.W || st.H !== A.H) build(A);
      st.segS.forEach((s) => (s.off += s.I * 1500 * dt));
      st.segP.forEach((s) => (s.off += s.I * 1500 * dt));
    }
    function lamp(ctx, P, x, y, on, broken) {
      if (on) {
        const g = ctx.createRadialGradient(x, y, 3, x, y, 40);
        g.addColorStop(0, draw.alpha(P.glow, 0.95)); g.addColorStop(1, draw.alpha(P.glow, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = on ? P.glow : P.card; ctx.fill();
      ctx.strokeStyle = broken ? P.ink3 : P.ink; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath();
      if (broken) {
        ctx.moveTo(x - 10, y - 10); ctx.lineTo(x - 2, y - 2); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10); ctx.lineTo(x + 2, y - 2); ctx.moveTo(x - 2, y + 2); ctx.lineTo(x - 10, y + 10);
      } else {
        ctx.moveTo(x - 10, y - 10); ctx.lineTo(x + 10, y + 10); ctx.moveTo(x + 10, y - 10); ctx.lineTo(x - 10, y + 10);
      }
      ctx.stroke();
    }
    function render(ctx, A, P) {
      if (st.W !== A.W || st.H !== A.H) build(A);
      const { IS, Ib } = solve();
      const { pS, pP } = layout(A);
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
      if (pP.x > 0) { ctx.beginPath(); ctx.moveTo(pP.x, 20); ctx.lineTo(pP.x, A.H - 20); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(20, pP.y); ctx.lineTo(A.W - 20, pP.y); ctx.stroke(); }
      draw.text(ctx, A, "En série", pS.x + 24, pS.y + 30, { size: 17, weight: 700 });
      draw.text(ctx, A, "En parallèle", pP.x + 24, pP.y + 30, { size: 17, weight: 700 });
      /* fils */
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      st.segS.forEach((s) => strokePath(ctx, s.pts));
      st.segP.forEach((s) => strokePath(ctx, s.pts));
      st.segS.forEach((s) => drawDots(ctx, s, P.accent, 24));
      st.segP.forEach((s) => drawDots(ctx, s, P.accent, 24));
      /* nœuds */
      ctx.fillStyle = P.ink;
      st.geoP.bx.forEach((x, k) => { if (k < 5) { [st.geoP.yT, st.geoP.yB].forEach((y) => { ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); }); } });
      /* générateurs */
      battery(ctx, A, P, st.geoS.xL, (st.geoS.yT + st.geoS.yB) / 2, "");
      battery(ctx, A, P, st.geoP.xL, (st.geoP.yT + st.geoP.yB) / 2, "");
      draw.text(ctx, A, "230 V", st.geoS.xL + 28, st.geoS.yB - 16, { size: 12, color: P.ink3 });
      draw.text(ctx, A, "230 V", st.geoP.xL + 28, st.geoP.yB - 16, { size: 12, color: P.ink3 });
      /* lampes */
      st.lampsS.forEach(([x, y], k) => lamp(ctx, P, x, y, IS > 0, st.s[k]));
      st.lampsP.forEach(([x, y], k) => lamp(ctx, P, x, y, Ib[k] > 0, st.p[k]));
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    cv.addEventListener("click", (e) => {
      const p = A.pos(e);
      st.lampsS.forEach(([x, y], k) => { if (Math.hypot(p.x - x, p.y - y) < 26) st.s[k] = st.s[k] ? 0 : 1; });
      st.lampsP.forEach(([x, y], k) => { if (Math.hypot(p.x - x, p.y - y) < 26) st.p[k] = st.p[k] ? 0 : 1; });
      A.redraw();
    });
    document.getElementById("gu-repair").addEventListener("click", () => { st.s.fill(0); st.p.fill(0); A.redraw(); });
  })();

  /* =================================================================
     Animation 3.2 — Simulateur : série, parallèle, mixte
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-circuit");
    if (!cv) return;
    const st = { mode: "mixte", U: 12, R: [10, 20, 30], segs: [], comps: [], key: "" };

    function solve() {
      const [R1, R2, R3] = st.R, U = st.U;
      let I, I1, I2, I3, U1, U2, U3, Req;
      if (st.mode === "serie") { Req = R1 + R2 + R3; I = U / Req; I1 = I2 = I3 = I; U1 = R1 * I; U2 = R2 * I; U3 = R3 * I; }
      else if (st.mode === "para") { I1 = U / R1; I2 = U / R2; I3 = U / R3; I = I1 + I2 + I3; Req = U / I; U1 = U2 = U3 = U; }
      else { const R23 = R2 * R3 / (R2 + R3); Req = R1 + R23; I = U / Req; I1 = I; U1 = R1 * I; U2 = U3 = U - U1; I2 = U2 / R2; I3 = U3 / R3; }
      return { I, I1, I2, I3, U1, U2, U3, Req };
    }
    function build(A) {
      const W = A.W, H = A.H;
      const xL = W * 0.12, xR = W * 0.86, yT = H * 0.16, yB = H * 0.84, yM = (yT + yB) / 2;
      const S = []; const C = [];
      if (st.mode === "serie") {
        S.push({ pts: [[xL, yM], [xL, yT], [xR, yT], [xR, yB], [xL, yB], [xL, yM]], k: "I" });
        C.push({ x: W * 0.36, y: yT, v: false, i: 0 }, { x: W * 0.64, y: yT, v: false, i: 1 }, { x: xR, y: yM, v: true, i: 2 });
      } else if (st.mode === "para") {
        const bx = [W * 0.42, W * 0.64, xR];
        S.push({ pts: [[xL, yB], [xL, yT], [bx[0], yT]], k: "I" });
        S.push({ pts: [[bx[0], yT], [bx[1], yT]], k: "I23" });
        S.push({ pts: [[bx[1], yT], [bx[2], yT]], k: "I3" });
        bx.forEach((x, i) => S.push({ pts: [[x, yT], [x, yB]], k: "I" + (i + 1) }));
        S.push({ pts: [[bx[2], yB], [bx[1], yB]], k: "I3" });
        S.push({ pts: [[bx[1], yB], [bx[0], yB]], k: "I23" });
        S.push({ pts: [[bx[0], yB], [xL, yB]], k: "I" });
        bx.forEach((x, i) => C.push({ x, y: yM, v: true, i }));
        st.nodes = [[bx[0], yT], [bx[1], yT], [bx[0], yB], [bx[1], yB]];
      } else {
        const bx = [W * 0.6, xR];
        S.push({ pts: [[xL, yM], [xL, yT], [bx[0], yT]], k: "I" });
        S.push({ pts: [[bx[0], yT], [bx[1], yT]], k: "I3" });
        S.push({ pts: [[bx[0], yT], [bx[0], yB]], k: "I2" });
        S.push({ pts: [[bx[1], yT], [bx[1], yB]], k: "I3" });
        S.push({ pts: [[bx[1], yB], [bx[0], yB]], k: "I3" });
        S.push({ pts: [[bx[0], yB], [xL, yB], [xL, yM]], k: "I" });
        C.push({ x: W * 0.34, y: yT, v: false, i: 0 }, { x: bx[0], y: yM, v: true, i: 1 }, { x: bx[1], y: yM, v: true, i: 2 });
        st.nodes = [[bx[0], yT], [bx[0], yB]];
      }
      if (st.mode === "serie") st.nodes = [];
      S.forEach((s) => (s.off = 0));
      st.segs = S; st.comps = C; st.gen = [xL, yM];
      st.key = st.mode + W + "x" + H;
    }
    function currents() {
      const r = solve();
      return { I: r.I, I1: r.I1, I2: r.I2, I3: r.I3, I23: r.I2 + r.I3, r };
    }
    function update(A, dt) {
      if (st.key !== st.mode + A.W + "x" + A.H) build(A);
      const c = currents();
      st.segs.forEach((s) => { s.I = c[s.k]; s.off += Math.min(520, 110 * s.I) * dt; });
    }
    function render(ctx, A, P) {
      if (st.key !== st.mode + A.W + "x" + A.H) build(A);
      const c = currents(), r = c.r;
      st.segs.forEach((s) => (s.I = c[s.k]));
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      st.segs.forEach((s) => strokePath(ctx, s.pts));
      st.segs.forEach((s) => drawDots(ctx, s, P.accent, 28));
      ctx.fillStyle = P.ink;
      (st.nodes || []).forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill(); });
      battery(ctx, A, P, st.gen[0], st.gen[1], fr(st.U, 1) + " V");
      const Ps = [r.U1 * r.I1, r.U2 * r.I2, r.U3 * r.I3];
      st.comps.forEach((k) => resistor(ctx, A, P, k.x, k.y, k.v, Ps[k.i], "R" + "₁₂₃"[k.i], fr(st.R[k.i], 0) + " Ω", 6));
      /* intensités sur les fils */
      const lab = (x, y, t, al) => draw.text(ctx, A, t, x, y, { size: 13, color: P.accent, align: al || "center", family: "mono", weight: 500 });
      const W = A.W, H = A.H, yT = H * 0.16, yB = H * 0.84;
      lab(W * 0.2, yT - 18, "I = " + si(r.I, "A", 3));
      if (st.mode === "para") {
        [W * 0.42, W * 0.64, W * 0.86].forEach((x, i) => lab(x - 18, yB - 26, "I" + "₁₂₃"[i] + " = " + si([r.I1, r.I2, r.I3][i], "A", 3), "right"));
      }
      if (st.mode === "mixte") {
        lab(W * 0.6 - 18, yB - 26, "I₂ = " + si(r.I2, "A", 3), "right");
        lab(W * 0.86 - 18, yB - 26, "I₃ = " + si(r.I3, "A", 3), "right");
      }
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("sim-play"));
    function out() {
      const r = solve();
      const row = (n, I, U) => "<span>" + n + " : <b>" + si(I, "A", 3) + " · " + si(U, "V", 3) + " · " + si(U * I, "W", 3) + "</b></span>";
      document.getElementById("sim-read").innerHTML =
        row("R₁", r.I1, r.U1) + row("R₂", r.I2, r.U2) + row("R₃", r.I3, r.U3) +
        "<span>Total : <b>R<sub>éq</sub> = " + si(r.Req, "Ω", 3) + " · I = " + si(r.I, "A", 3) + " · P = " + si(st.U * r.I, "W", 3) + "</b></span>";
      A.redraw();
    }
    choice("sim-mode", (v) => { st.mode = v; st.key = ""; out(); });
    range("sim-u", (v) => fr(v, 1) + " V", (v) => { st.U = v; out(); });
    [0, 1, 2].forEach((i) => range("sim-r" + (i + 1), (v) => fr(v, 0) + " Ω", (v) => { st.R[i] = v; out(); }));
  })();

  /* =================================================================
     Animation 3.3 — Générateur réel : batterie de voiture
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-gen");
    if (!cv) return;
    const U0 = 12.6;
    const st = { r: 0.02, R: 3 };
    const Rof = (v) => 0.005 * Math.pow(10, v / 25);
    const vOf = (R) => 25 * Math.log10(R / 0.005);

    function render(ctx, A, P) {
      const side = A.H < A.W * 0.8;
      const g1 = side ? { x: 70, y: 30, w: A.W / 2 - 110, h: A.H - 90 } : { x: 80, y: 30, w: A.W - 120, h: A.H / 2 - 80 };
      const g2 = side ? { x: A.W / 2 + 70, y: 30, w: A.W / 2 - 100, h: A.H - 90 } : { x: 80, y: A.H / 2 + 30, w: A.W - 120, h: A.H / 2 - 80 };
      const I = U0 / (st.R + st.r), Ub = U0 - st.r * I, Pc = Ub * I;
      const Icc = U0 / st.r, Pmax = U0 * U0 / (4 * st.r);

      /* graphe 1 : U(I) */
      const X1 = (i) => g1.x + i / Icc * g1.w, Y1 = (u) => g1.y + g1.h - u / 14 * g1.h;
      axes(ctx, A, P, g1, "I (A)", "U aux bornes (V)");
      const raw = Icc / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), stp = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= raw);
      for (let i = 0; i <= Icc + 1e-9; i += stp) draw.text(ctx, A, fr(i, 0), X1(i), g1.y + g1.h + 16, { size: 11, color: P.ink3, align: "center" });
      [0, 4, 8, 12].forEach((u) => draw.text(ctx, A, u + "", g1.x - 8, Y1(u), { size: 11, color: P.ink3, align: "right" }));
      ctx.fillStyle = draw.alpha(P.accent, 0.15);
      ctx.fillRect(g1.x, Y1(Ub), X1(I) - g1.x, g1.y + g1.h - Y1(Ub));
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X1(0), Y1(U0)); ctx.lineTo(X1(Icc), Y1(0)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X1(I), Y1(Ub), 7, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill(); ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
      if (X1(I) - g1.x > 110) draw.text(ctx, A, "P = U·I (aire)", (X1(I) + g1.x) / 2, Y1(Ub / 2), { size: 12, color: P.accent, align: "center" });
      draw.text(ctx, A, "U₀ = 12,6 V", X1(0) + 8, Y1(U0) - 12, { size: 12, color: P.ink2 });
      /* phares */
      const bright = Math.pow(Math.max(0, Ub) / U0, 3.4);
      const hx = g1.x + g1.w - 30, hy = g1.y + 26;
      const gl = ctx.createRadialGradient(hx, hy, 2, hx, hy, 34);
      gl.addColorStop(0, draw.alpha(P.glow, bright)); gl.addColorStop(1, draw.alpha(P.glow, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, hy, 34, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx, hy, 12, 0, Math.PI * 2); ctx.fillStyle = draw.mix(P.card, P.glow, bright); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      draw.text(ctx, A, "phares", hx, hy + 26, { size: 11, color: P.ink3, align: "center" });

      /* graphe 2 : P(R), échelle log */
      const Rmin = 0.005, Rmax = 50;
      const X2 = (R) => g2.x + Math.log10(R / Rmin) / Math.log10(Rmax / Rmin) * g2.w, Y2 = (p) => g2.y + g2.h - p / (Pmax * 1.12) * g2.h;
      axes(ctx, A, P, g2, "R (Ω, échelle log)", "P reçue par la charge (W)");
      [0.01, 0.1, 1, 10].forEach((R) => draw.text(ctx, A, fr(R, R < 1 ? 2 : 0), X2(R), g2.y + g2.h + 16, { size: 11, color: P.ink3, align: "center" }));
      draw.text(ctx, A, si(Pmax, "W", 3), g2.x - 8, Y2(Pmax), { size: 11, color: P.ink3, align: "right" });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X2(st.r), g2.y + g2.h); ctx.lineTo(X2(st.r), Y2(Pmax)); ctx.lineTo(g2.x, Y2(Pmax)); ctx.stroke(); ctx.setLineDash([]);
      draw.text(ctx, A, "R = r", X2(st.r), Y2(Pmax) - 14, { size: 12, color: P.ink2, align: "center" });
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const R = Rmin * Math.pow(Rmax / Rmin, k / 200), i = U0 / (R + st.r), p = R * i * i;
        if (k) ctx.lineTo(X2(R), Y2(p)); else ctx.moveTo(X2(R), Y2(p));
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(X2(st.R), Y2(Pc), 7, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill(); ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
    }
    function axes(ctx, A, P, g, xl, yl) {
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(g.x, g.y - 6); ctx.lineTo(g.x, g.y + g.h); ctx.lineTo(g.x + g.w + 6, g.y + g.h); ctx.stroke();
      draw.text(ctx, A, xl, g.x + g.w, g.y + g.h + 34, { size: 12, color: P.ink2, align: "right" });
      draw.text(ctx, A, yl, g.x + 8, g.y - 10, { size: 12, color: P.ink2 });
    }
    const A = anim(cv, { draw: render, autoplay: false });
    function out() {
      const I = U0 / (st.R + st.r), Ub = U0 - st.r * I;
      document.getElementById("gen-read").innerHTML =
        "<span>R = <b>" + si(st.R, "Ω", 3) + "</b></span>" +
        "<span>I = <b>" + si(I, "A", 3) + "</b></span>" +
        "<span>U aux bornes = <b>" + fr(Ub, 2) + " V</b></span>" +
        "<span>P charge = <b>" + si(Ub * I, "W", 3) + "</b></span>" +
        "<span>P perdue dans la batterie = <b>" + si(st.r * I * I, "W", 3) + "</b></span>" +
        "<span>rendement = <b>" + fr(100 * st.R / (st.R + st.r), 0) + " %</b></span>";
      A.redraw();
    }
    const rR = range("gen-r", () => si(st.R, "Ω", 3), (v) => { st.R = Rof(v); out(); });
    range("gen-ri", (v) => fr(v, 0) + " mΩ", (v) => { st.r = v / 1000; rR.set(document.getElementById("gen-r").value); });
    const presets = { phares: 12 * 12 / 110, demarreur: 0.043, adapte: null };
    document.querySelectorAll("#gen-preset button").forEach((b) => b.addEventListener("click", () => {
      const R = presets[b.dataset.value] || st.r;
      rR.set(vOf(R));
    }));
  })();
})();
