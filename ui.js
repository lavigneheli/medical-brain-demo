/* Medical Brain · Helen — componentes de interface, modal, formulários de registro */
const ICON = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M12 11v5M9.5 13.5h5"/>',
  pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l6 7"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  cards2: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 012 2v12"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  grade: '<path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.7l6.2-.9z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
};
const ico = (n, c) => '<svg viewBox="0 0 24 24"' + (c ? ' class="' + c + '"' : '') + '>' + ICON[n] + '</svg>';

/* ---------- componentes ---------- */
const stClass = v => ({ ok: 'ok', warn: 'warn', bad: 'bad', sem: '' }[v] || '');
const badge = (txt, cls) => '<span class="badge ' + (cls || '') + '">' + esc(txt) + '</span>';
const bar = (pct, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + clamp(pct || 0, 0, 100) + '%"></i></div>';
const cell = v => v == null ? '<span class="cell">–</span>' : '<span class="cell ' + statusOf(v) + '">' + Math.round(v) + '</span>';
function ring(v, size) {
  size = size || 110; const r = size / 2 - 9, c = 2 * Math.PI * r, st = statusOf(v);
  const col = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', sem: 'var(--sem)' }[st];
  const frac = v == null ? 0 : v / 100;
  return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--sem-l)" stroke-width="9"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (c * frac) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg><b>' + (v == null ? '–' : v + '%') + '</b></div>';
}
function spark(vals, w, h) {
  w = w || 120; h = h || 34;
  if (!vals.length) return '<svg width="' + w + '" height="' + h + '"></svg>';
  const mx = 100, n = vals.length;
  const pts = vals.map((v, i) => [n === 1 ? w / 2 : 4 + i * (w - 8) / (n - 1), h - 4 - (v / mx) * (h - 8)]);
  return '<svg width="' + w + '" height="' + h + '"><polyline fill="none" stroke="var(--pri)" stroke-width="2" points="' + pts.map(p => p.join(',')).join(' ') + '"/>' + pts.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="var(--pri)"/>').join('') + '</svg>';
}
function lineChart(labels, vals, opt) {
  opt = opt || {}; const w = opt.w || 620, h = opt.h || 200, L = 34, B = 24, T = 10, R = 10, max = opt.max || 100;
  const n = labels.length; const X = i => L + (n === 1 ? (w - L - R) / 2 : i * (w - L - R) / (n - 1)), Y = v => T + (h - T - B) * (1 - v / max);
  let g = '';
  [0, 25, 50, 75, 100].forEach(t => { if (t <= max) g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--line)"/><text x="4" y="' + (Y(t) + 4) + '">' + t + '</text>'; });
  if (opt.meta) g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + Y(opt.meta) + '" y2="' + Y(opt.meta) + '" stroke="var(--ok)" stroke-dasharray="5 4"/>';
  labels.forEach((l, i) => { if (n <= 14 || i % 2 === 0) g += '<text x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(l) + '</text>'; });
  const pts = []; vals.forEach((v, i) => { if (v != null) pts.push([X(i), Y(v), v]); });
  if (pts.length > 1) g += '<polyline fill="none" stroke="var(--pri)" stroke-width="2.4" points="' + pts.map(p => p[0] + ',' + p[1]).join(' ') + '"/>';
  pts.forEach(p => { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="var(--pri)"/><text x="' + p[0] + '" y="' + (p[1] - 8) + '" text-anchor="middle" style="fill:var(--ink)">' + Math.round(p[2]) + '</text>'; });
  return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:' + w + 'px">' + g + '</svg>';
}
function barChart(labels, vals, opt) {
  opt = opt || {}; const w = opt.w || 620, h = opt.h || 180, L = 30, B = 24, T = 14;
  const max = Math.max(opt.min || 1, ...vals), n = labels.length, bw = (w - L - 10) / n;
  let g = '';
  vals.forEach((v, i) => {
    const bh = (h - T - B) * v / max, x = L + i * bw + bw * .18;
    g += '<rect x="' + x + '" y="' + (h - B - bh) + '" width="' + bw * .64 + '" height="' + bh + '" rx="4" fill="' + (opt.color || 'var(--pri)') + '"/>';
    if (v) g += '<text x="' + (x + bw * .32) + '" y="' + (h - B - bh - 4) + '" text-anchor="middle" style="fill:var(--ink)">' + v + '</text>';
    g += '<text x="' + (x + bw * .32) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(labels[i]) + '</text>';
  });
  return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:' + w + 'px">' + g + '</svg>';
}
function patSelect(sel, name, extra) {
  const groups = {}; S.pats.concat(S.semio || []).forEach(p => (groups[p.sistema] = groups[p.sistema] || []).push(p));
  return '<select data-f="' + name + '"' + (extra || '') + '><option value="">— nenhuma —</option>' + Object.keys(groups).map(g => '<optgroup label="' + esc(g) + '">' + groups[g].map(p => '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nome) + '</option>').join('') + '</optgroup>').join('') + '</select>';
}
const skillSelect = (sel, name) => '<select data-f="' + name + '">' + S.skills.map(s => '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + s.id + ' · ' + esc(s.nome.length > 52 ? s.nome.slice(0, 50) + '…' : s.nome) + '</option>').join('') + '</select>';
const fld = (label, inner, cls) => '<label class="f ' + (cls || '') + '"><span>' + label + '</span>' + inner + '</label>';

/* ---------- modal e toast ---------- */
const OV = () => document.getElementById('ov');
function openModal(html, wide) {
  OV().innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '"><button class="btn ghost sm x" data-act="close">' + ico('x') + '</button>' + html + '</div>';
  OV().classList.add('on');
}
function closeModal() { OV().classList.remove('on'); OV().innerHTML = ''; }
const modalOpen = () => OV().classList.contains('on');
let toastT;
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); }
  catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast('Copiado');
}

/* ---------- formulários de registro ---------- */
const REG_TABS = [['treino', 'Treino / drill'], ['caso', 'Caso clínico'], ['anki', 'Lote no Anki'], ['prova', 'Prova']];
const nivSel = v => '<select data-f="nivel">' + NIVEIS_CASO.map(n => '<option value="' + n.id + '"' + (n.id === (v || nivelAtual().id) ? ' selected' : '') + '>' + esc(n.nome.split(' (')[0]) + '</option>').join('') + '</select>';
function openRegistrar(kind, preset) {
  preset = preset || {}; kind = kind || 'treino';
  const t = todayISO();
  let body = '';
  if (kind === 'treino') {
    body = '<div class="grid g2">' + fld('Data', '<input type="date" data-f="date" value="' + (preset.date || t) + '">') + fld('Habilidade / drill', skillSelect(preset.skill || drillDoDia(t) || 'C1', 'skill')) +
      fld('Patologia (opcional)', patSelect(preset.pat || '', 'pat')) + fld('Nível do caso', nivSel(preset.nivel)) + fld('Nota (0 a 100)', '<input type="number" min="0" max="100" data-f="score" placeholder="ex.: 75" value="' + (preset.score != null ? preset.score : '') + '">') + '</div><div class="sp8"></div>' +
      fld('Observações (o que errou, o que ficou fraco)', '<textarea data-f="nota" rows="3">' + esc(preset.nota || '') + '</textarea>');
  } else if (kind === 'caso') {
    body = '<div class="grid g3">' + fld('Data', '<input type="date" data-f="date" value="' + (preset.date || t) + '">') + fld('Tipo', '<select data-f="tipo">' + CASO_TIPOS.map(x => '<option value="' + x[0] + '"' + (preset.tipo === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select>') + fld('Nota geral (0 a 100)', '<input type="number" min="0" max="100" data-f="score" value="' + (preset.score != null ? preset.score : '') + '">') + '</div><div class="sp8"></div>' +
      '<div class="grid g2">' + fld('Patologia', patSelect(preset.pat || '', 'pat')) + fld('Nível do caso', nivSel(preset.nivel)) + '</div><div class="sp8"></div>' +
      '<details open><summary>Nota por habilidade (opcional, alimenta a saúde de cada uma)</summary><div class="grid g4" style="margin-top:10px">' + PAT_SKILLS.concat(SEMIO_SKILLS.filter(k => k !== 'C2')).map(k => fld(k, '<input type="number" min="0" max="100" data-p="' + k + '" placeholder="–" value="' + ((preset.por || {})[k] != null ? preset.por[k] : '') + '">')).join('') + '</div><p class="tiny muted" style="margin-top:8px">A: C1 · B: C2, C6 · C: C3, C4, C7 · D: C8, C9, C10 · Semiologia: S1 a S6. Preencha só o que foi avaliado.</p></details><div class="sp8"></div>' +
      fld('Observações', '<textarea data-f="nota" rows="3">' + esc(preset.nota || '') + '</textarea>');
  } else if (kind === 'anki') {
    body = '<div class="grid g3">' + fld('Data', '<input type="date" data-f="date" value="' + (preset.date || t) + '">') + fld('Nº de cards', '<input type="number" min="0" max="500" data-f="cards" value="' + (preset.cards != null ? preset.cards : 21) + '">') + fld('Tipo', '<select data-f="tipo">' + ANKI_TIPOS.map(x => '<option>' + x + '</option>').join('') + '</select>') + '</div><div class="sp8"></div>' +
      fld('Patologia (se o lote é de uma patologia)', patSelect(preset.pat || '', 'pat')) + '<div class="sp8"></div>' +
      fld('Tópico livre (ex.: C13 Tabela MEC, Tanner, calendário vacinal)', '<input data-f="topico" value="' + esc(preset.topico || '') + '">') + '<div class="sp8"></div>' +
      fld('Tag usada', '<input data-f="tags" placeholder="#P4::Digestivo::DRGE" value="' + esc(preset.tags || '') + '">') + '<div class="sp8"></div>' +
      fld('Observações', '<textarea data-f="nota" rows="2">' + esc(preset.nota || '') + '</textarea>');
  } else {
    body = '<div class="grid g3">' + fld('Data', '<input type="date" data-f="date" value="' + (preset.date || t) + '">') + fld('Prova', '<select data-f="prova">' + PROVA_TIPOS.map(x => '<option' + (preset.prova === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>') + fld('Nota (0 a 100)', '<input type="number" min="0" max="100" step="0.1" data-f="score">') + '</div><div class="sp8"></div>' +
      fld('Observações (onde travou, temas surpresa)', '<textarea data-f="nota" rows="3"></textarea>');
  }
  openModal('<h2>Registrar</h2><div class="tabs">' + REG_TABS.map(x => '<button class="tab' + (x[0] === kind ? ' on' : '') + '" data-act="reg-tab" data-k="' + x[0] + '">' + x[1] + '</button>').join('') + '</div><div id="regform" data-kind="' + kind + '">' + body + '</div><div class="sp"></div><div class="row"><button class="btn pri" data-act="reg-save">Salvar registro</button><button class="btn" data-act="close">Cancelar</button></div>');
}
function readForm(root) {
  const o = {}; root.querySelectorAll('[data-f]').forEach(e => { o[e.dataset.f] = e.value; });
  o.por = {}; root.querySelectorAll('[data-p]').forEach(e => { if (e.value !== '') o.por[e.dataset.p] = +e.value; });
  return o;
}
function saveRegistro() {
  const f = document.getElementById('regform'); const kind = f.dataset.kind; const o = readForm(f);
  const sc = o.score === '' || o.score == null ? null : clamp(+o.score, 0, 100);
  if (kind === 'treino') { if (sc == null) return toast('Informe a nota'); addTreino({ date: o.date, skill: o.skill, pat: o.pat, score: sc, nota: o.nota, nivel: o.nivel }); }
  else if (kind === 'caso') { if (sc == null && !Object.keys(o.por).length) return toast('Informe a nota geral ou por habilidade'); addCaso({ date: o.date, tipo: o.tipo, pat: o.pat, score: sc, por: o.por, nota: o.nota, nivel: o.nivel }); }
  else if (kind === 'anki') { if (!(+o.cards > 0)) return toast('Informe o número de cards'); if (!o.pat && !o.topico) return toast('Escolha a patologia ou escreva o tópico'); addAnki({ date: o.date, pat: o.pat, topico: o.topico, cards: +o.cards, tipo: o.tipo, tags: o.tags, nota: o.nota }); }
  else { if (sc == null) return toast('Informe a nota'); addProva({ date: o.date, prova: o.prova, score: sc, nota: o.nota }); }
  closeModal(); toast('Registro salvo'); render();
}
