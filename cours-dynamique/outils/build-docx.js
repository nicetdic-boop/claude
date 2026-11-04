// Construit cours-dynamique.docx à partir de docx-src/contenu.json
// Usage : node outils/build-docx.js <dossier-de-extract.js> [sortie.docx]  (paquet npm docx requis)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, HeadingLevel, LevelFormat, PageBreak, Header, Footer, PageNumber,
  TabStopType, TableLayoutType, VerticalAlign, LineRuleType
} = require('docx');

const SRC = path.resolve(process.argv[2] || 'docx-src');
const OUT = process.argv[3] || path.resolve(__dirname, '../cours-dynamique.docx');
const D = JSON.parse(fs.readFileSync(path.join(SRC, 'contenu.json'), 'utf8'));

const INK = '132030', INK2 = '4A5A6B', INK3 = '6F7D8C', ACC = '0B7A75', ACCSOFT = 'D9EFED', PAPER = 'F3F5F7', RULE = 'D4DCE5', RULE2 = 'E6EBF0', SIGNAL = 'F5C400';
const FONT = 'Calibri';
const TW = 9638; // largeur utile en DXA (17 cm)

/* ---------- Runs ---------- */
function tr(r, extra) {
  extra = extra || {};
  const o = {
    text: r.text,
    bold: r.b || extra.bold || undefined,
    italics: r.i || r.vec || extra.italics || undefined,
    subScript: r.sub || undefined,
    superScript: r.sup || undefined,
    color: r.color || extra.color || undefined,
    size: extra.size,
    font: r.vec ? 'Cambria Math' : extra.font
  };
  return new TextRun(o);
}
const runs = (rs, extra) => (rs || []).map((r) => tr(r, extra));
const plain = (t, extra) => new TextRun(Object.assign({ text: t }, extra || {}));
const rtext = (rs) => (rs || []).map((r) => r.text).join('');

/* ---------- Paragraphes ---------- */
let numInst = 0;
function P(children, opts) { return new Paragraph(Object.assign({ children }, opts || {})); }
function para(rs, opts) { return P(runs(rs, opts && opts.run), opts && opts.p); }
function bullet(rs, level) { return P(runs(rs), { numbering: { reference: 'puces', level: level || 0 } }); }
function numbered(items, ref) {
  const inst = ++numInst;
  return items.map((rs) => P(runs(rs), { numbering: { reference: ref || 'nums', level: 0, instance: inst } }));
}
function label(t, color) {
  return P([plain(t.toUpperCase(), { bold: true, size: 17, color: color || ACC, characterSpacing: 20 })], { spacing: { before: 0, after: 60 }, keepNext: true });
}

/* ---------- Images ---------- */
function pngSize(f) {
  const b = fs.readFileSync(f);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function image(file, widthPx) {
  const s = pngSize(file);
  const w = widthPx, h = Math.round(widthPx * s.h / s.w);
  return P([new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: w, height: h } })],
    { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true });
}
const IMGW = {
  'fig-livre': 400, 'fig-luge': 400, 'fig-corde': 560, 'fig-paires': 470, 'fig-mcu': 280
};

/* ---------- Tableaux ---------- */
function cellBorders(color, size, style) {
  const b = { style: style || BorderStyle.SINGLE, size: size || 4, color: color || RULE };
  return { top: b, bottom: b, left: b, right: b };
}
function dataTable(t, widths) {
  const n = t.head.length;
  widths = widths || Array(n).fill(Math.floor(TW / n));
  const sum = widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += TW - sum;
  const mk = (c, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders: cellBorders(RULE, 4),
    shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: RULE2 } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [P(runs(c.runs, { size: head ? 18 : 20, bold: head || undefined, color: head ? INK2 : undefined }), { alignment: c.r ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { before: 0, after: 0 } })]
  });
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({ tableHeader: true, children: t.head.map((c, i) => mk(c, i, true)) })]
      .concat(t.rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false)) })))
  });
}
function boxTable(children, kind) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  let borders, fill;
  switch (kind) {
    case 'loi': borders = cellBorders(INK, 12); break;
    case 'def': borders = cellBorders(RULE, 4); fill = PAPER; break;
    case 'ex': borders = { top: none, bottom: none, left: none, right: none }; fill = ACCSOFT; break;
    case 'fun': borders = cellBorders(INK3, 6, BorderStyle.DASHED); break;
    case 'warn': borders = Object.assign(cellBorders(RULE, 4), { top: { style: BorderStyle.SINGLE, size: 36, color: SIGNAL } }); break;
    case 'ess': borders = Object.assign({ top: none, bottom: none, right: none }, { left: { style: BorderStyle.SINGLE, size: 36, color: ACC } }); fill = RULE2; break;
    default: borders = cellBorders(RULE, 4);
  }
  return [new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({ cantSplit: children.length < 12, children: [new TableCell({
      width: { size: TW, type: WidthType.DXA },
      borders,
      shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      children
    })] })]
  }), P([], { spacing: { before: 0, after: 60 } })];
}

/* ---------- Formules ---------- */
function formula(b) {
  const out = [];
  const eqs = b.parts.filter((x) => x.eq);
  const notes = b.parts.filter((x) => x.note);
  const ch = [];
  eqs.forEach((e, i) => { if (i) ch.push(plain('        ')); ch.push(...runs(e.eq, { size: 24 })); });
  out.push(P(ch, { alignment: AlignmentType.CENTER, spacing: { before: 100, after: notes.length ? 20 : 100 } }));
  notes.forEach((nn) => out.push(P(runs(nn.note, { size: 18, color: INK3 }), { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 } })));
  return out;
}

/* ---------- Blocs du cours ---------- */
const corrige = []; // solutions des exercices, par chapitre
function exoHead(e) {
  return P([plain('Exercice ' + e.num + '  ', { bold: true, color: ACC, size: 24 }), plain(e.title, { bold: true, size: 24 }), plain('   ' + e.niveau, { size: 17, color: INK3 })],
    { spacing: { before: 200, after: 80 }, keepNext: true, border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } } });
}
function answerLine(lbl, unit) {
  const ch = runs(lbl).concat([plain(' :'), plain('\t'), plain(unit ? ' ' + unit : '')]);
  return P(ch, { tabStops: [{ type: TabStopType.RIGHT, position: TW - 200, leader: 'dot' }], spacing: { before: 120, after: 60 } });
}
function qcmLines(opts) {
  return opts.map((o) => P([plain('☐  ', { font: 'Segoe UI Symbol' })].concat(runs(o)), { indent: { left: 360 }, spacing: { before: 40, after: 40 } }));
}
function blocks(list, ctx) {
  const out = [];
  list.forEach((b) => {
    switch (b.t) {
      case 'h2': {
        if (/^Exercices/.test(b.label)) out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain('Exercices du chapitre ' + ctx.n)] }));
        else out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain(b.label + '  ', { color: ACC }), plain(b.text)] }));
        break;
      }
      case 'h3': out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [plain(b.text)] })); break;
      case 'p': out.push(b.small ? para(b.runs, { run: { size: 18, color: INK3 } }) : para(b.runs)); break;
      case 'formula': out.push(...formula(b)); break;
      case 'ul': if (b.steps) out.push(...numbered(b.items)); else b.items.forEach((it) => out.push(bullet(it))); break;
      case 'ol': out.push(...numbered(b.items)); break;
      case 'table': out.push(dataTable(b), P([], { spacing: { after: 60 } })); break;
      case 'box': {
        const inner = [label(b.label, b.kind === 'loi' || b.kind === 'warn' ? INK : ACC)].concat(blocks(b.children, ctx));
        out.push(...boxTable(inner, b.kind));
        break;
      }
      case 'img': {
        out.push(image(D.shots[b.id], IMGW[b.id] || 500));
        out.push(para(b.caption, { run: { size: 18, color: INK2 }, p: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 } } }));
        break;
      }
      case 'sim': {
        out.push(P([plain(b.num + '  ·  ', { bold: true, color: ACC, size: 22 }), plain(b.title, { bold: true, size: 22 })], { spacing: { before: 200, after: 0 }, keepNext: true }));
        out.push(image(D.shots[b.id], 600));
        out.push(P([plain('Capture de la simulation interactive. Dans le cours en ligne, les curseurs et les boutons permettent de modifier la situation.', { italics: true, size: 18, color: INK3 })], { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 }, keepNext: true }));
        out.push(label('À essayer dans le cours en ligne'));
        out.push(...numbered(b.essayer));
        out.push(P([], { spacing: { after: 100 } }));
        break;
      }
      case 'exo': {
        out.push(exoHead(b));
        b.parts.forEach((pp) => {
          if (pp.t === 'p') out.push(para(pp.runs));
          else if (pp.t === 'answer') out.push(answerLine(pp.label, pp.unit));
          else if (pp.t === 'qcm') out.push(...qcmLines(pp.opts));
        });
        corrige.push({ chap: ctx.n, e: b });
        break;
      }
      case 'essentiel': {
        const inner = [label(b.label, ACC)].concat(b.items.map((it) => bullet(it)));
        out.push(P([], { spacing: { before: 200 } }), ...boxTable(inner, 'ess'));
        break;
      }
      case 'objectifs': break;
      default: break;
    }
  });
  return out;
}

/* ---------- Page de titre ---------- */
const COL = D.COL;
const titre = [
  P([plain('PHYSIQUE · SECONDAIRE II · MÉCANIQUE', { size: 18, color: ACC, bold: true, characterSpacing: 30 })], { spacing: { before: 1800, after: 200 } }),
  P([plain('Dynamique', { size: 96, bold: true, color: INK })], { spacing: { after: 0 } }),
  P([plain('au gymnase', { size: 48, color: INK2 })], { spacing: { after: 400 } }),
  P([plain('ΣF⃗ = m·a⃗', { size: 56, font: 'Cambria Math', italics: true, color: INK })], { spacing: { after: 500 } }),
  P([plain('La cinématique décrit comment les objets bougent. La dynamique explique pourquoi ils bougent, pourquoi ils s\'arrêtent, et pourquoi ta voiture sort du virage quand la route est verglacée.', { size: 26, color: INK2 })], { spacing: { after: 400, line: 320, lineRule: LineRuleType.AUTO } }),
  P([plain('Retranscription du cours interactif : théorie, exemples pratiques, descriptions des 9 simulations, 27 exercices, formulaire et évaluation finale notée sur 6. Le corrigé des exercices et de l\'évaluation se trouve à la fin, dans une section séparée qu\'on peut retirer avant de distribuer.', { size: 21, color: INK3 })], { spacing: { after: 200 } }),
  P([plain('Prérequis : MRU, MRUA et vecteurs. Durée indicative : 10 à 12 périodes. Dans tout le cours, g = 9,81 m/s².', { size: 21, color: INK3 })]),
  P([new PageBreak()])
];

/* ---------- Sommaire et code couleur ---------- */
const intro = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain('Sommaire')] }),
  ...D.chapters.map((c) => P([plain('Chapitre ' + c.n + '  ', { bold: true, color: ACC }), plain(c.title)], { spacing: { before: 60, after: 60 } })),
  P([plain('Formulaire', { bold: true, color: ACC })], { spacing: { before: 60, after: 60 } }),
  P([plain('Évaluation finale', { bold: true, color: ACC })], { spacing: { before: 60, after: 60 } }),
  P([plain('Corrigé des exercices et de l\'évaluation', { bold: true, color: ACC })], { spacing: { before: 60, after: 300 } }),
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain('Code couleur des vecteurs')] }),
  para([{ text: 'Chaque type de force garde sa couleur dans tout le cours : dans le texte, les schémas et les simulations.' }]),
  dataTable({
    head: [{ runs: [{ text: 'Vecteur' }] }, { runs: [{ text: 'Symbole' }] }, { runs: [{ text: 'Couleur' }] }],
    rows: [
      ['Poids', 'P', 'orange brûlé', COL['c-poids']], ['Force normale', 'N', 'bleu', COL['c-normale']], ['Tension', 'T', 'violet', COL['c-tension']],
      ['Frottement', 'Ff', 'ocre', COL['c-frott']], ['Force appliquée', 'F', 'rouge', COL['c-app']], ['Force élastique', 'Fél', 'sarcelle', COL['c-ressort']],
      ['Résultante', 'ΣF', 'noir, trait épais', INK], ['Vitesse', 'v', 'vert', COL['c-vit']], ['Accélération', 'a', 'magenta', COL['c-acc']]
    ].map(([n, s, c, h]) => [{ runs: [{ text: n, b: true, color: h }] }, { runs: [{ text: s, i: true, color: h }] }, { runs: [{ text: c }] }])
  }, [4200, 1800, 3638]),
  P([], { spacing: { after: 200 } }),
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain('Comment utiliser ce document')] }),
  ...numbered([
    [{ text: 'Lis la théorie chapitre par chapitre. Les encadrés au trait noir épais contiennent les lois à connaître par cœur.', b: false }],
    [{ text: 'Les simulations sont reproduites sous forme de captures. Pour les manipuler, ouvre le cours en ligne (fichier index.html) : les questions « À essayer » te guident.' }],
    [{ text: 'Fais les exercices sur les lignes prévues, puis compare avec le corrigé à la fin du document.' }],
    [{ text: 'Termine par l\'évaluation finale (26 points, note sur 6).' }]
  ]),
  P([new PageBreak()])
];

/* ---------- Chapitres ---------- */
const cours = [];
D.chapters.forEach((c, i) => {
  if (i) cours.push(P([new PageBreak()]));
  cours.push(P([plain('CHAPITRE ' + c.n, { bold: true, color: ACC, size: 20, characterSpacing: 30 })], { spacing: { before: 0, after: 40 }, keepNext: true }));
  cours.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain(c.title)] }));
  cours.push(para(c.lead, { run: { italics: true, size: 24, color: INK2 }, p: { spacing: { after: 160 } } }));
  if (c.objectifs.length) cours.push(...boxTable([label('Objectifs')].concat(c.objectifs.map((o) => bullet(o))), 'def'));
  cours.push(...blocks(c.body, c));
});

/* ---------- Formulaire ---------- */
cours.push(P([new PageBreak()]));
cours.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain('Formulaire')] }));
cours.push(dataTable(D.formulaire, [3400, 4300, 1938]));

/* ---------- Évaluation ---------- */
const EV = D.evaluation;
const CH = EV.chap;
const evalPart = [
  P([plain('ÉVALUATION FINALE', { bold: true, color: ACC, size: 20, characterSpacing: 30 })], { spacing: { after: 40 } }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain('Dynamique · l\'épreuve')] }),
  P([plain('Nom :'), plain('\t'), plain('   Classe :'), plain('\t'), plain('   Date :'), plain('\t')],
    { tabStops: [{ type: TabStopType.LEFT, position: 4300, leader: 'dot' }, { type: TabStopType.LEFT, position: 7000, leader: 'dot' }, { type: TabStopType.RIGHT, position: TW, leader: 'dot' }], spacing: { before: 200, after: 240 } }),
  ...boxTable([
    label('Consignes', INK),
    bullet([{ text: '16 questions, 26 points : 6 questions à choix multiple à 1 point, 10 calculs à 2 points.' }]),
    bullet([{ text: 'Calculatrice et formulaire autorisés. Durée conseillée : 45 minutes.' }]),
    bullet([{ text: 'Pour les calculs, écris la formule, remplace par les valeurs, donne le résultat avec son unité. Prends g = 9,81 m/s².' }]),
    bullet([{ text: 'Une réponse numérique est juste si elle s\'écarte de moins de 2 % de la valeur exacte.' }]),
    bullet([{ text: 'Note = 1 + 5 × points / 26, arrondie au demi-point.' }])
  ], 'loi')
];
EV.questions.forEach((q) => {
  evalPart.push(P([plain('Question ' + q.num, { bold: true, color: ACC, size: 23 }), plain('   ' + q.pts + ' point' + (q.pts > 1 ? 's' : '') + '  ·  chapitre ' + q.chap, { size: 17, color: INK3 })],
    { spacing: { before: 220, after: 60 }, keepNext: true, border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } } }));
  evalPart.push(P(runs(q.text), { keepNext: true }));
  if (q.type === 'qcm') {
    evalPart.push(...q.opts.map((o, k) => P([plain('☐  ', { font: 'Segoe UI Symbol' }), plain(String.fromCharCode(65 + k) + ')  ', { bold: true })].concat(runs(o)), { indent: { left: 360 }, spacing: { before: 40, after: 40 } })));
  } else {
    for (let k = 0; k < 3; k++) evalPart.push(P([plain('\t')], { tabStops: [{ type: TabStopType.RIGHT, position: TW, leader: 'dot' }], spacing: { before: 160, after: 0 } }));
    evalPart.push(P([plain('Réponse :', { bold: true }), plain('\t'), plain(' ' + q.unit)], { tabStops: [{ type: TabStopType.RIGHT, position: 6000, leader: 'dot' }], spacing: { before: 160, after: 60 } }));
  }
});
// barème
evalPart.push(P([new PageBreak()]));
evalPart.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain('Barème')] }));
evalPart.push(para([{ text: 'Note = 1 + 5 × points / 26, arrondie au demi-point. Table de conversion :' }]));
{
  const cols = 4, rowsN = Math.ceil((EV.total + 1) / cols);
  const head = [];
  for (let c = 0; c < cols; c++) head.push({ runs: [{ text: 'Points' }], r: true }, { runs: [{ text: 'Note' }], r: true });
  const rows = [];
  for (let r = 0; r < rowsN; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const pts = c * rowsN + r;
      if (pts <= EV.total) {
        const nt = Math.round((1 + 5 * pts / EV.total) * 2) / 2;
        row.push({ runs: [{ text: String(pts) }], r: true }, { runs: [{ text: nt.toFixed(1).replace('.', ','), b: true }], r: true });
      } else row.push({ runs: [] }, { runs: [] });
    }
    rows.push(row);
  }
  evalPart.push(dataTable({ head, rows }));
}

/* ---------- Corrigé ---------- */
const fmt = (x) => {
  const e = Math.floor(Math.log10(Math.abs(x)));
  const d = Math.max(0, 2 - e);
  return x.toFixed(d).replace('.', ',');
};
const corr = [
  P([plain('CORRIGÉ', { bold: true, color: ACC, size: 20, characterSpacing: 30 })], { spacing: { after: 40 } }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain('Corrigé des exercices')] })
];
let lastChap = null;
corrige.forEach(({ chap, e }) => {
  if (chap !== lastChap) {
    corr.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [plain('Chapitre ' + chap + '  ', { color: ACC }), plain(D.chapters.find((c) => c.n === chap).title)] }));
    lastChap = chap;
  }
  corr.push(P([plain(e.num + '  ', { bold: true, color: ACC }), plain(e.title, { bold: true })], { spacing: { before: 160, after: 40 }, keepNext: true }));
  const ans = [];
  e.parts.forEach((pp) => {
    if (pp.t === 'answer') ans.push(rtext(pp.label).replace(/^([a-z]\)).*$/, '$1') + ' ' + fmt(pp.ans) + (pp.unit ? ' ' + pp.unit : ''));
    if (pp.t === 'qcm') { const k = pp.ans.charCodeAt(0) - 97; ans.push('réponse : ' + rtext(pp.opts[k])); }
  });
  if (ans.length) corr.push(P([plain('Résultats : ', { bold: true, size: 20, color: INK2 }), plain(ans.join('  ·  '), { size: 20, color: INK2 })], { spacing: { after: 40 } }));
  e.solution.forEach((b) => { if (b.t === 'p') corr.push(para(b.runs)); });
});
corr.push(P([new PageBreak()]));
corr.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [plain('Corrigé de l\'évaluation finale')] }));
EV.questions.forEach((q) => {
  const exp = q.type === 'qcm' ? String.fromCharCode(65 + q.opts.length && 65) : '';
  void exp;
  const head = [plain('Question ' + q.num + '  ', { bold: true, color: ACC }), plain('(' + q.pts + ' pt' + (q.pts > 1 ? 's' : '') + ')  ', { size: 18, color: INK3 })];
  if (q.type === 'qcm') {
    const k = q.ans;
    head.push(plain('Réponse ' + String.fromCharCode(65 + k) + ' : ', { bold: true }), ...runs(q.opts[k], { bold: true }));
  } else {
    head.push(plain('Réponse : ' + fmt(q.ans) + ' ' + q.unit, { bold: true }));
  }
  corr.push(P(head, { spacing: { before: 140, after: 30 }, keepNext: true }));
  corr.push(para(q.sol));
});

/* ---------- Document ---------- */
const header = (t) => new Header({ children: [P([plain(t, { size: 16, color: INK3 })], { alignment: AlignmentType.RIGHT })] });
const footer = new Footer({ children: [P([plain('Page ', { size: 16, color: INK3 }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: INK3 }), plain(' sur ', { size: 16, color: INK3 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: INK3 })], { alignment: AlignmentType.CENTER })] });
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 567, footer: 567 } };

const doc = new Document({
  creator: 'Dynamique au gymnase',
  title: 'Dynamique au gymnase',
  description: 'Cours de dynamique pour le gymnase : théorie, simulations, exercices, évaluation et corrigé.',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK }, paragraph: { spacing: { after: 120, line: 276, lineRule: LineRuleType.AUTO } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 44, bold: true, color: INK }, paragraph: { spacing: { before: 0, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: INK }, paragraph: { spacing: { before: 360, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: INK }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 300 } } } }] }
    ]
  },
  sections: [
    { properties: { page, titlePage: true }, headers: { default: header('Dynamique au gymnase · cours') }, footers: { default: footer }, children: titre.concat(intro, cours) },
    { properties: { page }, headers: { default: header('Dynamique au gymnase · évaluation finale') }, footers: { default: footer }, children: evalPart },
    { properties: { page }, headers: { default: header('Dynamique au gymnase · corrigé') }, footers: { default: footer }, children: corr }
  ]
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log('écrit', OUT, buf.length, 'octets'); });
