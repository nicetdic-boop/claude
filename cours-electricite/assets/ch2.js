/* Chapitre 2 — Électrodynamique : animations */
(function () {
  "use strict";
  const { anim, draw, fr, sci, si, range, choice } = window.Cours;
  const QE = 1.602e-19;

  /* =================================================================
     Animation 2.1 — Électrons dans un fil de cuivre
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-fil");
    if (!cv) return;
    const st = { I: 8, on: true, conv: true, front: -1, el: [], init: false };
    const N = 70, VTH = 230;

    function geo(A) {
      const h = Math.min(A.H * 0.5, 230);
      return { x0: 40, x1: A.W - 40, y0: A.H / 2 - h / 2, y1: A.H / 2 + h / 2 };
    }
    function init(A) {
      const g = geo(A);
      st.el = [];
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        st.el.push({ x: g.x0 + Math.random() * (g.x1 - g.x0), y: g.y0 + 8 + Math.random() * (g.y1 - g.y0 - 16), vx: Math.cos(a) * VTH, vy: Math.sin(a) * VTH, t: Math.random() * 0.2 });
      }
      st.init = true;
    }
    function update(A, dt) {
      if (!st.init) init(A);
      const g = geo(A);
      const vd = st.on ? st.I * 7 : 0;
      if (st.front >= 0) st.front += dt;
      const xf = st.front < 0 ? -1e9 : g.x1 - st.front * 2600;
      for (const e of st.el) {
        e.t -= dt;
        if (e.t <= 0) {
          const a = Math.random() * Math.PI * 2, s = VTH * (0.6 + Math.random() * 0.8);
          e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; e.t = 0.05 + Math.random() * 0.25;
        }
        const drift = st.on && e.x > xf ? vd : 0;
        e.x += (e.vx - drift) * dt;
        e.y += e.vy * dt;
        if (e.y < g.y0 + 6) { e.y = g.y0 + 6; e.vy = Math.abs(e.vy); }
        if (e.y > g.y1 - 6) { e.y = g.y1 - 6; e.vy = -Math.abs(e.vy); }
        if (e.x < g.x0) e.x += g.x1 - g.x0;
        if (e.x > g.x1) e.x -= g.x1 - g.x0;
      }
    }
    function render(ctx, A, P) {
      if (!st.init) init(A);
      const g = geo(A);
      /* gaine */
      ctx.fillStyle = draw.alpha(P.wirePhase, 0.12);
      draw.roundRect(ctx, g.x0 - 14, g.y0 - 14, g.x1 - g.x0 + 28, g.y1 - g.y0 + 28, 18); ctx.fill();
      ctx.fillStyle = draw.alpha(P.metal, 0.18);
      ctx.fillRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2; ctx.strokeRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0);
      /* réseau d'ions */
      ctx.fillStyle = draw.alpha(P.plus, 0.18);
      ctx.strokeStyle = draw.alpha(P.plus, 0.55); ctx.lineWidth = 1.4;
      for (let y = g.y0 + 22; y < g.y1 - 10; y += 38) for (let x = g.x0 + 24; x < g.x1 - 10; x += 40) {
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x + 3.5, y); ctx.moveTo(x, y - 3.5); ctx.lineTo(x, y + 3.5); ctx.stroke();
      }
      /* section */
      ctx.setLineDash([5, 5]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(A.W / 2, g.y0 - 10); ctx.lineTo(A.W / 2, g.y1 + 10); ctx.stroke(); ctx.setLineDash([]);
      /* front du champ */
      if (st.front >= 0) {
        const xf = g.x1 - st.front * 2600;
        if (xf > g.x0) { ctx.fillStyle = draw.alpha(P.signal, 0.25); ctx.fillRect(xf, g.y0, g.x1 - xf, g.y1 - g.y0); }
        else st.front = -1;
      }
      /* électrons */
      ctx.fillStyle = P.minus;
      for (const e of st.el) { ctx.beginPath(); ctx.arc(e.x, e.y, 4.5, 0, Math.PI * 2); ctx.fill(); }
      /* bornes */
      draw.text(ctx, A, "+", g.x0 - 26, A.H / 2, { size: 26, weight: 700, color: P.plus, align: "center" });
      draw.text(ctx, A, "−", g.x1 + 26, A.H / 2, { size: 26, weight: 700, color: P.minus, align: "center" });
      draw.text(ctx, A, "vers la borne +", g.x0, g.y1 + 30, { size: 12, color: P.ink3 });
      draw.text(ctx, A, "depuis la borne −", g.x1, g.y1 + 30, { size: 12, color: P.ink3, align: "right" });
      draw.text(ctx, A, "section", A.W / 2 + 6, g.y1 + 18, { size: 11, color: P.ink3 });
      /* flèches */
      if (st.on && st.I > 0) {
        if (st.conv) {
          draw.arrow(ctx, A.W / 2 - 110, g.y0 - 30, A.W / 2 + 110, g.y0 - 30, { color: P.ink, width: 3, head: 13 });
          draw.text(ctx, A, "I (sens conventionnel)", A.W / 2, g.y0 - 48, { size: 13, color: P.ink, align: "center", weight: 600 });
        }
        draw.arrow(ctx, A.W / 2 + 70, g.y1 + 44, A.W / 2 - 70, g.y1 + 44, { color: P.minus, width: 2, head: 10 });
        draw.text(ctx, A, "dérive des électrons", A.W / 2, g.y1 + 62, { size: 12, color: P.minus, align: "center" });
      } else {
        draw.text(ctx, A, "interrupteur ouvert : agitation thermique seulement", A.W / 2, g.y0 - 30, { size: 13, color: P.ink3, align: "center" });
      }
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("fil-play"));
    function out() {
      const n = 8.5e28, Asec = 1.5e-6;
      const I = st.on ? st.I : 0;
      const v = I / (n * QE * Asec);
      document.getElementById("fil-read").innerHTML =
        "<span>I = <b>" + fr(I, 1) + " A</b></span>" +
        "<span>électrons par seconde à travers la section : <b>" + (I ? sci(I / QE, 2) : "0") + "</b></span>" +
        "<span>vitesse de dérive réelle (cuivre 1,5 mm²) : <b>" + (I ? fr(v * 1000, 2) + " mm/s" : "0") + "</b></span>" +
        "<span>temps pour avancer d'1 m : <b>" + (I ? fr(1 / v / 60, 0) + " min" : "—") + "</b></span>";
      A.redraw();
    }
    range("fil-i", (v) => fr(v, 1) + " A", (v) => { st.I = v; out(); });
    const sw = document.getElementById("fil-switch");
    sw.addEventListener("click", () => {
      st.on = !st.on;
      sw.textContent = st.on ? "Ouvrir l'interrupteur" : "Fermer l'interrupteur";
      sw.setAttribute("aria-pressed", st.on ? "true" : "false");
      st.front = st.on ? 0 : -1;
      out(); A.play();
    });
    const cb = document.getElementById("fil-conv");
    cb.addEventListener("click", () => { st.conv = !st.conv; cb.setAttribute("aria-pressed", st.conv ? "true" : "false"); A.redraw(); });
  })();

  /* =================================================================
     Animation 2.2 — Caractéristique I(U)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-ui");
    if (!cv) return;
    const COMP = {
      R: { name: "Résistance 47 Ω", u: [-10, 10], i: [-0.25, 0.25], f: (U) => U / 47, ticksU: 5, ticksI: 0.1 },
      L: { name: "Lampe 12 V", u: [-12, 12], i: [-0.5, 0.5], f: (U) => Math.sign(U) * 0.42 * Math.pow(Math.abs(U) / 12, 0.55), ticksU: 4, ticksI: 0.2 },
      D: { name: "Diode", u: [-2, 0.8], i: [-0.1, 0.5], f: (U) => Math.min(5, 8.3e-8 * (Math.exp(U / 0.05) - 1)), ticksU: 0.5, ticksI: 0.1 }
    };
    const st = { c: "R", s: 50, sweep: false, phase: 0 };
    const U = () => { const c = COMP[st.c]; return c.u[0] + (st.s + 100) / 200 * (c.u[1] - c.u[0]); };

    function render(ctx, A, P) {
      const c = COMP[st.c];
      const m = { l: 70, r: 30, t: 30, b: 46 };
      const X = (u) => m.l + (u - c.u[0]) / (c.u[1] - c.u[0]) * (A.W - m.l - m.r);
      const Y = (i) => A.H - m.b - (i - c.i[0]) / (c.i[1] - c.i[0]) * (A.H - m.t - m.b);
      /* grille */
      ctx.strokeStyle = P.rule2; ctx.lineWidth = 1;
      for (let u = Math.ceil(c.u[0] / c.ticksU) * c.ticksU; u <= c.u[1] + 1e-9; u += c.ticksU) {
        ctx.beginPath(); ctx.moveTo(X(u), m.t); ctx.lineTo(X(u), A.H - m.b); ctx.stroke();
        draw.text(ctx, A, fr(u, c.ticksU < 1 ? 1 : 0), X(u), A.H - m.b + 16, { size: 11, color: P.ink3, align: "center" });
      }
      for (let i = Math.ceil(c.i[0] / c.ticksI - 1e-9) * c.ticksI; i <= c.i[1] + 1e-9; i += c.ticksI) {
        ctx.beginPath(); ctx.moveTo(m.l, Y(i)); ctx.lineTo(A.W - m.r, Y(i)); ctx.stroke();
        draw.text(ctx, A, fr(i, 1), m.l - 8, Y(i), { size: 11, color: P.ink3, align: "right" });
      }
      /* axes passant par l'origine */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(m.l, Y(0)); ctx.lineTo(A.W - m.r, Y(0)); ctx.moveTo(X(0), m.t); ctx.lineTo(X(0), A.H - m.b); ctx.stroke();
      draw.text(ctx, A, "U (V)", A.W - m.r, Y(0) - 12, { size: 12, color: P.ink2, align: "right" });
      draw.text(ctx, A, "I (A)", X(0) + 8, m.t + 4, { size: 12, color: P.ink2 });
      /* courbe */
      ctx.save();
      ctx.beginPath(); ctx.rect(m.l, m.t, A.W - m.l - m.r, A.H - m.t - m.b); ctx.clip();
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let k = 0; k <= 300; k++) {
        const u = c.u[0] + k / 300 * (c.u[1] - c.u[0]);
        const y = Y(c.f(u));
        if (k === 0) ctx.moveTo(X(u), y); else ctx.lineTo(X(u), y);
      }
      ctx.stroke();
      /* droite R = U/I (référence) */
      const u0 = U(), i0 = c.f(u0);
      if (Math.abs(i0) > 1e-4 && st.c !== "R") {
        const slope = i0 / u0;
        ctx.setLineDash([6, 6]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(c.u[0]), Y(slope * c.u[0])); ctx.lineTo(X(c.u[1]), Y(slope * c.u[1])); ctx.stroke(); ctx.setLineDash([]);
      }
      /* point courant */
      const px = X(u0), py = Y(Math.min(c.i[1], i0));
      ctx.setLineDash([3, 4]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px, py); ctx.lineTo(X(0), py); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill(); ctx.strokeStyle = P.card; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      /* icône du composant */
      const ix = m.l + 50, iy = m.t + 46;
      ctx.fillStyle = P.card; ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
      draw.roundRect(ctx, ix - 40, iy - 34, 80, 68, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ix - 34, iy); ctx.lineTo(ix - 18, iy); ctx.moveTo(ix + 18, iy); ctx.lineTo(ix + 34, iy); ctx.stroke();
      if (st.c === "R") { ctx.strokeRect(ix - 18, iy - 8, 36, 16); }
      if (st.c === "L") {
        const pw = Math.abs(u0 * i0) / 5;
        if (pw > 0.01) { const gl = ctx.createRadialGradient(ix, iy, 2, ix, iy, 34); gl.addColorStop(0, draw.alpha(P.glow, Math.min(1, pw))); gl.addColorStop(1, draw.alpha(P.glow, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ix, iy, 34, 0, Math.PI * 2); ctx.fill(); }
        ctx.beginPath(); ctx.arc(ix, iy, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix - 11, iy - 11); ctx.lineTo(ix + 11, iy + 11); ctx.moveTo(ix + 11, iy - 11); ctx.lineTo(ix - 11, iy + 11); ctx.stroke();
      }
      if (st.c === "D") {
        ctx.fillStyle = P.ink;
        ctx.beginPath(); ctx.moveTo(ix - 12, iy - 12); ctx.lineTo(ix + 10, iy); ctx.lineTo(ix - 12, iy + 12); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ix + 12, iy - 12); ctx.lineTo(ix + 12, iy + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix - 18, iy); ctx.lineTo(ix - 12, iy); ctx.moveTo(ix + 12, iy); ctx.lineTo(ix + 18, iy); ctx.stroke();
      }
    }
    function update(A, dt) {
      if (!st.sweep) return;
      st.phase += dt * 2 * Math.PI / 7;
      sl.set(Math.round(Math.sin(st.phase) * 100));
    }
    const A = anim(cv, { draw: render, update, autoplay: false });
    function out() {
      const c = COMP[st.c], u = U(), i = c.f(u);
      const R = Math.abs(i) > 1e-6 ? u / i : Infinity;
      document.getElementById("ui-read").innerHTML =
        "<span>U = <b>" + fr(u, 2) + " V</b></span>" +
        "<span>I = <b>" + si(i, "A", 3) + "</b></span>" +
        "<span>R = U/I : <b>" + (isFinite(R) ? si(R, "Ω", 3) : "très grande (pas de courant)") + "</b></span>" +
        "<span>P = UI : <b>" + si(Math.abs(u * i), "W", 3) + "</b></span>";
      A.redraw();
    }
    const sl = range("ui-u", () => fr(U(), 2) + " V", (v) => { st.s = v; out(); });
    choice("ui-comp", (v) => { st.c = v; sl.set(st.s); out(); });
    const sb = document.getElementById("ui-sweep");
    const setSweep = (on) => { st.sweep = on; sb.textContent = on ? "❚❚ Arrêter le balayage" : "▶ Balayer la tension"; sb.setAttribute("aria-pressed", on ? "true" : "false"); if (on) { st.phase = Math.asin(Math.max(-1, Math.min(1, st.s / 100))); A.play(); } else A.pause(); };
    sb.addEventListener("click", () => setSweep(!st.sweep));
    setSweep(false);
  })();

  /* =================================================================
     Animation 2.3 — Le compteur de la maison
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-compteur");
    if (!cv) return;
    const APP = [
      { n: "Éclairage LED (6 lampes)", p: 48, h: 5, on: true },
      { n: "Réfrigérateur (moyenne)", p: 30, h: 24, on: true },
      { n: "Ordinateur portable", p: 50, h: 4, on: true },
      { n: "Box internet + veilles", p: 25, h: 24, on: false },
      { n: "Télévision", p: 100, h: 3, on: false },
      { n: "Console de jeux", p: 150, h: 2, on: false },
      { n: "Bouilloire", p: 2200, h: 0.1, on: false },
      { n: "Four", p: 3500, h: 0.4, on: false },
      { n: "Lave-linge (moyenne d'un cycle)", p: 1000, h: 0.7, on: false },
      { n: "Sèche-cheveux", p: 1800, h: 0.1, on: false },
      { n: "Pompe à chaleur (hiver)", p: 2500, h: 8, on: false },
      { n: "Recharge voiture électrique (triphasé)", p: 11000, h: 0.5, on: false }
    ];
    const PRICE = 0.28, TF = 60, REV = 75;
    const st = { theta: 0, kwh: 4318.6 };
    const list = document.getElementById("cp-list");
    APP.forEach((a, i) => {
      const lab = document.createElement("label");
      lab.className = "cp-item";
      const dur = a.h >= 1 ? fr(a.h, 0) + " h/j" : fr(a.h * 60, 0) + " min/j";
      lab.innerHTML = '<input type="checkbox" id="cp-' + i + '"' + (a.on ? " checked" : "") + '><span>' + a.n + ' <small>' + dur + "</small></span><span class=\"num\">" + si(a.p, "W", 3) + "</span>";
      list.appendChild(lab);
      lab.querySelector("input").addEventListener("change", (e) => { a.on = e.target.checked; out(); });
    });
    const power = () => APP.reduce((s, a) => s + (a.on ? a.p : 0), 0);

    function update(A, dt) {
      const P = power();
      st.kwh += P * dt * TF / 3.6e6;
      const rps = Math.min(6, REV * P / 1000 * TF / 3600);
      st.theta += rps * 2 * Math.PI * dt;
    }
    function render(ctx, A, P) {
      const W = A.W, H = A.H;
      const bx = W * 0.14, by = H * 0.08, bw = W * 0.72, bh = H * 0.84;
      ctx.fillStyle = P.paper; ctx.strokeStyle = P.ink3; ctx.lineWidth = 2;
      draw.roundRect(ctx, bx, by, bw, bh, 18); ctx.fill(); ctx.stroke();
      /* compteur à rouleaux */
      const s = st.kwh.toFixed(1).padStart(7, "0").replace(".", "");
      const dw = bw * 0.1, dh = dw * 1.45, dx0 = bx + (bw - dw * 6.4) / 2, dy0 = by + bh * 0.12;
      for (let k = 0; k < 6; k++) {
        const x = dx0 + k * dw * 1.07;
        ctx.fillStyle = k === 5 ? P.plus : P.ink;
        ctx.fillRect(x, dy0, dw, dh);
        draw.text(ctx, A, s[k], x + dw / 2, dy0 + dh / 2 + 1, { size: dw * 0.78, color: "#ffffff", align: "center", family: "mono", weight: 500 });
      }
      draw.text(ctx, A, "kWh", dx0 + dw * 6.5, dy0 + dh / 2, { size: 16, color: P.ink2 });
      /* fenêtre du disque */
      const wy = by + bh * 0.52, wx = bx + bw * 0.12, ww = bw * 0.76, wh = bh * 0.14;
      ctx.fillStyle = P.card; ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5; ctx.strokeRect(wx, wy, ww, wh);
      const cx = wx + ww / 2, cy = wy + wh / 2, rx = ww * 0.46, ry = wh * 0.22;
      ctx.fillStyle = P.metal; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.stroke();
      /* repère rouge sur la tranche */
      const c = Math.cos(st.theta), sn = Math.sin(st.theta);
      if (c > -0.1) {
        ctx.fillStyle = P.plus;
        ctx.fillRect(cx + rx * sn - 5, cy - ry - 1, 10, ry * 2 + 2);
      }
      draw.text(ctx, A, REV + " tours = 1 kWh", cx, wy + wh + 22, { size: 14, color: P.ink2, align: "center" });
      draw.text(ctx, A, "230 V · 50 Hz", cx, wy + wh + 46, { size: 13, color: P.ink3, align: "center", family: "mono" });
      draw.text(ctx, A, "accéléré ×60", bx + bw - 14, by + bh - 18, { size: 12, color: P.ink3, align: "right" });
      draw.text(ctx, A, si(power(), "W", 3), bx + 16, by + bh - 18, { size: 15, color: P.ink, weight: 600 });
    }
    const A = anim(cv, { draw: render, update, autoplay: true });
    function out() {
      const P = power();
      const I = P / 230;
      const day = APP.reduce((s, a) => s + (a.on ? a.p * a.h / 1000 : 0), 0);
      document.getElementById("cp-read").innerHTML =
        "<span>Puissance : <b>" + si(P, "W", 3) + "</b></span>" +
        "<span>Courant équivalent sous 230 V : <b>" + fr(I, 1) + " A</b></span>" +
        "<span>Énergie par jour : <b>" + fr(day, 2) + " kWh</b></span>" +
        "<span>Par an : <b>" + fr(day * 365, 0) + " kWh ≈ " + fr(day * 365 * PRICE, 0) + " CHF</b></span>" +
        (I > 13 ? '<span class="warn">Plus de 13 A : sur un seul circuit, le disjoncteur couperait.</span>' : "");
      A.redraw();
    }
    out();
  })();
})();
