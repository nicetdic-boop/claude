/* Chapitre 3 — Les gaz parfaits : simulations */
(function () {
  "use strict";
  const { anim, draw, plot, curve, fr, sci, range, choice, K } = window.Cours;

  /* =================================================================
     Simulation 3.1 — Le gaz dans un cylindre
     2D : la pression « mesurée » est le rapport chocs mesurés / chocs
     attendus, appliqué à la valeur calculée par pV = nRT (3D).
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-cyl");
    if (!cv) return;
    const KM = 40, MOL_PER = 2.41e20 / K.NA; /* mol par bille */
    const st = { N: 100, T: 300, V: 1, p: [], imp: 0, tw: 0, ratio: 1, trace: [], init: false };
    let L = null;
    function layout(A) {
      const land = A.W / A.H > 1.25;
      L = land
        ? { cx: 60, w: 250, bot: A.H - 30, hmax: A.H - 120, gx: 205, gy: 0, plot: { x: 480, y: 40, w: A.W - 505, h: A.H - 100 } }
        : { cx: 120, w: 300, bot: A.H * 0.52, hmax: A.H * 0.4, gx: 0, gy: 0, plot: { x: 80, y: A.H * 0.6, w: A.W - 110, h: A.H * 0.32 } };
    }
    const top = () => L.bot - st.V / 1.2 * L.hmax;
    const gauss = () => { const u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    function add(n) {
      const s = Math.sqrt(st.T * KM);
      for (let i = 0; i < n; i++) st.p.push({ x: L.cx + 6 + Math.random() * (L.w - 12), y: top() + 6 + Math.random() * (L.bot - top() - 12), vx: gauss() * s, vy: gauss() * s });
    }
    function init() { st.p = []; add(st.N); st.init = true; }
    const pth = () => st.N * MOL_PER * K.R * st.T / (st.V * 1e-3); /* Pa */
    function update(A, dt) {
      if (!st.init) init();
      const r = 4, y0 = top();
      let imp = 0;
      for (const q of st.p) {
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < L.cx + r) { q.x = L.cx + r; q.vx = Math.abs(q.vx); imp += 2 * q.vx; }
        if (q.x > L.cx + L.w - r) { q.x = L.cx + L.w - r; q.vx = -Math.abs(q.vx); imp += -2 * q.vx; }
        if (q.y < y0 + r) { q.y = y0 + r; q.vy = Math.abs(q.vy); imp += 2 * q.vy; }
        if (q.y > L.bot - r) { q.y = L.bot - r; q.vy = -Math.abs(q.vy); imp += -2 * q.vy; }
      }
      /* thermostat doux */
      let ke = 0;
      for (const q of st.p) ke += 0.5 * (q.vx * q.vx + q.vy * q.vy);
      const target = st.p.length * st.T * KM;
      const lam = Math.sqrt(1 + dt / 0.3 * (target / Math.max(ke, 1) - 1));
      for (const q of st.p) { q.vx *= lam; q.vy *= lam; }
      /* pression mesurée (moyenne glissante sur ~1 s) */
      const per = 2 * (L.w + (L.bot - y0));
      const p2 = imp / (per * Math.max(dt, 1e-3));
      const p2th = st.p.length * st.T * KM / (L.w * (L.bot - y0));
      if (dt > 0) st.ratio += (p2 / p2th - st.ratio) * Math.min(1, dt / 1.0);
      if (A.t % 0.2 < 0.02) out();
    }
    function render(ctx, A, P) {
      if (!L) layout(A);
      if (!st.init) init();
      const y0 = top();
      /* cylindre */
      ctx.fillStyle = draw.alpha(draw.heat((st.T - 100) / 500), 0.18);
      ctx.fillRect(L.cx, y0, L.w, L.bot - y0);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(L.cx, L.bot - L.hmax - 20); ctx.lineTo(L.cx, L.bot); ctx.lineTo(L.cx + L.w, L.bot); ctx.lineTo(L.cx + L.w, L.bot - L.hmax - 20); ctx.stroke();
      /* piston */
      ctx.fillStyle = P.metal; ctx.fillRect(L.cx + 2, y0 - 16, L.w - 4, 16);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(L.cx + 2, y0 - 16, L.w - 4, 16);
      ctx.fillRect(L.cx + L.w / 2 - 6, y0 - 60, 12, 44);
      for (const q of st.p) {
        const v2 = (q.vx * q.vx + q.vy * q.vy) / (2 * KM);
        ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = draw.heat(v2 / 1000); ctx.fill();
        ctx.strokeStyle = draw.alpha(P.ink, 0.35); ctx.lineWidth = 0.8; ctx.stroke();
      }
      /* manomètre */
      const pm = pth() * st.ratio / 1000;
      const gx = L.cx + L.w + 62, gy = L.bot - 60, gr = 46;
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.cx + L.w, gy); ctx.lineTo(gx - gr, gy); ctx.stroke();
      ctx.fillStyle = P.card; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      const ang = (v) => Math.PI * 0.75 + Math.min(1.02, v / 600) * Math.PI * 1.5;
      for (let v = 0; v <= 600; v += 100) {
        const a = ang(v);
        ctx.strokeStyle = P.ink2; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(gx + Math.cos(a) * (gr - 8), gy + Math.sin(a) * (gr - 8)); ctx.lineTo(gx + Math.cos(a) * (gr - 2), gy + Math.sin(a) * (gr - 2)); ctx.stroke();
      }
      draw.text(ctx, A, "kPa", gx, gy + 20, { size: 10, color: P.ink3, align: "center" });
      const at = ang(pth() / 1000);
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(at) * (gr - 6), gy + Math.sin(at) * (gr - 6)); ctx.stroke(); ctx.setLineDash([]);
      const a = ang(pm);
      ctx.strokeStyle = P.hot; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * (gr - 6), gy + Math.sin(a) * (gr - 6)); ctx.stroke();
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, Math.PI * 2); ctx.fill();
      draw.text(ctx, A, fr(pm, 0) + " kPa", gx, gy - gr - 12, { size: 13, weight: 700, family: "mono", align: "center" });
      /* diagramme p-V */
      const pl = plot(ctx, A, L.plot, { xmin: 0, xmax: 1.3, ymin: 0, ymax: 600, xstep: 0.2, ystep: 100, xlabel: "V (L)", ylabel: "p (kPa)", xfmt: (v) => fr(v, 1) });
      const iso = [];
      for (let V = 0.12; V <= 1.3; V += 0.02) iso.push([V, st.N * MOL_PER * K.R * st.T / (V * 1e-3) / 1000]);
      ctx.save(); ctx.beginPath(); ctx.rect(L.plot.x, L.plot.y, L.plot.w, L.plot.h); ctx.clip();
      curve(ctx, iso, pl.X, pl.Y, draw.alpha(P.hot, 0.6), 1.5, [5, 4]);
      ctx.fillStyle = P.ink3;
      st.trace.forEach((t) => { ctx.beginPath(); ctx.arc(pl.X(t[0]), pl.Y(t[1]), 2.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      const py = pth() / 1000;
      ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(pl.X(st.V), pl.Y(Math.min(600, py)), 6, 0, Math.PI * 2); ctx.fill();
      draw.text(ctx, A, "isotherme " + st.T + " K (pV = cste)", L.plot.x + L.plot.w - 4, L.plot.y + 10, { size: 11, color: P.hot, align: "right" });
    }
    const A = anim(cv, { draw: render, update, onResize: (A2) => { layout(A2); st.init = false; } });
    A.bindPlay(document.getElementById("cyl-play"));
    function out() {
      const n = st.N * MOL_PER;
      document.getElementById("cyl-read").innerHTML =
        "<span>n = <b>" + fr(n * 1000, 1) + " mmol</b></span>" +
        "<span>p calculée = nRT/V <b>" + fr(pth() / 1000, 1) + " kPa</b></span>" +
        "<span>p mesurée (chocs) <b>" + fr(pth() * st.ratio / 1000, 1) + " kPa</b></span>" +
        "<span>pV <b>" + fr(pth() * st.V * 1e-3, 1) + " J</b></span>";
    }
    const mark = () => { st.trace.push([st.V, pth() / 1000]); if (st.trace.length > 400) st.trace.shift(); };
    range("cyl-n", (v) => fr(v, 0), (v) => {
      st.N = v;
      if (st.init) { if (st.p.length < v) add(v - st.p.length); else st.p.length = v; }
      mark(); out(); A.redraw();
    });
    range("cyl-t", (v) => fr(v, 0) + " K (" + fr(v - 273.15, 0) + " °C)", (v) => { st.T = v; mark(); out(); A.redraw(); });
    range("cyl-v", (v) => fr(v, 2) + " L", (v) => {
      st.V = v;
      if (st.init && L) { const y0 = top(); st.p.forEach((q) => { if (q.y < y0 + 5) q.y = y0 + 5 + Math.random() * 20; }); }
      mark(); out(); A.redraw();
    });
    document.getElementById("cyl-trace").addEventListener("click", () => { st.trace = []; A.redraw(); });
  })();

  /* =================================================================
     Simulation 3.2 — Le laboratoire des lois des gaz
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-labo");
    if (!cv) return;
    const EXP = {
      boyle: { lab: "Volume de la seringue", min: 15, max: 60, def: 60, fmt: (v) => fr(v, 0) + " mL", meas: (x) => 101.3 * 60 / x, unitY: "kPa" },
      charles: { lab: "Température du bain", min: 0, max: 100, def: 20, fmt: (v) => fr(v, 0) + " °C", meas: (x) => 50 * (x + 273.15) / 273.15, unitY: "mL" },
      gl: { lab: "Température du bain", min: 0, max: 100, def: 20, fmt: (v) => fr(v, 0) + " °C", meas: (x) => 101.3 * (x + 273.15) / 273.15, unitY: "kPa" }
    };
    const st = { exp: "boyle", x: 60, pts: { boyle: [], charles: [], gl: [] }, fit: false };
    const slider = document.getElementById("labo-x");
    const val = () => { const e = EXP[st.exp]; return e.min + (e.max - e.min) * parseFloat(slider.value) / 100; };
    const noise = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random() - 0.5; return s * 0.012; };
    function fit(pts) {
      const n = pts.length; if (n < 2) return null;
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; });
      const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n;
      return { a, b };
    }
    function apparatus(ctx, A, P, box) {
      const e = EXP[st.exp], x = st.x, y = e.meas(x);
      const cx = box.x + box.w / 2;
      if (st.exp === "boyle") {
        const y0 = box.y + box.h * 0.45, len = 240 * box.w / 330, x0 = cx - len / 2 + 34;
        const gas = len * (x / 65);
        ctx.fillStyle = draw.alpha(P.particle, 0.12); ctx.fillRect(x0, y0 - 22, gas, 44);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(x0, y0 - 22, len, 44);
        for (let k = 0; k <= 6; k++) { const xx = x0 + len * k * 10 / 65; ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xx, y0 - 22); ctx.lineTo(xx, y0 - 14); ctx.stroke(); draw.text(ctx, A, String(k * 10), xx, y0 - 30, { size: 10, color: P.ink3, align: "center", family: "mono" }); }
        ctx.fillStyle = P.metal; ctx.fillRect(x0 + gas, y0 - 20, 10, 40); ctx.fillRect(x0 + gas + 10, y0 - 4, len - gas + 30, 8); ctx.fillRect(x0 + len + 30, y0 - 22, 8, 44);
        const n = Math.round(30);
        for (let i = 0; i < n; i++) { const px = x0 + 6 + ((i * 53.7) % 1) * (gas - 12), py = y0 - 16 + ((i * 0.618) % 1) * 32; ctx.fillStyle = P.particle; ctx.beginPath(); ctx.arc(x0 + 5 + ((i * 37) % 100) / 100 * (gas - 10), py, 2.5, 0, Math.PI * 2); ctx.fill(); void px; }
        ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 30, y0); ctx.stroke();
        gauge(ctx, A, P, x0 - 30, y0 - 70, y, 450, "kPa");
        draw.text(ctx, A, "seringue bouchée, à température ambiante", cx, box.y + box.h - 16, { size: 12, color: P.ink2, align: "center" });
      } else {
        const bx = cx - 90, by = box.y + box.h * 0.35, bw = 180, bh = box.h * 0.55;
        ctx.fillStyle = draw.alpha(draw.heat(0.3 + x / 140), 0.5); ctx.fillRect(bx, by + 18, bw, bh - 18);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke();
        draw.text(ctx, A, "bain à " + fr(x, 0) + " °C", bx + bw + 8, by + bh - 12, { size: 12, color: P.ink2 });
        ctx.strokeStyle = P.ink3; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + bw - 22, by - 30); ctx.lineTo(bx + bw - 22, by + bh - 20); ctx.stroke();
        ctx.strokeStyle = P.hot; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + bw - 22, by + bh - 20); ctx.lineTo(bx + bw - 22, by + bh - 20 - (bh - 30) * (x + 10) / 130); ctx.stroke();
        if (st.exp === "charles") {
          const cw = 60, cxx = cx - 30, cbot = by + bh - 14, hgas = (y / 80) * (bh + 40);
          ctx.fillStyle = draw.alpha(P.particle, 0.15); ctx.fillRect(cxx - cw / 2, cbot - hgas, cw, hgas);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cxx - cw / 2, cbot - bh - 70); ctx.lineTo(cxx - cw / 2, cbot); ctx.lineTo(cxx + cw / 2, cbot); ctx.lineTo(cxx + cw / 2, cbot - bh - 70); ctx.stroke();
          ctx.fillStyle = P.metal; ctx.fillRect(cxx - cw / 2 + 2, cbot - hgas - 10, cw - 4, 10);
          ctx.fillStyle = P.ink2; ctx.fillRect(cxx - 14, cbot - hgas - 28, 28, 18);
          draw.text(ctx, A, "piston libre", cxx + cw / 2 + 8, cbot - hgas - 6, { size: 11, color: P.ink2 });
          draw.text(ctx, A, "p = cste", cxx + cw / 2 + 8, cbot - hgas + 10, { size: 11, color: P.ink3 });
        } else {
          const fx = cx - 30, fy = by + bh * 0.6, fr2 = 44;
          ctx.fillStyle = draw.alpha(P.particle, 0.15); ctx.beginPath(); ctx.arc(fx, fy, fr2, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx, fy - fr2); ctx.lineTo(fx, by - 40); ctx.lineTo(fx - 40, by - 40); ctx.stroke();
          gauge(ctx, A, P, fx - 40 - 36, by - 40, y, 150, "kPa");
          draw.text(ctx, A, "ballon rigide : V = cste", fx + fr2 + 8, fy, { size: 11, color: P.ink2 });
        }
      }
    }
    function gauge(ctx, A, P, gx, gy, v, vmax, unit) {
      const gr = 34;
      ctx.fillStyle = P.card; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      const a = Math.PI * 0.75 + Math.min(1, v / vmax) * Math.PI * 1.5;
      for (let k = 0; k <= 6; k++) { const aa = Math.PI * 0.75 + k / 6 * Math.PI * 1.5; ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx + Math.cos(aa) * (gr - 7), gy + Math.sin(aa) * (gr - 7)); ctx.lineTo(gx + Math.cos(aa) * (gr - 2), gy + Math.sin(aa) * (gr - 2)); ctx.stroke(); }
      ctx.strokeStyle = P.hot; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * (gr - 6), gy + Math.sin(a) * (gr - 6)); ctx.stroke();
      draw.text(ctx, A, unit, gx, gy + 14, { size: 9, color: P.ink3, align: "center" });
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const ab = land ? { x: 10, y: 20, w: 340, h: A.H - 40 } : { x: 20, y: 10, w: A.W - 40, h: A.H * 0.45 };
      const gb = land ? { x: 430, y: 40, w: A.W - 460, h: A.H - 100 } : { x: 80, y: A.H * 0.52, w: A.W - 110, h: A.H * 0.38 };
      apparatus(ctx, A, P, ab);
      const pts = st.pts[st.exp];
      let pl;
      if (st.exp === "boyle") {
        if (st.fit) {
          pl = plot(ctx, A, gb, { xmin: 0, xmax: 70, ymin: 0, ymax: 450, xstep: 10, ystep: 50, xlabel: "1/V (L⁻¹)", ylabel: "p (kPa)" });
          const tp = pts.map(([x, y]) => [1000 / x, y]);
          const f = fit(tp);
          if (f) curve(ctx, [[0, f.b], [70, f.a * 70 + f.b]], pl.X, pl.Y, P.accent, 1.6, [6, 4]);
          tp.forEach(([x, y]) => dot(ctx, pl.X(x), pl.Y(y), P.hot));
        } else {
          pl = plot(ctx, A, gb, { xmin: 0, xmax: 65, ymin: 0, ymax: 450, xstep: 10, ystep: 50, xlabel: "V (mL)", ylabel: "p (kPa)" });
          pts.forEach(([x, y]) => dot(ctx, pl.X(x), pl.Y(y), P.hot));
        }
      } else {
        const ymax = st.exp === "charles" ? 80 : 150;
        pl = plot(ctx, A, gb, { xmin: -300, xmax: 120, ymin: 0, ymax, xstep: 50, ystep: st.exp === "charles" ? 10 : 25, xlabel: "θ (°C)", ylabel: st.exp === "charles" ? "V (mL)" : "p (kPa)" });
        curve(ctx, [[-273.15, 0], [-273.15, ymax]], pl.X, pl.Y, P.rule, 1, [2, 4]);
        draw.text(ctx, A, "−273,15 °C", pl.X(-273.15) + 4, gb.y + 10, { size: 10, color: P.ink3 });
        const f = st.fit ? fit(pts) : null;
        if (f) {
          const x0 = -f.b / f.a;
          curve(ctx, [[x0, 0], [120, f.a * 120 + f.b]], pl.X, pl.Y, P.accent, 1.6, [6, 4]);
          dot(ctx, pl.X(x0), pl.Y(0), P.accent);
          draw.text(ctx, A, "zéro absolu estimé : " + fr(x0, 0) + " °C", pl.X(x0) + 8, pl.Y(0) - 14, { size: 12, color: P.accent, weight: 700 });
        }
        pts.forEach(([x, y]) => dot(ctx, pl.X(x), pl.Y(y), P.hot));
      }
    }
    function dot(ctx, x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); }
    const A = anim(cv, { draw: render, autoplay: false });
    const fitBtn = document.getElementById("labo-fit");
    function out() {
      const e = EXP[st.exp], pts = st.pts[st.exp];
      let s = "<span>" + (st.exp === "boyle" ? "V" : "θ") + " = <b>" + e.fmt(st.x) + "</b></span><span>mesures <b>" + pts.length + "</b></span>";
      if (pts.length) { const l = pts[pts.length - 1]; s += "<span>dernière mesure <b>" + fr(l[1], 1) + " " + e.unitY + "</b></span>"; }
      if (st.fit && pts.length >= 2) {
        if (st.exp === "boyle") { const f = fit(pts.map(([x, y]) => [1000 / x, y])); s += "<span>pente = pV <b>" + fr(f.a, 2) + " kPa·L</b>, ordonnée à l'origine <b>" + fr(f.b, 1) + " kPa</b></span>"; }
        else { const f = fit(pts); s += "<span>zéro absolu estimé <b>" + fr(-f.b / f.a, 1) + " °C</b></span>"; }
      } else if (st.fit) s += "<span><b>il faut au moins deux mesures</b></span>";
      document.getElementById("labo-read").innerHTML = s;
      A.redraw();
    }
    slider.addEventListener("input", () => { st.x = val(); const o = document.querySelector('output[for="labo-x"]'); if (o) o.textContent = EXP[st.exp].fmt(st.x); out(); });
    choice("labo-exp", (v) => {
      st.exp = v;
      const e = EXP[v];
      document.getElementById("labo-xlab").textContent = e.lab;
      slider.value = (e.def - e.min) / (e.max - e.min) * 100;
      slider.dispatchEvent(new Event("input"));
    });
    document.getElementById("labo-mes").addEventListener("click", () => {
      const e = EXP[st.exp];
      st.pts[st.exp].push([st.x, e.meas(st.x) * (1 + noise())]);
      out();
    });
    fitBtn.addEventListener("click", () => { st.fit = !st.fit; fitBtn.setAttribute("aria-pressed", st.fit ? "true" : "false"); out(); });
    document.getElementById("labo-clr").addEventListener("click", () => { st.pts[st.exp] = []; out(); });
  })();

  /* =================================================================
     Simulation 3.3 — La course des molécules (distribution de Maxwell)
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-maxwell");
    if (!cv) return;
    const GAZ = [
      { id: "H2", n: "H₂", M: 0.002016, on: true },
      { id: "He", n: "He", M: 0.004003, on: false },
      { id: "N2", n: "N₂", M: 0.028014, on: true },
      { id: "O2", n: "O₂", M: 0.031998, on: false },
      { id: "CO2", n: "CO₂", M: 0.04401, on: true },
      { id: "Xe", n: "Xe", M: 0.13129, on: false }
    ];
    const st = { T: 293, mol: {} };
    const colors = (P) => ({ H2: P.hot, He: P.flame, N2: P.cold, O2: P.energy, CO2: P.work, Xe: P.ink2 });
    const f = (v, M, T) => { const a = M / (2 * K.R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v); };
    const vq = (M, T) => Math.sqrt(3 * K.R * T / M);
    const gauss = () => { const u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    function sample(M, T) { const s = Math.sqrt(K.R * T / M); return Math.hypot(gauss() * s, gauss() * s, gauss() * s); }
    function initGas(g) { st.mol[g.id] = []; for (let i = 0; i < 14; i++) st.mol[g.id].push({ x: Math.random(), v: sample(g.M, st.T), y: Math.random() }); }
    GAZ.forEach(initGas);
    /* log10 de P(v > v_lib) */
    function tailLog10(x) {
      if (x < 4) {
        const t = 1 / (1 + 0.3275911 * x);
        const erfc = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
        return Math.log10(erfc + 2 / Math.sqrt(Math.PI) * x * Math.exp(-x * x));
      }
      return Math.log10(2 / Math.sqrt(Math.PI) * x * (1 + 1 / (2 * x * x))) - x * x / Math.LN10;
    }
    function fmtLog(l) {
      if (l > -4) return fr(Math.pow(10, l) * 100, 3) + " %";
      const e = Math.floor(l), m = Math.pow(10, l - e);
      return (m >= 1.5 ? fr(m, 1) + "·" : "") + "10" + String(e).split("").map((c) => ({ "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" })[c]).join("");
    }
    function update(A, dt) {
      GAZ.filter((g) => g.on).forEach((g) => st.mol[g.id].forEach((m) => { m.x = (m.x + m.v / 1000 * dt * 0.5) % 1; }));
    }
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const C = colors(P);
      const on = GAZ.filter((g) => g.on);
      const gb = { x: 70, y: 36, w: A.W - 100, h: land ? A.H * 0.46 : A.H * 0.4 };
      let fmax = 0;
      on.forEach((g) => { const vp = Math.sqrt(2 * K.R * st.T / g.M); fmax = Math.max(fmax, f(vp, g.M, st.T)); });
      fmax = fmax || 1e-3;
      const pl = plot(ctx, A, gb, { xmin: 0, xmax: 4000, ymin: 0, ymax: fmax * 1.12, xstep: 500, ystep: fmax * 1.12 / 4, xlabel: "v (m/s)", ylabel: "proportion de molécules", yfmt: () => "" });
      on.forEach((g) => {
        const pts = []; for (let v = 0; v <= 4000; v += 20) pts.push([v, f(v, g.M, st.T)]);
        ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = C[g.id];
        ctx.beginPath(); ctx.moveTo(pl.X(0), pl.Y(0)); pts.forEach((p) => ctx.lineTo(pl.X(p[0]), pl.Y(p[1]))); ctx.lineTo(pl.X(4000), pl.Y(0)); ctx.closePath(); ctx.fill(); ctx.restore();
        curve(ctx, pts, pl.X, pl.Y, C[g.id], 2.2);
        const q = vq(g.M, st.T);
        if (q < 4000) {
          curve(ctx, [[q, 0], [q, f(q, g.M, st.T)]], pl.X, pl.Y, C[g.id], 1.2, [3, 3]);
          draw.text(ctx, A, g.n, pl.X(q) + 4, pl.Y(f(q, g.M, st.T)) - 10, { size: 12, weight: 700, color: C[g.id] });
        } else draw.text(ctx, A, g.n + " →", gb.x + gb.w - 4, gb.y + 20, { size: 12, weight: 700, color: C[g.id], align: "right" });
      });
      draw.text(ctx, A, "pointillés : vitesse quadratique moyenne", gb.x + gb.w - 4, gb.y + 4, { size: 11, color: P.ink3, align: "right" });
      /* course */
      const ry = gb.y + gb.h + 56, rh = A.H - ry - 14, lane = on.length ? rh / on.length : rh;
      const x0 = 70, x1 = A.W - 30;
      draw.text(ctx, A, "La course (1 km/s ↔ la piste en 2 s)", x0, ry - 14, { size: 12, color: P.ink2, weight: 600 });
      on.forEach((g, i) => {
        const y = ry + i * lane;
        ctx.fillStyle = i % 2 ? P.paper : P.rule2; ctx.fillRect(x0, y, x1 - x0, lane);
        draw.text(ctx, A, g.n, x0 - 8, y + lane / 2, { size: 13, weight: 700, color: C[g.id], align: "right" });
        st.mol[g.id].forEach((m, k) => {
          ctx.fillStyle = C[g.id];
          ctx.beginPath(); ctx.arc(x0 + 6 + m.x * (x1 - x0 - 12), y + 6 + ((k * 0.37 + m.y) % 1) * (lane - 12), Math.min(5, lane / 4), 0, Math.PI * 2); ctx.fill();
        });
      });
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1; ctx.strokeRect(x0, ry, x1 - x0, rh);
    }
    const A = anim(cv, { draw: render, update });
    A.bindPlay(document.getElementById("mx-play"));
    function out() {
      const on = GAZ.filter((g) => g.on);
      document.getElementById("mx-read").innerHTML = on.map((g) => {
        const vp = Math.sqrt(2 * K.R * st.T / g.M);
        return "<span>" + g.n + " : v<sub>q</sub> = <b>" + fr(vq(g.M, st.T), 0) + " m/s</b>, plus rapides que 11,2 km/s : <b>" + fmtLog(tailLog10(11200 / vp)) + "</b></span>";
      }).join("") || "<span>Choisis au moins un gaz.</span>";
      A.redraw();
    }
    const box = document.getElementById("mx-gaz");
    GAZ.forEach((g) => {
      const b = document.createElement("button");
      b.className = "btn"; b.type = "button"; b.innerHTML = g.n + " <small>(" + fr(g.M * 1000, 0) + " g/mol)</small>";
      b.setAttribute("aria-pressed", g.on ? "true" : "false");
      b.addEventListener("click", () => { g.on = !g.on; b.setAttribute("aria-pressed", g.on ? "true" : "false"); out(); });
      box.appendChild(b);
    });
    range("mx-t", (v) => fr(v, 0) + " K (" + fr(v - 273.15, 0) + " °C)", (v) => {
      const r = Math.sqrt(v / st.T);
      Object.values(st.mol).forEach((arr) => arr.forEach((m) => { m.v *= r; }));
      st.T = v; out();
    });
  })();

  /* =================================================================
     Simulation 3.4 — Du Léman au sommet de l'Everest
     ================================================================= */
  (function () {
    const cv = document.getElementById("cv-alt");
    if (!cv) return;
    const LIEUX = [
      ["Genève (Léman)", 372], ["Berne", 540], ["La Chaux-de-Fonds", 1000], ["Zermatt", 1608],
      ["Grand-Saint-Bernard", 2469], ["Jungfraujoch", 3454], ["Pointe Dufour", 4634], ["Mont Blanc", 4806], ["Kilimandjaro", 5895], ["Everest", 8849]
    ];
    const H0 = 400, VMAX = 1.8;
    const st = { h: 372 };
    const Tstd = (h) => 288.15 - 0.0065 * h;
    const pres = (h) => 1013.25 * Math.pow(1 - 0.0065 * h / 288.15, 5.25588);
    const teb = (p) => 1 / (1 / 373.15 - K.R / 40660 * Math.log(p / 1013.25)) - 273.15;
    function render(ctx, A, P) {
      const land = A.W / A.H > 1.25;
      const ax = 70, top = 30, bot = A.H - 30, Y = (h) => bot - h / 9000 * (bot - top);
      const mw = land ? 300 : 330;
      /* montagnes stylisées */
      ctx.fillStyle = draw.alpha(P.ink3, 0.12);
      ctx.beginPath(); ctx.moveTo(ax, bot);
      const peaks = [[0.05, 372], [0.18, 1600], [0.3, 900], [0.45, 4634], [0.58, 2400], [0.72, 8849], [0.86, 3000], [1, 1200]];
      peaks.forEach(([fx, h]) => ctx.lineTo(ax + fx * mw, Y(h)));
      ctx.lineTo(ax + mw, bot); ctx.closePath(); ctx.fill();
      ctx.fillStyle = draw.alpha(P.card, 0.9);
      [[0.45, 4634], [0.72, 8849]].forEach(([fx, h]) => { const x = ax + fx * mw, y = Y(h); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 26, y + 40); ctx.lineTo(x + 22, y + 34); ctx.closePath(); ctx.fill(); });
      /* axe */
      ctx.strokeStyle = P.ink3; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, top); ctx.lineTo(ax, bot); ctx.stroke();
      for (let h = 0; h <= 9000; h += 1000) { const y = Y(h); ctx.beginPath(); ctx.moveTo(ax - 5, y); ctx.lineTo(ax, y); ctx.stroke(); draw.text(ctx, A, fr(h, 0), ax - 8, y, { size: 10, family: "mono", color: P.ink3, align: "right" }); }
      draw.text(ctx, A, "altitude (m)", ax - 60, top - 16, { size: 11, color: P.ink2 });
      /* lieux */
      const items = LIEUX.map(([n, h]) => ({ n, h, y: Y(h), y0: Y(h) }));
      for (let i = 1; i < items.length; i++) if (items[i - 1].y - items[i].y < 15) items[i].y = items[i - 1].y - 15;
      items.forEach((it) => {
        const near = Math.abs(it.h - st.h) < 15;
        ctx.strokeStyle = near ? P.accent : P.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, it.y0); ctx.lineTo(ax + 12, it.y); ctx.stroke();
        draw.text(ctx, A, it.n, ax + 16, it.y, { size: 11, color: near ? P.accent : P.ink2, weight: near ? 700 : 500 });
      });
      /* marqueur */
      const yh = Y(st.h);
      ctx.strokeStyle = P.hot; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ax, yh); ctx.lineTo(ax + mw + 10, yh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(ax, yh, 6, 0, Math.PI * 2); ctx.fill();
      const p = pres(st.h), ratio = pres(H0) / p;
      /* sachet de chips */
      const bx = land ? 470 : 560, by = land ? A.H * 0.3 : A.H * 0.22;
      const burst = ratio > VMAX;
      const puff = Math.min(ratio, VMAX);
      const bw = 110, bh = 140, bulge = (puff - 0.85) * 46;
      if (!burst) {
        ctx.fillStyle = draw.mix(P.flame, P.card, 0.35);
        ctx.beginPath();
        ctx.moveTo(bx - bw / 2, by - bh / 2);
        ctx.quadraticCurveTo(bx, by - bh / 2 - bulge * 0.4, bx + bw / 2, by - bh / 2);
        ctx.quadraticCurveTo(bx + bw / 2 + bulge, by, bx + bw / 2, by + bh / 2);
        ctx.quadraticCurveTo(bx, by + bh / 2 + bulge * 0.4, bx - bw / 2, by + bh / 2);
        ctx.quadraticCurveTo(bx - bw / 2 - bulge, by, bx - bw / 2, by - bh / 2);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = P.ink3; ctx.fillRect(bx - bw / 2, by - bh / 2 - 4, bw, 6); ctx.fillRect(bx - bw / 2, by + bh / 2 - 2, bw, 6);
        draw.text(ctx, A, "CHIPS", bx, by, { size: 20, weight: 800, align: "center", color: P.ink });
      } else {
        ctx.strokeStyle = P.hot; ctx.lineWidth = 2;
        for (let k = 0; k < 10; k++) { const a = k * 0.628; ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * 30, by + Math.sin(a) * 30); ctx.lineTo(bx + Math.cos(a) * 70, by + Math.sin(a) * 70); ctx.stroke(); }
        draw.text(ctx, A, "PAF !", bx, by, { size: 26, weight: 800, align: "center", color: P.hot });
      }
      draw.text(ctx, A, "volume : " + fr(ratio, 2) + " × celui à 400 m", bx, by + bh / 2 + 34, { size: 12, align: "center", color: P.ink2 });
      /* casserole */
      const cx = land ? 680 : 560, cy = land ? A.H * 0.36 : A.H * 0.62;
      const tb = teb(p);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 55, cy - 40); ctx.lineTo(cx - 55, cy + 30); ctx.lineTo(cx + 55, cy + 30); ctx.lineTo(cx + 55, cy - 40); ctx.stroke();
      ctx.fillStyle = draw.alpha(P.water, 0.5); ctx.fillRect(cx - 53, cy - 20, 106, 48);
      for (let k = 0; k < 6; k++) { ctx.strokeStyle = P.card; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - 40 + k * 16, cy + 10 - (k % 3) * 9, 3, 0, Math.PI * 2); ctx.stroke(); }
      draw.flame(ctx, cx, cy + 56, 70, 20, 1.3, true);
      draw.text(ctx, A, "l'eau bout à", cx, cy - 74, { size: 12, align: "center", color: P.ink2 });
      draw.text(ctx, A, fr(tb, 1) + " °C", cx, cy - 54, { size: 20, weight: 700, align: "center", family: "mono", color: tb < 95 ? P.hot : P.ink });
      /* colonne de pression */
      const px = land ? 600 : 560, py = land ? A.H - 60 : A.H - 70, pw = land ? 170 : 200;
      draw.text(ctx, A, "pression : " + fr(p, 0) + " hPa", px - 10, py - 18, { size: 12, color: P.ink2 });
      ctx.fillStyle = P.rule2; ctx.fillRect(px - 10, py, pw, 14);
      ctx.fillStyle = P.cold; ctx.fillRect(px - 10, py, pw * p / 1013.25, 14);
    }
    const A = anim(cv, { draw: render, autoplay: false });
    function out() {
      const p = pres(st.h), T = Tstd(st.h);
      document.getElementById("alt-read").innerHTML =
        "<span>p = <b>" + fr(p, 0) + " hPa</b> (" + fr(p / 1013.25 * 100, 0) + " % du niveau de la mer)</span>" +
        "<span>air (atmosphère standard) <b>" + fr(T - 273.15, 1) + " °C</b></span>" +
        "<span>masse volumique de l'air <b>" + fr(p * 100 * 0.029 / (K.R * T), 2) + " kg/m³</b></span>" +
        "<span>ébullition de l'eau <b>" + fr(teb(p), 1) + " °C</b></span>";
      A.redraw();
    }
    const r = range("alt-h", (v) => fr(v, 0) + " m", (v) => { st.h = v; out(); });
    const box = document.getElementById("alt-lieux");
    LIEUX.forEach(([n, h]) => {
      const b = document.createElement("button");
      b.className = "btn"; b.type = "button"; b.textContent = n + " (" + fr(h, 0) + " m)";
      b.addEventListener("click", () => r.set(h));
      box.appendChild(b);
    });
  })();
})();
