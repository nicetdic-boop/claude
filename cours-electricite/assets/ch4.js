/* Chapitre 4 — Production en Suisse : graphiques et animations */
(function () {
  "use strict";
  const { anim, draw, fr, si, range, choice } = window.Cours;
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* =================================================================
     Fig. 4.1 — Mix électrique 2025 (barre empilée SVG + infobulle)
     ================================================================= */
  (function () {
    const box = document.getElementById("mix-chart");
    if (!box) return;
    const DATA = [
      { n: "Hydraulique à accumulation", s: "Accumulation", v: 21.1, c: "--s-acc" },
      { n: "Hydraulique au fil de l'eau", s: "Fil de l'eau", v: 16.3, c: "--s-fil" },
      { n: "Nucléaire", s: "Nucléaire", v: 18.4, c: "--s-nuc" },
      { n: "Thermique et autres renouvelables", s: "Autres", v: 3.7, c: "--s-aut" },
      { n: "Photovoltaïque", s: "Solaire", v: 8.0, c: "--s-pv" }
    ];
    const total = DATA.reduce((a, d) => a + d.v, 0);
    const legend = document.getElementById("mix-legend");
    legend.innerHTML = DATA.map((d) => '<span><i style="background:var(' + d.c + ')"></i>' + d.n + "</span>").join("") +
      '<span><i style="background:var(--ink-3)"></i>Consommation finale</span>';
    const W = 700, x0 = 120, x1 = 690, sc = (x1 - x0) / 70;
    let svg = '<svg viewBox="0 0 ' + W + ' 190" role="img" aria-label="Barre empilée de la production 2025 : accumulation 21,1 TWh, fil de l\'eau 16,3, nucléaire 18,4, autres 3,7, solaire 8,0 ; total 67,5 TWh. Consommation finale 58,0 TWh.">';
    for (let t = 0; t <= 70; t += 10) {
      const x = x0 + t * sc;
      svg += '<line x1="' + x + '" y1="20" x2="' + x + '" y2="160" style="stroke:var(--rule-2);stroke-width:1"/>';
      svg += '<text x="' + x + '" y="178" text-anchor="middle" class="t-small">' + t + "</text>";
    }
    svg += '<text x="' + x1 + '" y="14" text-anchor="end" class="t-small">TWh</text>';
    svg += '<text x="' + (x0 - 10) + '" y="70" text-anchor="end" class="t-strong" style="font-size:13px">Production</text>';
    svg += '<text x="' + (x0 - 10) + '" y="86" text-anchor="end" class="t-small">67,5 TWh</text>';
    let x = x0;
    DATA.forEach((d, i) => {
      const w = d.v * sc;
      const gap = i < DATA.length - 1 ? 2 : 0;
      svg += '<rect class="mix-seg" data-i="' + i + '" x="' + x.toFixed(1) + '" y="44" width="' + (w - gap).toFixed(1) + '" height="54" rx="' + (i === 0 || i === DATA.length - 1 ? 4 : 0) + '" style="fill:var(' + d.c + ')"/>';
      if (w > 70) {
        svg += '<text x="' + (x + 6) + '" y="36" class="t-small" style="fill:var(--ink)">' + d.s + "</text>";
        svg += '<text x="' + (x + 6) + '" y="116" class="t-mono" style="fill:var(--ink-2);font-size:11px">' + fr(d.v, 1) + " · " + fr(100 * d.v / total, 0) + " %</text>";
      }
      x += w;
    });
    svg += '<text x="' + (x0 - 10) + '" y="146" text-anchor="end" class="t-strong" style="font-size:13px">Consommation</text>';
    svg += '<rect class="mix-seg" data-i="c" x="' + x0 + '" y="134" width="' + (58 * sc).toFixed(1) + '" height="22" rx="4" style="fill:var(--ink-3)"/>';
    svg += '<text x="' + (x0 + 58 * sc + 8) + '" y="150" class="t-mono" style="fill:var(--ink-2);font-size:11px">58,0 TWh</text>';
    svg += "</svg>";
    box.innerHTML = svg + '<div class="tip" hidden></div>';
    const tip = box.querySelector(".tip");
    box.querySelectorAll(".mix-seg").forEach((r) => {
      const show = (e) => {
        const i = r.dataset.i;
        tip.innerHTML = i === "c" ? "Consommation finale<br>58,0 TWh" : DATA[i].n + "<br>" + fr(DATA[i].v, 1) + " TWh · " + fr(100 * DATA[i].v / total, 1) + " %";
        const b = box.getBoundingClientRect();
        tip.style.left = (e.clientX - b.left) + "px";
        tip.style.top = (e.clientY - b.top) + "px";
        tip.hidden = false;
        r.style.opacity = "0.85";
      };
      r.addEventListener("pointermove", show);
      r.addEventListener("pointerdown", show);
      r.addEventListener("pointerleave", () => { tip.hidden = true; r.style.opacity = ""; });
    });
  })();

  /* =================================================================
     Animation 4.1 — Aimant et bobine
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-induction");
    if (!cv) return;
    const st = { N: 5, speed: 4, flip: false, mx: null, phase: 0, phi: 0, emf: 0, emfS: 0, drag: false };
    const L = 110;
    function geo(A) { return { cx: A.W * 0.64, cy: A.H * 0.6, gx: A.W * 0.64, gy: A.H * 0.2, len: 200 }; }
    const flux = (A, mx) => { const { cx } = geo(A); const d = (mx - cx) / L; return (st.flip ? -1 : 1) / Math.pow(1 + d * d, 1.5); };
    function update(A, dt) {
      const g = geo(A);
      if (st.mx == null) st.mx = g.cx - 270;
      if (!st.drag && st.speed > 0) {
        st.phase += dt * st.speed * 0.6;
        st.mx = g.cx - 150 - 120 * Math.cos(st.phase);
      }
      const ph = flux(A, st.mx);
      const dphi = dt > 0 ? (ph - st.phi) / dt : 0;
      st.phi = ph;
      st.emf = -st.N * dphi;
      st.emfS += (st.emf - st.emfS) * Math.min(1, dt * 12);
      out();
    }
    function render(ctx, A, P) {
      const g = geo(A);
      if (st.mx == null) st.mx = g.cx - 270;
      const { cx, cy, gx, gy, len } = g;
      const left = cx - len / 2, right = cx + len / 2;
      /* fils vers le galvanomètre */
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(left, cy - 62); ctx.lineTo(left, gy); ctx.lineTo(gx - 46, gy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(right, cy - 62); ctx.lineTo(right, gy); ctx.lineTo(gx + 46, gy); ctx.stroke();
      /* sens du courant induit sur les fils */
      const e = st.emfS, mag = Math.min(1, Math.abs(e) / 16);
      if (mag > 0.06) {
        const s = e > 0 ? 1 : -1;
        const col = draw.alpha(P.accent, 0.4 + 0.6 * mag);
        draw.arrow(ctx, left, cy - 80 - s * 18 + (s > 0 ? 0 : 0), left, cy - 80 + s * 18, { color: col, width: 3, head: 10 });
        draw.arrow(ctx, right, cy - 80 + s * 18, right, cy - 80 - s * 18, { color: col, width: 3, head: 10 });
      }
      /* bobine : spires derrière */
      const n = st.N, rx = 16, ry = 62;
      ctx.lineWidth = 3;
      for (let k = 0; k < n; k++) {
        const x = left + (k + 0.5) * len / n;
        ctx.strokeStyle = draw.alpha(P.wirePhase, 0.45);
        ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
      }
      /* aimant */
      const mw = 180, mh = 44, mx = st.mx;
      const lc = st.flip ? P.plus : P.metal, rc = st.flip ? P.metal : P.plus;
      ctx.fillStyle = lc; ctx.fillRect(mx - mw / 2, cy - mh / 2, mw / 2, mh);
      ctx.fillStyle = rc; ctx.fillRect(mx, cy - mh / 2, mw / 2, mh);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.strokeRect(mx - mw / 2, cy - mh / 2, mw, mh);
      draw.text(ctx, A, st.flip ? "N" : "S", mx - mw / 4, cy, { size: 20, weight: 700, color: "#ffffff", align: "center" });
      draw.text(ctx, A, st.flip ? "S" : "N", mx + mw / 4, cy, { size: 20, weight: 700, color: "#ffffff", align: "center" });
      /* bobine : spires devant */
      for (let k = 0; k < n; k++) {
        const x = left + (k + 0.5) * len / n;
        ctx.strokeStyle = P.wirePhase;
        ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      }
      ctx.strokeStyle = P.wirePhase; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(left + 0.5 * len / n, cy - ry); ctx.lineTo(left, cy - ry); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(right - 0.5 * len / n, cy - ry); ctx.lineTo(right, cy - ry); ctx.stroke();
      /* pôle induit (Lenz) */
      if (mag > 0.06) {
        const dphiPos = st.emfS < 0; /* emf = -N dΦ/dt */
        const pole = dphiPos ? "N" : "S";
        const other = dphiPos ? "S" : "N";
        draw.text(ctx, A, pole, left - 22, cy + ry + 12, { size: 18, weight: 700, color: P.accent, align: "center" });
        draw.text(ctx, A, other, right + 22, cy + ry + 12, { size: 18, weight: 700, color: P.accent, align: "center" });
        draw.text(ctx, A, "pôles créés par la bobine", cx, cy + ry + 34, { size: 12, color: P.ink3, align: "center" });
      }
      /* galvanomètre */
      ctx.fillStyle = P.card; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy + 6, 46, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
      for (let k = -4; k <= 4; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 12;
        ctx.beginPath(); ctx.moveTo(gx + Math.cos(a) * 36, gy + 6 + Math.sin(a) * 36); ctx.lineTo(gx + Math.cos(a) * 42, gy + 6 + Math.sin(a) * 42); ctx.stroke();
      }
      const ang = -Math.PI / 2 + Math.max(-1, Math.min(1, st.emfS / 16)) * Math.PI / 3;
      ctx.strokeStyle = P.plus; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(gx, gy + 6); ctx.lineTo(gx + Math.cos(ang) * 40, gy + 6 + Math.sin(ang) * 40); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy + 6, 4, 0, Math.PI * 2); ctx.fillStyle = P.ink; ctx.fill();
      draw.text(ctx, A, "galvanomètre", gx + 56, gy - 18, { size: 12, color: P.ink3 });
      draw.text(ctx, A, "0", gx, gy - 46, { size: 11, color: P.ink3, align: "center" });
      if (st.speed === 0 && !st.drag) draw.text(ctx, A, "← fais glisser l'aimant →", mx, cy + 48, { size: 13, color: P.ink3, align: "center" });
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("ind-play"));
    let lastOut = 0;
    function out() {
      const now = performance.now();
      if (now - lastOut < 120) return;
      lastOut = now;
      document.getElementById("ind-read").innerHTML =
        "<span>Tension induite : <b>" + fr(st.emfS * 0.5, 1) + " mV</b></span>" +
        "<span>" + (Math.abs(st.emfS) < 1 ? "flux constant : rien n'est induit" : (st.emfS < 0 ? "le flux augmente" : "le flux diminue") + " : la bobine s'oppose au mouvement") + "</span>";
    }
    range("ind-n", (v) => String(v * 20), (v) => { st.N = v; A.redraw(); });
    range("ind-v", (v) => (v === 0 ? "manuel" : String(v)), (v) => { st.speed = v; if (v > 0) A.play(); });
    document.getElementById("ind-flip").addEventListener("click", () => { st.flip = !st.flip; st.phi = flux(A, st.mx); A.redraw(); });
    cv.addEventListener("pointerdown", (e) => {
      const p = A.pos(e), { cy } = geo(A);
      if (Math.abs(p.x - st.mx) < 100 && Math.abs(p.y - cy) < 40) { st.drag = true; st.dx = p.x - st.mx; cv.setPointerCapture(e.pointerId); A.play(); }
    });
    cv.addEventListener("pointermove", (e) => { if (st.drag) { const p = A.pos(e); st.mx = Math.max(100, Math.min(A.W - 100, p.x - st.dx)); } });
    const end = () => { if (st.drag) { st.drag = false; if (st.speed > 0) st.phase = Math.acos(Math.max(-1, Math.min(1, (geo(A).cx - 150 - st.mx) / 120))); } };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
  })();

  /* =================================================================
     Animation 4.2 — Alternateur et oscilloscope
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-alt");
    if (!cv) return;
    const st = { n: 3000, p: 1, t: 0, theta: 0 };
    const SLOW = 50, WIN = 0.06;
    function update(A, dt) {
      const tr = dt / SLOW;
      st.t += tr;
      st.theta += 2 * Math.PI * st.n / 60 * tr;
    }
    function render(ctx, A, P) {
      const tall = A.H > A.W * 0.9;
      const mc = tall ? { x: A.W / 2, y: A.H * 0.25, r: Math.min(A.W, A.H) * 0.17 } : { x: A.W * 0.24, y: A.H / 2 + 8, r: A.H * 0.26 };
      const sc = tall ? { x: 60, y: A.H * 0.52, w: A.W - 90, h: A.H * 0.4 } : { x: A.W * 0.5, y: 40, w: A.W * 0.46, h: A.H - 90 };
      /* stator */
      ctx.strokeStyle = P.metal; ctx.lineWidth = mc.r * 0.28;
      ctx.beginPath(); ctx.arc(mc.x, mc.y, mc.r * 1.45, 0, Math.PI * 2); ctx.stroke();
      /* bobine du stator (en haut) */
      const by = mc.y - mc.r * 1.45;
      ctx.fillStyle = P.wirePhase;
      draw.roundRect(ctx, mc.x - mc.r * 0.42, by - mc.r * 0.2, mc.r * 0.84, mc.r * 0.4, 6); ctx.fill();
      ctx.strokeStyle = draw.alpha(P.card, 0.6); ctx.lineWidth = 1.5;
      for (let k = 1; k < 6; k++) { const x = mc.x - mc.r * 0.42 + k * mc.r * 0.14; ctx.beginPath(); ctx.moveTo(x, by - mc.r * 0.2); ctx.lineTo(x, by + mc.r * 0.2); ctx.stroke(); }
      draw.text(ctx, A, "bobine (stator)", mc.x + mc.r * 0.55, by - mc.r * 0.32, { size: 12, color: P.ink3 });
      /* rotor : 2p secteurs */
      const np = 2 * st.p;
      for (let k = 0; k < np; k++) {
        const a0 = st.theta + k * 2 * Math.PI / np - Math.PI / 2 - Math.PI / np, a1 = a0 + 2 * Math.PI / np;
        ctx.beginPath(); ctx.moveTo(mc.x, mc.y); ctx.arc(mc.x, mc.y, mc.r, a0, a1); ctx.closePath();
        ctx.fillStyle = k % 2 ? P.metal : P.plus; ctx.fill();
        ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
        const am = (a0 + a1) / 2;
        draw.text(ctx, A, k % 2 ? "S" : "N", mc.x + Math.cos(am) * mc.r * 0.66, mc.y + Math.sin(am) * mc.r * 0.66, { size: st.p > 2 ? 12 : 18, weight: 700, color: "#ffffff", align: "center" });
      }
      ctx.beginPath(); ctx.arc(mc.x, mc.y, mc.r * 0.12, 0, Math.PI * 2); ctx.fillStyle = P.ink; ctx.fill();
      draw.text(ctx, A, "rotor", mc.x, mc.y + mc.r * 1.45 + mc.r * 0.32, { size: 12, color: P.ink3, align: "center" });
      /* oscilloscope */
      const umax = 3600 / 3000;
      ctx.fillStyle = draw.alpha(P.ink, 0.04); ctx.fillRect(sc.x, sc.y, sc.w, sc.h);
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
      for (let k = 0; k <= 6; k++) { const x = sc.x + k * sc.w / 6; ctx.beginPath(); ctx.moveTo(x, sc.y); ctx.lineTo(x, sc.y + sc.h); ctx.stroke(); }
      for (let k = 0; k <= 4; k++) { const y = sc.y + k * sc.h / 4; ctx.beginPath(); ctx.moveTo(sc.x, y); ctx.lineTo(sc.x + sc.w, y); ctx.stroke(); }
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sc.x, sc.y + sc.h / 2); ctx.lineTo(sc.x + sc.w, sc.y + sc.h / 2); ctx.stroke();
      const amp = st.n / 3000;
      const w = 2 * Math.PI * st.n / 60 * st.p;
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let k = 0; k <= 400; k++) {
        const tt = st.t - WIN + k / 400 * WIN;
        const u = amp * Math.sin(w * tt + st.p * (st.theta - 2 * Math.PI * st.n / 60 * st.t));
        const x = sc.x + k / 400 * sc.w, y = sc.y + sc.h / 2 - u / umax * sc.h * 0.46;
        if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      draw.text(ctx, A, "u(t)", sc.x + 6, sc.y + 14, { size: 13, color: P.accent, weight: 600 });
      draw.text(ctx, A, "10 ms / division", sc.x + sc.w, sc.y + sc.h + 16, { size: 11, color: P.ink3, align: "right" });
      draw.text(ctx, A, "maintenant", sc.x + sc.w, sc.y - 10, { size: 11, color: P.ink3, align: "right" });
      /* liaison */
      ctx.strokeStyle = draw.alpha(P.wirePhase, 0.6); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath();
      if (tall) { ctx.moveTo(mc.x + mc.r * 0.42, by); ctx.lineTo(A.W - 30, by); ctx.lineTo(A.W - 30, sc.y); }
      else { ctx.moveTo(mc.x + mc.r * 0.42, by); ctx.lineTo(sc.x - 20, by); ctx.lineTo(sc.x - 20, sc.y + sc.h / 2); ctx.lineTo(sc.x, sc.y + sc.h / 2); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("alt-play"));
    function out() {
      const f = st.p * st.n / 60;
      document.getElementById("alt-read").innerHTML =
        "<span>n = <b>" + fr(st.n, 0) + " tr/min = " + fr(st.n / 60, 1) + " tr/s</b></span>" +
        "<span>f = p·n = <b>" + fr(f, 1) + " Hz</b></span>" +
        "<span>période T = <b>" + (f > 0 ? fr(1000 / f, 1) + " ms" : "—") + "</b></span>" +
        (Math.abs(f - 50) < 0.6 ? "<span><b>50 Hz : prêt pour le réseau !</b></span>" : "");
      A.redraw();
    }
    range("alt-n", (v) => fr(v, 0) + " tr/min", (v) => { st.n = v; out(); });
    choice("alt-p", (v) => { st.p = Number(v); out(); });
  })();

  /* =================================================================
     Animation 4.3 — Dimensionner une centrale hydraulique
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-hydro");
    if (!cv) return;
    const hOf = (v) => 2 * Math.pow(1000, v / 100), vOfH = (h) => 100 * Math.log10(h / 2) / 3;
    const qOf = (v) => Math.pow(1600, v / 100), vOfQ = (q) => 100 * Math.log10(q) / Math.log10(1600);
    const st = { h: hOf(50), q: qOf(50), drops: [], rot: 0, acc: 0 };
    const turbine = () => (st.h < 25 ? "Kaplan" : st.h > 600 || (st.h > 250 && st.q < 40) ? "Pelton" : "Francis");
    function geo(A) {
      const ground = A.H - 40;
      const top = ground - (ground - 60) * (Math.log10(st.h / 2) / 3) - 20;
      return { ground, top, lakeX0: 30, lakeX1: A.W * 0.3, ph: { x: A.W * 0.7, y: ground - 70, w: A.W * 0.24, h: 70 } };
    }
    function update(A, dt) {
      const g = geo(A);
      const v = 60 + 40 * Math.log10(st.h);
      st.acc += dt * (4 + 3 * Math.log10(st.q));
      while (st.acc > 1) { st.acc -= 1; st.drops.push({ s: 0, o: Math.random() - 0.5 }); }
      const L = Math.hypot(g.ph.x - g.lakeX1, g.ph.y + 35 - g.top);
      st.drops.forEach((d) => (d.s += v * dt / L));
      st.drops = st.drops.filter((d) => d.s < 1);
      st.rot += dt * (1 + Math.log10(st.h)) * 2.2;
    }
    function render(ctx, A, P) {
      const g = geo(A);
      const x2 = g.ph.x, y2 = g.ph.y + 35;
      /* montagne */
      ctx.fillStyle = P.rule2;
      ctx.beginPath(); ctx.moveTo(0, g.ground); ctx.lineTo(0, g.top - 30); ctx.lineTo(g.lakeX1 + 30, g.top - 50); ctx.lineTo(x2 - 10, g.ground); ctx.closePath(); ctx.fill();
      ctx.fillRect(0, g.ground, A.W, A.H - g.ground);
      /* lac */
      ctx.fillStyle = draw.alpha(P.water, 0.55);
      ctx.fillRect(g.lakeX0, g.top - 26, g.lakeX1 - g.lakeX0, 26);
      ctx.fillStyle = P.metal; ctx.fillRect(g.lakeX1, g.top - 40, 14, 44);
      /* conduite */
      const thick = 4 + 5 * Math.log10(st.q);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = thick + 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(g.lakeX1 + 7, g.top); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = draw.alpha(P.water, 0.35); ctx.lineWidth = thick;
      ctx.beginPath(); ctx.moveTo(g.lakeX1 + 7, g.top); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = P.water;
      st.drops.forEach((d) => {
        const x = g.lakeX1 + 7 + (x2 - g.lakeX1 - 7) * d.s, y = g.top + (y2 - g.top) * d.s;
        ctx.beginPath(); ctx.arc(x + d.o * thick * 0.5, y, Math.max(2, thick * 0.22), 0, Math.PI * 2); ctx.fill();
      });
      /* cote h */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(g.lakeX0, g.top); ctx.lineTo(A.W - 20, g.top); ctx.moveTo(x2, y2); ctx.lineTo(A.W - 20, y2); ctx.stroke(); ctx.setLineDash([]);
      draw.arrow(ctx, A.W - 30, y2, A.W - 30, g.top, { color: P.ink2, width: 1.5, head: 8 });
      draw.arrow(ctx, A.W - 30, g.top, A.W - 30, y2, { color: P.ink2, width: 1.5, head: 8 });
      draw.text(ctx, A, "h = " + fr(st.h, st.h < 10 ? 1 : 0) + " m", A.W - 38, (g.top + y2) / 2, { size: 14, color: P.ink, align: "right", weight: 600 });
      /* centrale */
      ctx.fillStyle = P.card; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.fillRect(g.ph.x, g.ph.y, g.ph.w, g.ph.h); ctx.strokeRect(g.ph.x, g.ph.y, g.ph.w, g.ph.h);
      const tx = g.ph.x + 40, ty = g.ph.y + 35;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(st.rot);
      ctx.strokeStyle = P.accent; ctx.lineWidth = 3;
      const nb = turbine() === "Pelton" ? 10 : turbine() === "Kaplan" ? 4 : 7;
      for (let k = 0; k < nb; k++) { const a = k * 2 * Math.PI / nb; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(tx, ty, 24, 0, Math.PI * 2); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = P.accentSoft; ctx.strokeStyle = P.accent; ctx.lineWidth = 2;
      ctx.fillRect(tx + 40, ty - 16, 40, 32); ctx.strokeRect(tx + 40, ty - 16, 40, 32);
      draw.text(ctx, A, "G", tx + 60, ty, { size: 14, weight: 700, color: P.accent, align: "center" });
      draw.text(ctx, A, "turbine " + turbine(), g.ph.x + g.ph.w / 2, g.ph.y - 14, { size: 14, weight: 600, color: P.ink, align: "center" });
      /* rivière */
      ctx.fillStyle = draw.alpha(P.water, 0.5); ctx.fillRect(g.ph.x - 10, g.ground, A.W - g.ph.x + 10, 8);
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    function out() {
      const P = 0.9 * 1000 * 9.81 * st.q * st.h;
      const v = Math.sqrt(2 * 9.81 * st.h);
      const E = P * 4000 / 1000; /* kWh pour 4000 h */
      document.getElementById("hy-read").innerHTML =
        "<span>P = ηρgQh = <b>" + si(P, "W", 3) + "</b></span>" +
        "<span>turbine adaptée : <b>" + turbine() + "</b></span>" +
        "<span>vitesse de l'eau en bas (sans frottement) : <b>" + fr(v, 0) + " m/s = " + fr(v * 3.6, 0) + " km/h</b></span>" +
        "<span>4000 h/an : <b>" + si(E * 1000, "Wh", 3) + ", la consommation d'environ " + fr(E / 4500 >= 1000 ? Math.round(E / 4500 / 100) * 100 : Math.round(E / 4500), 0) + " ménages</b></span>";
      A.redraw();
    }
    const rh = range("hy-h", () => fr(st.h, st.h < 10 ? 1 : 0) + " m", (v) => { st.h = hOf(v); out(); });
    const rq = range("hy-q", () => fr(st.q, st.q < 10 ? 1 : 0) + " m³/s", (v) => { st.q = qOf(v); out(); });
    document.querySelectorAll("#hy-preset button").forEach((b) => b.addEventListener("click", () => {
      rh.set(vOfH(parseFloat(b.dataset.h))); rq.set(vOfQ(parseFloat(b.dataset.q)));
      st.h = parseFloat(b.dataset.h); st.q = parseFloat(b.dataset.q); out();
      document.querySelector('output[for="hy-h"]').textContent = fr(st.h, st.h < 10 ? 1 : 0) + " m";
      document.querySelector('output[for="hy-q"]').textContent = fr(st.q, 0) + " m³/s";
    }));
  })();

  /* =================================================================
     Animation 4.4 — Une journée sur le réseau (modèle simplifié)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-day");
    if (!cv) return;
    const st = { season: "hiver", pv: 9.5, cloud: 0.4, nuc: 1, cursor: null, playT: 0, res: null };
    const SER = [
      { k: "nuc", n: "Nucléaire", c: "sNuc" },
      { k: "fil", n: "Fil de l'eau", c: "sFil" },
      { k: "aut", n: "Autres", c: "sAut" },
      { k: "pv", n: "Solaire", c: "sPv" },
      { k: "acc", n: "Barrages", c: "sAcc" },
      { k: "imp", n: "Import", c: "sImp" }
    ];
    const leg = document.getElementById("day-legend");
    leg.innerHTML = SER.map((s) => '<span><i style="background:var(--s-' + s.k + ')"></i>' + s.n + "</span>").join("") +
      '<span><i style="background:repeating-linear-gradient(45deg,var(--s-acc) 0 3px,var(--card) 3px 6px)"></i>Pompage</span>' +
      '<span><i style="background:repeating-linear-gradient(45deg,var(--s-imp) 0 3px,var(--card) 3px 6px)"></i>Export</span>' +
      '<span><i style="background:var(--ink);height:3px;border-radius:0"></i>Consommation</span>';

    const sig = (x) => 1 / (1 + Math.exp(-x));
    const gau = (t, m, s) => Math.exp(-0.5 * Math.pow((t - m) / s, 2));
    function model() {
      const w = st.season === "hiver";
      const N = 96, dt = 0.25;
      const base = w ? 8.6 : 6.6;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t = i * dt;
        const d = 0.78 + 0.22 * sig((t - 6.5) / 0.7) * sig((22.5 - t) / 0.8) + 0.05 * gau(t, 11.5, 1.6) + (w ? 0.1 : 0.03) * gau(t, 18.5, 1.4);
        const C = base * d;
        const nuc = st.nuc ? (w ? 2.95 : 2.6) : 0;
        const fil = w ? 1.5 : 3.6;
        const aut = w ? 0.45 : 0.35;
        const sr = w ? 8.1 : 5.9, L = w ? 8.6 : 15.2, k = w ? 0.25 : 0.68;
        const sun = t > sr && t < sr + L ? Math.pow(Math.sin(Math.PI * (t - sr) / L), 1.3) : 0;
        const pv = st.pv * k * (1 - 0.8 * st.cloud) * sun;
        pts.push({ t, C, nuc, fil, aut, pv });
      }
      /* barrages : budget d'énergie, écrêtage des pointes */
      const budget = w ? 60 : 30, Dmax = 8;
      pts.forEach((p) => { p.def = p.C - (p.nuc + p.fil + p.aut + p.pv); });
      const cover = (lam) => pts.reduce((s, p, i) => s + (i < N ? Math.max(0, Math.min(Dmax, Math.max(0, p.def) - lam)) * dt : 0), 0);
      let lam = 0;
      if (cover(0) > budget) {
        let lo = 0, hi = 15;
        for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (cover(m) > budget) lo = m; else hi = m; }
        lam = hi;
      }
      const tot = { C: 0, pv: 0, acc: 0, imp: 0, pump: 0, exp: 0, short: 0 };
      pts.forEach((p, i) => {
        if (p.def > 0) {
          p.acc = Math.max(0, Math.min(Dmax, p.def - lam));
          const rest = p.def - p.acc;
          p.imp = Math.min(7, rest); p.short = rest - p.imp; p.pump = 0; p.exp = 0;
        } else {
          const sur = -p.def;
          p.acc = 0; p.imp = 0; p.short = 0;
          p.pump = Math.min(4, sur); p.exp = sur - p.pump;
        }
        if (i < N) { tot.C += p.C * dt; tot.pv += p.pv * dt; tot.acc += p.acc * dt; tot.imp += p.imp * dt; tot.pump += p.pump * dt; tot.exp += p.exp * dt; tot.short += p.short * dt; }
      });
      st.res = { pts, tot };
      return st.res;
    }
    function scales(A) {
      const { pts } = st.res;
      const m = { l: 52, r: 16, t: 16, b: 36 };
      let ymax = 0, ymin = 0;
      pts.forEach((p) => { ymax = Math.max(ymax, p.nuc + p.fil + p.aut + p.pv + p.acc + p.imp, p.C); ymin = Math.min(ymin, -(p.pump + p.exp)); });
      ymax = Math.ceil(ymax / 2) * 2 + 1; ymin = Math.floor(ymin / 2) * 2;
      const X = (t) => m.l + t / 24 * (A.W - m.l - m.r);
      const Y = (v) => m.t + (ymax - v) / (ymax - ymin) * (A.H - m.t - m.b);
      return { m, X, Y, ymax, ymin };
    }
    function band(ctx, pts, X, Y, lo, hi, fill) {
      ctx.beginPath();
      pts.forEach((p, i) => { const x = X(p.t), y = Y(hi(p)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(X(pts[i].t), Y(lo(pts[i])));
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = cssVar("--card"); ctx.lineWidth = 1; ctx.stroke();
    }
    function hatch(ctx, base, P) {
      const c = document.createElement("canvas"); c.width = c.height = 8;
      const x = c.getContext("2d");
      x.fillStyle = P.card; x.fillRect(0, 0, 8, 8);
      x.strokeStyle = base; x.lineWidth = 3;
      x.beginPath(); x.moveTo(-2, 10); x.lineTo(10, -2); x.stroke();
      x.beginPath(); x.moveTo(6, 10); x.lineTo(10, 6); x.stroke();
      x.beginPath(); x.moveTo(-2, 2); x.lineTo(2, -2); x.stroke();
      return ctx.createPattern(c, "repeat");
    }
    function render(ctx, A, P) {
      if (!st.res) model();
      const { pts } = st.res;
      const { m, X, Y, ymax, ymin } = scales(A);
      /* grille */
      ctx.strokeStyle = P.rule2; ctx.lineWidth = 1;
      for (let v = ymin; v <= ymax; v += 2) { ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(A.W - m.r, Y(v)); ctx.stroke(); draw.text(ctx, A, v + "", m.l - 8, Y(v), { size: 11, color: P.ink3, align: "right" }); }
      for (let h = 0; h <= 24; h += 3) draw.text(ctx, A, h + "h", X(h), A.H - m.b + 16, { size: 11, color: P.ink3, align: "center" });
      draw.text(ctx, A, "GW", m.l - 8, m.t - 4, { size: 11, color: P.ink3, align: "right", baseline: "bottom" });
      /* bandes empilées */
      let acc = () => 0;
      const keys = ["nuc", "fil", "aut", "pv", "acc", "imp"];
      const cols = { nuc: P.sNuc, fil: P.sFil, aut: P.sAut, pv: P.sPv, acc: P.sAcc, imp: P.sImp };
      keys.forEach((k) => {
        const lo = acc;
        const hi = ((l) => (p) => l(p) + p[k])(lo);
        band(ctx, pts, X, Y, lo, hi, cols[k]);
        acc = hi;
      });
      /* négatifs : pompage puis export */
      band(ctx, pts, X, Y, () => 0, (p) => -p.pump, hatch(ctx, P.sAcc, P));
      band(ctx, pts, X, Y, (p) => -p.pump, (p) => -p.pump - p.exp, hatch(ctx, P.sImp, P));
      /* pénurie */
      if (st.res.tot.short > 0.01) band(ctx, pts, X, Y, (p) => p.C - p.short, (p) => p.C, draw.alpha(P.plus, 0.5));
      /* zéro */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.l, Y(0)); ctx.lineTo(A.W - m.r, Y(0)); ctx.stroke();
      /* consommation */
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.C)) : ctx.moveTo(X(p.t), Y(p.C))));
      ctx.stroke();
      /* curseur */
      if (st.cursor != null) {
        const i = Math.round(st.cursor * 4), p = pts[Math.max(0, Math.min(96, i))];
        const x = X(p.t);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, m.t); ctx.lineTo(x, A.H - m.b); ctx.stroke(); ctx.setLineDash([]);
        const lines = [
          fr(p.t, 2).replace(",00", "") + " h — conso " + fr(p.C, 1) + " GW",
          "nucl. " + fr(p.nuc, 1) + " · fil " + fr(p.fil, 1) + " · autres " + fr(p.aut, 1),
          "solaire " + fr(p.pv, 1) + " · barrages " + fr(p.acc, 1) + " · import " + fr(p.imp, 1),
          "pompage " + fr(p.pump, 1) + " · export " + fr(p.exp, 1)
        ];
        const fs = draw.fs(A, 12.5), lh = fs * 1.4, wbox = Math.max(...lines.map((l) => l.length)) * fs * 0.6 + 16, hbox = lines.length * lh + 12;
        let bx = x + 12; if (bx + wbox > A.W - 4) bx = x - 12 - wbox;
        ctx.fillStyle = draw.alpha(P.ink, 0.92); draw.roundRect(ctx, bx, m.t + 4, wbox, hbox, 6); ctx.fill();
        lines.forEach((l, k) => draw.text(ctx, A, l, bx + 8, m.t + 10 + lh / 2 + k * lh, { size: 12.5, color: P.card, family: "mono" }));
      }
    }
    function update(A, dt) {
      st.playT = (st.playT + dt * 2) % 24;
      st.cursor = st.playT;
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    A.bindPlay(document.getElementById("day-play"));
    function out() {
      model();
      const t = st.res.tot;
      document.getElementById("day-read").innerHTML =
        "<span>Consommation : <b>" + fr(t.C, 0) + " GWh</b></span>" +
        "<span>Solaire : <b>" + fr(t.pv, 0) + " GWh</b></span>" +
        "<span>Barrages : <b>" + fr(t.acc, 0) + " GWh</b></span>" +
        "<span>Import : <b>" + fr(t.imp, 0) + " GWh</b></span>" +
        "<span>Pompage : <b>" + fr(t.pump, 0) + " GWh</b></span>" +
        "<span>Export : <b>" + fr(t.exp, 0) + " GWh</b></span>" +
        (t.short > 0.01 ? '<span class="warn">Pénurie : ' + fr(t.short, 0) + " GWh non couverts (import plafonné à 7 GW)</span>" : "");
      A.redraw();
    }
    choice("day-season", (v) => { st.season = v; out(); });
    choice("day-nuc", (v) => { st.nuc = Number(v); out(); });
    range("day-pv", (v) => fr(v, 1) + " GW", (v) => { st.pv = v; out(); });
    range("day-cloud", (v) => fr(v, 0) + " %", (v) => { st.cloud = v / 100; out(); });
    cv.addEventListener("pointermove", (e) => {
      if (A.wantPlay || !st.res) return;
      const p = A.pos(e), { m } = scales(A);
      const t = (p.x - m.l) / (A.W - m.l - m.r) * 24;
      st.cursor = t >= 0 && t <= 24 ? t : null;
      A.redraw();
    });
    cv.addEventListener("pointerleave", () => { if (!A.wantPlay) { st.cursor = null; A.redraw(); } });
  })();

  /* =================================================================
     Animation 4.5 — Transport : pourquoi la très haute tension ?
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-transport");
    if (!cv) return;
    const RL = 5, UG = 20;
    const st = { U: 380, P: 500, off: 0 };
    const calc = () => {
      const I = st.P * 1e6 / (st.U * 1e3);
      const loss = RL * I * I;
      return { I, loss, frac: loss / (st.P * 1e6) };
    };
    function update(A, dt) { const { I } = calc(); st.off += Math.min(600, I / 12) * dt; }
    function coil(ctx, x, y, n, h, col) {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5;
      const step = h / n;
      ctx.beginPath();
      for (let k = 0; k < n; k++) ctx.arc(x, y - h / 2 + step * (k + 0.5), step / 2, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();
    }
    function render(ctx, A, P) {
      const { I, frac } = calc();
      const tall = A.H > A.W * 0.6;
      const yA = tall ? A.H * 0.42 : A.H * 0.42, yB = yA + 26;
      const xT1 = 190, xT2 = A.W - 190;
      /* centrale */
      ctx.fillStyle = P.card; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.fillRect(20, yA - 40, 90, 106); ctx.strokeRect(20, yA - 40, 90, 106);
      draw.text(ctx, A, "centrale", 65, yA - 54, { size: 13, color: P.ink2, align: "center" });
      draw.text(ctx, A, "G", 65, yA + 8, { size: 22, weight: 700, color: P.accent, align: "center" });
      draw.text(ctx, A, UG + " kV", 65, yA + 40, { size: 12, color: P.ink3, align: "center", family: "mono" });
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(110, yA); ctx.lineTo(xT1 - 30, yA); ctx.moveTo(110, yB); ctx.lineTo(xT1 - 30, yB); ctx.stroke();
      /* transformateurs */
      const ratio = st.U / UG;
      const n1 = 3, n2 = Math.min(14, Math.max(3, Math.round(3 * Math.sqrt(ratio))));
      [[xT1, n1, n2], [xT2, n2, n1]].forEach(([x, a, b]) => {
        ctx.fillStyle = draw.alpha(P.metal, 0.35); ctx.fillRect(x - 20, yA - 46, 40, 118);
        coil(ctx, x - 30, yA + 13, a, 80, P.wirePhase);
        ctx.save(); ctx.translate(x + 30, yA + 13); ctx.scale(-1, 1); coil(ctx, 0, 0, b, 80, P.wirePhase); ctx.restore();
      });
      draw.text(ctx, A, "élévateur", xT1, yA - 60, { size: 12, color: P.ink2, align: "center" });
      draw.text(ctx, A, "abaisseur", xT2, yA - 60, { size: 12, color: P.ink2, align: "center" });
      draw.text(ctx, A, "×" + fr(ratio, ratio < 10 ? 1 : 0), xT1, yA + 90, { size: 12, color: P.ink3, align: "center", family: "mono" });
      /* ligne */
      const x0 = xT1 + 30, x1 = xT2 - 30;
      const hot = Math.min(1, frac * 3);
      const lineCol = draw.mix(P.ink, P.plus, hot);
      if (hot > 0.05) {
        ctx.strokeStyle = draw.alpha(P.plus, 0.25 * hot); ctx.lineWidth = 16;
        ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x1, yA); ctx.moveTo(x0, yB); ctx.lineTo(x1, yB); ctx.stroke();
      }
      ctx.strokeStyle = lineCol; ctx.lineWidth = 2.5 + 2 * hot;
      ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x1, yA); ctx.moveTo(x0, yB); ctx.lineTo(x1, yB); ctx.stroke();
      /* pylônes */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
      for (let k = 1; k <= 3; k++) {
        const x = x0 + (x1 - x0) * k / 4;
        ctx.beginPath(); ctx.moveTo(x - 16, yB + 70); ctx.lineTo(x, yA - 22); ctx.lineTo(x + 16, yB + 70); ctx.moveTo(x - 20, yA - 6); ctx.lineTo(x + 20, yA - 6); ctx.stroke();
      }
      draw.text(ctx, A, "100 km · " + st.U + " kV", (x0 + x1) / 2, yA - 34, { size: 14, weight: 600, color: P.ink, align: "center" });
      /* points du courant */
      if (frac < 1) {
        ctx.fillStyle = P.accent;
        const sp = 30, o = st.off % sp;
        for (let x = x0 + o; x < x1; x += sp) { ctx.beginPath(); ctx.arc(x, yA, 3.5, 0, Math.PI * 2); ctx.fill(); }
        for (let x = x1 - o; x > x0; x -= sp) { ctx.beginPath(); ctx.arc(x, yB, 3.5, 0, Math.PI * 2); ctx.fill(); }
      }
      /* ville */
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xT2 + 30, yA); ctx.lineTo(A.W - 110, yA); ctx.moveTo(xT2 + 30, yB); ctx.lineTo(A.W - 110, yB); ctx.stroke();
      const bx = A.W - 110;
      ctx.fillStyle = P.card; ctx.strokeStyle = P.ink;
      [[0, 50, 26], [30, 80, 24], [58, 40, 30]].forEach(([dx, h, w]) => { ctx.fillRect(bx + dx, yB + 40 - h, w, h); ctx.strokeRect(bx + dx, yB + 40 - h, w, h); });
      const lit = frac < 1 ? Math.max(0.15, 1 - frac) : 0;
      ctx.fillStyle = draw.alpha(P.glow, lit);
      for (let k = 0; k < 6; k++) ctx.fillRect(bx + 36 + (k % 2) * 8, yB + 40 - 72 + Math.floor(k / 2) * 16, 5, 7);
      draw.text(ctx, A, "ville", bx + 44, yB + 56, { size: 12, color: P.ink3, align: "center" });
      if (frac >= 1) draw.text(ctx, A, "Impossible : les pertes dépasseraient la puissance envoyée.", A.W / 2, tall ? A.H - 30 : A.H - 22, { size: 14, weight: 600, color: P.plus, align: "center" });
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("tr-play"));
    function out() {
      const { I, loss, frac } = calc();
      document.getElementById("tr-read").innerHTML =
        "<span>Courant : <b>" + si(I, "A", 3) + "</b></span>" +
        "<span>Pertes R·I² : <b>" + (frac >= 1 ? "plus que la puissance envoyée" : si(loss, "W", 3) + " (" + fr(100 * frac, 1) + " %)") + "</b></span>" +
        "<span>Puissance arrivée : <b>" + (frac >= 1 ? "0" : si(st.P * 1e6 - loss, "W", 3)) + "</b></span>" +
        (I > 4000 ? '<span class="warn">Aucun câble aérien raisonnable ne supporte un tel courant.</span>' : "");
      A.redraw();
    }
    choice("tr-u", (v) => { st.U = Number(v); out(); });
    range("tr-p", (v) => fr(v, 0) + " MW", (v) => { st.P = v; out(); });
  })();
})();
