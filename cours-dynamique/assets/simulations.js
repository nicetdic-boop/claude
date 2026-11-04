/* =====================================================================
   Dynamique au gymnase — les neuf simulations
   Toutes les valeurs affichées sont calculées avec les formules du cours
   (g = 9,81 m/s²). Les dessins ne sont pas à l'échelle, les flèches de
   force le sont entre elles dans chaque simulation.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.Dyn;
  const { C, G, fr, sig, text, arrow, vlabel, line, rrect, axes, polyline, hatch, $, bindRange, readouts } = D;
  const deg = Math.PI / 180;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const kmh = (v) => v * 3.6;

  function setPlay(btn, running, labels) {
    if (btn) btn.textContent = running ? labels[1] : labels[0];
  }

  /* ===================================================================
     1. Somme de forces
     =================================================================== */
  function simSomme() {
    const cv = $("cv-somme");
    if (!cv) return;
    const out = $("somme-out");
    const btn3 = $("somme-f3"), btnChain = $("somme-chain");
    const F = [
      { x: 30, y: 0, col: "app", sub: "1" },
      { x: 0, y: 40, col: "tension", sub: "2" },
      { x: -20, y: -30, col: "ressort", sub: "3" }
    ];
    let show3 = false, chain = true, drag = -1, sel = 0;
    let geo = { cx: 0, cy: 0, k: 3 };

    function active() { return show3 ? F : F.slice(0, 2); }
    function sum() { return active().reduce((s, f) => ({ x: s.x + f.x, y: s.y + f.y }), { x: 0, y: 0 }); }
    function ang(v) { return ((Math.atan2(v.y, v.x) / deg) + 360) % 360; }

    const st = new D.Stage(cv, {
      minW: 460,
      draw(ctx, W, H) {
        const cell = Math.max(18, Math.min(W, H) / 14);
        const k = cell / 10;
        const cx = W / 2, cy = H / 2;
        geo = { cx, cy, k };
        // quadrillage
        for (let x = cx % cell; x < W; x += cell) line(ctx, x, 0, x, H, C.rule2, 1);
        for (let y = cy % cell; y < H; y += cell) line(ctx, 0, y, W, y, C.rule2, 1);
        line(ctx, 0, cy, W, cy, C.rule, 1.2);
        line(ctx, cx, 0, cx, H, C.rule, 1.2);
        // échelle
        line(ctx, 16, H - 18, 16 + cell, H - 18, C.ink2, 2);
        line(ctx, 16, H - 22, 16, H - 14, C.ink2, 2);
        line(ctx, 16 + cell, H - 22, 16 + cell, H - 14, C.ink2, 2);
        text(ctx, "10 N", 22 + cell, H - 14, { size: 12, color: C.ink2, kind: "mono" });
        // caisse
        ctx.save();
        ctx.fillStyle = C.accentSoft;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1.5;
        rrect(ctx, cx - 17, cy - 17, 34, 34, 3);
        ctx.fill(); ctx.stroke();
        ctx.restore();
        const act = active();
        // construction bout à bout
        if (chain && act.length > 1) {
          let px = cx + act[0].x * k, py = cy - act[0].y * k;
          for (let i = 1; i < act.length; i++) {
            const nx = px + act[i].x * k, ny = py - act[i].y * k;
            arrow(ctx, px, py, nx, ny, C[act[i].col], { width: 1.6, dash: [5, 4], head: 9 });
            px = nx; py = ny;
          }
        }
        // forces
        act.forEach((f, i) => {
          const tx = cx + f.x * k, ty = cy - f.y * k;
          arrow(ctx, cx, cy, tx, ty, C[f.col], { width: 3.5, label: "F", sub: f.sub, labelOff: 16 });
          ctx.save();
          ctx.beginPath();
          ctx.arc(tx, ty, i === sel ? 7 : 6, 0, Math.PI * 2);
          ctx.fillStyle = C.card;
          ctx.strokeStyle = C[f.col];
          ctx.lineWidth = i === sel ? 3 : 2;
          ctx.fill(); ctx.stroke();
          ctx.restore();
        });
        // résultante
        const R = sum();
        const mag = Math.hypot(R.x, R.y);
        if (mag >= 0.5) {
          arrow(ctx, cx, cy, cx + R.x * k, cy - R.y * k, C.res, { width: 5, label: "ΣF", labelOff: 18 });
        } else {
          text(ctx, "ΣF = 0 : équilibre", cx, cy + 44, { size: 15, weight: 600, align: "center", color: C.ink, halo: C.card });
        }
      }
    });

    function hit(p) {
      const act = active();
      let best = -1, bd = 26;
      act.forEach((f, i) => {
        const d = Math.hypot(geo.cx + f.x * geo.k - p.x, geo.cy - f.y * geo.k - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }
    function setFrom(i, p) {
      const W = st.W, H = st.H;
      const x = clamp(p.x, 10, W - 10), y = clamp(p.y, 10, H - 10);
      F[i].x = Math.round((x - geo.cx) / geo.k);
      F[i].y = Math.round((geo.cy - y) / geo.k);
    }
    cv.setAttribute("tabindex", "0");
    cv.addEventListener("pointerdown", (e) => {
      const p = st.toLocal(e);
      const i = hit(p);
      if (i >= 0) { drag = i; sel = i; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; e.preventDefault(); }
    });
    cv.addEventListener("pointermove", (e) => {
      const p = st.toLocal(e);
      if (drag >= 0) { setFrom(drag, p); update(); }
      else cv.style.cursor = hit(p) >= 0 ? "grab" : "default";
    });
    const end = () => { drag = -1; cv.style.cursor = "default"; };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("keydown", (e) => {
      const n = active().length;
      if (e.key >= "1" && e.key <= String(n)) { sel = +e.key - 1; update(); return; }
      const step = e.shiftKey ? 10 : 1;
      const f = F[sel];
      if (e.key === "ArrowLeft") f.x -= step;
      else if (e.key === "ArrowRight") f.x += step;
      else if (e.key === "ArrowUp") f.y += step;
      else if (e.key === "ArrowDown") f.y -= step;
      else return;
      e.preventDefault();
      update();
    });
    btn3.addEventListener("click", () => {
      show3 = !show3;
      if (!show3 && sel > 1) sel = 0;
      update();
    });
    btnChain.addEventListener("click", () => { chain = !chain; update(); });
    document.querySelectorAll("#sim-somme [data-preset]").forEach((b) => b.addEventListener("click", () => {
      const p = b.dataset.preset;
      if (p === "perp") { show3 = false; Object.assign(F[0], { x: 30, y: 0 }); Object.assign(F[1], { x: 0, y: 40 }); }
      if (p === "corde") { show3 = false; Object.assign(F[0], { x: -50, y: 0 }); Object.assign(F[1], { x: 45, y: 0 }); }
      if (p === "equi") { show3 = true; Object.assign(F[0], { x: 30, y: 40 }); Object.assign(F[1], { x: -50, y: 0 }); Object.assign(F[2], { x: 20, y: -40 }); }
      update();
    }));

    function update() {
      btn3.setAttribute("aria-pressed", String(show3));
      btn3.textContent = show3 ? "Retirer F₃" : "Ajouter F₃";
      btnChain.setAttribute("aria-pressed", String(chain));
      const R = sum();
      const mag = Math.hypot(R.x, R.y);
      const items = active().map((f) => ["F" + "₁₂₃"[+f.sub - 1] + " =", fr(Math.hypot(f.x, f.y), 1) + " N"]);
      items.push(["ΣF =", fr(mag, 1) + " N"]);
      if (mag >= 0.5) items.push(["direction", fr(ang(R), 1) + "°"]);
      items.push(["Rx =", fr(R.x, 0) + " N"], ["Ry =", fr(R.y, 0) + " N"]);
      if (mag < 0.5) items.push({ state: "Équilibre : la caisse ne change pas de vitesse", cls: "is-ok" });
      readouts(out, items);
      st.invalidate();
    }
    update();
  }

  /* ===================================================================
     2. Loi de Hooke
     =================================================================== */
  function simHooke() {
    const cv = $("cv-hooke");
    if (!cv) return;
    const out = $("hooke-out");
    const sel = $("hooke-ressort");
    const KM = 32; // raideur du ressort mystère
    let key = sel.value, k = 20, m = 0.2;
    let x = m * G / k, v = 0;
    const pts = { "20": [], "50": [], mystere: [] };
    let msg = "";

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const meff = Math.max(m, 0.03);
        const w = Math.sqrt(k / meff);
        const c = 2 * 0.2 * w;
        const n = 8, h = dt / n;
        for (let i = 0; i < n; i++) {
          const a = (m * G - k * x) / meff - c * v;
          v += a * h;
          x += v * h;
        }
        const xe = m * G / k;
        if (Math.abs(x - xe) < 4e-4 && Math.abs(v) < 4e-3) { x = xe; v = 0; st.running = false; updOut(); }
        else if (Math.random() < 0.15) updOut();
      },
      draw(ctx, W, H) {
        const zone = Math.min(W * 0.42, 330);
        const cx = zone * 0.42;
        const top = 34;
        const L0 = 86;
        const ppm = (H - top - L0 - 90) / 0.27; // pixels par mètre d'allongement
        // plafond
        ctx.fillStyle = C.rule2;
        ctx.fillRect(cx - 60, top - 14, 120, 14);
        hatch(ctx, cx - 60, cx + 60, top - 22, C.ink3, 10);
        line(ctx, cx - 60, top, cx + 60, top, C.ink, 2);
        // ressort
        const yEnd = top + L0 + x * ppm;
        const y1 = top + 10, y2 = yEnd - 10;
        line(ctx, cx, top, cx, y1, C.ink, 2);
        line(ctx, cx, y2, cx, yEnd, C.ink, 2);
        ctx.save();
        ctx.strokeStyle = C.ressort;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        const nz = 16;
        ctx.moveTo(cx, y1);
        for (let i = 1; i < nz; i++) {
          const yy = y1 + (y2 - y1) * i / nz;
          ctx.lineTo(cx + (i % 2 ? 13 : -13), yy);
        }
        ctx.lineTo(cx, y2);
        ctx.stroke();
        ctx.restore();
        // masses (disques de 50 g)
        const nd = Math.round(m / 0.05);
        let yb = yEnd;
        ctx.save();
        ctx.fillStyle = C.metal;
        ctx.strokeStyle = C.ink2;
        ctx.lineWidth = 1;
        if (nd === 0) {
          ctx.beginPath(); ctx.arc(cx, yEnd + 6, 6, 0, Math.PI); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
        }
        for (let i = 0; i < nd; i++) {
          rrect(ctx, cx - 22, yb + i * 8, 44, 7, 2);
          ctx.fill(); ctx.stroke();
        }
        ctx.restore();
        const mc = yEnd + Math.max(nd, 1) * 4;
        // règle graduée
        const rx = cx + 46;
        const y0 = top + L0;
        ctx.fillStyle = C.signal;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(rx, y0 - 6, 30, 0.26 * ppm + 12);
        ctx.globalAlpha = 1;
        line(ctx, rx, y0 - 6, rx, y0 + 0.26 * ppm + 6, C.ink2, 1.2);
        for (let cm = 0; cm <= 26; cm++) {
          const yy = y0 + cm / 100 * ppm;
          const big = cm % 5 === 0;
          line(ctx, rx, yy, rx + (big ? 14 : 7), yy, C.ink2, 1);
          if (big) text(ctx, String(cm), rx + 18, yy + 4, { size: 11, color: C.ink2, kind: "mono" });
        }
        text(ctx, "cm", rx + 18, y0 - 12, { size: 11, color: C.ink3, kind: "mono" });
        // repère
        ctx.save();
        ctx.fillStyle = C.app;
        ctx.beginPath(); ctx.moveTo(rx - 2, yEnd); ctx.lineTo(rx - 11, yEnd - 5); ctx.lineTo(rx - 11, yEnd + 5); ctx.fill();
        ctx.restore();
        line(ctx, cx + 24, yEnd, rx - 2, yEnd, C.app, 1, [3, 3]);
        // forces sur la masse
        if (m > 0) {
          const s = 20; // px par N
          arrow(ctx, cx - 30, mc, cx - 30, mc - k * x * s, C.ressort, { width: 3, label: "F", sub: "él", labelOff: 14 });
          arrow(ctx, cx - 30, mc, cx - 30, mc + m * G * s, C.poids, { width: 3, label: "P", labelOff: 14 });
        }
        // graphique F(Δl)
        const gx = zone + 44, gw = W - gx - 22, gy = 34, gh = H - 88;
        const A = axes(ctx, { x: gx, y: gy, w: gw, h: gh }, { xmax: 25, ymax: 5, xstep: 5, ystep: 1, xlabel: "Δl (cm)", ylabel: "F (N)" });
        const P = pts[key];
        if (P.length) {
          let sxy = 0, sxx = 0;
          P.forEach((p) => { sxy += p.dl * p.F; sxx += p.dl * p.dl; });
          const kf = sxy / sxx;
          const xe = Math.min(25, 5 / kf * 100);
          line(ctx, A.X(0), A.Y(0), A.X(xe), A.Y(kf * xe / 100), C.accent, 1.5, [6, 4]);
          if (P.length >= 2) text(ctx, "pente : k ≈ " + fr(kf, 1) + " N/m", gx + 10, gy + 16, { size: 13, color: C.accent, weight: 600, halo: C.card });
          P.forEach((p) => {
            ctx.beginPath();
            ctx.arc(A.X(p.dl * 100), A.Y(p.F), 4.5, 0, Math.PI * 2);
            ctx.fillStyle = C.accent; ctx.fill();
          });
        } else {
          text(ctx, "Note tes mesures : elles s'affichent ici", gx + gw / 2, gy + gh / 2, { size: 13, color: C.ink3, align: "center" });
        }
      }
    });

    function updOut() {
      const xe = m * G / k;
      const settled = !st.running;
      readouts(out, [
        ["m =", fr(m * 1000, 0) + " g"],
        ["P = m·g =", fr(m * G, 2) + " N"],
        ["Δl lu =", fr(x * 100, 1) + " cm"],
        ["k =", key === "mystere" ? "?" : fr(k, 0) + " N/m"],
        { state: msg || (settled ? "Au repos : F<sub>él</sub> = P" : "Oscille… attends qu'il se calme"), cls: msg ? "is-bad" : "" }
      ]);
      void xe;
    }
    function setSpring() {
      key = sel.value;
      k = key === "mystere" ? KM : parseFloat(key);
      msg = "";
      st.start(); updOut();
    }
    sel.addEventListener("change", setSpring);
    bindRange("hooke-m", (v) => fr(v, 0) + " g", (val) => { m = val / 1000; msg = ""; st.start(); updOut(); });
    $("hooke-noter").addEventListener("click", () => {
      if (st.running) { msg = "Attends que le ressort soit immobile pour lire la règle."; updOut(); return; }
      if (m === 0) { msg = "Accroche d'abord une masse."; updOut(); return; }
      const dl = Math.round(x * 1000) / 1000; // lecture au mm
      const P = pts[key];
      if (!P.some((p) => Math.abs(p.F - m * G) < 1e-6)) P.push({ dl, F: m * G });
      msg = ""; updOut(); st.invalidate();
    });
    $("hooke-effacer").addEventListener("click", () => { pts[key].length = 0; st.invalidate(); });
    k = parseFloat(key) || 20;
    x = m * G / k;
    updOut();
  }

  /* ===================================================================
     3. Inertie : la pierre de curling
     =================================================================== */
  function simInertie() {
    const cv = $("cv-inertie");
    if (!cv) return;
    const out = $("inertie-out");
    const go = $("inertie-go");
    const MS = 19; // masse de la pierre (kg)
    const HOUSE = 32, R12 = 1.83;
    let mu = parseFloat($("inertie-surface").value), v0 = parseFloat($("inertie-v0").value);
    let x = 0, v = 0, t = 0, launched = false, done = false;
    let hist = [], ghost = null;
    const speed = () => (mu < 0.05 ? 3 : 1);

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const n = 4, h = dt * speed() / n;
        for (let i = 0; i < n; i++) {
          if (v <= 0) break;
          const a = -mu * G;
          v = Math.max(0, v + a * h);
          x += v * h;
          t += h;
        }
        if (!hist.length || t - hist[hist.length - 1][0] > 0.05) hist.push([t, v]);
        if (v <= 0) { v = 0; finish(); }
        else if (x > 60) finish(true);
        if (Math.random() < 0.2) updOut();
      },
      draw(ctx, W, H) {
        const bandY = 26, bandH = Math.min(H * 0.38, 150);
        const wm = 12; // largeur de vue en mètres
        const ppm = W / wm;
        const cam = x - 2.5;
        const X = (m) => (m - cam) * ppm;
        // surface
        const surf = mu === 0 ? C.ice : mu < 0.1 ? C.ice : mu < 0.4 ? C.wood : C.rule;
        ctx.fillStyle = surf;
        ctx.fillRect(0, bandY, W, bandH);
        line(ctx, 0, bandY, W, bandY, C.ink3, 1.2);
        line(ctx, 0, bandY + bandH, W, bandY + bandH, C.ink3, 1.2);
        // maison
        if (mu < 0.1 && X(HOUSE + R12) > 0 && X(HOUSE - R12) < W) {
          const hc = bandY + bandH / 2;
          ctx.save();
          ctx.beginPath(); ctx.rect(0, bandY, W, bandH); ctx.clip();
          [[R12, C.normale], [1.22, C.card], [0.61, C.app], [0.15, C.card]].forEach(([r, col]) => {
            ctx.beginPath();
            ctx.arc(X(HOUSE), hc, r * ppm, 0, Math.PI * 2);
            ctx.fillStyle = col; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
          });
          ctx.restore();
          text(ctx, "maison", X(HOUSE), bandY + bandH + 16, { size: 12, color: C.ink2, align: "center" });
        }
        // graduations
        line(ctx, X(0), bandY, X(0), bandY + bandH, C.ink2, 2);
        for (let m = Math.max(0, Math.ceil(cam)); m <= cam + wm + 1; m++) {
          const xx = X(m);
          const big = m % 5 === 0;
          line(ctx, xx, bandY + bandH, xx, bandY + bandH - (big ? 12 : 5), C.ink3, 1);
          if (big) text(ctx, m + " m", xx, bandY - 8, { size: 11, color: C.ink3, align: "center", kind: "mono" });
        }
        // pierre
        const sx = X(x), sy = bandY + bandH / 2;
        ctx.save();
        ctx.beginPath(); ctx.arc(sx, sy, 17, 0, Math.PI * 2);
        ctx.fillStyle = C.metal; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink2; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fillStyle = C.app; ctx.fill();
        ctx.restore();
        // vecteurs
        if (v > 0) arrow(ctx, sx + 20, sy - 30, sx + 20 + v * 28, sy - 30, C.vit, { width: 3, label: "v", labelOff: 12 });
        if (v > 0 && mu > 0) {
          const ff = mu * MS * G;
          const len = Math.max(12, ff * 0.9);
          arrow(ctx, sx - 20, sy + 28, sx - 20 - len, sy + 28, C.frott, { width: 3, label: "F", sub: "f", labelOff: 14 });
        }
        // graphique v(t)
        const gy = bandY + bandH + 46, gh = H - gy - 34;
        if (gh > 50) {
          const tmax = Math.max(10, Math.ceil(Math.max(t, ghost ? ghost.tmax : 0) / 5) * 5);
          const A = axes(ctx, { x: 46, y: gy, w: W - 70, h: gh }, { xmax: tmax, ymax: 4, ystep: 1, xlabel: "t (s)", ylabel: "v (m/s)" });
          if (ghost) polyline(ctx, ghost.pts, A.X, A.Y, C.ink3, 1.5, [4, 4]);
          polyline(ctx, hist.concat(launched ? [[t, v]] : []), A.X, A.Y, C.vit, 2.5);
        }
      }
    });

    function finish(gone) {
      st.running = false;
      done = true;
      hist.push([t, v]);
      setPlay(go, false, ["Lancer", "Pause"]);
      updOut(gone);
    }
    function updOut(gone) {
      const items = [
        ["t =", fr(t, 1) + " s" + (speed() > 1 ? " (film accéléré ×3)" : "")],
        ["v =", fr(v, 2) + " m/s"],
        ["distance =", fr(x, 2) + " m"],
        ["a = −μ·g =", fr(-mu * G, 3) + " m/s²"],
        ["ΣF = F<sub>f</sub> =", fr(mu * MS * G, 1) + " N"]
      ];
      let s = "", cls = "";
      if (!launched) s = "Pierre de 19 kg, prête à partir. P et N se compensent.";
      else if (gone || (done && x > 60)) { s = "La pierre a quitté la piste à " + fr(v, 1) + " m/s. Sans frottement, elle ne s'arrêterait jamais."; cls = "is-ok"; }
      else if (done && Math.abs(x - HOUSE) <= R12 + 0.15 && mu < 0.1) { s = "Dans la maison ! Arrêtée à " + fr(x, 1) + " m."; cls = "is-ok"; }
      else if (done) s = "Arrêtée après " + fr(x, 2) + " m, en " + fr(t, 1) + " s.";
      else s = mu === 0 ? "Aucune force horizontale : vitesse constante." : "Seul le frottement agit horizontalement : la pierre ralentit.";
      items.push({ state: s, cls });
      readouts(out, items);
    }
    function reset() {
      if (launched && hist.length > 1) ghost = { pts: hist.slice(), tmax: t };
      x = 0; v = 0; t = 0; launched = false; done = false; hist = [];
      st.stop();
      setPlay(go, false, ["Lancer", "Pause"]);
      updOut();
    }
    go.addEventListener("click", () => {
      if (st.running) { st.running = false; setPlay(go, false, ["Reprendre", "Pause"]); st.invalidate(); return; }
      if (done || !launched) { if (done) reset(); launched = true; v = v0; hist = [[0, v0]]; }
      st.start();
      setPlay(go, true, ["Lancer", "Pause"]);
      updOut();
    });
    $("inertie-reset").addEventListener("click", reset);
    $("inertie-surface").addEventListener("change", (e) => { mu = parseFloat(e.target.value); if (!st.running) reset(); updOut(); st.invalidate(); });
    bindRange("inertie-v0", (val) => fr(val, 1) + " m/s", (val) => { v0 = val; if (!launched) updOut(); });
    updOut();
  }

  /* ===================================================================
     4. Deuxième loi : le chariot
     =================================================================== */
  function simChariot() {
    const cv = $("cv-chariot");
    if (!cv) return;
    const out = $("chariot-out");
    const go = $("chariot-go");
    const LEN = 2.0, TMAX = 6;
    let Ft = 6, m = 2, mu = 0;
    let x = 0, v = 0, t = 0, moving = false, finished = false, blocked = false;
    let runs = [], cur = null;
    const colors = () => [C.accent, C.app, C.tension, C.poids];

    function acc() {
      const fmax = mu * m * G;
      if (Ft <= fmax + 1e-9) return 0;
      return (Ft - fmax) / m;
    }

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const a = acc();
        const n = 4, h = dt / n;
        for (let i = 0; i < n; i++) {
          v += a * h; x += v * h; t += h;
          if (x >= LEN || t >= TMAX) break;
        }
        if (cur && (t - cur.pts[cur.pts.length - 1][0] > 0.03)) cur.pts.push([t, v]);
        if (x >= LEN || t >= TMAX) {
          if (x > LEN) { // interpolation exacte du point d'arrivée
            const tt = (Math.sqrt(2 * a * LEN) ) / a;
            t = tt; v = a * tt; x = LEN;
          }
          cur.pts.push([t, v]);
          cur.a = v / t;
          st.running = false; moving = false; finished = true;
          setPlay(go, false, ["Relancer", ""]);
        }
        updOut();
      },
      draw(ctx, W, H) {
        const trackY = Math.min(H * 0.4, 185);
        const x0 = 30, x1 = W - 150;
        const ppm = (x1 - x0 - 80) / LEN;
        // rail
        ctx.fillStyle = C.rule2;
        ctx.fillRect(x0, trackY, x1 - x0 + 90, 8);
        line(ctx, x0, trackY, x1 + 90, trackY, C.ink3, 1.5);
        for (let d = 0; d <= LEN + 1e-9; d += 0.5) {
          const xx = x0 + 40 + d * ppm;
          line(ctx, xx, trackY + 8, xx, trackY + 16, C.ink3, 1);
          text(ctx, fr(d, 1) + " m", xx, trackY + 30, { size: 11, color: C.ink3, align: "center", kind: "mono" });
        }
        // butoir
        ctx.fillStyle = C.ink2;
        ctx.fillRect(x0 + 40 + LEN * ppm + 40, trackY - 26, 8, 26);
        // chariot
        const cx = x0 + 40 + x * ppm;
        const cw = 76, ch = 30;
        const cy = trackY - 8 - ch / 2;
        ctx.save();
        ctx.fillStyle = C.accentSoft;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1.6;
        rrect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 4);
        ctx.fill(); ctx.stroke();
        // masses posées
        const nb = Math.round(m / 0.5);
        ctx.fillStyle = C.metal;
        for (let i = 0; i < nb; i++) {
          const col = i % 5, row = Math.floor(i / 5);
          rrect(ctx, cx - 30 + col * 12, cy - ch / 2 - 9 - row * 9, 10, 8, 1.5);
          ctx.fill();
        }
        ctx.fillStyle = C.ink2;
        [-22, 22].forEach((o) => { ctx.beginPath(); ctx.arc(cx + o, trackY - 5, 5, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
        text(ctx, fr(m, 2) + " kg", cx, cy + 5, { size: 12, align: "center", kind: "mono", color: C.ink });
        // dynamomètre
        const dx = cx + cw / 2 + 50;
        line(ctx, cx + cw / 2, cy, dx, cy, C.ink2, 1.5);
        ctx.save();
        ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2;
        rrect(ctx, dx, cy - 9, 58, 18, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
        text(ctx, fr(Ft, 1) + " N", dx + 29, cy + 4, { size: 11, align: "center", kind: "mono" });
        // forces
        const s = 5.5; // px par N
        const fmax = mu * m * G;
        const ff = Ft <= fmax ? Ft : fmax;
        const a = acc();
        const fy = cy - ch / 2 - 22;
        if (Ft > 0) arrow(ctx, cx + cw / 2, fy, cx + cw / 2 + Ft * s, fy, C.app, { width: 3, label: "F", labelOff: 12 });
        if (ff > 0) arrow(ctx, cx - cw / 2, fy, cx - cw / 2 - ff * s, fy, C.frott, { width: 3, label: "F", sub: "f", labelOff: 14 });
        const net = Ft - ff;
        if (net > 0.01) arrow(ctx, cx - (net * s) / 2, fy - 34, cx + (net * s) / 2, fy - 34, C.res, { width: 4, label: "ΣF", labelOff: 18 });
        if (a > 0) arrow(ctx, cx - 30, fy - 66, cx - 30 + Math.min(150, a * 12), fy - 66, C.acc, { width: 3, label: "a", labelOff: 12 });
        // graphique v(t)
        const gy = trackY + 64, gh = H - gy - 36;
        if (gh > 60) {
          let vmax = 2, tm = 2;
          runs.forEach((r) => r.pts.forEach((p) => { vmax = Math.max(vmax, p[1]); tm = Math.max(tm, p[0]); }));
          vmax = Math.ceil(vmax * 1.1);
          tm = Math.min(TMAX, Math.ceil(tm * 2) / 2);
          const A = axes(ctx, { x: 46, y: gy, w: W - 70 - 120, h: gh }, { xmax: tm, ymax: vmax, xlabel: "t (s)", ylabel: "v (m/s)" });
          const cols = colors();
          runs.forEach((r, i) => {
            polyline(ctx, r.pts, A.X, A.Y, cols[i % 4], 2.5);
            text(ctx, r.label, W - 128, gy + 14 + i * 18, { size: 12, color: cols[i % 4], weight: 600, kind: "mono" });
          });
          if (!runs.length) text(ctx, "Lance le chariot : sa courbe v(t) s'affiche ici", 46 + (W - 190) / 2, gy + gh / 2, { size: 13, color: C.ink3, align: "center" });
        }
      }
    });

    function updOut() {
      const fmax = mu * m * G;
      const a = acc();
      blocked = Ft <= fmax + 1e-9;
      const items = [
        ["a prévue = (F − F<sub>f</sub>)/m =", fr(a, 2) + " m/s²"],
        ["t =", fr(t, 2) + " s"],
        ["v =", fr(v, 2) + " m/s"],
        ["x =", fr(x, 2) + " m"]
      ];
      if (cur && t > 0.05) items.splice(1, 0, ["a mesurée = v/t =", fr(v / t, 2) + " m/s²"]);
      if (blocked) items.push({ state: Ft === 0 ? "Aucune force de traction." : "Le chariot ne bouge pas : F ≤ μ·m·g = " + fr(fmax, 1) + " N", cls: "is-bad" });
      else if (finished) items.push({ state: x >= LEN ? "Arrivé au butoir après " + fr(t, 2) + " s." : "Temps écoulé.", cls: "is-ok" });
      readouts(out, items);
    }
    function launch() {
      if (st.running) return;
      x = 0; v = 0; t = 0; finished = false;
      if (acc() <= 0) { updOut(); st.invalidate(); return; }
      cur = { pts: [[0, 0]], label: fr(Ft, 1) + " N · " + fr(m, 2) + " kg" + (mu ? " · μ " + fr(mu, 2) : ""), a: 0 };
      runs.push(cur);
      if (runs.length > 4) runs.shift();
      moving = true;
      setPlay(go, true, ["Lancer", "En route…"]);
      st.start();
    }
    function changed() {
      if (!st.running) { x = 0; v = 0; t = 0; finished = false; cur = null; setPlay(go, false, ["Lancer", ""]); }
      updOut(); st.invalidate();
    }
    go.addEventListener("click", launch);
    $("chariot-effacer").addEventListener("click", () => { if (!st.running) { runs = []; cur = null; changed(); } });
    bindRange("chariot-f", (val) => fr(val, 1) + " N", (val) => { Ft = val; changed(); });
    bindRange("chariot-m", (val) => fr(val, 2) + " kg", (val) => { m = val; changed(); });
    $("chariot-mu").addEventListener("change", (e) => { mu = parseFloat(e.target.value); changed(); });
    updOut();
    void moving;
  }

  /* ===================================================================
     5. Troisième loi : les patineurs
     =================================================================== */
  function simPatineurs() {
    const cv = $("cv-patineurs");
    if (!cv) return;
    const out = $("pat-out");
    const go = $("pat-go");
    const DT = 0.5, HALF = 5.6;
    let mA = 50, mB = 75, F = 150;
    let phase = "ready", t = 0, xA = -0.32, xB = 0.32, vA = 0, vB = 0;

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const n = 4, h = dt / n;
        for (let i = 0; i < n; i++) {
          if (phase === "push") {
            vA -= F / mA * h; vB += F / mB * h;
            t += h;
            if (t >= DT) { vA = -F * DT / mA; vB = F * DT / mB; phase = "glide"; }
          } else t += h;
          xA += vA * h; xB += vB * h;
          if (xA < -HALF) { xA = -HALF; vA = 0; }
          if (xB > HALF) { xB = HALF; vB = 0; }
        }
        if (phase === "glide" && vA === 0 && vB === 0) { phase = "done"; st.running = false; }
        if (phase === "glide" && t > 12) { phase = "done"; st.running = false; }
        updOut();
      },
      draw(ctx, W, H) {
        const ppm = (W - 60) / (2 * HALF + 0.6);
        const cx = W / 2;
        const ground = H - 44;
        // patinoire
        ctx.fillStyle = C.ice;
        ctx.fillRect(16, ground, W - 32, 18);
        line(ctx, 16, ground, W - 16, ground, C.ink3, 1.2);
        ctx.fillStyle = C.ink2;
        ctx.fillRect(cx - HALF * ppm - 22, ground - 34, 6, 52);
        ctx.fillRect(cx + HALF * ppm + 16, ground - 34, 6, 52);
        for (let m = -5; m <= 5; m++) {
          line(ctx, cx + m * ppm, ground + 18, cx + m * ppm, ground + 24, C.ink3, 1);
          if (m % 5 === 0) text(ctx, m + " m", cx + m * ppm, ground + 36, { size: 11, color: C.ink3, align: "center", kind: "mono" });
        }
        const hgt = Math.min(H * 0.5, 190);
        function skater(xm, mass, facing, name) {
          const px = cx + xm * ppm;
          const w = 9 + mass / 12;
          const head = ground - hgt;
          ctx.save();
          ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 3;
          // patins
          line(ctx, px - 16, ground - 2, px + 16, ground - 2, C.ink2, 3);
          // jambes
          ctx.beginPath(); ctx.moveTo(px - 6, ground - 4); ctx.lineTo(px - 3, ground - hgt * 0.45); ctx.lineTo(px + 6, ground - 4); ctx.stroke();
          // corps
          ctx.fillStyle = facing > 0 ? C.tension : C.normale;
          rrect(ctx, px - w / 2, ground - hgt * 0.82, w, hgt * 0.4, w / 3); ctx.fill();
          // bras tendus vers l'autre
          ctx.beginPath(); ctx.moveTo(px, ground - hgt * 0.72); ctx.lineTo(px + facing * Math.min(18, 0.3 * ppm), ground - hgt * 0.68); ctx.stroke();
          // tête
          ctx.fillStyle = C.skin;
          ctx.beginPath(); ctx.arc(px, head + 12, 12, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          text(ctx, name + " · " + mass + " kg", px - facing * 4, ground - hgt - 10, { size: 12, align: facing > 0 ? "right" : "left", weight: 600, color: C.ink2 });
          return { px, w, fy: ground - hgt * 0.62, vy: ground - hgt - 38 };
        }
        const a = skater(xA, mA, 1, "Léa");
        const b = skater(xB, mB, -1, "Marc");
        const s = Math.min(0.6, (W / 2 - 60) / 420); // px par N
        if (phase === "push" || phase === "ready") {
          const al = phase === "ready" ? 0.35 : 1;
          ctx.save(); ctx.globalAlpha = al;
          arrow(ctx, a.px - a.w / 2, a.fy, a.px - a.w / 2 - F * s, a.fy, C.app, { width: 3.5, label: "F", sub: "Marc→Léa", labelOff: 18, labelAt: "mid" });
          arrow(ctx, b.px + b.w / 2, b.fy, b.px + b.w / 2 + F * s, b.fy, C.app, { width: 3.5, label: "F", sub: "Léa→Marc", labelOff: -18, labelAt: "mid" });
          ctx.restore();
        }
        if (phase === "glide" || phase === "done") {
          if (vA) arrow(ctx, a.px, a.vy, a.px + vA * 40, a.vy, C.vit, { width: 3, label: "v", labelOff: 12 });
          if (vB) arrow(ctx, b.px, b.vy, b.px + vB * 40, b.vy, C.vit, { width: 3, label: "v", labelOff: 12 });
        }
      }
    });

    function updOut() {
      const va = F * DT / mA, vb = F * DT / mB;
      const items = [
        ["F<sub>Léa→Marc</sub> = F<sub>Marc→Léa</sub> =", fr(F, 0) + " N"],
        ["a<sub>Léa</sub> =", fr(F / mA, 2) + " m/s²"],
        ["a<sub>Marc</sub> =", fr(F / mB, 2) + " m/s²"]
      ];
      if (phase === "ready") items.push({ state: "Prêts. La poussée durera 0,5 s." });
      else if (phase === "push") items.push({ state: "Poussée en cours : deux forces égales et opposées." });
      else {
        items.push(["v<sub>Léa</sub> =", fr(va, 2) + " m/s"], ["v<sub>Marc</sub> =", fr(vb, 2) + " m/s"], ["v<sub>Léa</sub> / v<sub>Marc</sub> =", fr(va / vb, 2)]);
        items.push({ state: mA === mB ? "Masses égales : vitesses égales." : (mA < mB ? "Léa, plus légère" : "Marc, plus léger") + ", part plus vite.", cls: "is-ok" });
      }
      readouts(out, items);
    }
    function reset() {
      phase = "ready"; t = 0; xA = -0.32; xB = 0.32; vA = 0; vB = 0;
      st.stop(); updOut();
    }
    go.addEventListener("click", () => {
      if (phase !== "ready") reset();
      phase = "push"; t = 0; st.start(); updOut();
    });
    $("pat-reset").addEventListener("click", reset);
    bindRange("pat-ma", (val) => val + " kg", (val) => { mA = val; if (phase === "ready" || phase === "done") reset(); });
    bindRange("pat-mb", (val) => val + " kg", (val) => { mB = val; if (phase === "ready" || phase === "done") reset(); });
    bindRange("pat-f", (val) => val + " N", (val) => { F = val; if (phase === "ready" || phase === "done") reset(); });
    updOut();
  }

  /* ===================================================================
     6. Plan incliné
     =================================================================== */
  function simPlan() {
    const cv = $("cv-plan");
    if (!cv) return;
    const out = $("plan-out");
    const btnD = $("plan-decomp");
    const L = 3;
    let al = 20, m = 5, mus = 0.5, muk = 0.3, decomp = true;
    let s = 0, v = 0, sliding = false, bottom = false;

    function forces() {
      const a = al * deg;
      const P = m * G, Ppar = P * Math.sin(a), Pperp = P * Math.cos(a), N = Pperp;
      let Ff, kind, acc = 0;
      if (sliding) {
        Ff = muk * N; kind = "cinétique";
        acc = G * (Math.sin(a) - muk * Math.cos(a));
      } else {
        Ff = Math.min(Ppar, mus * N); kind = "statique";
      }
      return { P, Ppar, Pperp, N, Ff, kind, acc };
    }
    function checkSlip() {
      if (bottom) return;
      if (!sliding && Math.tan(al * deg) > mus + 1e-9) { sliding = true; }
      if (sliding) st.start();
    }

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const n = 4, h = dt / n;
        for (let i = 0; i < n; i++) {
          if (!sliding) break;
          const f = forces();
          v += f.acc * h;
          if (v <= 0 && f.acc <= 0) { v = 0; sliding = Math.tan(al * deg) > mus + 1e-9; if (!sliding) break; }
          s += v * h;
          if (s >= L) { s = L; bottom = true; break; }
        }
        if (!sliding || bottom) st.running = false;
        updOut();
      },
      draw(ctx, W, H) {
        const a = al * deg;
        const Lpx = Math.min(W - 110, (H - 80) / Math.sin(60 * deg));
        const x0 = 46, y0 = H - 40;
        const xt = x0 + Lpx * Math.cos(a), yt = y0 - Lpx * Math.sin(a);
        // sol
        line(ctx, 10, y0, W - 10, y0, C.ink, 2);
        hatch(ctx, 10, W - 10, y0, C.ink3, 14);
        // rampe
        ctx.save();
        ctx.fillStyle = C.wood; ctx.strokeStyle = C.wood2; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xt, yt); ctx.lineTo(xt, y0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
        line(ctx, x0, y0, xt, yt, C.ink, 2);
        // angle
        if (al > 0.5) {
          ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(x0, y0, 58, -a, 0); ctx.stroke(); ctx.restore();
          text(ctx, "α = " + fr(al, 1) + "°", x0 + 66, y0 - 10, { size: 13, color: C.ink2, kind: "mono" });
        }
        // bloc
        const bw = 82, bh = 48;
        const ex = Math.cos(a), ey = -Math.sin(a); // vers le haut de la pente
        const nx = -Math.sin(a), ny = -Math.cos(a); // normale sortante
        const u = Lpx - bw / 2 - 10 - (s / L) * (Lpx - bw - 20);
        const sx = x0 + ex * u, sy = y0 + ey * u;
        const cx = sx + nx * bh / 2, cy = sy + ny * bh / 2;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(-a);
        ctx.fillStyle = C.accentSoft; ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6;
        rrect(ctx, -bw / 2, -bh / 2, bw, bh, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
        text(ctx, fr(m, 1) + " kg", cx, cy + 4, { size: 12, align: "center", kind: "mono" });
        // forces
        const f = forces();
        const k = 125 / f.P;
        const Px = cx, Py = cy + f.P * k;
        if (decomp && al > 0.5) {
          const par = { x: cx - ex * f.Ppar * k, y: cy - ey * f.Ppar * k };
          const perp = { x: cx - nx * f.Pperp * k, y: cy - ny * f.Pperp * k };
          line(ctx, par.x, par.y, Px, Py, C.poids, 1, [3, 4]);
          line(ctx, perp.x, perp.y, Px, Py, C.poids, 1, [3, 4]);
          arrow(ctx, cx, cy, par.x, par.y, C.poids, { width: 2, dash: [6, 4], label: "P", sub: "∥", labelOff: 16 });
          arrow(ctx, cx, cy, perp.x, perp.y, C.poids, { width: 2, dash: [6, 4], label: "P", sub: "⊥", labelOff: 14, side: 0.8 });
        }
        arrow(ctx, cx, cy, Px, Py, C.poids, { width: 3.5, label: "P", labelOff: 14 });
        arrow(ctx, cx, cy, cx + nx * f.N * k, cy + ny * f.N * k, C.normale, { width: 3.5, label: "N", labelOff: 14 });
        if (f.Ff > 0.01) {
          const fx = sx + ex * (bw / 2), fy = sy + ey * (bw / 2);
          arrow(ctx, fx, fy, fx + ex * f.Ff * k, fy + ey * f.Ff * k, C.frott, { width: 3.5, label: "F", sub: "f", labelOff: 14 });
        }
        if (sliding && f.acc > 0.01) {
          const ax = cx - nx * 0 + nx * (bh / 2 + 30), ay = cy + ny * (bh / 2 + 30);
          arrow(ctx, ax, ay, ax - ex * Math.min(110, f.acc * 14), ay - ey * Math.min(110, f.acc * 14), C.acc, { width: 3, label: "a", labelOff: 12 });
        }
      }
    });

    function updOut() {
      const f = forces();
      const t = Math.tan(al * deg);
      let state, cls = "";
      if (bottom) { state = "Arrivé en bas à " + fr(v, 2) + " m/s."; cls = "is-ok"; }
      else if (sliding && t <= mus) { state = "Glisse encore alors que tan α ≤ μs : le frottement cinétique est plus faible."; }
      else if (sliding) state = "Glisse : P∥ dépasse le frottement maximal.";
      else if (al === 0) state = "Sol horizontal : N = P, pas de frottement.";
      else { state = "Immobile : le frottement statique compense P∥."; }
      readouts(out, [
        ["P =", fr(f.P, 1) + " N"],
        ["P∥ =", fr(f.Ppar, 1) + " N"],
        ["P⊥ = N =", fr(f.N, 1) + " N"],
        ["F<sub>f</sub> (" + f.kind + ") =", fr(f.Ff, 1) + " N"],
        ["tan α =", fr(t, 3)],
        ["a =", fr(sliding ? f.acc : 0, 2) + " m/s²"],
        ["v =", fr(v, 2) + " m/s"],
        { state, cls }
      ]);
    }
    function reset() {
      s = 0; v = 0; sliding = false; bottom = false;
      st.stop(); checkSlip(); updOut();
    }
    bindRange("plan-a", (val) => fr(val, 1) + "°", (val) => { al = val; checkSlip(); updOut(); st.invalidate(); });
    bindRange("plan-m", (val) => fr(val, 1) + " kg", (val) => { m = val; updOut(); st.invalidate(); });
    $("plan-mat").addEventListener("change", (e) => {
      const p = e.target.value.split(",").map(parseFloat);
      mus = p[0]; muk = p[1];
      checkSlip(); updOut(); st.invalidate();
    });
    btnD.addEventListener("click", () => { decomp = !decomp; btnD.setAttribute("aria-pressed", String(decomp)); st.invalidate(); });
    $("plan-reset").addEventListener("click", reset);
    updOut();
  }

  /* ===================================================================
     7. Ascenseur
     =================================================================== */
  function simAscenseur() {
    const cv = $("cv-ascenseur");
    if (!cv) return;
    const out = $("asc-out");
    const btnUp = $("asc-up"), btnDown = $("asc-down"), btnCut = $("asc-cut");
    const HF = 3, TOP = 30, VMAX = 3;
    let m = 60, aSet = 1.5;
    let y = 0, v = 0, a = 0, t = 0, mode = "idle", target = 0, tf = 0, stuck = false;
    let hist = [];

    function disp() { return m * (G + a) / G; }
    function step(h) {
      if (mode === "trip") {
        const dir = Math.sign(target - y) || 1;
        const rem = Math.abs(target - y);
        const u = v * dir;
        let acc;
        if (u > 0 && u * u / (2 * aSet) >= rem - 1e-6) acc = -(u * u) / (2 * Math.max(rem, 1e-6));
        else if (u < VMAX - 1e-9) acc = Math.min(aSet, (VMAX - u) / h);
        else acc = 0;
        acc = Math.max(acc, -aSet * 1.05);
        a = acc * dir;
        v += a * h; y += v * h;
        if ((v * dir <= 1e-4 && rem < 0.05) || (target - y) * dir <= 0) {
          y = target; v = 0; a = 0; mode = "idle";
        }
      } else if (mode === "fall") {
        a = -G; v += a * h; y += v * h; tf += h;
        if (tf >= 1.0) mode = "brake";
      } else if (mode === "brake") {
        a = 1.5 * G; v += a * h; y += v * h;
        if (v >= 0) { v = 0; a = 0; mode = "idle"; stuck = true; }
      } else a = 0;
      t += h;
    }
    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const n = 8, h = dt / n;
        for (let i = 0; i < n; i++) step(h);
        if (!hist.length || t - hist[hist.length - 1][0] > 0.04) hist.push([t, a, disp()]);
        if (mode === "idle") {
          hist.push([t, 0, disp()]);
          // laisse la courbe se prolonger un instant puis s'arrête
          st.running = false;
          btnState();
        }
        updOut();
      },
      draw(ctx, W, H) {
        const narrow = W < 640;
        // immeuble
        const bx = 18, bw = 46, by = 24, bh = (narrow ? H * 0.56 : H - 24) - by;
        const ppm = bh / (TOP + HF);
        ctx.fillStyle = C.paper;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = C.ink3; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
        for (let f = 0; f <= 10; f++) {
          const yy = by + bh - f * HF * ppm;
          line(ctx, bx, yy, bx + bw, yy, C.rule, 1);
          if (f % 2 === 0) text(ctx, f === 0 ? "rez" : f + "e", bx + bw + 4, yy - 2, { size: 10, color: C.ink3, kind: "mono" });
        }
        const cyB = by + bh - (y + HF) * ppm;
        ctx.fillStyle = C.accent;
        ctx.fillRect(bx + 8, cyB, bw - 16, HF * ppm);
        // cabine agrandie
        const cx0 = bx + bw + 40, cwid = narrow ? W - bx - bw - 56 : 200;
        const ctop = 30, cbot = narrow ? H * 0.56 : H - 30;
        ctx.save();
        ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
        ctx.fillRect(cx0, ctop, cwid, cbot - ctop); ctx.strokeRect(cx0, ctop, cwid, cbot - ctop);
        ctx.restore();
        const cut = mode === "fall" || mode === "brake" || stuck;
        if (!cut) line(ctx, cx0 + cwid / 2, 0, cx0 + cwid / 2, ctop, C.ink2, 2);
        if (cut) text(ctx, "câble coupé", cx0 + cwid / 2 + 6, 16, { size: 11, color: C.bad, weight: 600 });
        text(ctx, "étage " + fr(y / HF, 1), cx0 + 8, ctop + 18, { size: 12, color: C.ink2, kind: "mono" });
        // balance et écran
        const fx = cx0 + cwid * 0.42;
        ctx.fillStyle = C.ink2;
        rrect(ctx, fx - 32, cbot - 12, 64, 10, 3); ctx.fill();
        ctx.save();
        ctx.fillStyle = C.ink; rrect(ctx, cx0 + cwid - 84, ctop + 30, 74, 30, 4); ctx.fill(); ctx.restore();
        text(ctx, fr(Math.max(0, disp()), 1), cx0 + cwid - 47, ctop + 52, { size: 17, color: C.signal, align: "center", kind: "mono", weight: 600 });
        text(ctx, "kg", cx0 + cwid - 47, ctop + 74, { size: 10, color: C.ink3, align: "center", kind: "mono" });
        // personne
        const hp = Math.min(150, (cbot - ctop) * 0.55);
        const feet = cbot - 12, head = feet - hp;
        ctx.save();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(fx - 9, feet); ctx.lineTo(fx, feet - hp * 0.45); ctx.lineTo(fx + 9, feet); ctx.stroke();
        ctx.fillStyle = C.tension; rrect(ctx, fx - 13, feet - hp * 0.85, 26, hp * 0.42, 8); ctx.fill();
        ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(fx, head + 11, 11, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // forces sur la personne
        const k = 70 / (m * G);
        const mid = feet - hp * 0.6;
        const N = Math.max(0, m * (G + a));
        arrow(ctx, fx + 22, mid, fx + 22, mid + m * G * k, C.poids, { width: 3.5, label: "P", labelOff: 14 });
        if (N > 1) arrow(ctx, fx - 22, mid, fx - 22, mid - Math.min(N * k, mid - ctop - 10), C.normale, { width: 3.5, label: "N", labelOff: 14 });
        if (Math.abs(a) > 0.05) {
          const ax = cx0 + cwid - 26, ay = (ctop + cbot) / 2 + 40;
          arrow(ctx, ax, ay, ax, ay - clamp(a * 9, -100, 100), C.acc, { width: 3, label: "a", labelOff: 12 });
        }
        // graphiques
        let b1, b2;
        if (narrow) {
          const gw = (W - 46 - 16 - 50) / 2, gtop = cbot + 46, gh = H - gtop - 34;
          b1 = { x: 46, y: gtop, w: gw, h: gh };
          b2 = { x: 46 + gw + 50, y: gtop, w: gw, h: gh };
        } else {
          const gx = cx0 + cwid + 56, gw = W - gx - 16, gh = (H - 110) / 2;
          b1 = { x: gx, y: 26, w: gw, h: gh };
          b2 = { x: gx, y: 26 + gh + 50, w: gw, h: gh };
        }
        {
          const tmax = Math.max(14, Math.ceil(t / 2) * 2);
          let amin = -2, amax = 2, dmax = m * 1.3;
          hist.forEach((p) => { amin = Math.min(amin, p[1]); amax = Math.max(amax, p[1]); dmax = Math.max(dmax, p[2]); });
          const A1 = axes(ctx, b1, { xmax: tmax, ymin: Math.floor(amin), ymax: Math.ceil(amax), xlabel: "t (s)", ylabel: "a (m/s²)" });
          polyline(ctx, hist.map((p) => [p[0], p[1]]), A1.X, A1.Y, C.acc, 2);
          const A2 = axes(ctx, b2, { xmax: tmax, ymax: Math.ceil(dmax / 20) * 20, ystep: dmax > 150 ? 40 : 20, xlabel: "t (s)", ylabel: "balance (kg)" });
          line(ctx, b2.x, A2.Y(m), b2.x + b2.w, A2.Y(m), C.ink3, 1, [4, 4]);
          polyline(ctx, hist.map((p) => [p[0], p[2]]), A2.X, A2.Y, C.normale, 2);
        }
      }
    });

    function phaseText() {
      if (mode === "fall") return "Chute libre : la balance affiche 0. Apesanteur !";
      if (mode === "brake") return "Freins de sécurité : la balance s'affole.";
      if (stuck && mode === "idle") return "Bloqué entre deux étages, mais entier. Appelle le concierge.";
      if (mode === "idle") return "À l'arrêt : la balance affiche ta vraie masse.";
      if (Math.abs(a) < 0.01) return "Vitesse constante : la balance affiche ta vraie masse.";
      return a > 0 ? "Accélération vers le haut : tu te sens plus lourd." : "Accélération vers le bas : tu te sens plus léger.";
    }
    function updOut() {
      readouts(out, [
        ["étage", fr(y / HF, 1)],
        ["v =", fr(v, 2) + " m/s"],
        ["a =", fr(a, 2) + " m/s²"],
        ["N = m(g + a) =", fr(Math.max(0, m * (G + a)), 0) + " N"],
        ["balance =", fr(Math.max(0, disp()), 1) + " kg"],
        { state: phaseText(), cls: mode === "fall" || mode === "brake" ? "is-bad" : "" }
      ]);
    }
    function btnState() {
      const busy = mode !== "idle";
      btnUp.disabled = busy || y >= TOP - 0.01;
      btnDown.disabled = busy || y <= 0.01;
      btnCut.disabled = busy || y < 12;
    }
    function startTrip(to) {
      if (mode !== "idle") return;
      target = to; mode = "trip"; stuck = false; t = 0; hist = [[0, 0, m]];
      btnState(); st.start();
    }
    btnUp.addEventListener("click", () => startTrip(TOP));
    btnDown.addEventListener("click", () => startTrip(0));
    btnCut.addEventListener("click", () => {
      if (mode !== "idle" || y < 12) return;
      mode = "fall"; tf = 0; t = 0; hist = [[0, 0, m]]; btnState(); st.start();
    });
    bindRange("asc-m", (val) => val + " kg", (val) => { m = val; updOut(); st.invalidate(); });
    bindRange("asc-a", (val) => fr(val, 1) + " m/s²", (val) => { aSet = val; });
    btnState(); updOut();
  }

  /* ===================================================================
     8. Systèmes liés
     =================================================================== */
  function simLies() {
    const cv = $("cv-lies");
    if (!cv) return;
    const out = $("lies-out");
    const go = $("lies-go");
    const bT = $("lies-table"), bA = $("lies-atwood");
    let mode = "table", m1 = 2, m2 = 1, mu = 0;
    let d = 0, v = 0, done = false;
    let dmax = 1;

    function phys() {
      if (mode === "table") {
        const drive = m2 * G, fmax = mu * m1 * G;
        if (drive <= fmax + 1e-9) return { a: 0, T: drive, Ff: drive, stat: true };
        const a = (drive - fmax) / (m1 + m2);
        return { a, T: m2 * (G - a), Ff: fmax, stat: false };
      }
      const a = (m2 - m1) * G / (m1 + m2);
      return { a, T: 2 * m1 * m2 * G / (m1 + m2), Ff: 0, stat: Math.abs(a) < 1e-9 };
    }
    const side = (mm) => 26 + 9 * Math.sqrt(mm);

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const p = phys();
        v += p.a * dt; d += v * dt;
        if (Math.abs(d) >= dmax) { d = Math.sign(d) * dmax; st.running = false; done = true; setPlay(go, false, ["Lâcher", ""]); }
        updOut();
      },
      draw(ctx, W, H) {
        const p = phys();
        const k = 100 / (Math.max(m1, m2) * G);
        const s1 = side(m1), s2 = side(m2);
        if (mode === "table") {
          const ty = Math.max(110, H * 0.36);
          const tx0 = 20, tx1 = W * 0.62;
          const s2max = side(10);
          const ppm = Math.min(220, (H - 24 - (ty + 46 + s2max)), (tx1 - tx0 - 120 - s1));
          dmax = 1.0;
          // table
          ctx.fillStyle = C.wood; ctx.strokeStyle = C.wood2; ctx.lineWidth = 1.5;
          ctx.fillRect(tx0, ty, tx1 - tx0, 12); ctx.strokeRect(tx0, ty, tx1 - tx0, 12);
          line(ctx, tx0 + 20, ty + 12, tx0 + 20, H - 10, C.ink2, 3);
          line(ctx, tx1 - 20, ty + 12, tx1 - 20, H - 10, C.ink2, 3);
          line(ctx, 0, H - 10, W, H - 10, C.ink, 2);
          // poulie
          const pr = 14, ya = ty - 16, px = tx1 + 6, py = ya + pr;
          line(ctx, tx1 - 4, ty + 6, px, py, C.ink2, 3);
          ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = C.metal; ctx.fill();
          ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; ctx.stroke();
          // bloc 1
          const b1x = tx0 + 40 + d * ppm, b1y = ty - s1;
          ctx.fillStyle = C.accentSoft; ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6;
          rrect(ctx, b1x, b1y, s1, s1, 3); ctx.fill(); ctx.stroke();
          text(ctx, "m₁", b1x + s1 / 2, b1y + s1 / 2 + 5, { size: 13, align: "center", weight: 600 });
          // masse 2
          const b2top = ty + 40 + d * ppm, b2x = px + pr - s2 / 2;
          // corde
          line(ctx, b1x + s1, ya, px, ya, C.ink, 1.6);
          line(ctx, px + pr, py, px + pr, b2top, C.ink, 1.6);
          ctx.fillStyle = C.metal; ctx.strokeStyle = C.ink2;
          rrect(ctx, b2x, b2top, s2, s2, 3); ctx.fill(); ctx.stroke();
          text(ctx, "m₂", b2x + s2 / 2, b2top + s2 / 2 + 5, { size: 13, align: "center", weight: 600 });
          // forces m1
          const c1x = b1x + s1 / 2, c1y = b1y + s1 / 2;
          arrow(ctx, c1x, c1y, c1x, c1y + m1 * G * k, C.poids, { width: 3, label: "P", sub: "1", labelOff: 14 });
          arrow(ctx, c1x - 8, c1y, c1x - 8, c1y - m1 * G * k, C.normale, { width: 3, label: "N", labelOff: 14 });
          arrow(ctx, b1x + s1, ya - 9, b1x + s1 + p.T * k, ya - 9, C.tension, { width: 3, label: "T", labelOff: 12 });
          if (p.Ff > 0.01 && mu > 0) arrow(ctx, b1x, c1y + 8, b1x - p.Ff * k, c1y + 8, C.frott, { width: 3, label: "F", sub: "f", labelOff: 14 });
          // forces m2
          const c2x = b2x + s2 / 2, c2y = b2top + s2 / 2;
          arrow(ctx, c2x + s2 / 2 + 14, c2y, c2x + s2 / 2 + 14, c2y + m2 * G * k, C.poids, { width: 3, label: "P", sub: "2", labelOff: 14 });
          arrow(ctx, c2x + s2 / 2 + 14, c2y, c2x + s2 / 2 + 14, c2y - p.T * k, C.tension, { width: 3, label: "T", labelOff: 12 });
          if (p.a > 0.01) {
            arrow(ctx, b1x, b1y - 26, b1x + Math.min(90, p.a * 10), b1y - 26, C.acc, { width: 2.5, label: "a", labelOff: 11 });
          }
          text(ctx, "m₁ = " + fr(m1, 1) + " kg · m₂ = " + fr(m2, 1) + " kg", W - 16, 24, { size: 12, align: "right", color: C.ink2, kind: "mono" });
        } else {
          const cx = W * 0.45, py = 64, pr = 34;
          ctx.fillStyle = C.rule2; ctx.fillRect(cx - 80, 0, 160, 14);
          line(ctx, cx - 80, 14, cx + 80, 14, C.ink, 2);
          line(ctx, cx, 14, cx, py, C.ink2, 3);
          ctx.beginPath(); ctx.arc(cx, py, pr, 0, Math.PI * 2); ctx.fillStyle = C.metal; ctx.fill(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, py, 5, 0, Math.PI * 2); ctx.fillStyle = C.ink2; ctx.fill();
          line(ctx, 0, H - 10, W, H - 10, C.ink, 2);
          const ymid = (py + H) / 2 - 10;
          const room = Math.min(ymid - py - 20 - Math.max(s1, s2) / 2, H - 14 - ymid - side(10));
          const ppm = Math.max(40, room / 1.0);
          dmax = Math.min(1.0, room / ppm);
          const y1 = ymid - d * ppm, y2 = ymid + d * ppm; // haut de chaque masse
          const x1 = cx - pr, x2 = cx + pr;
          line(ctx, x1, py, x1, y1, C.ink, 1.6);
          line(ctx, x2, py, x2, y2, C.ink, 1.6);
          ctx.fillStyle = C.accentSoft; ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6;
          rrect(ctx, x1 - s1 / 2, y1, s1, s1, 3); ctx.fill(); ctx.stroke();
          ctx.fillStyle = C.metal; ctx.strokeStyle = C.ink2;
          rrect(ctx, x2 - s2 / 2, y2, s2, s2, 3); ctx.fill(); ctx.stroke();
          text(ctx, "m₁", x1, y1 + s1 / 2 + 5, { size: 13, align: "center", weight: 600 });
          text(ctx, "m₂", x2, y2 + s2 / 2 + 5, { size: 13, align: "center", weight: 600 });
          const l1 = x1 - s1 / 2 - 16, l2 = x2 + s2 / 2 + 16;
          arrow(ctx, l1, y1 + s1 / 2, l1, y1 + s1 / 2 + m1 * G * k, C.poids, { width: 3, label: "P", sub: "1", labelOff: 14 });
          arrow(ctx, l1, y1 + s1 / 2, l1, y1 + s1 / 2 - p.T * k, C.tension, { width: 3, label: "T", labelOff: 12 });
          arrow(ctx, l2, y2 + s2 / 2, l2, y2 + s2 / 2 + m2 * G * k, C.poids, { width: 3, label: "P", sub: "2", labelOff: 14 });
          arrow(ctx, l2, y2 + s2 / 2, l2, y2 + s2 / 2 - p.T * k, C.tension, { width: 3, label: "T", labelOff: 12 });
          text(ctx, "m₁ = " + fr(m1, 1) + " kg · m₂ = " + fr(m2, 1) + " kg", W - 16, 24, { size: 12, align: "right", color: C.ink2, kind: "mono" });
        }
      }
    });

    function updOut() {
      const p = phys();
      const items = [
        ["a =", fr(Math.abs(p.a), 2) + " m/s²"],
        ["T =", fr(p.T, 2) + " N"],
        ["P₂ = m₂·g =", fr(m2 * G, 2) + " N"]
      ];
      if (mode === "table" && mu > 0) items.push(["F<sub>f</sub> =", fr(p.Ff, 2) + " N"]);
      items.push(["v =", fr(Math.abs(v), 2) + " m/s"]);
      let s;
      if (p.stat) s = mode === "table" ? "Rien ne bouge : le frottement statique retient le bloc (m₂·g ≤ μ·m₁·g)." : "Masses égales : équilibre, rien ne bouge.";
      else if (mode === "atwood") s = (p.a > 0 ? "m₂" : "m₁") + " descend, l'autre monte.";
      else s = "m₂ descend et entraîne le bloc. T < P₂.";
      items.push({ state: s, cls: p.stat ? "is-bad" : "" });
      readouts(out, items);
    }
    function reset() {
      d = 0; v = 0; done = false; st.stop(); setPlay(go, false, ["Lâcher", ""]); updOut();
    }
    function setMode(mm) {
      mode = mm;
      bT.setAttribute("aria-pressed", String(mm === "table"));
      bA.setAttribute("aria-pressed", String(mm === "atwood"));
      $("lies-mu-ctrl").hidden = mm !== "table";
      reset();
    }
    bT.addEventListener("click", () => setMode("table"));
    bA.addEventListener("click", () => setMode("atwood"));
    go.addEventListener("click", () => {
      if (st.running) return;
      if (done) { d = 0; v = 0; done = false; }
      if (phys().stat) { updOut(); return; }
      setPlay(go, true, ["Lâcher", "…"]);
      st.start();
    });
    $("lies-reset").addEventListener("click", reset);
    bindRange("lies-m1", (val) => fr(val, 1) + " kg", (val) => { m1 = val; reset(); });
    bindRange("lies-m2", (val) => fr(val, 1) + " kg", (val) => { m2 = val; reset(); });
    bindRange("lies-mu", (val) => fr(val, 2), (val) => { mu = val; reset(); });
    updOut();
  }

  /* ===================================================================
     9. Le virage
     =================================================================== */
  function simVirage() {
    const cv = $("cv-virage");
    if (!cv) return;
    const out = $("vir-out");
    const go = $("vir-go");
    const MC = 1300;
    let vk = 50, r = 50, mu = 0.8;
    let th = Math.PI / 2 * 3, skid = null, trail = [];
    function need() { const v = vk / 3.6; return MC * v * v / r; }
    function fmax() { return mu * MC * G; }
    function vmax() { return Math.sqrt(mu * G * r); }

    const st = new D.Stage(cv, {
      minW: 460,
      update(dt) {
        const v = vk / 3.6;
        if (!skid) {
          if (need() > fmax()) {
            const px = r * Math.cos(th), py = r * Math.sin(th);
            skid = { x: px, y: py, vx: -Math.sin(th) * v, vy: Math.cos(th) * v, out: false };
            trail = [[px, py]];
          } else {
            th += v / r * dt;
          }
        }
        if (skid) {
          const sp = Math.hypot(skid.vx, skid.vy);
          if (sp > 0.05) {
            const dec = Math.min(sp, 0.7 * mu * G * dt);
            skid.vx -= skid.vx / sp * dec; skid.vy -= skid.vy / sp * dec;
            skid.x += skid.vx * dt; skid.y += skid.vy * dt;
            trail.push([skid.x, skid.y]);
          } else { st.running = false; setPlay(go, false, ["Rouler", "Pause"]); }
          const lim = r * 1.9;
          if (Math.abs(skid.x) > lim || Math.abs(skid.y) > lim) { st.running = false; setPlay(go, false, ["Rouler", "Pause"]); }
          updOut();
        }
      },
      draw(ctx, W, H) {
        const cx = W / 2, cy = H / 2;
        const R = Math.min(W, H) * 0.33;
        const s = R / r;
        const road = 36;
        ctx.fillStyle = C.grass; ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        // route
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, R + road / 2, 0, Math.PI * 2); ctx.arc(cx, cy, R - road / 2, 0, Math.PI * 2, true);
        ctx.fillStyle = C.road; ctx.fill("evenodd");
        ctx.setLineDash([10, 10]); ctx.strokeStyle = C.card; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // centre et rayon
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
        text(ctx, "r = " + r + " m", cx, cy + 20, { size: 13, align: "center", kind: "mono", color: C.ink, halo: C.card });
        // traces
        if (trail.length > 1) {
          ctx.save(); ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
          ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(cx + p[0] * s, cy - p[1] * s) : ctx.moveTo(cx + p[0] * s, cy - p[1] * s))); ctx.stroke();
          ctx.restore();
        }
        // voiture
        let px, py, hx, hy;
        if (skid) { px = skid.x; py = skid.y; const sp = Math.hypot(skid.vx, skid.vy) || 1; hx = skid.vx / sp; hy = skid.vy / sp; if (sp < 0.06) { hx = trail.length > 1 ? (trail[trail.length - 1][0] - trail[0][0]) : 1; hy = trail.length > 1 ? (trail[trail.length - 1][1] - trail[0][1]) : 0; const n = Math.hypot(hx, hy) || 1; hx /= n; hy /= n; } }
        else { px = r * Math.cos(th); py = r * Math.sin(th); hx = -Math.sin(th); hy = Math.cos(th); }
        const sx = cx + px * s, sy = cy - py * s;
        const angle = Math.atan2(-hy, hx);
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(angle);
        ctx.fillStyle = C.app; rrect(ctx, -17, -9, 34, 18, 4); ctx.fill();
        ctx.fillStyle = C.card; ctx.globalAlpha = 0.7; rrect(ctx, 4, -7, 7, 14, 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();
        // vecteurs
        const v = skid ? Math.hypot(skid.vx, skid.vy) : vk / 3.6;
        if (v > 0.05) arrow(ctx, sx, sy, sx + hx * v * 3.6, sy - hy * v * 3.6, C.vit, { width: 3.5, label: "v", labelOff: 12 });
        if (!skid) {
          const kF = 105 / (0.8 * MC * G);
          const ux = -Math.cos(th), uy = Math.sin(th); // vers le centre (écran)
          const fm = fmax() * kF;
          line(ctx, sx, sy, sx + ux * fm, sy + uy * fm, C.frott, 1.5, [3, 4]);
          ctx.beginPath(); ctx.arc(sx + ux * fm, sy + uy * fm, 3.5, 0, Math.PI * 2); ctx.strokeStyle = C.frott; ctx.lineWidth = 1.5; ctx.stroke();
          const fn = Math.min(need(), fmax()) * kF;
          arrow(ctx, sx, sy, sx + ux * fn, sy + uy * fn, C.frott, { width: 3.5, label: "F", sub: "f", labelOff: 16, labelAt: "mid", side: 0 });
        } else {
          text(ctx, "Sortie de route !", W / 2, 28, { size: 18, align: "center", weight: 700, color: C.bad, kind: "display", halo: C.card });
        }
      }
    });

    function updOut() {
      const v = vk / 3.6;
      const ok = need() <= fmax();
      readouts(out, [
        ["v =", fr(vk, 0) + " km/h = " + fr(v, 1) + " m/s"],
        ["F nécessaire = m·v²/r =", fr(need(), 0) + " N"],
        ["F<sub>f</sub> max = μ<sub>s</sub>·m·g =", fr(fmax(), 0) + " N"],
        ["v<sub>max</sub> = √(μ<sub>s</sub>·g·r) =", fr(kmh(vmax()), 0) + " km/h"],
        { state: skid ? "Le frottement ne suffit plus : la voiture continue tout droit (inertie)." : ok ? "Ça passe : le frottement fournit la force centripète." : "Trop vite : la voiture va glisser vers l'extérieur.", cls: skid || !ok ? "is-bad" : "is-ok" }
      ]);
    }
    function reset() {
      skid = null; trail = []; th = Math.PI * 1.5;
      st.stop(); setPlay(go, false, ["Rouler", "Pause"]); updOut();
    }
    go.addEventListener("click", () => {
      if (st.running) { st.running = false; setPlay(go, false, ["Rouler", "Pause"]); st.invalidate(); return; }
      if (skid) reset();
      setPlay(go, true, ["Rouler", "Pause"]); st.start();
    });
    $("vir-reset").addEventListener("click", reset);
    bindRange("vir-v", (val) => val + " km/h", (val) => { vk = val; updOut(); st.invalidate(); });
    bindRange("vir-r", (val) => val + " m", (val) => { r = val; if (!skid) updOut(); st.invalidate(); });
    $("vir-route").addEventListener("change", (e) => { mu = parseFloat(e.target.value); updOut(); st.invalidate(); });
    updOut();
  }

  document.addEventListener("DOMContentLoaded", () => {
    [simSomme, simHooke, simInertie, simChariot, simPatineurs, simPlan, simAscenseur, simLies, simVirage].forEach((f) => {
      try { f(); } catch (err) { console.error(f.name, err); }
    });
  });
})();
