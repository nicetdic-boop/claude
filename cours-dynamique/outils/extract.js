// Extrait le contenu structuré du cours (thème clair) et capture les figures.
// Usage : node outils/extract.js <dossier-sortie>  (Playwright requis)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve(process.argv[2] || 'docx-src');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1100, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 });
  p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await p.waitForTimeout(700);

  const setRange = (id, v) => p.$eval('#' + id, (el, v) => { el.value = v; el.dispatchEvent(new Event('input')); }, v);
  const view = (id) => p.$('#' + id).then((e) => e.scrollIntoViewIfNeeded());

  // ---- États des simulations pour les captures ----
  await view('sim-hooke');
  for (const v of [100, 200, 300, 400]) { await setRange('hooke-m', v); await p.waitForTimeout(4200); await p.click('#hooke-noter'); }
  await setRange('hooke-m', 250); await p.waitForTimeout(4200);

  await view('sim-inertie');
  await p.click('#inertie-go'); await p.waitForTimeout(7600);

  await view('sim-chariot');
  await p.click('#chariot-go'); await p.waitForTimeout(1500);
  await setRange('chariot-f', 12); await p.click('#chariot-go'); await p.waitForTimeout(1300);
  await setRange('chariot-f', 6);

  await view('sim-ascenseur');
  await p.click('#asc-up'); await p.waitForTimeout(13000);

  const shots = {};
  for (const id of ['fig-livre', 'fig-luge', 'fig-corde', 'fig-paires', 'fig-mcu']) {
    const el = await p.$('#' + id + ' .fig__body');
    await el.scrollIntoViewIfNeeded();
    const f = path.join(out, id + '.png');
    await el.screenshot({ path: f });
    shots[id] = f;
  }
  async function simShot(id) {
    const el = await p.$('#' + id + ' .sim__stage');
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(150);
    const f = path.join(out, id + '.png');
    await el.screenshot({ path: f });
    shots[id] = f;
  }
  for (const id of ['sim-somme', 'sim-hooke', 'sim-inertie', 'sim-chariot', 'sim-plan', 'sim-ascenseur', 'sim-lies', 'sim-virage']) await simShot(id);
  await view('sim-patineurs');
  await p.click('#pat-go'); await p.waitForTimeout(260);
  await p.evaluate(() => {}); await simShot('sim-patineurs');

  // ---- Extraction du contenu ----
  const data = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const hex = (v) => {
      v = v.trim();
      if (v.startsWith('#')) return v.slice(1).toUpperCase();
      const m = v.match(/\d+/g); if (!m) return null;
      return m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
    };
    const COL = {};
    ['poids', 'normale', 'frott', 'tension', 'app', 'ressort', 'vit', 'acc'].forEach((k) => (COL['c-' + k] = hex(cs.getPropertyValue('--v-' + k))));

    function runs(node, st, acc) {
      st = st || {}; acc = acc || [];
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          const t = n.textContent.replace(/[ \t\n\r]+/g, ' ');
          if (t) acc.push(Object.assign({ text: t }, st));
          return;
        }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        const s = Object.assign({}, st);
        if (tag === 'i' || tag === 'em') s.i = true;
        if (tag === 'strong' || tag === 'b') s.b = true;
        if (tag === 'sub') s.sub = true;
        if (tag === 'sup') s.sup = true;
        n.classList.forEach((c) => { if (COL[c]) s.color = COL[c]; });
        if (n.classList.contains('vec')) {
          acc.push(Object.assign({}, s, { text: n.textContent + '⃗', vec: true }));
          return;
        }
        if (n.classList.contains('frac')) {
          const [a, bb] = n.children;
          const wrap = (el) => {
            const r = runs(el, s, []);
            const txt = r.map((x) => x.text).join('').trim();
            const need = /[ +−\-×]/.test(txt) && !/^\(.*\)$/.test(txt);
            return need ? [Object.assign({}, s, { text: '(' })].concat(r, [Object.assign({}, s, { text: ')' })]) : r;
          };
          acc.push(...wrap(a), Object.assign({}, s, { text: ' / ' }), ...wrap(bb));
          return;
        }
        runs(n, s, acc);
      });
      return acc;
    }
    function trimRuns(r) {
      r = r.filter((x) => x.text !== '');
      if (r.length) { r[0].text = r[0].text.replace(/^ +/, ''); r[r.length - 1].text = r[r.length - 1].text.replace(/ +$/, ''); }
      return r.filter((x) => x.text !== '');
    }
    const R = (el) => trimRuns(runs(el));
    const T = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

    function formula(el) {
      const parts = [];
      el.childNodes.forEach((n) => {
        if (n.nodeType === 1 && n.classList.contains('note')) parts.push({ note: R(n) });
        else if (n.nodeType === 1) parts.push({ eq: R(n) });
      });
      return { t: 'formula', parts };
    }
    function table(el) {
      const tb = el.querySelector('table');
      const head = [...tb.querySelectorAll('thead th')].map((th) => ({ runs: R(th), r: th.classList.contains('r') }));
      const rows = [...tb.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => ({ runs: R(td), r: td.classList.contains('r') })));
      return { t: 'table', head, rows };
    }
    function list(el) {
      return { t: el.tagName === 'OL' ? 'ol' : 'ul', steps: el.classList.contains('steps'), items: [...el.children].map((li) => R(li.querySelector(':scope > span') && el.classList.contains('steps') ? li.querySelector(':scope > span') : li)) };
    }
    function exo(li) {
      const e = { t: 'exo', id: li.id, num: T(li.querySelector('.exo__num')), title: T(li.querySelector('.exo__title')), niveau: T(li.querySelector('.niveau')), parts: [], solution: [] };
      [...li.children].forEach((c) => {
        if (c.matches('.exo__head, .check-row')) return;
        if (c.matches('p')) e.parts.push({ t: 'p', runs: R(c) });
        else if (c.matches('.answer')) e.parts.push({ t: 'answer', label: R(c.querySelector('label')), unit: T(c.querySelector('.unit')), ans: +c.dataset.ans });
        else if (c.matches('ul.qcm')) e.parts.push({ t: 'qcm', ans: c.dataset.ans, opts: [...c.querySelectorAll('label > span')].map(R) });
        else if (c.matches('details.solution')) e.solution = blocks(c.querySelector(':scope > div'));
      });
      return e;
    }
    function blocks(container) {
      const res = [];
      [...container.children].forEach((c) => {
        if (c.matches('.section-head')) {
          res.push({ t: 'h2', label: T(c.querySelector('.label')), text: T(c.querySelector('h3')) });
        } else if (c.matches('p.formula')) res.push(formula(c));
        else if (c.matches('p.hint')) res.push({ t: 'p', small: true, runs: R(c) });
        else if (c.matches('p')) res.push({ t: 'p', runs: R(c) });
        else if (c.matches('span.label')) res.push({ t: 'label', text: T(c) });
        else if (c.matches('h4')) res.push({ t: 'h3', text: T(c) });
        else if (c.matches('ol.exos')) [...c.children].forEach((li) => res.push(exo(li)));
        else if (c.matches('ul, ol')) res.push(list(c));
        else if (c.matches('.box')) {
          const kind = ['loi', 'def', 'ex', 'fun', 'warn'].find((k) => c.classList.contains('box--' + k)) || 'def';
          res.push({ t: 'box', kind, label: T(c.querySelector(':scope > .label')), children: blocks(c).filter((x) => x.t !== 'label') });
        } else if (c.matches('.table-wrap')) res.push(table(c));
        else if (c.matches('figure.fig')) res.push({ t: 'img', id: c.id, caption: R(c.querySelector('figcaption')) });
        else if (c.matches('.fig-row')) [...c.children].forEach((f) => res.push({ t: 'img', id: f.id, caption: R(f.querySelector('figcaption')) }));
        else if (c.matches('figure.sim')) {
          res.push({ t: 'sim', id: c.id, title: T(c.querySelector('h4')), num: T(c.querySelector('.sim__head .label')),
            essayer: [...c.querySelectorAll('.essayer li')].map(R) });
        } else if (c.matches('aside.essentiel')) res.push({ t: 'essentiel', label: T(c.querySelector('.label')), items: [...c.querySelectorAll('li')].map(R) });
        else if (c.matches('.objectifs')) res.push({ t: 'objectifs', items: [...c.querySelectorAll('li')].map(R) });
        else if (c.matches('section')) res.push(...blocks(c));
      });
      return res;
    }
    const chapters = [...document.querySelectorAll('article.chapter[data-chapter]')].map((art) => {
      const head = art.querySelector('.chapter-head');
      return {
        n: art.dataset.chapter,
        title: T(head.querySelector('h2')),
        lead: R(head.querySelector('.lead')),
        objectifs: [...head.querySelectorAll('.objectifs li')].map(R),
        body: [...art.children].filter((c) => !c.matches('.chapter-head')).flatMap((c) => (c.matches('section') ? blocks(c) : blocks({ children: [c] })))
      };
    });
    const formulaire = table(document.querySelector('#formulaire .table-wrap'));

    const tmp = document.createElement('div');
    const html2runs = (h) => { tmp.innerHTML = h; return R(tmp); };
    const ev = window.Evaluation.build(0).map((q) => ({
      num: q.num, chap: q.chap, pts: q.pts, type: q.type, unit: q.unit || '', ans: q.ans,
      text: html2runs(q.text), opts: (q.opts || []).map(html2runs), sol: html2runs(q.sol)
    }));
    return { COL, chapters, formulaire, evaluation: { questions: ev, total: window.Evaluation.TOTAL, chap: window.Evaluation.CHAP } };
  });
  data.shots = shots;
  fs.writeFileSync(path.join(out, 'contenu.json'), JSON.stringify(data, null, 1));
  console.log('chapitres', data.chapters.length, 'questions', data.evaluation.questions.length, 'images', Object.keys(shots).length);
  await b.close();
})();
