/* Hora – Quotation Builder. Plain JS, rule-based maths, no AI. */

/* ===== 1. EDIT YOUR COMPANY DETAILS HERE (printed in Word header/footer) ===== */
const COMPANY = {
  name: 'EMED BIOMEDICALSS',
  address: ['#100C, V.O.C. Street, Injambakkam,', 'ECR, Chennai–600115'],
  phones: '+ 91 9790759552 / 8778438998',
  email: 'emedbss@gmail.com',
  web: 'www.emedbss.com',
  gstn: '33AFTPN9502Q1ZM',
  footEmails: ['info@emedgroup.in', 'emed_biomed@yahoo.com'],
  tagline: ['***21', 'st', ' year in the Excellence of Medical Electronic Devices***'], // middle part is superscript
  signRight: 'FOR EMED BIOMEDICALSS'
};
const COLORS = { blue: '1F1FC8', red: 'E52620' };

/* ===== 2. MASTER DATA ===== */
const UNITS = ['Nos', 'Set', 'Lot', 'RM', 'Mtr', 'Kg', 'Sq.Ft', 'Sq.Mtr', 'Litre', 'Box', 'Hrs', 'Job'];
const DEFAULT_TERMS = [
  'The Buyer must make an advance payment of 70% of the total order value at the time of order confirmation.',
  'The delivery period for the ordered equipment shall be within 30 days from the date of order confirmation',
  'The Buyer shall inspect the delivered goods upon receipt. Any defects or discrepancies must be reported within 7 days of delivery.',
  'Orders once confirmed cannot be cancelled without prior written approval from the Supplier.',
  'The Supplier shall not be liable for any indirect or consequential damages arising from equipment failure.',
  'These terms shall be governed by and construed in accordance with the laws of India.',
  'Warranty for Split Unit:',
  '* 1 year Replacement Warranty.',
  '* Additional 4 years PCB Warranty.',
  '* Additional 9 years Compressor warranty.'
].join('\n');

/* ===== 3. STATE ===== */
const KEY = 'hora_quote_v1';
let uid = Date.now();
const nid = p => p + (uid++);
const newRow = () => ({ id: nid('r'), type: 'item', name: '', desc: '', dealer: 0, margin: 15, unit: 'Nos', qty: 1, hsn: '', gst: 18, note: '' });
const newNote = () => ({ id: nid('r'), type: 'note', name: '', note: '' });
const newSection = () => ({ id: nid('s'), title: '', rows: [newRow()] });
const today = () => new Date().toISOString().slice(0, 10);
let state = load() || { no: '', date: today(), toName: '', toAddr: '', showSum: true, terms: DEFAULT_TERMS, sections: [newSection()] };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && Array.isArray(s.sections) && s.sections.length ? s : null;
  } catch (e) { return null; }
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 300);
}

/* ===== 4. MATHS (the only place numbers are calculated) ===== */
const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
function calc(r) {
  if (r.type !== 'item') return { sell: 0, base: 0, tax: 0, total: 0, dealerTotal: 0 };
  const sell = r2(r.dealer * (1 + r.margin / 100));   // selling price per unit
  const base = r2(sell * r.qty);                      // total before tax
  const tax = r2(base * r.gst / 100);                 // GST amount
  return { sell, base, tax, total: r2(base + tax), dealerTotal: r2(r.dealer * r.qty) };
}
function secTotals(sec) {
  const t = { base: 0, tax: 0, total: 0, dealer: 0 };
  sec.rows.forEach(r => { const c = calc(r); t.base += c.base; t.tax += c.tax; t.total += c.total; t.dealer += c.dealerTotal; });
  Object.keys(t).forEach(k => t[k] = r2(t[k]));
  return t;
}
const fmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const $ = id => document.getElementById(id);

/* ===== 5. SCREEN RENDERING ===== */
function render() {
  $('sections').innerHTML = state.sections.map((s, i) => `
  <section class="card sec" data-sid="${s.id}">
    <div class="sec-head"><span class="badge">${i + 1}</span>
      <input data-f="title" value="${esc(s.title)}" placeholder="Table title, e.g. INSTALLATION PRICING (empty = plain 1, 2, 3 numbering)">
      ${state.sections.length > 1 ? '<button class="btn small danger" data-a="del-sec">Delete table</button>' : ''}</div>
    <div class="tscroll"><table>
      <thead><tr><th>#</th><th>Product / description</th><th class="int num">Dealer ₹ (hidden)</th><th class="int num">Margin %</th>
        <th class="num">Seller price ₹</th><th>Unit</th><th>Qty</th><th>HSN</th><th>GST %</th>
        <th class="num">Total excl. GST</th><th class="num">GST amt</th><th class="num">Total incl. GST</th><th></th></tr></thead>
      <tbody>${s.rows.map((r, j) => rowHtml(r, j)).join('')}</tbody></table></div>
    <div class="sec-foot">
      <button class="btn small" data-a="add-row">＋ Add product row</button>
      <button class="btn small" data-a="add-note">＋ Add note row</button>
      <span class="tot">Table total: <b data-c="sec-base"></b> excl. GST · <b data-c="sec-total"></b> incl. GST</span>
    </div>
  </section>`).join('');
  updateAll();
}
function rowHtml(r, j) {
  const del = `<td class="full"><button class="btn small danger" data-a="del-row" title="Remove row">✕</button></td>`;
  if (r.type === 'note') return `<tr data-rid="${r.id}"><td data-l="${j + 1}">${j + 1}</td>
    <td class="full" data-l="Item name (e.g. Copper Pipes)"><input data-f="name" value="${esc(r.name)}"></td>
    <td class="full" data-l="Note text (printed across the price columns)" colspan="10"><input data-f="note" value="${esc(r.note)}" placeholder="e.g. Additional charges as actual will be reflected in the final invoice"></td>${del}</tr>`;
  const num = (f, v, l, extra = '') => `<td ${extra} data-l="${l}"><input type="number" min="0" step="any" data-f="${f}" value="${v}"></td>`;
  return `<tr data-rid="${r.id}"><td data-l="${j + 1}">${j + 1}</td>
    <td class="full" data-l="Product / description"><input data-f="name" value="${esc(r.name)}" placeholder="Product name">
      <textarea data-f="desc" class="desc-in" rows="1" placeholder="Description (optional)">${esc(r.desc)}</textarea></td>
    ${num('dealer', r.dealer, 'Dealer price ₹ (hidden)', 'class="int"')}${num('margin', r.margin, 'Margin %', 'class="int"')}
    <td class="num" data-l="Seller price ₹" data-c="sell"></td>
    <td data-l="Unit"><select data-f="unit">${UNITS.map(u => `<option${u === r.unit ? ' selected' : ''}>${u}</option>`).join('')}</select></td>
    ${num('qty', r.qty, 'Qty')}
    <td data-l="HSN"><input data-f="hsn" class="hsn-in" autocomplete="off" value="${esc(r.hsn)}" placeholder="Search HSN / SAC"></td>
    <td data-l="GST % (type any rate)"><input type="number" min="0" max="100" step="any" list="gstlist" data-f="gst" value="${r.gst}"></td>
    <td class="num" data-l="Total excl. GST" data-c="base"></td><td class="num" data-l="GST amount" data-c="tax"></td>
    <td class="num" data-l="Total incl. GST" data-c="total"></td>${del}</tr>`;
}
function updateAll() {
  const g = { base: 0, tax: 0, total: 0, dealer: 0 };
  document.querySelectorAll('[data-sid]').forEach(el => {
    const sec = state.sections.find(s => s.id === el.dataset.sid); if (!sec) return;
    el.querySelectorAll('tr[data-rid]').forEach(tr => {
      const row = sec.rows.find(r => r.id === tr.dataset.rid); if (!row) return;
      const c = calc(row);
      tr.querySelectorAll('[data-c]').forEach(td => td.textContent = fmt(c[td.dataset.c]));
    });
    const t = secTotals(sec);
    el.querySelector('[data-c=sec-base]').textContent = fmt(t.base);
    el.querySelector('[data-c=sec-total]').textContent = fmt(t.total);
    Object.keys(g).forEach(k => g[k] += t[k]);
  });
  $('g-base').textContent = fmt(g.base); $('g-tax').textContent = fmt(g.tax); $('g-total').textContent = fmt(g.total);
  $('g-dealer').textContent = fmt(g.dealer); $('g-profit').textContent = fmt(g.base - g.dealer);
  save();
}
function toast(msg, err) {
  const t = $('toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 4500);
}

/* ===== 6. EVENTS ===== */
const NUM_FIELDS = ['dealer', 'margin', 'qty', 'gst'];
function onEdit(e) {
  const t = e.target, f = t.dataset.f; if (!f) return;
  const sec = state.sections.find(s => s.id === t.closest('[data-sid]').dataset.sid);
  if (f === 'title') { sec.title = t.value; return save(); }
  const tr = t.closest('tr'), row = sec.rows.find(r => r.id === tr.dataset.rid);
  row[f] = NUM_FIELDS.includes(f) ? Math.max(0, parseFloat(t.value) || 0) : t.value;
  if (f === 'hsn') {
    const g = guessGst(t.value);
    if (g !== null) { row.gst = g; tr.querySelector('[data-f=gst]').value = g; }
    showPop(t);
  }
  updateAll();
}
document.addEventListener('input', onEdit);
document.addEventListener('change', onEdit);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, secEl = b.closest('[data-sid]');
  const sec = secEl && state.sections.find(s => s.id === secEl.dataset.sid);
  if (a === 'add-sec') { state.sections.push(newSection()); render(); }
  else if (a === 'del-sec') { if (confirm('Delete this whole table?')) { state.sections = state.sections.filter(s => s !== sec); render(); } }
  else if (a === 'add-row') { sec.rows.push(newRow()); render(); }
  else if (a === 'add-note') { sec.rows.push(newNote()); render(); }
  else if (a === 'del-row') {
    if (sec.rows.length < 2) return toast('A table needs at least one row. Delete the table instead.', true);
    sec.rows = sec.rows.filter(r => r.id !== b.closest('tr').dataset.rid); render();
  }
  else if (a === 'reset') { if (confirm('Clear everything and start a new quotation?')) { localStorage.removeItem(KEY); state = { no: '', date: today(), toName: '', toAddr: '', showSum: true, terms: DEFAULT_TERMS, sections: [newSection()] }; init(); } }
  else if (a === 'export') exportWord();
});
[['quoteNo', 'no'], ['quoteDate', 'date'], ['toName', 'toName'], ['toAddr', 'toAddr'], ['terms', 'terms']].forEach(([id, k]) =>
  $(id).addEventListener('input', e => { state[k] = e.target.value; save(); }));
$('showSum').addEventListener('change', e => { state.showSum = e.target.checked; save(); });

/* ===== 6b. HSN / SAC SEARCH DROPDOWN (full list from hsn-data.js) ===== */
const HSN = HSN_DATA.map(l => { const [c, g, ...d] = l.split('|'); const desc = d.join('|'); return { c, g: +g, d: desc, s: (c + ' ' + desc).toLowerCase() }; });
const POP_MAX = 100;
const pop = document.createElement('div');
pop.id = 'hsnpop'; pop.hidden = true; document.body.appendChild(pop);
let popInput = null, popItems = [], popIdx = -1;
function searchHsn(q) {
  q = q.trim().toLowerCase();
  if (!q) return HSN;
  if (/^\d+$/.test(q)) return HSN.filter(h => h.c.startsWith(q));
  const w = q.split(/\s+/);
  return HSN.filter(h => w.every(x => h.s.includes(x)));
}
function guessGst(v) {           // suggest GST from the typed code (exact code, or a 4+ digit prefix with one common rate)
  v = v.trim(); if (!/^\d{4,8}$/.test(v)) return null;
  const m = HSN.filter(h => h.c.startsWith(v));
  return m.length && m.every(h => h.g === m[0].g) ? m[0].g : null;
}
function showPop(input) {
  popInput = input;
  const q = input.value, res = searchHsn(q);
  popItems = res.slice(0, POP_MAX); popIdx = -1;
  pop.innerHTML = `<div class="pop-info">${res.length.toLocaleString('en-IN')} codes${q.trim() ? ' match' : ' available'} – type a code (8415) or words (air conditioner)${res.length > POP_MAX ? ` · showing first ${POP_MAX}` : ''}</div>` +
    (popItems.map((h, i) => `<div class="pop-i" data-i="${i}"><b>${h.c}</b><em>${h.g}%</em><span>${esc(h.d)}</span></div>`).join('') || '<div class="pop-info">No match – you can still type your own code.</div>');
  const r = input.getBoundingClientRect(), w = Math.min(560, innerWidth - 16);
  pop.style.width = w + 'px';
  pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  const below = innerHeight - r.bottom, up = below < 260 && r.top > below;
  pop.style.maxHeight = Math.max(160, Math.min(380, (up ? r.top : below) - 12)) + 'px';
  pop.style.top = up ? 'auto' : r.bottom + 4 + 'px';
  pop.style.bottom = up ? innerHeight - r.top + 4 + 'px' : 'auto';
  pop.hidden = false; pop.scrollTop = 0;
}
function pickHsn(i) {
  const h = popItems[i]; if (!h || !popInput) return;
  const tr = popInput.closest('tr'), sec = state.sections.find(s => s.id === tr.closest('[data-sid]').dataset.sid);
  const row = sec.rows.find(r => r.id === tr.dataset.rid);
  row.hsn = h.c; row.gst = h.g; popInput.value = h.c; tr.querySelector('[data-f=gst]').value = h.g;
  pop.hidden = true; updateAll();
}
function hidePop() { pop.hidden = true; }
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('hsn-in')) showPop(e.target); else if (!pop.contains(e.target)) hidePop(); });
pop.addEventListener('mousedown', e => { e.preventDefault(); const it = e.target.closest('.pop-i'); if (it) pickHsn(+it.dataset.i); });
document.addEventListener('keydown', e => {
  if (pop.hidden || e.target !== popInput) return;
  const items = pop.querySelectorAll('.pop-i');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); popIdx = Math.max(0, Math.min(items.length - 1, popIdx + (e.key === 'ArrowDown' ? 1 : -1)));
    items.forEach((el, i) => el.classList.toggle('on', i === popIdx)); items[popIdx] && items[popIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && popIdx >= 0) { e.preventDefault(); pickHsn(popIdx); }
  else if (e.key === 'Escape' || e.key === 'Tab') hidePop();
});
window.addEventListener('resize', hidePop);
document.addEventListener('scroll', e => { if (!pop.contains(e.target)) hidePop(); }, true);

function init() {
  $('gstlist').innerHTML = [0, 5, 12, 18, 28].map(g => `<option value="${g}">`).join('');
  $('quoteNo').value = state.no; $('quoteDate').value = state.date || today();
  $('toName').value = state.toName; $('toAddr').value = state.toAddr;
  $('terms').value = state.terms; $('showSum').checked = state.showSum !== false;
  render();
}

/* ===== 7. WORD EXPORT (docx library; dealer price/margin are never read here) ===== */
function exportWord() {
  if (!window.docx) return toast('Word library could not load. Check your internet connection and retry.', true);
  const items = state.sections.flatMap(s => s.rows.filter(r => r.type === 'item' && r.name.trim()));
  if (!items.length) return toast('Add at least one product with a name before exporting.', true);
  if (!state.toName.trim()) return toast('Please enter the client name (TO).', true);
  const d = window.docx;
  const FONT = 'Times New Roman', DXA = d.WidthType.DXA;
  const none = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

  const run = (t, o = {}) => new d.TextRun({ text: t, font: o.font || FONT, size: o.size || 20, bold: o.bold, color: o.color,
    underline: o.ul ? { type: d.UnderlineType.SINGLE } : undefined, superScript: o.sup, break: o.br });
  const para = (t, o = {}) => new d.Paragraph({ alignment: o.align || d.AlignmentType.LEFT, spacing: { before: o.before || 0, after: o.after || 0 },
    children: Array.isArray(t) ? t : [run(t, o)] });
  const cell = (t, w, o = {}) => new d.TableCell({
    width: { size: w, type: DXA }, columnSpan: o.span, rowSpan: o.rowSpan, verticalAlign: d.VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    shading: o.fill ? { type: d.ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
    borders: o.noBorder ? { top: none, bottom: none, left: none, right: none } : undefined,
    children: [...String(t).split('\n').map(line => para(line, { size: o.size || 17, bold: o.bold, align: o.align, color: o.color })),
      ...String(o.desc || '').split('\n').map(s => s.trim()).filter(Boolean).map(line => para(line, { size: 15, color: '444444', before: 20 }))]
  });
  const table = (rows, widths, o = {}) => new d.Table({
    rows, columnWidths: widths, width: { size: widths.reduce((a, b) => a + b, 0), type: DXA },
    layout: d.TableLayoutType.FIXED, borders: o.borders });
  const R = d.AlignmentType.RIGHT, C = d.AlignmentType.CENTER;

  /* Header & footer copied from your sample quotation */
  const logo = Uint8Array.from(atob(LOGO_B64), c => c.charCodeAt(0));
  const hp = (t, color, o = {}) => para([run(t, { font: 'Cambria', size: o.size || 22, color, bold: o.bold, ul: o.ul })], { align: R });
  const header = new d.Header({ children: [
    table([new d.TableRow({ children: [
      new d.TableCell({ width: { size: 2200, type: DXA }, borders: { top: none, bottom: none, left: none, right: none },
        children: [new d.Paragraph({ children: [new d.ImageRun({ data: logo, transformation: { width: 105, height: Math.round(105 * LOGO_SIZE.h / LOGO_SIZE.w) } })] })] }),
      new d.TableCell({ width: { size: 7800, type: DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [
        hp(COMPANY.name, COLORS.blue, { size: 52 }),
        ...COMPANY.address.map(a => hp(a, COLORS.red)),
        hp(COMPANY.phones, COLORS.blue), hp(COMPANY.email, '0563C1', { ul: true }), hp(COMPANY.web, COLORS.blue, { bold: true })] })
    ] })], [2200, 7800], { borders: noBorders }),
    para('GSTN: ' + COMPANY.gstn, { size: 16, before: 60, after: 60 })
  ] });
  const footer = new d.Footer({ children: [
    table([new d.TableRow({ children: [
      new d.TableCell({ width: { size: 5000, type: DXA }, borders: { top: none, bottom: none, left: none, right: none },
        children: [para([run(COMPANY.footEmails[0], { font: 'Cambria', size: 22, color: COLORS.red, ul: true })])] }),
      new d.TableCell({ width: { size: 5000, type: DXA }, borders: { top: none, bottom: none, left: none, right: none },
        children: [para([run(COMPANY.footEmails[1], { font: 'Cambria', size: 22, color: COLORS.red, ul: true })], { align: R })] })
    ] })], [5000, 5000], { borders: noBorders }),
    para([run(COMPANY.tagline[0], { font: 'Cambria', size: 20, color: COLORS.blue }), run(COMPANY.tagline[1], { font: 'Cambria', size: 20, color: COLORS.blue, sup: true }),
      run(COMPANY.tagline[2], { font: 'Cambria', size: 20, color: COLORS.blue })], { align: C })
  ] });

  /* Body */
  const [y, m, dd] = (state.date || today()).split('-');
  const dateStr = `${dd}-${m}-${y}`;
  const toText = state.toName.trim().toUpperCase() + (state.toAddr.trim() ? '\n' + state.toAddr.trim() : '');
  const body = [
    para('QUOTATION', { bold: true, size: 24, ul: true, align: C, before: 60, after: 120 }),
    table([
      new d.TableRow({ children: [cell('TO', 700, { bold: true, size: 20, rowSpan: 2 }), cell(toText, 5300, { size: 20, rowSpan: 2 }),
        cell('Q.NO', 1200, { size: 20 }), cell(state.no, 2800, { size: 20, align: R })] }),
      new d.TableRow({ children: [cell('DATE', 1200, { size: 20 }), cell(dateStr, 2800, { size: 20, align: R })] })
    ], [700, 5300, 1200, 2800]),
    para('', { after: 120 })
  ];

  const W = [520, 2900, 800, 650, 650, 1150, 1300, 650, 1380];
  const heads = ['S.NO', 'PRODUCT', 'HSN', 'UNIT', 'QTY', 'PRICE', 'TOTAL (EXCL GST)', 'GST', 'TOTAL (INCL GST)'];
  const sums = [];
  state.sections.forEach((sec, si) => {
    const rows = sec.rows.filter(r => r.type === 'note' ? r.name.trim() || r.note.trim() : r.name.trim());
    if (!rows.length) return;
    const titled = sec.title.trim().length > 0;
    const out = [];
    if (titled) out.push(new d.TableRow({ children: [cell(String(si + 1), W[0], { bold: true, align: R, size: 18 }),
      cell(sec.title.trim().toUpperCase(), W.slice(1).reduce((a, b) => a + b), { span: 8, bold: true, align: C, size: 19 })] }));
    out.push(new d.TableRow({ tableHeader: true, children: heads.map((h, i) => cell(h, W[i], { bold: true, fill: 'EDEDED', align: i > 4 ? C : (i === 0 ? C : undefined) })) }));
    rows.forEach((r, j) => {
      const no = titled ? `${si + 1}.${j + 1}` : String(j + 1);
      if (r.type === 'note') {
        out.push(new d.TableRow({ children: [cell(no, W[0], { align: R }), cell(r.name, W[1]), cell(r.note, W.slice(2).reduce((a, b) => a + b), { span: 7, align: C })] }));
      } else {
        const c = calc(r);
        out.push(new d.TableRow({ children: [cell(no, W[0], { align: R }), cell(r.name.trim(), W[1], { desc: r.desc }), cell(r.hsn, W[2], { align: C }),
          cell(r.unit, W[3], { align: C }), cell(String(r.qty), W[4], { align: C }), cell(fmt(c.sell), W[5], { align: R }),
          cell(fmt(c.base), W[6], { align: R }), cell(r.gst + '%', W[7], { align: C }), cell(fmt(c.total), W[8], { align: R, bold: true })] }));
      }
    });
    const t = secTotals({ rows });
    const lw = W.slice(0, 6).reduce((a, b) => a + b), vw = W.slice(6).reduce((a, b) => a + b);
    [['TOTAL (EXCL GST)', t.base, false], ['GST', t.tax, false], ['TOTAL AFTER TAX', t.total, true]].forEach(([l, v, b]) =>
      out.push(new d.TableRow({ children: [cell(l, lw, { span: 6, align: R, bold: b, size: 18 }), cell(fmt(v), vw, { span: 3, align: R, bold: b, size: 18 })] })));
    body.push(table(out, W), para('', { after: 140 }));
    sums.push({ label: titled ? sec.title.trim().toUpperCase() : 'ITEMS', t });
  });

  if (state.showSum) {
    const gt = sums.reduce((a, s) => a + s.t.total, 0);
    const srows = [];
    if (sums.length > 1) sums.forEach(s => srows.push(new d.TableRow({ children: [cell(s.label + ' TOTAL', 7000, { size: 19 }), cell(fmt(s.t.total), 3000, { size: 19, align: R })] })));
    srows.push(new d.TableRow({ children: [cell('TOTAL PRICE AFTER TAX', 7000, { size: 20, bold: true, fill: 'EDEDED' }), cell(fmt(r2(gt)), 3000, { size: 20, bold: true, align: R, fill: 'EDEDED' })] }));
    body.push(table(srows, [7000, 3000]));
  }

  /* Terms page */
  const lines = state.terms.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length) {
    let n = 0;
    body.push(new d.Paragraph({ children: [new d.PageBreak()] }), para('Terms and Conditions', { bold: true, size: 24, after: 120 }));
    lines.forEach(l => {
      const sub = /^[*\-•]/.test(l);
      const text = sub ? '* ' + l.replace(/^[*\-•]\s*/, '') : `${++n}.  ` + l;
      body.push(new d.Paragraph({ spacing: { after: 120 }, indent: { left: sub ? 900 : 500, hanging: sub ? 0 : 360 }, children: [run(text, { size: 21 })] }));
    });
    body.push(para('', { before: 1800 }), table([new d.TableRow({ children: [
      cell('CUSTOMER SIGNATURE', 5000, { noBorder: true, size: 20 }), cell(COMPANY.signRight, 5000, { noBorder: true, size: 20, align: R })] })], [5000, 5000], { borders: noBorders }));
  }

  const doc = new d.Document({
    creator: COMPANY.name, title: 'Quotation ' + state.no,
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 2300, bottom: 1300, left: 800, right: 800, header: 400, footer: 400 } } },
      headers: { default: header }, footers: { default: footer }, children: body }]
  });
  const safe = s => s.replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
  const fname = `Quotation_${safe(state.no) || 'draft'}_${safe(state.toName)}.docx`;
  d.Packer.toBlob(doc).then(blob => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Word file downloaded: ' + fname);
  }).catch(err => toast('Export failed: ' + err.message, true));
}

init();
