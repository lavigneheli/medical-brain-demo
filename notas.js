/* Medical Brain · Helen — notas do período: SOI, HAM, IESC, MCM e PIEPE (aprovação por dimensão, cálculo automático) */
UI.notasMat = UI.notasMat || 'soi';

const nkey = (m, it) => m.id + '.' + it.id;
const nget = k => (state.notas && state.notas[k]) || {};
const nset = (k, v) => { state.notas = state.notas || {}; state.notas[k] = v; touch(); };
const nfmt = n => (n == null || isNaN(n)) ? '–' : String(Math.round(n * 100) / 100).replace('.', ',');
const nparse = s => { s = String(s).trim().replace(',', '.'); if (s === '') return null; const v = parseFloat(s); return isNaN(v) ? undefined : v; };
const nmat = id => S.notas.materias.find(m => m.id === id);
function nfind(key) { const [mid, iid] = key.split('.'); const m = nmat(mid); let hit = null; m.dims.forEach(d => d.itens.forEach(it => { if (it.id === iid) hit = { m, d, it }; })); return hit; }

/* ---------- cálculo ---------- */
function itemCalc(m, it) {
  const st = nget(nkey(m, it));
  if (it.tipo === 'simples') {
    const v = st.v == null || st.v === '' ? null : +st.v;
    return { atual: v || 0, feito: v != null, entrou: v != null, pend: v == null ? it.vale : 0 };
  }
  if (it.tipo === 'partes') {
    const p = st.p || []; let a = 0, pend = 0, n = 0;
    it.partes.forEach((pt, i) => { const v = p[i]; if (v == null || v === '') pend += pt.max; else { a += +v; n++; } });
    return { atual: a, feito: n === it.partes.length, entrou: n > 0, pend };
  }
  const e = st.e || []; const soma = e.reduce((s, x) => s + (+x.score || 0), 0);
  /* conv:'media' = média das aulas lançadas (cada uma 0..max) convertida para a escala do item; faltas lançadas como 0 contam */
  const atual = it.conv === 'media' ? (e.length ? Math.round(soma / (e.length * it.max) * it.vale * 100) / 100 : 0) : Math.min(it.vale, soma);
  const fim = !!st.closed || (it.conv !== 'media' && atual >= it.vale);
  return { atual, soma, n: e.length, feito: fim, entrou: e.length > 0, pend: fim ? 0 : it.vale - atual, closed: !!st.closed };
}
function dimCalc(m, d) {
  let atual = 0, pend = 0, entrou = false;
  const items = d.itens.map(it => { const c = itemCalc(m, it); atual += c.atual; pend += c.pend; if (c.entrou) entrou = true; return Object.assign({ it }, c); });
  const min = S.notas.minimo, arr = S.notas.arredondamento;
  const falta = Math.max(0, min - atual), max = atual + pend;
  let status;
  if (atual >= min) status = 'ok'; else if (max < min) status = 'imp'; else if (atual >= arr) status = 'arr'; else status = entrou ? 'and' : 'sem';
  return { atual, pend, max, falta, precisa: pend > 0 ? falta / pend * 100 : null, status, entrou, items };
}
function matCalc(m) {
  const dims = m.dims.map(d => Object.assign({ d }, dimCalc(m, d)));
  let status;
  if (dims.every(x => x.status === 'ok')) status = 'ok'; else if (dims.some(x => x.status === 'imp')) status = 'imp'; else if (dims.some(x => x.entrou)) status = 'and'; else status = 'sem';
  return { dims, status };
}
const nLabel = { ok: ['Meta atingida', 'ok'], imp: ['Fora do alcance', 'bad'], arr: ['Faixa de arredondamento', 'warn'], and: ['Em andamento', 'warn'], sem: ['Sem notas', ''] };
const nLabelMat = { ok: ['APROVADA', 'ok'], imp: ['EM RISCO', 'bad'], and: ['Em andamento', 'warn'], sem: ['Sem notas', ''] };

function dimTexto(dc) {
  const min = S.notas.minimo;
  if (dc.status === 'ok') return '<b>Meta atingida:</b> ' + nfmt(dc.atual) + ' de 100 (mínimo ' + min + ').' + (dc.pend > 0 ? ' Ainda restam ' + nfmt(dc.pend) + ' pontos em jogo, que passam a ser margem.' : '');
  if (dc.status === 'imp') return '<b>Fora do alcance:</b> você tem ' + nfmt(dc.atual) + ' e, mesmo com a nota máxima em tudo o que resta (' + nfmt(dc.pend) + ' pontos), chega a ' + nfmt(dc.max) + '. Fica abaixo de ' + min + '. Converse com a coordenação sobre recuperação.';
  const pend = dc.items.filter(x => x.pend > 0);
  const lista = pend.map(x => esc(x.it.nome) + ' (' + nfmt(x.pend) + ')').join(', ');
  return 'Você tem <b>' + nfmt(dc.atual) + '</b> de 100. <b>Faltam ' + nfmt(dc.falta) + ' pontos</b> para ' + min + '.' +
    (dc.pend > 0 ? ' Ainda estão em jogo <b>' + nfmt(dc.pend) + '</b> pontos (' + lista + '): você precisa de <b>' + nfmt(dc.precisa) + '%</b> do que resta, ou seja, ' + nfmt(dc.falta) + ' de ' + nfmt(dc.pend) + '.' : '') +
    (dc.status === 'arr' ? ' <span class="muted">Você está na faixa de arredondamento (a partir de ' + S.notas.arredondamento + '); confirme com a coordenação.</span>' : '');
}
function dimSumHtml(m, dc) {
  const [lb, cl] = nLabel[dc.status];
  return '<div class="row wrap" style="gap:10px;margin-bottom:6px"><div class="grow"><div class="row"><b style="font-size:26px">' + nfmt(dc.atual) + '</b><span class="muted small">/ 100 · máximo possível ' + nfmt(dc.max) + '</span><span class="right">' + badge(lb, cl) + '</span></div>' +
    bar(dc.atual, dc.status === 'ok' ? 'ok' : dc.status === 'imp' ? 'bad' : 'warn') + '</div></div><div class="small">' + dimTexto(dc) + '</div>';
}

/* ---------- células de cada avaliação ---------- */
function itemFalta(it, c) { const alvo = it.vale * S.notas.minimo / 100; return c.feito ? Math.max(0, alvo - c.atual) : null; }
function itemStatusHtml(m, dc, x) {
  const it = x.it, alvo = it.vale * S.notas.minimo / 100;
  if (x.feito && x.entrou) return x.atual >= alvo ? badge('acima do alvo', 'ok') : badge('faltaram ' + nfmt(alvo - x.atual) + ' p/ o alvo', 'bad');
  if (x.pend > 0 && dc.status !== 'ok' && dc.status !== 'imp' && dc.pend > 0) { const sug = x.pend * dc.falta / dc.pend; return '<span class="small">para fechar a dimensão: <b>~' + nfmt(sug) + '</b> de ' + nfmt(x.pend) + '</span>'; }
  if (x.entrou) return badge('parcial', 'warn');
  return '<span class="muted tiny">pendente</span>';
}
const nin = (attrs, val, ph) => '<input class="nin" type="text" inputmode="decimal" autocomplete="off" ' + attrs + ' value="' + (val == null ? '' : esc(String(val).replace('.', ','))) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>';

function itemRowHtml(m, dc, x) {
  const it = x.it, key = nkey(m, it), st = nget(key), alvo = it.vale * S.notas.minimo / 100;
  const nome = '<b>' + esc(it.nome) + '</b>' + (it.obs ? '<div class="tiny muted">' + esc(it.obs) + '</div>' : '');
  let entrada = '';
  if (it.tipo === 'simples') {
    entrada = '<div class="nsub">' + '<label>nota (0 a ' + nfmt(it.vale) + ')' + nin('data-nk="' + key + '" data-nt="v"', st.v) + '</label>' +
      (it.q ? '<label>acertos (de ' + it.q + ')' + nin('data-nk="' + key + '" data-nt="h"', st.h) + '</label>' : '') + '</div>';
  } else if (it.tipo === 'partes') {
    entrada = '<div class="nsub">' + it.partes.map((pt, i) => '<label>' + esc(pt.n) + ' (0 a ' + nfmt(pt.max) + ')' + nin('data-nk="' + key + '" data-nt="p" data-i="' + i + '"', (st.p || [])[i]) + '</label>').join('') + '</div>';
  } else {
    entrada = '<span id="tot-' + key + '"><b>' + nfmt(x.atual) + '</b> <span class="muted small">de ' + nfmt(it.vale) + ' (' + x.n + ' lançada(s)' + (it.conv === 'media' && x.n ? ', média ' + nfmt(x.soma / x.n) + ' de ' + nfmt(it.max) : '') + ')</span></span>';
  }
  let h = '<tr class="nrow"><td>' + nome + '</td><td class="c">' + nfmt(it.vale) + '</td><td class="c">' + nfmt(alvo) + '</td><td>' + entrada + '</td><td class="c" id="fa-' + key + '">' + (itemFalta(it, x) == null ? '–' : nfmt(itemFalta(it, x))) + '</td><td id="st-' + key + '">' + itemStatusHtml(m, dc, x) + '</td></tr>';
  if (it.tipo === 'lista') {
    const e = st.e || [];
    h += '<tr><td colspan="6" style="background:var(--surface-2,transparent)"><div class="nsub" style="padding:4px 0">' +
      e.map((en, i) => '<div class="row" style="gap:6px;width:100%"><input style="max-width:200px" data-nk="' + key + '" data-nt="e" data-f="label" data-i="' + i + '" value="' + esc(en.label || '') + '" placeholder="' + esc(it.rotulo || 'Item') + '"><label style="display:inline-flex;align-items:center;gap:6px;flex-direction:row">nota (0 a ' + nfmt(it.max) + ')' + nin('data-nk="' + key + '" data-nt="e" data-f="score" data-i="' + i + '"', en.score) + '</label><button class="btn ghost sm" title="Remover" data-act="ndel" data-nk="' + key + '" data-i="' + i + '">' + ico('trash') + '</button></div>').join('') +
      '<div class="row wrap" style="gap:10px;width:100%"><button class="btn sm" data-act="nadd" data-nk="' + key + '">' + ico('plus') + 'Lançar ' + esc((it.rotulo || 'item').toLowerCase()) + '</button><label class="row small" style="gap:6px"><input type="checkbox" data-nk="' + key + '" data-nt="closed"' + (st.closed ? ' checked' : '') + '>Não haverá mais lançamentos</label></div></div></td></tr>';
  }
  return h;
}
function dimBlockHtml(m, dc) {
  const d = dc.d;
  return '<div class="card" style="margin-bottom:14px"><h3>' + esc(d.nome) + ' <span class="muted small">· precisa de ' + S.notas.minimo + '/100</span></h3><div id="sum-' + m.id + '-' + d.id + '">' + dimSumHtml(m, dc) + '</div><div class="sp8"></div>' +
    '<div class="tbl-wrap"><table><thead><tr><th>Avaliação</th><th class="c">Vale</th><th class="c" title="70% do valor">Alvo 70%</th><th>Sua nota</th><th class="c">Faltam p/ alvo</th><th>Situação</th></tr></thead><tbody>' + dc.items.map(x => itemRowHtml(m, dc, x)).join('') + '</tbody></table></div></div>';
}

/* ---------- visão geral ---------- */
function visaoGeralHtml() {
  const rows = S.notas.materias.map(m => {
    const mc = matCalc(m), [lb, cl] = nLabelMat[mc.status];
    const cel = dc => '<td><b>' + nfmt(dc.atual) + '</b> <span class="muted tiny">máx ' + nfmt(dc.max) + '</span><div class="tiny">' + badge(nLabel[dc.status][0], nLabel[dc.status][1]) + '</div></td>';
    const falta = mc.dims.map(dc => (mc.dims.length > 1 ? dc.d.nome.split(' ')[0] + ': ' : '') + (dc.status === 'ok' ? 'ok' : dc.status === 'imp' ? 'fora do alcance' : 'faltam ' + nfmt(dc.falta) + (dc.precisa != null ? ' (' + nfmt(dc.precisa) + '% do que resta)' : ''))).join(' · ');
    return '<tr class="clk" data-act="nmat" data-m="' + m.id + '"><td><b>' + esc(m.nome) + '</b></td>' + (mc.dims.length === 2 ? cel(mc.dims[0]) + cel(mc.dims[1]) : cel(mc.dims[0]) + '<td class="muted tiny">nota única</td>') + '<td>' + badge(lb, cl) + '</td><td class="small">' + falta + '</td></tr>';
  }).join('');
  return '<div class="tbl-wrap"><table><thead><tr><th>Matéria</th><th>Teórica</th><th>Prática</th><th>Situação</th><th>O que falta para 70</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function vNotas() {
  const m = nmat(UI.notasMat) || S.notas.materias[0], mc = matCalc(m);
  const tabs = '<div class="tabs" style="margin-bottom:12px">' + S.notas.materias.map(x => '<button class="tab' + (x.id === m.id ? ' on' : '') + '" data-act="nmat" data-m="' + x.id + '">' + esc(x.nome.replace(' (nota única)', '')) + '</button>').join('') + '</div>';
  const [lb, cl] = nLabelMat[mc.status];
  return page('Notas e aprovação', 'Digite o que já saiu. O painel calcula quanto falta e quanto você precisa em cada dimensão (70/100 na teórica e 70/100 na prática).', '<button class="btn" data-act="ntpi">Copiar TPI do SOI para HAM e IESC</button>',
    '<div class="callout small" style="margin-bottom:14px">' + S.notas.regras.map(esc).join('<br>') + '</div>' +
    '<h2>Visão geral</h2><div class="sp8"></div><div id="nov">' + visaoGeralHtml() + '</div><div class="sp"></div>' +
    tabs + '<div class="row" style="margin-bottom:10px"><h2 style="margin:0">' + esc(m.nome) + '</h2><span id="nhead">' + badge(lb, cl) + '</span></div>' +
    '<div>' + mc.dims.map(dc => dimBlockHtml(m, dc)).join('') + '</div>');
}
VIEWS.notas = vNotas;

/* atualiza só os resultados, sem recriar os campos de digitação (não perde o foco) */
function refreshNotas() {
  const m = nmat(UI.notasMat); if (!m || !document.getElementById('nov')) return;
  const mc = matCalc(m);
  document.getElementById('nov').innerHTML = visaoGeralHtml();
  const [lb, cl] = nLabelMat[mc.status]; document.getElementById('nhead').innerHTML = badge(lb, cl);
  mc.dims.forEach(dc => {
    const s = document.getElementById('sum-' + m.id + '-' + dc.d.id); if (s) s.innerHTML = dimSumHtml(m, dc);
    dc.items.forEach(x => {
      const key = nkey(m, x.it), st = document.getElementById('st-' + key), fa = document.getElementById('fa-' + key), tot = document.getElementById('tot-' + key);
      if (st) st.innerHTML = itemStatusHtml(m, dc, x);
      if (fa) fa.textContent = itemFalta(x.it, x) == null ? '–' : nfmt(itemFalta(x.it, x));
      if (tot) tot.innerHTML = '<b>' + nfmt(x.atual) + '</b> <span class="muted small">de ' + nfmt(x.it.vale) + ' (' + x.n + ' lançada(s)' + (x.it.conv === 'media' && x.n ? ', média ' + nfmt(x.soma / x.n) + ' de ' + nfmt(x.it.max) : '') + ')</span>';
    });
  });
  if (typeof renderSide === 'function') renderSide();
}

/* ---------- edição ---------- */
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || !el.dataset.nk) return;
  const key = el.dataset.nk, hit = nfind(key); if (!hit) return; const it = hit.it, t = el.dataset.nt;
  const cur = JSON.parse(JSON.stringify(nget(key)));
  if (t === 'closed') { cur.closed = el.checked; nset(key, cur); refreshNotas(); return; }
  if (el.dataset.f === 'label') { cur.e = cur.e || []; cur.e[+el.dataset.i].label = el.value; nset(key, cur); return; }
  let v = nparse(el.value);
  if (v === undefined) { toast('Número inválido'); el.value = ''; v = null; }
  const maxOf = t === 'p' ? it.partes[+el.dataset.i].max : t === 'e' ? it.max : t === 'h' ? it.q : it.vale;
  if (v != null && (v < 0 || v > maxOf)) { toast('O máximo aqui é ' + nfmt(maxOf)); v = clamp(v, 0, maxOf); el.value = nfmt(v); }
  if (t === 'v') { cur.v = v; if (it.q) { cur.h = v == null ? null : Math.round(v / it.vale * it.q * 100) / 100; const hi = el.closest('tr').querySelector('[data-nt="h"]'); if (hi) hi.value = cur.h == null ? '' : nfmt(cur.h); } }
  else if (t === 'h') { cur.h = v; cur.v = v == null ? null : Math.round(v / it.q * it.vale * 100) / 100; const vi = el.closest('tr').querySelector('[data-nt="v"]'); if (vi) vi.value = cur.v == null ? '' : nfmt(cur.v); }
  else if (t === 'p') { cur.p = cur.p || []; for (let i = 0; i < it.partes.length; i++) if (cur.p[i] === undefined) cur.p[i] = null; cur.p[+el.dataset.i] = v; }
  else if (t === 'e') { cur.e = cur.e || []; cur.e[+el.dataset.i].score = v; }
  nset(key, cur); refreshNotas();
});

Object.assign(window.ACT_EXTRA = window.ACT_EXTRA || {}, {
  nmat: el => { UI.notasMat = el.dataset.m; if (route() !== 'notas') location.hash = '#/notas'; else render(); },
  nadd: el => { const k = el.dataset.nk, hit = nfind(k), cur = JSON.parse(JSON.stringify(nget(k))); cur.e = cur.e || []; cur.e.push({ id: uid(), label: (hit.it.rotulo || 'Item') + ' ' + (cur.e.length + 1), score: null }); nset(k, cur); render(); },
  ndel: el => { const k = el.dataset.nk, cur = JSON.parse(JSON.stringify(nget(k))); (cur.e || []).splice(+el.dataset.i, 1); nset(k, cur); render(); },
  ntpi: () => {
    const src = nget('soi.tpi').v; if (src == null) return toast('Preencha primeiro o TPI do SOI');
    if (!confirm('Copiar o TPI do SOI (' + nfmt(src) + ') para HAM e IESC?')) return;
    ['ham.tpi', 'iesc.tpi'].forEach(k => nset(k, { v: src })); render();
  },
});

/* alertas para a Recepção */
function notasAlertas() {
  const out = [];
  S.notas.materias.forEach(m => matCalc(m).dims.forEach(dc => {
    if (!dc.entrou) return;
    const nome = m.nome.replace(' (nota única)', '') + ' · ' + dc.d.nome.split(' ')[0].toLowerCase();
    if (dc.status === 'imp') out.push({ k: 'bad', t: nome + ': fora do alcance dos 70', d: 'Máximo possível ' + nfmt(dc.max) + '. Procure a coordenação.', go: '#/notas' });
    else if (dc.status !== 'ok' && dc.precisa != null && dc.precisa >= 80) out.push({ k: 'bad', t: nome + ': você precisa de ' + nfmt(dc.precisa) + '% do que resta', d: 'Faltam ' + nfmt(dc.falta) + ' pontos para 70, com ' + nfmt(dc.pend) + ' em jogo.', go: '#/notas' });
  }));
  return out;
}
