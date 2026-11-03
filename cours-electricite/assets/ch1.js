/* Chapitre 1 — Électrostatique : animations */
(function () {
  "use strict";
  const { anim, draw, fr, sci, si, range, choice } = window.Cours;
  const K = 8.99e9, QE = 1.602e-19, ME = 9.11e-31, C_LUM = 3e8;

  /* =================================================================
     Animation 1.1 — Électrisation par influence
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-influence");
    if (!cv) return;
    const R = 110;
    const st = { rod: -1, gap: 60, grounded: false, ions: [], el: [], transit: [], timer: 0 };

    function build() {
      st.ions = []; st.el = []; st.transit = [];
      const sp = 24;
      for (let row = -6; row <= 6; row++) {
        for (let col = -6; col <= 6; col++) {
          const x = col * sp + (row % 2 ? sp / 2 : 0), y = row * sp * 0.866;
          if (Math.hypot(x, y) < R - 14) st.ions.push({ x, y });
        }
      }
      st.ions.forEach((p) => {
        const a = Math.random() * Math.PI * 2;
        const hx = p.x + Math.cos(a) * 5, hy = p.y + Math.sin(a) * 5;
        st.el.push({ x: hx, y: hy, hx, hy });
      });
    }
    build();

    function center(A) { return { cx: A.W < 700 ? 230 : Math.max(220, A.W * 0.3), cy: Math.min(A.H * 0.46, A.H - R - 90) }; }
    function wirePath(A) {
      const { cx, cy } = center(A);
      const ex = cx - R * 0.707, ey = cy + R * 0.707;
      const gx = cx - R - 55, gy = A.H - 34;
      return [[gx, gy], [gx, ey], [ex, ey]];
    }
    function along(path, s) {
      const segs = [];
      let L = 0;
      for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); L += l; }
      let d = s * L;
      for (let i = 0; i < segs.length; i++) {
        if (d <= segs[i] || i === segs.length - 1) {
          const t = segs[i] ? Math.min(1, d / segs[i]) : 0;
          return [path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t];
        }
        d -= segs[i];
      }
      return path[path.length - 1];
    }
    function randomHome() {
      for (;;) {
        const x = (Math.random() * 2 - 1) * (R - 14), y = (Math.random() * 2 - 1) * (R - 14);
        if (Math.hypot(x, y) < R - 14) return { x, y };
      }
    }
    const strength = () => Math.pow((R + 20) / (R + st.gap), 2);

    function update(A, dt) {
      const shift = st.rod * 78 * strength();
      const tipX = R + st.gap;
      const lim = R - 7;
      for (const e of st.el) {
        let tx = e.hx, ty = e.hy;
        if (st.rod) {
          const dx = tipX - e.hx, dy = -e.hy, d = Math.hypot(dx, dy) || 1;
          tx += shift * dx / d; ty += shift * dy / d * 0.6;
        }
        const r = Math.hypot(tx, ty);
        if (r > lim) { tx *= lim / r; ty *= lim / r; }
        const k = Math.min(1, dt * 5);
        e.x += (tx - e.x) * k + (Math.random() - 0.5) * 0.7;
        e.y += (ty - e.y) * k + (Math.random() - 0.5) * 0.7;
      }
      /* répulsion à courte portée pour éviter l'empilement */
      const n = st.el.length, md = 12;
      for (let i = 0; i < n; i++) {
        const a = st.el[i];
        for (let j = i + 1; j < n; j++) {
          const b = st.el[j];
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 < md * md && d2 > 0.0001) {
            const d = Math.sqrt(d2), p = (md - d) * 0.25;
            a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p;
          }
        }
      }
      for (const e of st.el) { const r = Math.hypot(e.x, e.y); if (r > lim) { e.x *= lim / r; e.y *= lim / r; } }

      /* échanges avec la terre */
      st.timer += dt;
      if (st.grounded && st.timer > 0.14) {
        st.timer = 0;
        const nIons = st.ions.length;
        const incoming = st.transit.filter((t) => t.dir > 0).length;
        const excess = st.el.length + incoming - nIons;
        const target = st.rod ? Math.round(st.rod * Math.min(22, 20 * strength())) : 0;
        if (excess < target) {
          st.transit.push({ s: 0, dir: 1 });
        } else if (excess > target && st.el.length) {
          const ex = -R * 0.707, ey = R * 0.707;
          let best = 0, bd = Infinity;
          st.el.forEach((e, i) => { const d = Math.hypot(e.x - ex, e.y - ey); if (d < bd) { bd = d; best = i; } });
          st.el.splice(best, 1);
          st.transit.push({ s: 1, dir: -1 });
        }
      }
      for (const t of st.transit) t.s += t.dir * dt * 1.4;
      st.transit = st.transit.filter((t) => {
        if (t.dir > 0 && t.s >= 1) {
          const h = randomHome();
          st.el.push({ x: -R * 0.68, y: R * 0.68, hx: h.x, hy: h.y });
          return false;
        }
        return !(t.dir < 0 && t.s <= 0);
      });
      readout();
    }

    let lastMsg = "";
    function readout() {
      const net = st.ions.length - st.el.length;
      const q = document.getElementById("inf-q");
      if (q) q.textContent = (net > 0 ? "+" : net < 0 ? "−" : "") + Math.abs(net) + " (unités)";
      let msg;
      if (st.grounded && st.rod) msg = st.rod < 0 ? "Repoussés par le bâton, des électrons s'échappent vers la terre." : "Attirés par le bâton, des électrons montent depuis la terre.";
      else if (st.grounded) msg = "Reliée à la terre sans bâton : la sphère se neutralise.";
      else if (st.rod && net === 0) msg = "Influence : face proche " + (st.rod > 0 ? "négative" : "positive") + ", face éloignée " + (st.rod > 0 ? "positive" : "négative") + ". Charge totale nulle.";
      else if (st.rod) msg = "La sphère est chargée et le bâton modifie encore la répartition.";
      else if (net !== 0) msg = "Bâton retiré : la sphère reste chargée " + (net > 0 ? "positivement" : "négativement") + " sans l'avoir touché.";
      else msg = "Sphère neutre : autant d'électrons que d'ions positifs.";
      if (msg !== lastMsg) { const m = document.getElementById("inf-msg"); if (m) m.textContent = msg; lastMsg = msg; }
    }

    function render(ctx, A, P) {
      const { cx, cy } = center(A);
      const floor = A.H - 26;
      /* table */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - 120, floor); ctx.lineTo(cx + 120, floor); ctx.stroke();
      /* pied isolant */
      ctx.fillStyle = P.paper; ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 7, cy + R - 4, 14, floor - (cy + R - 4));
      ctx.strokeRect(cx - 7, cy + R - 4, 14, floor - (cy + R - 4));
      draw.text(ctx, A, "pied isolant", cx + 14, floor - 16, { size: 12, color: P.ink3 });
      /* fil de terre */
      if (st.grounded) {
        const p = wirePath(A);
        ctx.strokeStyle = P.wireEarth; ctx.lineWidth = 4; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach((q) => ctx.lineTo(q[0], q[1])); ctx.stroke();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
        const gx = p[0][0], gy = p[0][1];
        [[16, 0], [10, 6], [4, 12]].forEach(([w, o]) => { ctx.beginPath(); ctx.moveTo(gx - w, gy + o); ctx.lineTo(gx + w, gy + o); ctx.stroke(); });
        draw.text(ctx, A, "terre", gx + 22, gy + 4, { size: 12, color: P.ink3 });
        st.transit.forEach((t) => { const [x, y] = along(p, Math.max(0, Math.min(1, t.s))); ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fillStyle = P.minus; ctx.fill(); });
      }
      /* sphère */
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, draw.alpha(P.card, 1));
      g.addColorStop(1, draw.alpha(P.metal, 0.55));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 2; ctx.stroke();
      /* ions fixes */
      ctx.strokeStyle = P.plus; ctx.lineWidth = 2; ctx.globalAlpha = 0.75;
      st.ions.forEach((p) => { ctx.beginPath(); ctx.moveTo(cx + p.x - 4, cy + p.y); ctx.lineTo(cx + p.x + 4, cy + p.y); ctx.moveTo(cx + p.x, cy + p.y - 4); ctx.lineTo(cx + p.x, cy + p.y + 4); ctx.stroke(); });
      ctx.globalAlpha = 1;
      /* électrons */
      ctx.fillStyle = P.minus;
      st.el.forEach((e) => { ctx.beginPath(); ctx.arc(cx + e.x, cy + e.y, 4.2, 0, Math.PI * 2); ctx.fill(); });
      /* bâton */
      if (st.rod) {
        const x0 = cx + R + st.gap, y0 = cy - 15;
        ctx.fillStyle = st.rod > 0 ? draw.alpha(P.plus, 0.12) : draw.alpha(P.ink3, 0.35);
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
        draw.roundRect(ctx, x0, y0, A.W + 30 - x0, 30, 14);
        ctx.fill(); ctx.stroke();
        for (let i = 0; i < 7; i++) {
          const x = x0 + 18 + i * 26;
          if (x > A.W - 8) break;
          draw.charge(ctx, x, cy + (i % 2 ? 5 : -5), 7, st.rod);
        }
        draw.text(ctx, A, st.rod > 0 ? "bâton de verre frotté (+)" : "bâton de PVC frotté (−)", Math.min(x0 + 4, A.W - 190), y0 - 16, { size: 13, color: P.ink2 });
      }
      /* légende */
      ctx.beginPath(); ctx.arc(24, 22, 4.2, 0, Math.PI * 2); ctx.fillStyle = P.minus; ctx.fill();
      draw.text(ctx, A, "électron libre", 34, 22, { size: 13, color: P.ink2 });
      ctx.strokeStyle = P.plus; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(150, 22); ctx.lineTo(158, 22); ctx.moveTo(154, 18); ctx.lineTo(154, 26); ctx.stroke();
      draw.text(ctx, A, "ion positif fixe", 166, 22, { size: 13, color: P.ink2 });
    }

    const A = anim(cv, { draw: render, update, autoplay: true });
    A.play(); /* le mouvement des électrons est le sujet : on lance même en mouvement réduit, très lent */
    choice("inf-rod", (v) => { st.rod = Number(v); A.play(); });
    range("inf-dist", (v) => fr(v / 10, 1) + " cm", (v) => { st.gap = v; });
    const gb = document.getElementById("inf-ground");
    gb.addEventListener("click", () => {
      st.grounded = !st.grounded;
      gb.setAttribute("aria-pressed", st.grounded ? "true" : "false");
      gb.textContent = st.grounded ? "Couper la terre" : "Relier à la terre";
      if (!st.grounded) {
        /* les électrons encore dans le fil : ceux qui montaient arrivent, ceux qui partaient sont perdus */
        st.transit.forEach((t) => { if (t.dir > 0) { const h = randomHome(); st.el.push({ x: -R * 0.68, y: R * 0.68, hx: h.x, hy: h.y }); } });
        st.transit = [];
      }
      A.play();
    });
    document.getElementById("inf-reset").addEventListener("click", () => { build(); A.play(); });
  })();

  /* =================================================================
     Animation 1.2 — Loi de Coulomb
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-coulomb");
    if (!cv) return;
    const st = { q1: 40e-9, q2: -60e-9, r: 0.2 };
    const F = (r) => K * Math.abs(st.q1 * st.q2) / (r * r);

    function geom(A) {
      const tall = A.H > A.W * 0.7;
      const lineY = tall ? A.H * 0.22 : A.H * 0.3;
      const plotTop = tall ? A.H * 0.46 : A.H * 0.56;
      const pxPerCm = (A.W - 160) / 50;
      return { lineY, plotTop, pxPerCm };
    }
    function render(ctx, A, P) {
      const { lineY, plotTop, pxPerCm } = geom(A);
      const rpx = st.r * 100 * pxPerCm;
      const x1 = 80, x2 = 80 + rpx;
      const rad = (q) => 10 + Math.sqrt(Math.abs(q) / 100e-9) * 14;
/* cote r */
      ctx.strokeStyle = P.ink3; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, lineY); ctx.lineTo(x2, lineY); ctx.stroke(); ctx.setLineDash([]);
      draw.text(ctx, A, "r = " + fr(st.r * 100, 0) + " cm", (x1 + x2) / 2, lineY - 14, { size: 13, color: P.ink2, align: "center" });
      /* forces */
      const f = F(st.r);
      const L = Math.min(260, f / 1e-5);
      const clipped = f / 1e-5 > 260;
      const attract = st.q1 * st.q2 < 0;
      if (f > 0) {
        const d1 = attract ? 1 : -1;
        draw.arrow(ctx, x1, lineY - 44, x1 + d1 * Math.max(L, 4), lineY - 44, { color: P.ink, width: 3, head: 12 });
        draw.arrow(ctx, x2, lineY + 44, x2 - d1 * Math.max(L, 4), lineY + 44, { color: P.ink, width: 3, head: 12 });
        draw.text(ctx, A, "F₂→₁", x1 + d1 * Math.max(L, 4) / 2, lineY - 60, { size: 13, color: P.ink2, align: "center" });
        draw.text(ctx, A, "F₁→₂", x2 - d1 * Math.max(L, 4) / 2, lineY + 62, { size: 13, color: P.ink2, align: "center" });
        if (clipped) draw.text(ctx, A, "(flèches tronquées)", A.W - 20, lineY - 60, { size: 11, color: P.ink3, align: "right" });
      }
      /* charges */
      [[x1, st.q1, "q₁"], [x2, st.q2, "q₂"]].forEach(([x, q, n]) => {
        if (q === 0) {
          ctx.beginPath(); ctx.arc(x, lineY, 10, 0, Math.PI * 2); ctx.fillStyle = P.metal; ctx.fill();
        } else draw.charge(ctx, x, lineY, rad(q), q > 0 ? 1 : -1);
        const above = (q === 0 ? 22 : rad(q) + 10) + (n === "q₁" ? 50 : 0);
        draw.text(ctx, A, n + " = " + fr(q * 1e9, 0) + " nC", x, lineY - above, { size: 12, color: P.ink2, align: "center" });
      });
      /* graphe F(r) */
      const gx0 = 80, gx1 = 80 + 50 * pxPerCm, gy1 = A.H - 34, gy0 = plotTop;
      const fmax = F(0.05) || 1;
      ctx.strokeStyle = P.rule2; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = gy1 - (gy1 - gy0) * i / 4; ctx.beginPath(); ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); ctx.stroke(); }
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gx0, gy0 - 6); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1 + 6, gy1); ctx.stroke();
      draw.text(ctx, A, "F", gx0 + 8, gy0 - 4, { size: 13, color: P.ink2 });
      draw.text(ctx, A, si(fmax, "N", 2), gx0 - 8, gy0, { size: 11, color: P.ink3, align: "right", baseline: "top" });
      draw.text(ctx, A, "0", gx0 - 8, gy1, { size: 11, color: P.ink3, align: "right" });
      [5, 10, 20, 30, 40, 50].forEach((c) => draw.text(ctx, A, c + "", gx0 + c * pxPerCm, gy1 + 14, { size: 11, color: P.ink3, align: "center" }));
      draw.text(ctx, A, "r (cm)", gx1, gy1 - 12, { size: 11, color: P.ink3, align: "right" });
      if (f > 0) {
        ctx.strokeStyle = P.accent; ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let c = 5; c <= 50; c += 0.25) {
          const x = gx0 + c * pxPerCm, y = gy1 - (gy1 - gy0) * F(c / 100) / fmax;
          if (c === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const px = gx0 + st.r * 100 * pxPerCm, py = gy1 - (gy1 - gy0) * f / fmax;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, gy1); ctx.lineTo(px, py); ctx.lineTo(gx0, py); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.card; ctx.stroke();
        draw.text(ctx, A, "F ∝ 1/r²", gx0 + 9 * pxPerCm, gy0 + 10, { size: 13, color: P.accent, baseline: "top" });
      } else {
        draw.text(ctx, A, "Une des charges est nulle : aucune force.", (gx0 + gx1) / 2, (gy0 + gy1) / 2, { size: 14, color: P.ink3, align: "center" });
      }
    }
    const A = anim(cv, { draw: render, autoplay: false });
    function out() {
      const f = F(st.r);
      document.getElementById("cl-F").textContent = f ? si(f, "N", 3) : "0 N";
      document.getElementById("cl-type").textContent = f === 0 ? "aucune" : st.q1 * st.q2 < 0 ? "attraction" : "répulsion";
      const m = f / 9.81;
      document.getElementById("cl-m").textContent = f === 0 ? "—" : m >= 1e-3 ? fr(m * 1000, 2) + " g" : fr(m * 1e6, 1) + " mg";
      A.redraw();
    }
    range("cl-q1", (v) => (v > 0 ? "+" : "") + fr(v, 0) + " nC", (v) => { st.q1 = v * 1e-9; out(); });
    range("cl-q2", (v) => (v > 0 ? "+" : "") + fr(v, 0) + " nC", (v) => { st.q2 = v * 1e-9; out(); });
    const rr = range("cl-r", (v) => fr(v, 0) + " cm", (v) => { st.r = v / 100; out(); });
    /* glisser q2 */
    let drag = false;
    cv.addEventListener("pointerdown", (e) => {
      const p = A.pos(e), { lineY, pxPerCm } = geom(A);
      const x2 = 80 + st.r * 100 * pxPerCm;
      if (Math.hypot(p.x - x2, p.y - lineY) < 40) { drag = true; cv.setPointerCapture(e.pointerId); }
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = A.pos(e), { pxPerCm } = geom(A);
      rr.set(Math.max(5, Math.min(50, Math.round((p.x - 80) / pxPerCm))));
    });
    cv.addEventListener("pointerup", () => { drag = false; });
    cv.addEventListener("pointercancel", () => { drag = false; });
  })();

  /* =================================================================
     Animation 1.3 — Visualiseur de champ électrique
     1 unité virtuelle = 1 mm ; chaque charge = n × 1 nC
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-champ");
    if (!cv) return;
    const st = { charges: [], lines: [], dirty: true, showLines: true, showVec: false, tests: [], pointer: null, preset: "dipole" };
    let AN = null;

    function preset(name) {
      st.preset = name;
      if (!AN) return;
      const W = AN.W, H = AN.H, cx = W / 2, cy = H / 2;
      const tall = H > W;
      const s = Math.min(W, H);
      const P = (dx, dy, q) => tall ? { x: cx + dy, y: cy + dx, q } : { x: cx + dx, y: cy + dy, q };
      const c = [];
      if (name === "single") c.push({ x: cx, y: cy, q: 1 });
      if (name === "dipole") c.push(P(-s * 0.24, 0, 1), P(s * 0.24, 0, -1));
      if (name === "same") c.push(P(-s * 0.26, 0, 4), P(s * 0.26, 0, 1));
      if (name === "trio") c.push(P(0, -s * 0.22, 2), P(-s * 0.22, s * 0.18, -1), P(s * 0.22, s * 0.18, -1));
      if (name === "plates") {
        const n = 11, half = s * 0.3;
        for (let i = 0; i < n; i++) {
          const t = -half + 2 * half * i / (n - 1);
          c.push(P(-s * 0.16, t, 1)); c.push(P(s * 0.16, t, -1));
        }
      }
      st.charges = c; st.tests = []; st.dirty = true;
    }

    function field(x, y) {
      let ex = 0, ey = 0;
      for (const c of st.charges) {
        const dx = x - c.x, dy = y - c.y;
        let r2 = dx * dx + dy * dy;
        if (r2 < 4) r2 = 4;
        const r = Math.sqrt(r2);
        const f = c.q / (r2 * r);
        ex += f * dx; ey += f * dy;
      }
      return [ex, ey];
    }
    /* |E| en N/C : unités virtuelles en mm, q en nC */
    const physE = (ex, ey) => Math.hypot(ex, ey) * K * 1e-9 * 1e6;

    function trace() {
      st.lines = [];
      const pos = st.charges.filter((c) => c.q > 0), neg = st.charges.filter((c) => c.q < 0);
      const many = st.charges.length > 6;
      const perUnit = many ? 3 : 9;
      const sources = pos.length ? pos : neg;
      const sign = pos.length ? 1 : -1;
      const sinks = pos.length ? neg : pos;
      const step = 3, margin = 60;
      for (const s0 of sources) {
        const n = Math.max(3, Math.round(perUnit * Math.abs(s0.q)));
        const off = many ? 0 : Math.PI / n * 0.5;
        for (let i = 0; i < n; i++) {
          const a = off + i * 2 * Math.PI / n;
          let x = s0.x + Math.cos(a) * 12, y = s0.y + Math.sin(a) * 12;
          const pts = [[x, y]];
          for (let k = 0; k < 1400; k++) {
            let [ex, ey] = field(x, y);
            let m = Math.hypot(ex, ey) || 1;
            const mx = x + sign * ex / m * step / 2, my = y + sign * ey / m * step / 2;
            [ex, ey] = field(mx, my);
            m = Math.hypot(ex, ey) || 1;
            x += sign * ex / m * step; y += sign * ey / m * step;
            pts.push([x, y]);
            if (x < -margin || y < -margin || x > AN.W + margin || y > AN.H + margin) break;
            let hit = false;
            for (const t of sinks) if (Math.hypot(x - t.x, y - t.y) < 9) { hit = true; break; }
            if (hit) break;
            let back = false;
            for (const t of sources) if (t !== s0 && Math.hypot(x - t.x, y - t.y) < 8) { back = true; break; }
            if (back) break;
          }
          st.lines.push(pts);
        }
      }
      st.dirty = false;
    }

    function update(A, dt) {
      for (const t of st.tests) {
        if (t.done) continue;
        const [ex, ey] = field(t.x, t.y);
        const m = Math.hypot(ex, ey) || 1;
        const v = 150;
        t.x += ex / m * v * dt; t.y += ey / m * v * dt;
        t.trail.push([t.x, t.y]);
        if (t.trail.length > 400) t.trail.shift();
        for (const c of st.charges) if (c.q < 0 && Math.hypot(t.x - c.x, t.y - c.y) < 10) t.done = true;
        if (t.x < -20 || t.y < -20 || t.x > A.W + 20 || t.y > A.H + 20) t.done = true;
      }
      if (!st.tests.some((t) => !t.done) && !drag) A.pause();
    }

    function render(ctx, A, P) {
      AN = A;
      if (!st.charges.length && st.preset !== "custom") preset(st.preset);
      if (st.dirty) trace();
      /* plaques pour le condensateur */
      if (st.preset === "plates" && st.charges.length >= 2) {
        const pp = st.charges.filter((c) => c.q > 0), nn = st.charges.filter((c) => c.q < 0);
        [[pp, P.plus], [nn, P.minus]].forEach(([arr, col]) => {
          if (arr.length < 2) return;
          ctx.strokeStyle = draw.alpha(col, 0.25); ctx.lineWidth = 16; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(arr[0].x, arr[0].y); ctx.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y); ctx.stroke();
        });
      }
      if (st.showVec) {
        const sp = 40;
        for (let y = sp / 2; y < A.H; y += sp) for (let x = sp / 2; x < A.W; x += sp) {
          const [ex, ey] = field(x, y);
          const E = physE(ex, ey);
          if (!isFinite(E) || E === 0) continue;
          const L = Math.min(17, 3 + 3.2 * Math.log10(1 + E / 300));
          const m = Math.hypot(ex, ey);
          const a = Math.min(1, 0.25 + Math.log10(1 + E / 300) / 3);
          ctx.globalAlpha = a;
          draw.arrow(ctx, x - ex / m * L / 2, y - ey / m * L / 2, x + ex / m * L / 2, y + ey / m * L / 2, { color: P.field, width: 1.6, head: 6 });
        }
        ctx.globalAlpha = 1;
      }
      if (st.showLines) {
        ctx.strokeStyle = P.field; ctx.lineWidth = 1.5; ctx.lineJoin = "round";
        for (const pts of st.lines) {
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
          /* flèches le long de la ligne */
          let acc = 0;
          for (let i = 1; i < pts.length - 2; i++) {
            acc += 3;
            if (acc >= 110 && pts[i][0] > 0 && pts[i][0] < A.W && pts[i][1] > 0 && pts[i][1] < A.H) {
              acc = 0;
              const sgn = st.charges.some((c) => c.q > 0) ? 1 : -1;
              const a = pts[i - 1], b = pts[i + 1];
              const [x0, y0, x1, y1] = sgn > 0 ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]];
              const dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy) || 1;
              const ux = dx / m, uy = dy / m, cx = pts[i][0], cy = pts[i][1];
              ctx.fillStyle = P.field;
              ctx.beginPath();
              ctx.moveTo(cx + ux * 6, cy + uy * 6);
              ctx.lineTo(cx - ux * 5 - uy * 4.5, cy - uy * 5 + ux * 4.5);
              ctx.lineTo(cx - ux * 5 + uy * 4.5, cy - uy * 5 - ux * 4.5);
              ctx.closePath(); ctx.fill();
            }
          }
        }
      }
      /* charges test */
      for (const t of st.tests) {
        ctx.strokeStyle = draw.alpha(P.plus, 0.45); ctx.lineWidth = 2;
        ctx.beginPath(); t.trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        if (!t.done) draw.charge(ctx, t.x, t.y, 6, 1);
      }
      /* charges sources */
      for (const c of st.charges) {
        const r = st.preset === "plates" ? 9 : 12 + 3 * Math.abs(c.q);
        ctx.beginPath(); ctx.arc(c.x, c.y, r + 2.5, 0, Math.PI * 2); ctx.fillStyle = P.card; ctx.fill();
        draw.charge(ctx, c.x, c.y, r, c.q > 0 ? 1 : -1);
        if (Math.abs(c.q) > 1) draw.text(ctx, A, (c.q > 0 ? "+" : "−") + Math.abs(c.q), c.x + r + 4, c.y - r, { size: 12, color: P.ink2 });
      }
      /* sonde */
      if (st.pointer) {
        const { x, y } = st.pointer;
        const [ex, ey] = field(x, y), m = Math.hypot(ex, ey);
        if (m > 0) draw.arrow(ctx, x, y, x + ex / m * 34, y + ey / m * 34, { color: P.ink, width: 2.2, head: 9 });
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = P.ink; ctx.fill();
      }
    }

    const A = anim(cv, { draw: render, update, autoplay: false, onResize: () => { st.dirty = true; } });
    choice("ch-preset", (v) => { preset(v); A.redraw(); });

    const bl = document.getElementById("ch-lines"), bv = document.getElementById("ch-vectors");
    bl.addEventListener("click", () => { st.showLines = !st.showLines; bl.setAttribute("aria-pressed", st.showLines); A.redraw(); });
    bv.addEventListener("click", () => { st.showVec = !st.showVec; bv.setAttribute("aria-pressed", st.showVec); A.redraw(); });
    function add(q) {
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 80;
      st.charges.push({ x: Math.max(30, Math.min(A.W - 30, A.W / 2 + Math.cos(a) * d)), y: Math.max(30, Math.min(A.H - 30, A.H / 2 + Math.sin(a) * d)), q });
      if (st.preset === "plates") st.preset = "custom";
      st.dirty = true; A.redraw();
    }
    document.getElementById("ch-addp").addEventListener("click", () => add(1));
    document.getElementById("ch-addm").addEventListener("click", () => add(-1));
    function dropTest(x, y) {
      st.tests.push({ x, y, trail: [[x, y]], done: false });
      if (st.tests.length > 14) st.tests.shift();
      A.play();
    }
    document.getElementById("ch-test").addEventListener("click", () => {
      const pos = st.charges.filter((c) => c.q > 0);
      if (pos.length) {
        const c = pos[Math.floor(Math.random() * pos.length)], a = Math.random() * Math.PI * 2;
        dropTest(c.x + Math.cos(a) * 26, c.y + Math.sin(a) * 26);
      } else dropTest(Math.random() * A.W, Math.random() * A.H);
    });

    /* interaction pointeur */
    let drag = null, downAt = 0, pressTimer = 0, moved = false, lastTap = 0;
    const out = document.getElementById("ch-E");
    function probe(p) {
      st.pointer = p;
      const [ex, ey] = field(p.x, p.y);
      const E = physE(ex, ey);
      out.textContent = "E ≈ " + si(E, "N/C", 3);
    }
    const hitCharge = (p) => {
      let best = null, bd = 22;
      st.charges.forEach((c) => { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = c; } });
      return best;
    };
    cv.addEventListener("pointerdown", (e) => {
      const p = A.pos(e);
      const c = hitCharge(p);
      moved = false; downAt = Date.now();
      if (c) {
        drag = c; cv.setPointerCapture(e.pointerId);
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => { if (drag === c && !moved) { st.charges = st.charges.filter((k) => k !== c); drag = null; st.dirty = true; A.redraw(); } }, 650);
        const now = Date.now();
        if (now - lastTap < 320) { st.charges = st.charges.filter((k) => k !== c); drag = null; st.dirty = true; A.redraw(); }
        lastTap = now;
      }
    });
    cv.addEventListener("pointermove", (e) => {
      const p = A.pos(e);
      if (drag) {
        moved = true;
        drag.x = Math.max(10, Math.min(A.W - 10, p.x)); drag.y = Math.max(10, Math.min(A.H - 10, p.y));
        st.dirty = true;
      }
      probe(p);
      A.redraw();
    });
    cv.addEventListener("pointerup", (e) => {
      clearTimeout(pressTimer);
      if (!drag && Date.now() - downAt < 400) { const p = A.pos(e); dropTest(p.x, p.y); }
      drag = null;
    });
    cv.addEventListener("pointercancel", () => { clearTimeout(pressTimer); drag = null; });
    cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { st.pointer = null; A.redraw(); } });
  })();

  /* =================================================================
     Animation 1.4 — Canon à électrons / déviation
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-canon");
    if (!cv) return;
    const S = 2.5e8; /* facteur de ralenti */
    const st = { mode: "acc", U: 2000, d: 0.04, Ud: 150, el: [], spawn: 0, hits: [] };
    const Lp = 0.08; /* longueur des plaques de déviation (m) */

    function scale(A) { return Math.min(40, (A.H - 90) / 10); } /* px par cm */
    const v0 = () => Math.sqrt(2 * QE * st.U / ME);

    function update(A, dt) {
      const pc = scale(A) * 100; /* px par m */
      st.spawn += dt;
      if (st.spawn > 0.22) {
        st.spawn = 0;
        if (st.mode === "acc") st.el.push({ x: 0, y: (Math.random() - 0.5) * 0.004, v: 0, out: false });
        else st.el.push({ x: 0, y: (Math.random() - 0.5) * 0.0008, vy: 0, dead: false });
      }
      if (st.mode === "acc") {
        const a = QE * (st.U / st.d) / ME;
        for (const e of st.el) {
          const tr = dt / S;
          if (e.x < st.d) { e.v += a * tr; e.x += e.v * tr; if (e.x >= st.d) e.v = v0(); }
          else e.x += e.v * tr;
        }
        const maxX = (A.W - 150) / pc + 0.05;
        st.el = st.el.filter((e) => e.x < maxX);
      } else {
        const vx = v0();
        const ay = QE * (st.Ud / st.d) / ME; /* Ud > 0 : plaque du haut positive, l'électron monte */
        const screenX = (A.W - 60 - 200) / pc;
        for (const e of st.el) {
          if (e.dead) continue;
          const tr = dt / S;
          if (e.x < Lp) e.vy += ay * tr;
          e.x += vx * tr; e.y += e.vy * tr;
          if (e.x < Lp && Math.abs(e.y) >= st.d / 2) { e.dead = true; e.deadT = 0; }
          if (e.x >= screenX) { e.dead = true; e.deadT = 0; st.hits.push({ y: e.y, t: 0 }); if (st.hits.length > 60) st.hits.shift(); }
        }
        st.el.forEach((e) => { if (e.dead) e.deadT += dt; });
        st.el = st.el.filter((e) => !e.dead || e.deadT < 0.4);
        st.hits.forEach((h) => (h.t += dt));
        st.hits = st.hits.filter((h) => h.t < 3);
      }
    }

    function render(ctx, A, P) {
      const pcm = scale(A), pc = pcm * 100, cy = A.H / 2;
      if (st.mode === "acc") {
        const x0 = 120, dpx = st.d * pc, x1 = x0 + dpx, hh = Math.min(A.H * 0.36, 150);
        /* champ */
        for (let i = -2; i <= 2; i++) {
          const y = cy + i * hh * 0.38;
          if (dpx > 50) draw.arrow(ctx, x1 - 12, y, x0 + 14, y, { color: draw.alpha(P.field, 0.6), width: 1.6, head: 8 });
        }
        draw.text(ctx, A, "E", (x0 + x1) / 2, cy - hh - 14, { size: 15, color: P.field, align: "center", weight: 600 });
        /* plaques */
        ctx.fillStyle = P.minus; ctx.fillRect(x0 - 8, cy - hh, 8, hh * 2);
        ctx.fillStyle = P.plus; ctx.fillRect(x1, cy - hh, 8, hh - 10); ctx.fillRect(x1, cy + 10, 8, hh - 10);
        draw.text(ctx, A, "−", x0 - 4, cy - hh - 14, { size: 18, color: P.minus, align: "center", weight: 700 });
        draw.text(ctx, A, "+", x1 + 4, cy - hh - 14, { size: 18, color: P.plus, align: "center", weight: 700 });
        /* cote d */
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, cy + hh + 16); ctx.lineTo(x1, cy + hh + 16); ctx.stroke();
        draw.text(ctx, A, "d = " + fr(st.d * 100, 1) + " cm", (x0 + x1) / 2, cy + hh + 30, { size: 12, color: P.ink2, align: "center" });
        /* électrons */
        for (const e of st.el) {
          const x = x0 + e.x * pc, y = cy + e.y * pc;
          ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fillStyle = P.minus; ctx.fill();
        }
        /* barre de vitesse */
        const vmax = Math.sqrt(2 * QE * 5000 / ME);
        const bx = A.W - 210, by = 24;
        draw.text(ctx, A, "vitesse finale", bx, by, { size: 12, color: P.ink3 });
        ctx.fillStyle = P.rule2; ctx.fillRect(bx, by + 10, 180, 10);
        ctx.fillStyle = P.accent; ctx.fillRect(bx, by + 10, 180 * v0() / vmax, 10);
        draw.text(ctx, A, sci(v0(), 2) + " m/s", bx, by + 34, { size: 12, color: P.ink, family: "mono" });
      } else {
        const gx = 30, px0 = 200, plen = Lp * pc, dpx = st.d * pc, sx = A.W - 60;
        /* canon */
        ctx.fillStyle = P.rule2; ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.5;
        draw.roundRect(ctx, gx, cy - 18, 110, 36, 6); ctx.fill(); ctx.stroke();
        draw.text(ctx, A, "canon " + fr(st.U, 0) + " V", gx + 55, cy - 30, { size: 12, color: P.ink2, align: "center" });
        /* plaques */
        const topCol = st.Ud > 0 ? P.plus : st.Ud < 0 ? P.minus : P.metal;
        const botCol = st.Ud > 0 ? P.minus : st.Ud < 0 ? P.plus : P.metal;
        ctx.fillStyle = topCol; ctx.fillRect(px0, cy - dpx / 2 - 6, plen, 6);
        ctx.fillStyle = botCol; ctx.fillRect(px0, cy + dpx / 2, plen, 6);
        if (st.Ud !== 0) {
          const dir = st.Ud > 0 ? 1 : -1; /* E va du + vers le − */
          for (let i = 1; i <= 4; i++) {
            const x = px0 + plen * i / 5;
            if (dpx > 30) draw.arrow(ctx, x, cy - dir * (dpx / 2 - 8), x, cy + dir * (dpx / 2 - 8), { color: draw.alpha(P.field, 0.5), width: 1.4, head: 7 });
          }
        }
        draw.text(ctx, A, (st.Ud > 0 ? "+" : "") + fr(st.Ud, 0) + " V", px0 + plen / 2, cy - dpx / 2 - 20, { size: 12, color: P.ink2, align: "center" });
        /* écran */
        ctx.fillStyle = P.rule2; ctx.fillRect(sx, 20, 14, A.H - 40);
        ctx.strokeStyle = P.ink3; ctx.strokeRect(sx, 20, 14, A.H - 40);
        draw.text(ctx, A, "écran", sx + 7, 12, { size: 11, color: P.ink3, align: "center" });
        for (const h of st.hits) {
          ctx.globalAlpha = Math.max(0, 1 - h.t / 3);
          ctx.beginPath(); ctx.arc(sx + 7, Math.max(22, Math.min(A.H - 22, cy - h.y * pc)), 6, 0, Math.PI * 2); ctx.fillStyle = P.glow; ctx.fill();
        }
        ctx.globalAlpha = 1;
        /* trajectoire théorique */
        ctx.strokeStyle = draw.alpha(P.minus, 0.35); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx + 110, cy);
        const kdev = st.Ud / (4 * st.d * st.U);
        let hit = false;
        for (let x = 0; x <= Lp; x += Lp / 60) { const y = kdev * x * x; if (Math.abs(y) >= st.d / 2) { hit = true; ctx.lineTo(px0 + x * pc, cy - y * pc); break; } ctx.lineTo(px0 + x * pc, cy - y * pc); }
        if (!hit) { const yL = kdev * Lp * Lp, slope = 2 * kdev * Lp; const xs = (sx - px0) / pc; ctx.lineTo(sx, cy - (yL + slope * (xs - Lp)) * pc); }
        ctx.stroke(); ctx.setLineDash([]);
        for (const e of st.el) {
          const x = px0 + e.x * pc, y = cy - e.y * pc;
          ctx.globalAlpha = e.dead ? Math.max(0, 1 - e.deadT / 0.4) : 1;
          ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fillStyle = P.minus; ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = draw.alpha(P.minus, 0.6); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx + 110, cy); ctx.lineTo(px0, cy); ctx.stroke();
      }
    }

    const A = anim(cv, { draw: render, update, autoplay: true });
    A.bindPlay(document.getElementById("cn-play"));
    function out() {
      const box = document.getElementById("cn-read");
      const v = v0();
      if (st.mode === "acc") {
        const E = st.U / st.d, F = QE * E, a = F / ME, t = 2 * st.d / v;
        box.innerHTML =
          "<span>E = U/d : <b>" + si(E, "V/m", 3) + "</b></span>" +
          "<span>F = eE : <b>" + sci(F, 2) + " N</b></span>" +
          "<span>a : <b>" + sci(a, 2) + " m/s²</b></span>" +
          "<span>W = eU : <b>" + fr(st.U, 0) + " eV = " + sci(QE * st.U, 2) + " J</b></span>" +
          "<span>v finale : <b>" + sci(v, 3) + " m/s (" + fr(100 * v / C_LUM, 1) + " % de c)</b></span>" +
          "<span>durée réelle : <b>" + fr(t * 1e9, 2) + " ns</b></span>";
      } else {
        const y = st.Ud * Lp * Lp / (4 * st.d * st.U);
        const touches = Math.abs(y) >= st.d / 2;
        box.innerHTML =
          "<span>v₀ : <b>" + sci(v, 3) + " m/s</b></span>" +
          "<span>déviation à la sortie : <b>" + (touches ? "l'électron touche la plaque" : fr(y * 1000, 1) + " mm") + "</b></span>" +
          "<span>y = U<sub>dév</sub>·L²/(4·d·U) avec L = 8 cm</span>";
      }
      A.redraw();
    }
    choice("cn-mode", (v) => { st.mode = v; st.el = []; st.hits = []; document.getElementById("cn-ud-wrap").hidden = v !== "dev"; out(); });
    range("cn-u", (v) => fr(v, 0) + " V", (v) => { st.U = v; out(); });
    range("cn-d", (v) => fr(v, 1) + " cm", (v) => { st.d = v / 100; st.el = st.el.filter((e) => st.mode !== "acc" || e.x > st.d); out(); });
    range("cn-ud", (v) => (v > 0 ? "+" : "") + fr(v, 0) + " V", (v) => { st.Ud = v; out(); });
  })();
})();
