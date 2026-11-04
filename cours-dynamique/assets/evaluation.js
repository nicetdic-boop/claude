/* =====================================================================
   Dynamique au gymnase — évaluation finale
   16 questions, 26 points. La série A (valeurs fixes) est celle du
   document Word ; « Nouvelle série » tire d'autres valeurs.
   Note suisse : 1 + 5 × points / total, arrondie au demi-point.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.Dyn;
  const { fr, sig, parseNum, checkValue, G } = D;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* valeur aléatoire sur une grille, ou la valeur de la série A */
  function pick(r, a, lo, hi, step) {
    if (!r) return a;
    const n = Math.round((hi - lo) / step);
    return +(lo + Math.floor(r() * (n + 1)) * step).toFixed(6);
  }
  const n = (x, d) => fr(x, d == null ? (Math.abs(x) < 10 && x % 1 ? 2 : (x % 1 ? 1 : 0)) : d);

  const CHAP = {
    1: "Les forces", 2: "Inertie", 3: "ΣF = m·a", 4: "Action–réaction",
    5: "Frottement et plan incliné", 6: "Poids apparent et systèmes liés", 7: "Mouvement circulaire"
  };

  const DEFS = [
    { chap: 1, type: "qcm", q: () => ({
      text: "Le newton est l'unité de force. À quoi correspond 1&nbsp;N ?",
      opts: ["1&nbsp;kg·m/s²", "1&nbsp;kg·m/s", "1&nbsp;kg/s²", "1&nbsp;g·cm/s²"], ans: 0,
      sol: "Par la deuxième loi, <i>F</i> = <i>m</i>·<i>a</i> : 1&nbsp;N = 1&nbsp;kg × 1&nbsp;m/s²." }) },
    { chap: 1, type: "qcm", q: () => ({
      text: "Un astronaute part de la Terre et se pose sur la Lune. Que deviennent sa masse et son poids ?",
      opts: ["Sa masse et son poids diminuent.", "Sa masse reste la même, son poids diminue.", "Sa masse diminue, son poids reste le même.", "Rien ne change."], ans: 1,
      sol: "La masse est une propriété de l'objet ; le poids <i>P</i> = <i>m</i>·<i>g</i> dépend de <i>g</i>, six fois plus petit sur la Lune." }) },
    { chap: 1, type: "num", q: (r) => {
      const m = pick(r, 8.5, 3, 25, 0.5);
      return { text: "Quel est le poids d'un sac de " + n(m, 1) + "&nbsp;kg ?", unit: "N", ans: m * G,
        sol: "<i>P</i> = <i>m</i>·<i>g</i> = " + n(m, 1) + " × 9,81 = " + sig(m * G) + "&nbsp;N." };
    } },
    { chap: 1, type: "num", q: (r) => {
      const a = pick(r, 24, 10, 80, 5), b = pick(r, 7, 10, 80, 5);
      const R = Math.hypot(a, b);
      return { text: "Deux forces perpendiculaires de " + a + "&nbsp;N et " + b + "&nbsp;N agissent sur le même objet. Quelle est l'intensité de la résultante ?", unit: "N", ans: R,
        sol: "Forces perpendiculaires : Pythagore. <i>F</i><sub>R</sub> = √(" + a + "² + " + b + "²) = " + sig(R) + "&nbsp;N." };
    } },
    { chap: 2, type: "qcm", q: () => ({
      text: "Une voiture roule à 80&nbsp;km/h en ligne droite, à vitesse constante. Que vaut la somme des forces qui agissent sur elle ?",
      opts: ["Elle est nulle.", "Elle pointe vers l'avant.", "Elle pointe vers l'arrière.", "Elle est égale au poids de la voiture."], ans: 0,
      sol: "MRU ⇒ Σ<i>F</i> = 0 (première loi). La force motrice compense exactement les frottements." }) },
    { chap: 3, type: "num", q: (r) => {
      const m = pick(r, 4, 1, 10, 0.5), F = pick(r, 18, 10, 40, 1);
      const f = r ? Math.min(F - 2, pick(r, 6, 1, 12, 1)) : 6;
      const a = (F - f) / m;
      return { text: "Un chariot de " + n(m, 1) + "&nbsp;kg est tiré par une force horizontale de " + F + "&nbsp;N. Le frottement vaut " + f + "&nbsp;N. Quelle est son accélération ?", unit: "m/s²", ans: a,
        sol: "Σ<i>F</i> = " + F + " − " + f + " = " + (F - f) + "&nbsp;N, donc <i>a</i> = " + (F - f) + "/" + n(m, 1) + " = " + sig(a) + "&nbsp;m/s²." };
    } },
    { chap: 3, type: "num", q: (r) => {
      const m = pick(r, 80, 60, 110, 5), v = pick(r, 36, 18, 45, 3), t = pick(r, 4, 2, 8, 0.5);
      const a = v / 3.6 / t, F = m * a;
      return { text: "Un cycliste (" + m + "&nbsp;kg avec son vélo) freine et passe de " + v + "&nbsp;km/h à l'arrêt en " + n(t, 1) + "&nbsp;s. Quelle est l'intensité de la force résultante moyenne qui le freine ?", unit: "N", ans: F,
        sol: v + "&nbsp;km/h = " + sig(v / 3.6) + "&nbsp;m/s. <i>a</i> = " + sig(v / 3.6) + "/" + n(t, 1) + " = " + sig(a) + "&nbsp;m/s², puis <i>F</i> = " + m + " × " + sig(a) + " = " + sig(F) + "&nbsp;N." };
    } },
    { chap: 4, type: "qcm", q: () => ({
      text: "Un livre est posé sur une table. Quelle force forme une paire action–réaction avec le poids du livre ?",
      opts: ["La force normale de la table sur le livre.", "La force du livre sur la table.", "La force d'attraction du livre sur la Terre.", "Aucune : le poids n'a pas de réaction."], ans: 2,
      sol: "Le poids est la force de la Terre sur le livre ; sa réaction est la force du livre sur la Terre. La normale compense le poids, mais agit sur le même objet." }) },
    { chap: 4, type: "qcm", q: () => ({
      text: "Un camion de 30&nbsp;t percute une voiture de 1,2&nbsp;t. Pendant le choc, quelle force est la plus grande ?",
      opts: ["La force du camion sur la voiture.", "La force de la voiture sur le camion.", "Les deux sont égales.", "Ça dépend de la vitesse."], ans: 2,
      sol: "Troisième loi : les deux forces ont toujours la même intensité. La voiture, 25 fois plus légère, subit une accélération 25 fois plus grande." }) },
    { chap: 5, type: "num", q: (r) => {
      const m = pick(r, 50, 10, 80, 5), mus = pick(r, 0.4, 0.2, 0.8, 0.05);
      const F = mus * m * G;
      return { text: "Une caisse de " + m + "&nbsp;kg repose sur un sol horizontal (<i>μ</i><sub>s</sub> = " + n(mus, 2) + "). Quelle force horizontale minimale faut-il pour la mettre en mouvement ?", unit: "N", ans: F,
        sol: "<i>N</i> = <i>m</i>·<i>g</i> = " + sig(m * G) + "&nbsp;N, puis <i>F</i> = <i>μ</i><sub>s</sub>·<i>N</i> = " + n(mus, 2) + " × " + sig(m * G) + " = " + sig(F) + "&nbsp;N." };
    } },
    { chap: 5, type: "num", q: (r) => {
      const al = pick(r, 30, 10, 50, 1);
      const a = G * Math.sin(al * Math.PI / 180);
      return { text: "Un bloc glisse sans frottement sur un plan incliné de " + al + "°. Quelle est son accélération ?", unit: "m/s²", ans: a,
        sol: "<i>a</i> = <i>g</i>·sin&nbsp;<i>α</i> = 9,81 × sin&nbsp;" + al + "° = " + sig(a) + "&nbsp;m/s²." };
    } },
    { chap: 5, type: "num", q: (r) => {
      const mus = pick(r, 0.7, 0.2, 1.0, 0.05);
      const al = Math.atan(mus) * 180 / Math.PI;
      return { text: "Un objet est posé sur une planche qu'on incline peu à peu. Le coefficient de frottement statique vaut " + n(mus, 2) + ". À partir de quel angle l'objet commence-t-il à glisser ?", unit: "°", ans: al,
        sol: "Angle limite : tan&nbsp;<i>α</i> = <i>μ</i><sub>s</sub> = " + n(mus, 2) + ", donc <i>α</i> = " + sig(al) + "°." };
    } },
    { chap: 6, type: "num", q: (r) => {
      const m = pick(r, 70, 45, 100, 1), a0 = pick(r, 1.4, 0.5, 3, 0.1);
      const up = r ? r() < 0.5 : true;
      const a = up ? a0 : -a0;
      const kg = m * (G + a) / G;
      return { text: "Une personne de " + m + "&nbsp;kg est debout sur une balance dans un ascenseur qui accélère vers le " + (up ? "haut" : "bas") + " à " + n(a0, 1) + "&nbsp;m/s². Quelle valeur la balance affiche-t-elle ?", unit: "kg", ans: kg,
        sol: "<i>N</i> = <i>m</i>(<i>g</i> " + (up ? "+" : "−") + " " + n(a0, 1) + ") = " + sig(m * (G + a)) + "&nbsp;N ; la balance affiche <i>N</i>/<i>g</i> = " + sig(kg) + "&nbsp;kg." };
    } },
    { chap: 6, type: "num", q: (r) => {
      const m1 = pick(r, 2, 1, 6, 0.5), m2 = r ? m1 + pick(r, 1, 0.5, 4, 0.5) : 3;
      const a = (m2 - m1) * G / (m1 + m2);
      return { text: "Dans une machine d'Atwood, deux masses de " + n(m1, 1) + "&nbsp;kg et " + n(m2, 1) + "&nbsp;kg pendent de part et d'autre d'une poulie idéale. Quelle est leur accélération ?", unit: "m/s²", ans: a,
        sol: "<i>a</i> = (<i>m</i><sub>2</sub> − <i>m</i><sub>1</sub>)·<i>g</i>/(<i>m</i><sub>1</sub> + <i>m</i><sub>2</sub>) = " + n(m2 - m1, 1) + " × 9,81/" + n(m1 + m2, 1) + " = " + sig(a) + "&nbsp;m/s²." };
    } },
    { chap: 7, type: "num", q: (r) => {
      const m = pick(r, 1000, 900, 2000, 50), rad = pick(r, 40, 20, 150, 5), v = pick(r, 54, 30, 90, 3);
      const F = m * Math.pow(v / 3.6, 2) / rad;
      return { text: "Une voiture de " + fr(m, 0) + "&nbsp;kg prend un virage de " + rad + "&nbsp;m de rayon à " + v + "&nbsp;km/h. Quelle force centripète faut-il ?", unit: "N", ans: F,
        sol: v + "&nbsp;km/h = " + sig(v / 3.6) + "&nbsp;m/s. <i>F</i> = <i>m</i>·<i>v</i>²/<i>r</i> = " + fr(m, 0) + " × " + sig(v / 3.6) + "²/" + rad + " = " + sig(F) + "&nbsp;N." };
    } },
    { chap: 7, type: "qcm", q: () => ({
      text: "Une pierre tourne au bout d'une ficelle, dans un plan horizontal. La ficelle casse. Quelle trajectoire suit la pierre, vue de dessus ?",
      opts: ["Elle continue à tourner en cercle.", "Elle part en ligne droite, tangentiellement au cercle.", "Elle part en ligne droite vers l'extérieur, dans le prolongement de la ficelle.", "Elle part vers le centre du cercle."], ans: 1,
      sol: "Plus aucune force horizontale : la pierre garde la vitesse qu'elle avait, tangente au cercle (première loi)." }) }
  ];

  function build(seed) {
    const r = seed ? rng(seed) : null;
    return DEFS.map((d, i) => {
      const q = d.q(r);
      q.chap = d.chap; q.type = d.type; q.pts = d.type === "qcm" ? 1 : 2; q.num = i + 1;
      if (d.type === "qcm" && r) {
        const order = q.opts.map((_, k) => k).sort(() => r() - 0.5);
        q.opts = order.map((k) => q.opts[k]);
        q.ans = order.indexOf(q.ans);
      }
      return q;
    });
  }
  const TOTAL = DEFS.reduce((s, d) => s + (d.type === "qcm" ? 1 : 2), 0);
  const note = (pts) => Math.round((1 + 5 * pts / TOTAL) * 2) / 2;

  /* ---------- Interface ---------- */
  let seed = 0, qs = build(0), submitted = false;
  const L = "ABCDEFGH";

  function render() {
    const list = D.$("eval-list");
    if (!list) return;
    D.$("eval-serie").textContent = seed ? "n° " + seed : "A";
    list.innerHTML = qs.map((q, i) => {
      const head = '<div class="eval-q__head"><span class="eval-q__num">Question ' + q.num + '</span><span class="eval-q__pts">' + q.pts + " pt" + (q.pts > 1 ? "s" : "") + '</span><span class="eval-q__chap">Chapitre ' + q.chap + "</span></div>";
      let body;
      if (q.type === "qcm") {
        body = '<ul class="qcm">' + q.opts.map((o, k) => '<li><label><input type="radio" name="ev' + i + '" value="' + k + '"><span>' + o + "</span></label></li>").join("") + "</ul>";
      } else {
        body = '<div class="answer"><label for="ev' + i + '">Réponse</label><input type="text" id="ev' + i + '" inputmode="decimal" autocomplete="off"><span class="unit">' + q.unit + "</span></div>";
      }
      return '<li class="eval-q" data-i="' + i + '">' + head + "<p>" + q.text + "</p>" + body + '<div class="corr" hidden></div></li>';
    }).join("");
    list.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", progress));
    list.querySelectorAll("input[type=radio]").forEach((inp) => inp.addEventListener("change", progress));
    D.$("eval-result").hidden = true;
    D.$("eval-submit").hidden = false;
    D.$("eval-retry").hidden = true;
    submitted = false;
    progress();
  }
  function answered(i) {
    const li = D.$("eval-list").children[i];
    const q = qs[i];
    if (q.type === "qcm") return !!li.querySelector("input:checked");
    return li.querySelector("input").value.trim() !== "";
  }
  function progress() {
    const k = qs.filter((_, i) => answered(i)).length;
    D.$("eval-progress").textContent = k + " / " + qs.length + " répondues";
  }
  function correct() {
    let pts = 0;
    const lost = {};
    const list = D.$("eval-list");
    qs.forEach((q, i) => {
      const li = list.children[i];
      let ok = false, given = "";
      if (q.type === "qcm") {
        const sel = li.querySelector("input:checked");
        ok = !!sel && +sel.value === q.ans;
        li.querySelectorAll("label").forEach((l, k) => {
          if (k === q.ans) l.classList.add("is-ok");
          else if (sel && +sel.value === k) l.classList.add("is-bad");
        });
      } else {
        const inp = li.querySelector("input");
        given = inp.value;
        ok = checkValue(parseNum(given), q.ans, 0.02).ok;
        inp.classList.add(ok ? "is-ok" : "is-bad");
      }
      li.querySelectorAll("input").forEach((x) => (x.disabled = true));
      li.classList.add(ok ? "is-ok" : "is-bad");
      if (ok) pts += q.pts; else lost[q.chap] = (lost[q.chap] || 0) + q.pts;
      const corr = li.querySelector(".corr");
      const expect = q.type === "qcm" ? "Réponse " + L[q.ans] + " : " + q.opts[q.ans] : sig(q.ans) + "&nbsp;" + q.unit;
      corr.innerHTML = "<p><b>" + (ok ? "Juste, " + q.pts + "&nbsp;pt" + (q.pts > 1 ? "s" : "") + "." : "Faux, 0&nbsp;pt.") + "</b> Réponse attendue : " + expect + "</p><p>" + q.sol + "</p>";
      corr.hidden = false;
    });
    const nt = note(pts);
    const verdict = nt >= 6 ? "Newton se retourne dans sa tombe. De fierté."
      : nt >= 5 ? "Très solide. Quelques détails à polir et c'est parfait."
      : nt >= 4 ? "Suffisant. La force est là, l'accélération peut encore grandir."
      : nt >= 3 ? "Pas encore suffisant. ΣF ≠ 0 : ça peut encore bouger dans le bon sens."
      : "Inertie détectée. Reprends les chapitres signalés, puis tente une nouvelle série.";
    const rev = Object.keys(lost).sort().map((c) => '<a href="#ch' + c + '">' + c + ". " + CHAP[c] + "</a>");
    const steps = [];
    for (let s = 1; s <= 6.001; s += 0.5) steps.push('<span class="' + (s <= nt ? "on" : "") + '"></span>');
    const res = D.$("eval-result");
    res.innerHTML = '<div class="result__note">' + fr(nt, 1) + "<small>note sur 6</small></div>" +
      '<div class="result__text"><span class="pts">' + pts + " / " + TOTAL + " points</span>" +
      '<span class="verdict">' + verdict + "</span>" +
      '<div class="scale" aria-hidden="true">' + steps.join("") + "</div>" +
      (rev.length ? '<span class="revoir">À revoir : ' + rev.join(" · ") + "</span>" : '<span class="revoir">Aucun chapitre à revoir. Tente une nouvelle série pour confirmer.</span>') + "</div>";
    res.hidden = false;
    D.$("eval-submit").hidden = true;
    D.$("eval-retry").hidden = false;
    submitted = true;
    res.scrollIntoView({ behavior: D.reduceMotion ? "auto" : "smooth", block: "center" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!D.$("eval-list")) return;
    render();
    D.$("eval-submit").addEventListener("click", () => {
      const missing = qs.filter((_, i) => !answered(i)).length;
      const btn = D.$("eval-submit");
      if (missing && btn.dataset.confirm !== "1") {
        btn.dataset.confirm = "1";
        btn.textContent = missing + " question" + (missing > 1 ? "s" : "") + " sans réponse : rendre quand même ?";
        return;
      }
      btn.dataset.confirm = "";
      btn.textContent = "Rendre l'évaluation";
      correct();
    });
    D.$("eval-retry").addEventListener("click", () => render());
    D.$("eval-new").addEventListener("click", () => { seed = 1 + Math.floor(Math.random() * 9999); qs = build(seed); render(); });
    D.$("eval-a").addEventListener("click", () => { seed = 0; qs = build(0); render(); });
  });

  window.Evaluation = { build, TOTAL, note, CHAP };
  void submitted;
})();
