/* Medical Brain · Helen — gestão curricular: atividades, horas complementares, perfil, prazos e pontuação por edital */
UI.curTab = UI.curTab || 'ativ';
UI.edSel = UI.edSel || 'sespe';
UI.edMode = UI.edMode || 'pend';

function ensureCur() {
  const c = (state.cur = state.cur || {});
  c.perfil = c.perfil || {}; c.atividades = c.atividades || []; c.prazos = c.prazos || []; c.hc = c.hc || { meta: null, cats: {} }; c.hc.cats = c.hc.cats || {};
  return c;
}
const STAT = { ok: ['Comprovada', 'ok'], pend: ['Falta certificado', 'warn'], plan: ['Planejada', ''] };
const NIVEL_EV = { int: 'Internacional', nac: 'Nacional (AMB/sociedade)', jor: 'Jornada / liga / DA' };

/* ---------- pontuação ---------- */
function curQ(mode, extra) {
  const acts = ensureCur().atividades.concat(extra ? [extra] : []);
  const okS = s => mode === 'ok' ? s === 'ok' : mode === 'pend' ? (s === 'ok' || s === 'pend') : true;
  const sel = (tipos, pred) => acts.filter(a => tipos.includes(a.tipo) && okS(a.status || 'ok') && (!pred || pred(a)));
  const fn = (tipos, pred) => sel(tipos, pred).reduce((s, a) => s + (+a.qtd || 1), 0);
  fn.h = (tipos, pred) => sel(tipos, pred).reduce((s, a) => s + (+a.horas || 0), 0);
  return fn;
}
function curEdital(E, mode, extra) {
  const q = curQ(mode, extra), P = ensureCur().perfil;
  const itens = E.itens.map(it => ({ it, pts: Math.max(0, Math.min(it.max, +it.f(q, P) || 0)) }));
  const bruto = itens.reduce((s, x) => s + x.pts, 0), mult = E.mult ? E.mult(P) : 1;
  return { itens, bruto, mult, total: Math.min(E.max, bruto * mult) };
}
const fnum = (v, d) => (Math.round(v * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)).toString().replace('.', ',');
/* o que mais rende por hora: simula acrescentar uma unidade e divide pelas horas estimadas */
function curGanho(E, mode) {
  const base = curEdital(E, mode).total, out = [];
  Object.keys(TIPOS_ATIV).forEach(k => {
    const T = TIPOS_ATIV[k]; if (k === 'voluntario') return;
    const passo = T.un === 'semestres' ? 2 : 1, h = ((ensureCur().hEst || {})[k] || T.h) * passo;
    const ex = { tipo: k, qtd: passo, status: 'ok', nivel: 'nac', autoria: 1, data: todayISO() };
    const g = curEdital(E, mode, ex).total - base; if (g <= 0.0001) return;
    out.push({ k, T, passo, h, g, pct: g / E.max * 100, por10: g / E.max * 100 / h * 10 });
  });
  return out.sort((a, b) => b.por10 - a.por10);
}

/* ---------- horas complementares ---------- */
function horasHC() {
  const cat = {}, tot = { ok: 0, pend: 0 };
  ensureCur().atividades.forEach(a => {
    const T = TIPOS_ATIV[a.tipo]; if (!T || a.status === 'plan') return;
    const h = +a.horas || 0; const k = T.hc; cat[k] = cat[k] || { ok: 0, pend: 0 };
    if (a.status === 'pend') { cat[k].pend += h; tot.pend += h; } else { cat[k].ok += h; tot.ok += h; }
  });
  return { cat, tot };
}

/* ---------- telas ---------- */
function vAtividades() {
  const A = ensureCur().atividades.slice().sort((a, b) => (b.data || '') < (a.data || '') ? -1 : 1);
  const horas = A.filter(a => a.status !== 'plan').reduce((s, a) => s + (+a.horas || 0), 0);
  const n = st => A.filter(a => a.status === st).length;
  const kp = '<div class="stat-row" style="margin-bottom:12px"><div class="kpi"><b>' + A.length + '</b><span>atividades</span></div><div class="kpi"><b>' + horas + 'h</b><span>horas registradas</span></div><div class="kpi"><b>' + n('ok') + '</b><span>com certificado</span></div><div class="kpi"><b>' + n('pend') + '</b><span>faltam certificados</span></div><div class="kpi"><b>' + n('plan') + '</b><span>planejadas</span></div></div>';
  const lista = A.length ? A.map(a => { const T = TIPOS_ATIV[a.tipo] || { nome: a.tipo, un: '' }, S_ = STAT[a.status || 'ok'];
    return '<div class="item"><div class="tiny muted nowrap" style="width:64px;padding-top:3px">' + (a.data ? fmtShort(a.data) + '/' + a.data.slice(2, 4) : '—') + '</div><div class="grow"><div class="row wrap" style="gap:6px"><b>' + esc(a.titulo || T.nome) + '</b>' + badge(T.nome, '') + '<button class="chip" data-act="curstatus" data-id="' + a.id + '" title="Clique para mudar">' + S_[0] + '</button></div><div class="tiny muted">' + (a.qtd ? a.qtd + ' ' + T.un : '') + (a.horas ? ' · ' + a.horas + 'h' : '') + (a.nivel && NIVEL_EV[a.nivel] ? ' · ' + NIVEL_EV[a.nivel] : '') + (a.bolsa ? ' · com bolsa' : '') + (a.pub ? ' · gerou publicação' : '') + (a.premio ? ' · premiado' : '') + (a.obs ? ' · ' + esc(a.obs) : '') + '</div></div><button class="btn sm ghost" data-act="curedit" data-id="' + a.id + '">' + ico('edit') + '</button><button class="btn sm ghost danger" data-act="curdel" data-id="' + a.id + '">' + ico('trash') + '</button></div>'; }).join('') : '<div class="empty">Nenhuma atividade ainda. Registre monitorias, IC, artigos, congressos, extensão, ligas, cursos e certificações.</div>';
  return kp + '<div class="card">' + lista + '</div>';
}
function vHorasHC() {
  const c = ensureCur(), H = horasHC(), meta = c.hc.meta;
  const rows = Object.keys(H.cat).sort().map(k => { const lim = c.hc.cats[k], h = H.cat[k]; return '<tr><td>' + k + '</td><td>' + h.ok + 'h</td><td>' + h.pend + 'h</td><td><input type="number" min="0" style="width:90px" data-chg="curhc" data-k="' + k + '" value="' + (lim == null ? '' : lim) + '" placeholder="sem limite"></td><td>' + (lim ? (h.ok + h.pend > lim ? badge('passou o limite: conta só ' + lim + 'h', 'warn') : bar((h.ok + h.pend) / lim * 100)) : '') + '</td></tr>'; }).join('');
  const prog = meta ? '<div style="margin:8px 0">' + bar((H.tot.ok) / meta * 100) + '<div class="small">' + H.tot.ok + 'h comprovadas de ' + meta + 'h (' + Math.round(H.tot.ok / meta * 100) + '%). Com certificados pendentes: ' + (H.tot.ok + H.tot.pend) + 'h. Faltam <b>' + Math.max(0, meta - H.tot.ok) + 'h</b>.</div></div>' : '<div class="callout warn small">Falta a meta de horas e os limites por categoria da faculdade. Salve o PDF do regulamento em <b>estrategia/horas-complementares</b> e me avise: eu leio e preencho aqui. Se preferir, digite abaixo.</div>';
  return '<div class="card"><h3>Horas complementares</h3><div class="row" style="margin-bottom:8px"><label class="small">Meta total exigida (h)</label><input type="number" min="0" style="width:110px" data-chg="curhc" data-k="meta" value="' + (meta == null ? '' : meta) + '"></div>' + prog +
    '<table style="width:100%"><thead><tr><th align="left">Categoria</th><th align="left">Comprovadas</th><th align="left">Pendentes</th><th align="left">Limite (h)</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="muted">Registre atividades com horas para ver as categorias.</td></tr>') + '</tbody></table><div class="tiny muted" style="margin-top:8px">As horas vêm das atividades (campo "horas"). Categorias seguem o tipo da atividade; ajuste aos nomes do regulamento depois de lido.</div></div>';
}
function vPerfil() {
  const c = ensureCur(), P = c.perfil, pz = c.prazos.slice().sort((a, b) => a.data < b.data ? -1 : 1);
  const num = (k, ph, w) => '<input type="number" step="any" style="width:' + (w || 90) + 'px" data-chg="curperfil" data-k="' + k + '" value="' + (P[k] == null ? '' : P[k]) + '" placeholder="' + (ph || '') + '">';
  const sel = (k, opts) => '<select data-chg="curperfil" data-k="' + k + '"><option value="">—</option>' + opts.map(o => '<option value="' + o[0] + '"' + (String(P[k]) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
  const chk = (k, t) => '<label class="row"><input type="checkbox" data-chg="curperfilck" data-k="' + k + '"' + (P[k] ? ' checked' : '') + '> ' + t + '</label>';
  const perfil = '<div class="card"><h3>Perfil da faculdade e do histórico</h3><div class="grid g2">' +
    fld('Média global do histórico (0 a 100)', num('media', 'ex.: 82')) + fld('Conceito Enamed da faculdade (1 a 5)', sel('enamedIES', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']])) +
    fld('Hospital de ensino', sel('hosp', [['proprio', 'Próprio'], ['conv', 'Conveniado'], ['nao', 'Não tem']])) + fld('Programas de pós-graduação da saúde (CAPES)', num('nPos', 'quantidade')) +
    fld('Pós da faculdade (maior nível)', sel('posIES', [['dout', 'Doutorado'], ['mest', 'Mestrado']])) + fld('Conceito Enade da faculdade (1 a 5)', sel('enade', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']])) +
    fld('Pré-requisito: hospital de ensino', sel('preHosp', [['proprio', 'Próprio'], ['conv', 'Conveniado'], ['nao', 'Não tem']])) + fld('Pré-requisito: pós da instituição', sel('prePos', [['dout', 'Doutorado'], ['mest', 'Mestrado']])) +
    fld('Aprimoramento (pós/outra graduação, pontos 0 a 5)', num('aprimora', '')) + fld('Seu Enamed individual', sel('enamedInd', [['proficiente', 'Proficiente'], ['nao', 'Não proficiente']])) + fld('Sua nota individual no Enamed (0 a 10)', num('enamedNota', '')) +
    fld('USP-SP: pontos da pós da faculdade (0 a 15)', num('uspPos', '')) + fld('USP-SP: pontos do corpo docente (0 a 8)', num('uspDoc', '')) +
    '</div><div class="sp8"></div>' + chk('semRecup', 'Histórico sem recuperação') + chk('centroExc', 'Faculdade cumpre os 4 requisitos de centro de excelência (Unifesp)') + '<div class="tiny muted" style="margin-top:6px">Esses dados alimentam os itens que dependem da instituição. Vazio conta como zero.</div></div>';
  const prazos = '<div class="card"><h3>Prazos (editais, congressos, certificados)</h3>' + (pz.length ? pz.map(p => '<div class="item"><div class="grow"><b style="' + (p.feito ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(p.titulo) + '</b> <span class="tiny muted">' + fmtDate(p.data) + (!p.feito && p.data < todayISO() ? ' · vencido' : '') + '</span></div><button class="btn sm" data-act="prazodone" data-id="' + p.id + '">' + (p.feito ? 'reabrir' : 'feito') + '</button><button class="btn sm ghost danger" data-act="prazodel" data-id="' + p.id + '">' + ico('trash') + '</button></div>').join('') : '<div class="muted small">Sem prazos. Prazos em até 14 dias entram na proposta de sexta.</div>') +
    '<div class="row" style="margin-top:10px"><input id="pz_t" placeholder="Ex.: submissão ABNC" style="flex:1"><input id="pz_d" type="date"><button class="btn pri" data-act="prazoadd">Adicionar</button></div></div>';
  return '<div class="grid g2">' + perfil + prazos + '</div>';
}
function vCurriculo() {
  const tabs = [['ativ', 'Atividades'], ['hc', 'Horas complementares'], ['perfil', 'Perfil e prazos']];
  const body = UI.curTab === 'hc' ? vHorasHC() : UI.curTab === 'perfil' ? vPerfil() : vAtividades();
  return page('Currículo', 'O que você já fez, as horas, o que falta. Alimenta a pontuação por edital.', '<button class="btn pri" data-act="curnew">' + ico('plus') + ' Nova atividade</button><a class="btn" href="#/editais">Pontuação por edital</a>',
    '<div class="tabs">' + tabs.map(t => '<button class="tab' + (UI.curTab === t[0] ? ' on' : '') + '" data-act="curtab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' + body);
}
VIEWS.curriculo = vCurriculo;

function vEditais() {
  const mode = UI.edMode, E = EDITAIS.find(x => x.id === UI.edSel) || EDITAIS[0];
  const modes = [['ok', 'Só comprovadas'], ['pend', '+ falta certificado'], ['pot', '+ planejadas']];
  const linhas = EDITAIS.map(e => { const r = curEdital(e, mode), pct = r.total / e.max * 100, conv = e.conv ? ' (nota ' + fnum(r.total * e.conv, 2) + '/10)' : '';
    return '<tr class="clk" data-act="edsel" data-id="' + e.id + '"' + (e.id === E.id ? ' style="background:var(--pri-l)"' : '') + '><td><b>' + esc(e.nome) + '</b><div class="tiny muted">' + e.uf + ' · peso ' + (typeof e.peso === 'number' ? e.peso + '%' : e.peso) + ' · ' + (e.lido === 'completo' ? 'barema lido' : 'barema lido em parte') + '</div></td><td>' + fnum(r.total) + ' de ' + fnum(e.max) + conv + '</td><td style="width:26%">' + bar(pct, pct >= 70 ? 'ok' : pct >= 40 ? 'warn' : 'bad') + '</td><td class="small">' + Math.round(pct) + '%' + (typeof e.peso === 'number' ? ' · ≈ ' + fnum(pct * e.peso / 100) + ' na nota final' : '') + '</td></tr>'; }).join('');
  const r = curEdital(E, mode), gan = curGanho(E, mode).slice(0, 5);
  const det = r.itens.map((x, i) => { const it = x.it, p = x.pts, falta = it.max - p;
    return '<tr><td>' + esc(it.nome) + (it.aprox ? ' <span class="tiny muted">(aprox.)</span>' : '') + (it.dica ? '<div class="tiny muted">' + esc(it.dica) + '</div>' : '') + '</td><td>' + fnum(p, 2) + ' / ' + fnum(it.max, 2) + '</td><td style="width:22%">' + bar(it.max ? p / it.max * 100 : 0, falta <= 0 ? 'ok' : '') + '</td></tr>'; }).join('');
  const ganho = gan.length ? '<table style="width:100%"><thead><tr><th align="left">Atividade</th><th align="left">Ganho</th><th align="left">Horas (estim.)</th><th align="left">Por 10h</th></tr></thead><tbody>' + gan.map(g => '<tr><td>' + esc(g.T.nome) + ' <span class="tiny muted">(+' + g.passo + ' ' + g.T.un + ')</span></td><td>+' + fnum(g.g, 2) + ' pts (' + fnum(g.pct) + '% do máx.)</td><td>' + g.h + 'h</td><td><b>' + fnum(g.por10) + '%</b></td></tr>').join('') + '</tbody></table><div class="tiny muted" style="margin-top:6px">As horas por atividade são estimativas minhas (editáveis) e o ganho considera só este edital. Serve para ordenar, não para prometer pontos.</div>' : '<div class="muted small">Nada rende mais pontos neste edital com as atividades modeladas.</div>';
  const ena = ENAMED_REGRAS.map(x => '<tr><td><b>' + x.n + '</b></td><td class="small">' + x.modo + '</td><td class="small">' + esc(x.r(ensureCur().perfil)) + '</td></tr>').join('');
  return page('Pontuação por edital', 'Quanto o seu currículo faria hoje em cada seletivo, com o que você registrou.', '<a class="btn" href="#/curriculo">Currículo</a>',
    '<div class="tabs" style="margin-bottom:10px">' + modes.map(m => '<button class="tab' + (mode === m[0] ? ' on' : '') + '" data-act="edmode" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>' +
    '<div class="tbl-wrap"><table><thead><tr><th>Edital</th><th>Pontos</th><th></th><th>% do máximo</th></tr></thead><tbody>' + linhas + '</tbody></table></div><div class="sp"></div>' +
    '<div class="card"><h3>' + esc(E.nome) + '</h3><div class="small muted" style="margin-bottom:8px">' + esc(E.nota) + ' Arquivo: ' + esc(E.pdf) + (E.mult && r.mult !== 1 ? ' · fator Enamed da IES ×' + fnum(r.mult, 2) : '') + '</div><table style="width:100%"><thead><tr><th align="left">Item</th><th align="left">Pontos</th><th></th></tr></thead><tbody>' + det + '</tbody></table></div><div class="sp"></div>' +
    '<div class="grid g2"><div class="card"><h3>O que mais rende por hora neste edital</h3>' + ganho + '</div><div class="card"><h3>Editais sem currículo pontuável ou com barema não publicado</h3>' + EDITAIS_SEM.map(x => '<div class="small" style="margin-bottom:6px"><b>' + x[0] + '</b>: ' + esc(x[1]) + '</div>').join('') + '</div></div><div class="sp"></div>' +
    '<div class="card"><h3>Enamed: o que a sua situação rende em cada seletivo</h3><table style="width:100%"><thead><tr><th align="left">Seletivo</th><th align="left">Como usa</th><th align="left">Para você</th></tr></thead><tbody>' + ena + '</tbody></table><div class="tiny muted" style="margin-top:6px">Fonte: Estratégia MED (atualizado em 16/10/2026) e editais salvos. Resumo em estrategia/editais/enamed_instituicoes.md.</div></div>');
}
VIEWS.editais = vEditais;

/* ---------- formulário de atividade ---------- */
function openAtiv(id) {
  const a = id ? ensureCur().atividades.find(x => x.id === id) : { tipo: 'monitoria', status: 'ok', data: todayISO(), qtd: 1 };
  const T = TIPOS_ATIV[a.tipo];
  const html = '<h2>' + (id ? 'Editar atividade' : 'Nova atividade') + '</h2><div id="atform" data-id="' + (id || '') + '"><div class="grid g2">' +
    fld('Tipo', '<select data-f="tipo" data-chg="atipo">' + Object.keys(TIPOS_ATIV).map(k => '<option value="' + k + '"' + (a.tipo === k ? ' selected' : '') + '>' + TIPOS_ATIV[k].nome + '</option>').join('') + '</select>') +
    fld('Título ou local', '<input data-f="titulo" value="' + esc(a.titulo || '') + '" placeholder="ex.: Monitoria de Anatomia">') +
    fld('Data (fim ou evento)', '<input type="date" data-f="data" value="' + esc(a.data || '') + '">') + fld('Quantidade (<span id="atun">' + T.un + '</span>)', '<input type="number" min="0" step="any" data-f="qtd" value="' + (a.qtd == null ? 1 : a.qtd) + '">') +
    fld('Carga horária total (h)', '<input type="number" min="0" data-f="horas" value="' + (a.horas == null ? '' : a.horas) + '">') +
    fld('Situação', '<select data-f="status">' + Object.keys(STAT).map(k => '<option value="' + k + '"' + ((a.status || 'ok') === k ? ' selected' : '') + '>' + STAT[k][0] + '</option>').join('') + '</select>') +
    fld('Nível do evento (congressos e apresentações)', '<select data-f="nivel"><option value="">—</option>' + Object.keys(NIVEL_EV).map(k => '<option value="' + k + '"' + (a.nivel === k ? ' selected' : '') + '>' + NIVEL_EV[k] + '</option>').join('') + '</select>') +
    fld('Posição de autoria (artigo)', '<input type="number" min="1" data-f="autoria" value="' + (a.autoria || '') + '" placeholder="1 = primeiro autor">') + '</div>' +
    '<div class="row wrap" style="margin:8px 0"><label class="row"><input type="checkbox" data-f="bolsa"' + (a.bolsa ? ' checked' : '') + '> com bolsa</label><label class="row"><input type="checkbox" data-f="pub"' + (a.pub ? ' checked' : '') + '> gerou publicação</label><label class="row"><input type="checkbox" data-f="premio"' + (a.premio ? ' checked' : '') + '> premiado</label></div>' +
    fld('Observação', '<input data-f="obs" value="' + esc(a.obs || '') + '">') + '<div class="row" style="margin-top:12px"><button class="btn pri" data-act="cursave">Salvar</button><button class="btn" data-act="close">Cancelar</button></div></div>';
  openModal(html);
}
function lerAtiv() {
  const root = document.getElementById('atform'), o = {};
  root.querySelectorAll('[data-f]').forEach(e => { o[e.dataset.f] = e.type === 'checkbox' ? e.checked : e.value; });
  ['qtd', 'horas', 'autoria'].forEach(k => { o[k] = o[k] === '' || o[k] == null ? null : +o[k]; });
  return o;
}

Object.assign(window.ACT_EXTRA = window.ACT_EXTRA || {}, {
  curtab: el => { UI.curTab = el.dataset.v; render(); },
  curnew: () => { if (route() !== 'curriculo') location.hash = '#/curriculo'; openAtiv(''); },
  curedit: el => openAtiv(el.dataset.id),
  cursave: () => {
    const o = lerAtiv(), id = document.getElementById('atform').dataset.id, c = ensureCur();
    if (!o.tipo) return toast('Escolha o tipo');
    if (id) Object.assign(c.atividades.find(x => x.id === id), o); else c.atividades.push(Object.assign({ id: uid() }, o));
    touch(); closeModal(); toast('Atividade salva'); render();
  },
  curdel: el => { if (confirm('Excluir esta atividade?')) { const c = ensureCur(); c.atividades = c.atividades.filter(x => x.id !== el.dataset.id); touch(); render(); } },
  curstatus: el => { const a = ensureCur().atividades.find(x => x.id === el.dataset.id), ord = ['ok', 'pend', 'plan']; a.status = ord[(ord.indexOf(a.status || 'ok') + 1) % 3]; touch(); render(); },
  edsel: el => { UI.edSel = el.dataset.id; render(); },
  edmode: el => { UI.edMode = el.dataset.v; render(); },
  prazoadd: () => { const t = document.getElementById('pz_t').value.trim(), d = document.getElementById('pz_d').value; if (!t || !d) return toast('Preencha o título e a data'); ensureCur().prazos.push({ id: uid(), titulo: t, data: d, feito: false }); touch(); render(); },
  prazodone: el => { const p = ensureCur().prazos.find(x => x.id === el.dataset.id); p.feito = !p.feito; touch(); render(); },
  prazodel: el => { const c = ensureCur(); c.prazos = c.prazos.filter(x => x.id !== el.dataset.id); touch(); render(); },
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.chg; if (!k) return;
  const c = ensureCur(), v = el.value === '' ? null : el.value;
  if (k === 'curperfil') { const kk = el.dataset.k; c.perfil[kk] = v == null ? null : (['hosp', 'enamedInd', 'posIES', 'preHosp', 'prePos'].includes(kk) ? v : +v); touch(); render(); }
  else if (k === 'curperfilck') { c.perfil[el.dataset.k] = el.checked; touch(); }
  else if (k === 'curhc') { const kk = el.dataset.k, n = v == null ? null : +v; if (kk === 'meta') c.hc.meta = n; else c.hc.cats[kk] = n; touch(); render(); }
  else if (k === 'atipo') { const T = TIPOS_ATIV[el.value], u = document.getElementById('atun'); if (u && T) u.textContent = T.un; }
});

/* aviso na Recepção: certificados pendentes e prazos */
(function () {
  const orig = pendencias;
  pendencias = function () {
    const out = orig(), c = ensureCur(), pz = prazosProximos(14), pend = c.atividades.filter(a => a.status === 'pend').length;
    pz.forEach(p => out.push({ k: 'warn', t: 'Prazo em ' + daysBetween(todayISO(), p.data) + ' dia(s): ' + p.titulo, d: fmtDate(p.data), go: '#/curriculo' }));
    if (pend >= 3) out.push({ k: 'warn', t: pend + ' atividades sem certificado', d: 'Peça os certificados: sem comprovante o edital não pontua.', go: '#/curriculo' });
    return out;
  };
})();
