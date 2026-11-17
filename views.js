/* Medical Brain · Helen — telas */
const UI = {
  pday: null, pron: { q: '', sis: '', per: '' }, pcat: 'Todos', pq: '', casoPat: '', casoPrompt: '', casoFoot: true,
  ankiTab: 'estrategia', evoWeeks: 12, enfOpen: null,
};
try { Object.assign(UI, JSON.parse(localStorage.getItem('mbh_ui') || '{}')); } catch (e) { }
const saveUI = () => { try { localStorage.setItem('mbh_ui', JSON.stringify({ casoPat: UI.casoPat, casoPrompt: UI.casoPrompt })); } catch (e) { } };
const page = (title, sub, actions, body) => '<div class="top"><div class="t"><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="right row">' + (actions || '') + '</div></div>' + body;
const regBtn = (label, kind, extra) => '<button class="btn pri" data-act="reg" data-k="' + (kind || 'treino') + '"' + (extra || '') + '>' + ico('plus') + (label || 'Registrar') + '</button>';
const promptByTitle = t => getPrompts().find(p => p.titulo.startsWith(t));
const promptForSkill = id => id[0] === 'C' ? promptByTitle('Drill ' + pad(+id.slice(1))) : id[0] === 'S' ? (getPrompts().find(p => p.id === id.toLowerCase()) || null) : id[0] === 'H' ? (getPrompts().find(p => p.id === 'bsys_' + id.toLowerCase()) || null) : null;
const SEM_EXTRA = id => [['base_' + id.toLowerCase(), 'Prompt base (definições)'], ['sem_domino', 'Dominó'], ['sem_trilha', 'Trilha adaptativa']];
const rangeOf = t => { const m = t.match(/^(\d\d):(\d\d)(?:–(\d\d):(\d\d))?$/); if (!m) return null; const a = +m[1] * 60 + +m[2]; return [a, m[3] ? +m[3] * 60 + +m[4] : a + 30]; };
const patLink = id => id ? '<a href="#" data-act="pat" data-id="' + id + '">' + esc(patName(id)) + '</a>' : '';

function tlItem(r, withDel) {
  const col = { Treino: 'pri', Caso: 'ok', Anki: 'warn', Prova: 'bad' }[r.tipo] || '';
  return '<div class="item"><div class="tiny muted nowrap" style="width:48px;padding-top:3px">' + fmtShort(r.date) + '</div><div class="grow"><div class="row wrap" style="gap:6px">' + badge(r.tipo, col) + '<b class="small">' + esc(r.titulo) + '</b>' + (r.nivel ? badge(nivelCurto(r.nivel), '') : '') + (r.origem === 'chat' ? badge('via Claude', 'pri') : '') + '</div>' +
    ((r.pat || r.nota) ? '<div class="tiny muted">' + (r.pat ? patLink(r.pat) : '') + (r.pat && r.nota ? ' · ' : '') + esc(r.nota || '') + '</div>' : '') + '</div>' +
    (r.score != null ? cell(r.score) : '') + (withDel ? '<button class="btn ghost sm" title="Excluir" data-act="del" data-kind="' + r.kind + '" data-id="' + r.id + '">' + ico('trash') + '</button>' : '') + '</div>';
}

function weekCard(compact) {
  const wk = isoWeek(todayISO()).key, c = weekCounts(wk), m = S.meta;
  const row = (lb, v, goal, man) => '<div style="margin-bottom:11px"><div class="row small"><span>' + lb + '</span><span class="right muted">' + v + (goal ? ' / ' + goal : '') + '</span>' + (man ? '<button class="btn sm" data-act="wk" data-k="' + man + '" data-d="-1">−</button><button class="btn sm" data-act="wk" data-k="' + man + '" data-d="1">+</button>' : '') + '</div>' + bar(goal ? v / goal * 100 : (v ? 100 : 0), goal && v >= goal ? 'ok' : 'pri') + '</div>';
  return '<div class="card"><h3>Metas da semana <span class="muted small">(' + fmtShort(c.start) + ' a ' + fmtShort(c.end) + ')</span></h3>' +
    row('Drills clínicos', c.drills, m.drills) + row('Plantões de patologia / casos fragmentados', c.frag, m.frag) + row('Casos completos (fim de semana)', c.caso, m.caso) +
    row('Aulas MB Comunidade', c.mb, m.mb, 'mb') + row('Treinos físicos', c.treino, m.treino, 'treino') + row('Preparações de APG', c.apg, m.apg, 'apg') +
    '<div class="small muted">Retornos feitos: <b>' + c.retornos + '</b> · Cards enviados ao Anki: <b>' + c.anki + '</b> em ' + c.lotes + ' lote(s) · treinos das bases (H): <b>' + c.hskills + '</b></div></div>';
}

/* ======================= RECEPÇÃO ======================= */
function vRecepcao() {
  const t = todayISO(), hr = new Date().getHours(), hs = healthAll(), pr = proximaProva(), pd = progressDia(t), dd = drillDoDia(t), pend = pendencias();
  const wk = weekCounts(isoWeek(t).key);
  const greet = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const bl = (S.rotina[parseISO(t).getDay()] || []); const now = new Date().getHours() * 60 + new Date().getMinutes();
  const next = bl.filter(b => { const r = rangeOf(b.t); return r && r[1] > now && !(state.daily[t] && state.daily[t].blocks[b.id]); }).slice(0, 4);
  const hero = '<div class="hero"><svg class="ecg" viewBox="0 0 600 80" preserveAspectRatio="none"><path d="M0 40h120l12-26 16 52 14-40 10 14h90l12-26 16 52 14-40 10 14h90l12-26 16 52 14-40 10 14h70"/></svg>' +
    '<h1>' + greet + ', ' + esc(state.settings.nome) + '.</h1><div class="sub">' + fmtLong(t) + ' · semana ' + isoWeek(t).w + ' · ' + (pr ? pr.n + ' em ' + pr.dias + ' dia(s)' : 'sem prova agendada') + '</div></div>';
  const kpis = '<div class="grid g4"><div class="card row">' + ring(hs.geral, 92) + '<div class="kpi"><b style="font-size:16px">Saúde geral</b><span>' + hs.comDados + ' de ' + hs.total + ' habilidades com registro</span></div></div>' +
    '<div class="card kpi"><span>Próxima prova</span><div class="countdown">' + (pr ? pr.dias : '–') + '<span style="font-size:15px;font-weight:500"> dia(s)</span></div><span>' + (pr ? esc(pr.n) + ' · ' + fmtDate(pr.d) : '') + '</span></div>' +
    '<div class="card kpi"><span>Plantão de hoje</span><b>' + pd.pct + '%</b>' + bar(pd.pct, 'pri') + '<span>' + pd.done + ' de ' + pd.total + ' blocos</span></div>' +
    '<div class="card kpi"><span>Drills na semana</span><b>' + wk.drills + ' / ' + S.meta.drills + '</b>' + bar(wk.drills / S.meta.drills * 100, wk.drills >= S.meta.drills ? 'ok' : 'pri') + '<span>' + wk.frag + ' fragmentado · ' + wk.caso + ' completo</span></div></div>';
  const dsk = dd ? skillById(dd) : null;
  const hoje = '<div class="card"><div class="row"><h3>Plantão de hoje</h3><a class="right small" href="#/plantao">abrir cronograma</a></div>' +
    (dsk ? '<div class="callout"><b>Drill do dia: ' + dd + ' · ' + esc(dsk.nome) + '</b><div class="small muted">' + esc(drillById(dd).objetivo) + '</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="ficha" data-id="' + dd + '">Ver ficha</button><button class="btn sm pri" data-act="reg" data-k="treino" data-skill="' + dd + '">Registrar</button></div></div>' : '<div class="callout">' + (parseISO(t).getDay() === 6 ? 'Sábado: caso clínico completo (A+B+C+D).' : 'Hoje não há drill no rodízio. Descanse ou revise.') + '</div>') +
    '<div class="sp8"></div>' + (next.length ? next.map(b => '<div class="blk"><div class="tm">' + esc(b.t) + '</div><div class="lb">' + esc(b.l) + '</div></div>').join('') : '<div class="muted small">Nenhum bloco pendente para o resto do dia.</div>') + '</div>';
  const pends = '<div class="card"><h3>Pendências e alertas</h3>' + (pend.length ? pend.slice(0, 6).map(p => '<div class="item"><span class="dot ' + (p.k === 'skill' || p.k === 'h' ? 'warn' : 'bad') + '" style="margin-top:7px"></span><div class="grow"><a href="' + p.go + '"><b class="small">' + esc(p.t) + '</b></a><div class="tiny muted">' + esc(p.d) + '</div></div></div>').join('') : '<div class="empty">Nada pendente por enquanto.</div>') + '</div>';
  const rec = timeline().slice(0, 7);
  const ativ = '<div class="card"><div class="row"><h3>Atividade recente</h3><a class="right small" href="#/evolucao">evolução</a></div>' + (rec.length ? rec.map(r => tlItem(r)).join('') : '<div class="empty">Nenhum registro ainda.<br>Faça um drill, volte aqui no chat com o resultado e eu registro, ou use o botão Registrar.</div>') + '</div>';
  return page('Recepção', 'Visão geral do hospital de estudos', regBtn('Registrar'), hero + '<div class="sp"></div>' + kpis + '<div class="sp"></div><div class="grid g2">' + hoje + pends + '</div><div class="sp"></div><div class="grid g2">' + ativ + weekCard() + '</div>');
}

/* ======================= PLANTÃO ======================= */
function vPlantao() {
  const t = todayISO(); const d = UI.pday || t; const dow = parseISO(d).getDay(); const dd = day(d); const bl = S.rotina[dow] || [];
  const dr = drillDoDia(d); const now = d === t ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
  const pg = progressDia(d);
  const ws = weekStart(d); const strip = [1, 2, 3, 4, 5, 6, 0].map(w => { const ds = addDays(ws, (w + 6) % 7); const p = progressDia(ds); return '<button class="chip' + (ds === d ? ' on' : '') + '" data-act="pday" data-v="' + ds + '">' + DOW[w].slice(0, 3) + ' ' + p.pct + '%</button>'; }).join('');
  const blocks = bl.map(b => { const r = rangeOf(b.t); const isNow = r && now >= r[0] && now < r[1]; const done = dd.blocks[b.id]; return '<div class="blk ' + b.k + (done ? ' done' : '') + (isNow ? ' now' : '') + '"><input type="checkbox" data-chg="blk" data-id="' + b.id + '"' + (done ? ' checked' : '') + '><div class="tm">' + esc(b.t) + '</div><div class="lb">' + esc(b.l) + '</div></div>'; }).join('');
  const drillCard = dr ? '<div class="callout"><b>Drill do dia: ' + dr + ' · ' + esc(skillById(dr).nome) + '</b><div class="small muted">Semana ' + (isoWeek(d).w % 2 ? 'ímpar' : 'par') + ' do rodízio</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="ficha" data-id="' + dr + '">Ficha do drill</button><button class="btn sm" data-act="copyprompt" data-sk="' + dr + '">Copiar prompt</button><button class="btn sm pri" data-act="reg" data-k="treino" data-skill="' + dr + '" data-date="' + d + '">Registrar resultado</button></div></div>' : '<div class="callout">' + (dow === 6 ? '<b>Caso clínico completo (A+B+C+D)</b><div class="row" style="margin-top:8px"><a class="btn sm" href="#/casos">Centro de casos</a></div>' : 'Sem drill neste dia.') + '</div>';
  const vit = '<div class="card"><h3>Sinais vitais do dia</h3>' + VITALS.map(v => '<label class="row small" style="padding:5px 0"><input type="checkbox" data-chg="vit" data-id="' + v[0] + '"' + (dd.vitals[v[0]] ? ' checked' : '') + '>' + v[1] + '</label>').join('') + '</div>';
  return page('Plantão de hoje', fmtLong(d) + ' · ' + pg.done + '/' + pg.total + ' blocos (' + pg.pct + '%)', '<button class="btn" data-act="pday" data-v="' + addDays(d, -1) + '">‹</button><button class="btn" data-act="pday" data-v="' + t + '">Hoje</button><button class="btn" data-act="pday" data-v="' + addDays(d, 1) + '">›</button>',
    '<div class="chips" style="margin-bottom:14px">' + strip + '</div><div class="grid" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)"><div class="card"><h3>Cronograma</h3>' + blocks + '</div><div class="col">' + drillCard + plantaoHojeCard(d) + vit + '<div class="card"><h3>Anotações do dia</h3><textarea data-chg="dnote" rows="5" placeholder="O que travou, o que aprendi…">' + esc(dd.note || '') + '</textarea></div></div></div>');
}

/* ======================= PROVAS ======================= */
function vProvas() {
  const t = todayISO();
  const cards = S.provas.map(p => { const dias = daysBetween(t, p.d); return '<div class="card kpi"><span>' + esc(p.n) + '</span><div class="countdown" style="font-size:36px">' + (dias >= 0 ? dias + '<span style="font-size:14px;font-weight:500"> dia(s)</span>' : 'feita') + '</div><span>' + fmtDate(p.d) + '</span></div>'; }).join('');
  const dates = [...new Set(S.agenda.map(a => a.d))].sort();
  const body = dates.map(d => { const its = S.agenda.filter(a => a.d === d); const done = its.filter(a => state.agendaDone[a.id]).length; return '<div class="card" style="margin-bottom:12px"><div class="row"><h3>' + fmtDate(d) + (d === t ? ' ' + badge('hoje', 'pri') : '') + '</h3><span class="right muted small">' + done + '/' + its.length + '</span></div>' + its.map(a => '<div class="blk' + (state.agendaDone[a.id] ? ' done' : '') + '"><input type="checkbox" data-chg="agenda" data-id="' + a.id + '"' + (state.agendaDone[a.id] ? ' checked' : '') + '><div class="lb grow"><b>' + esc(a.t) + '</b>' + (a.s ? '<div class="tiny muted">' + esc(a.s) + '</div>' : '') + '</div>' + (a.prova ? badge('prova', 'bad') : '') + '</div>').join('') + '</div>'; }).join('');
  const res = state.provasRes.slice().sort(byDate).reverse();
  const resHtml = '<div class="card"><div class="row"><h3>Resultados registrados</h3><button class="btn sm right" data-act="reg" data-k="prova">' + ico('plus') + 'Registrar prova</button></div>' + (res.length ? res.map(r => tlItem({ id: r.id, kind: 'provasRes', date: r.date, tipo: 'Prova', titulo: r.prova, pat: '', score: r.score, nota: r.nota, origem: r.origem }, true)).join('') : '<div class="empty">Nenhuma nota registrada ainda.</div>') + '</div>';
  return page('Agenda de provas', 'IESC 26/10 · HAM 28/10 · SOI IV 05/11', regBtn('Registrar prova', 'prova'), '<div class="grid g3">' + cards + '</div><div class="sp"></div><div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><div>' + body + '</div><div>' + resHtml + '</div></div>');
}

/* ======================= ENFERMARIA ======================= */
function sCard(s) {
  const h = healthOf(s.id);
  return '<div class="card scard" data-act="ficha" data-id="' + s.id + '"><div class="row"><span class="id">' + s.id + '</span>' + badge(h.label, stClass(h.status)) + (h.dominio ? badge('domínio', 'ok') : '') + '<span class="right">' + (h.health == null ? '' : '<b style="font-size:20px">' + h.health + '%</b>') + '</span></div><div class="small" style="margin:6px 0 10px;min-height:42px">' + esc(s.nome.length > 80 ? s.nome.slice(0, 78) + '…' : s.nome) + '</div>' + bar(h.health, stClass(h.status)) +
    '<div class="row tiny muted" style="margin-top:8px"><span>desempenho ' + (h.perf == null ? '–' : h.perf + '%') + '</span><span>ritmo ' + (h.health == null ? '–' : h.rhythm + '%') + '</span><span class="right">' + (h.since == null ? 'cadência ' + h.cad + 'd' : 'há ' + h.since + 'd') + '</span></div></div>';
}
function vEnfermaria() {
  const hs = healthAll();
  const c = S.skills.filter(s => s.grupo === 'C'), hh = S.skills.filter(s => s.grupo === 'H'), ss = S.skills.filter(s => s.grupo === 'S');
  return page('Enfermaria de habilidades', 'Saúde = 60% desempenho + 40% ritmo (frequência e tempo desde o último treino)', regBtn('Registrar treino'),
    '<div class="card row" style="margin-bottom:16px">' + ring(hs.geral, 96) + '<div><h3>Saúde geral</h3><div class="small muted">' + hs.comDados + ' de ' + hs.total + ' habilidades com registro.<br>Saudável ≥ 75 · Atenção 50 a 74 · Crítico &lt; 50. Domínio das bases (H): duas tentativas seguidas ≥ 80%.</div></div></div>' +
    '<h2>Drills clínicos (C1 a C22)</h2><div class="sp8"></div><div class="grid g-auto">' + c.map(sCard).join('') + '</div><div class="sp"></div>' +
    '<h2>Semiologia aplicada (S1 a S6)</h2><div class="tiny muted">Do básico (definições e apresentação clínica) ao raciocínio completo. Cada ficha tem os prompts de base, dominó e trilha.</div><div class="sp8"></div><div class="grid g-auto">' + ss.map(sCard).join('') + '</div><div class="sp"></div>' +
    '<h2>Bases dos sistemas (H5 e H7 a H11)</h2><div class="sp8"></div><div class="grid g-auto">' + hh.map(sCard).join('') + '</div>');
}
function openFicha(id) {
  const s = skillById(id), h = healthOf(id), d = drillById(id), isC = !!d, at = attemptsFor(id);
  const pr = promptForSkill(id);
  const info = isC ? '<div class="grid g2"><div><h4>Objetivo</h4><p>' + esc(d.objetivo) + '</p><h4>Lógica por trás</h4><p>' + esc(d.logica) + '</p><h4>Quando usar</h4><p>' + esc(d.quando) + '</p></div><div><h4>Formato do drill</h4><ol class="steps">' + d.formato.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol><h4 style="margin-top:12px">Entrega</h4><p>' + esc(d.entrega) + '</p><h4>Erros comuns</h4><ul class="list">' + d.erros.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>'
    : '<div class="grid g2"><div><h4>O que dominar</h4><p>' + esc(s.nome) + '</p><h4>Como treinar</h4><p>' + esc(s.treino) + '</p></div><div><h4>Material de apoio</h4><p>' + esc(s.entrega.replace('Material: ', '')) + '</p><h4>Cards Anki dessa habilidade</h4><p>' + esc(s.dominio.replace('Anki: ', '')) + '</p><div class="callout small">Registre cada tentativa de simulado/treino com a nota (0 a 100). Meta: ≥ 80% em duas tentativas seguidas.</div></div></div>';
  openModal('<div class="row"><span class="id" style="font-size:20px;font-weight:700;color:var(--pri-d)">' + id + '</span><h2 style="margin:0">' + esc(s.nome.length > 70 ? s.nome.slice(0, 68) + '…' : s.nome) + '</h2></div><div class="sp8"></div>' +
    '<div class="row wrap">' + badge(h.label, stClass(h.status)) + (h.dominio ? badge('domínio', 'ok') : '') + '<span class="muted small">saúde ' + (h.health == null ? '–' : h.health + '%') + ' · desempenho ' + (h.perf == null ? '–' : h.perf + '%') + ' · ritmo ' + (h.health == null ? '–' : h.rhythm + '%') + ' · cadência alvo a cada ' + h.cad + ' dias' + (h.trend ? ' · tendência <span class="trend ' + (h.trend > 0 ? 'up' : 'down') + '">' + (h.trend > 0 ? '▲ +' : '▼ ') + h.trend + '</span>' : '') + '</span></div><div class="sp8"></div>' + info + '<div class="sp8"></div>' +
    '<h4>Histórico</h4>' + (at.length ? '<div class="row">' + spark(at.slice(-12).map(a => a.score), 220, 40) + '<span class="muted small">' + at.length + ' registro(s)</span></div>' + at.slice(-6).reverse().map(a => '<div class="item"><span class="tiny muted" style="width:48px">' + fmtShort(a.date) + '</span><div class="grow small">' + (a.src === 'caso' ? 'em caso clínico' : 'treino') + (a.pat ? ' · ' + patLink(a.pat) : '') + '</div>' + cell(a.score) + '</div>').join('') : '<div class="empty">Sem registros. Rode o drill, volte ao chat com o resultado ou registre aqui.</div>') +
    '<div class="sp"></div><div class="row wrap">' + (pr ? '<button class="btn" data-act="use" data-id="' + pr.id + '">' + ico('copy') + 'Usar o prompt' + (id[0] === 'S' ? ' (completo)' : '') + '</button>' : '') + (id[0] === 'S' ? SEM_EXTRA(id).filter(x => getPrompts().find(p => p.id === x[0])).map(x => '<button class="btn" data-act="use" data-id="' + x[0] + '">' + ico('copy') + x[1] + '</button>').join('') : '') + (id[0] === 'H' ? '<button class="btn" data-act="use" data-id="bsys_mix">' + ico('copy') + 'Revisão relâmpago (todos os sistemas)</button>' : '') + '<button class="btn pri" data-act="reg" data-k="treino" data-skill="' + id + '">' + ico('plus') + 'Registrar treino</button></div>', true);
}

/* ======================= PRONTUÁRIOS ======================= */
function vSemioTab(aba) {
  const f = UI.pron, sistema = aba === 'ped' ? 'HAM · Pediátrico' : 'HAM · Adulto';
  const list = (S.semio || []).filter(p => p.sistema === sistema && (!f.q || p.nome.toLowerCase().includes(f.q.toLowerCase())));
  const cols = SEMIO_SKILLS;
  const head = '<tr><th>Aplicação semiológica</th>' + cols.map(k => '<th class="c" title="' + esc(skillById(k).nome) + '">' + k + (k === 'C2' ? ' <span class="tiny muted">exame</span>' : '') + '</th>').join('') + '<th class="c">Anki</th><th>Última</th></tr>';
  const rows = list.map(p => { const st = patStats(p.id); return '<tr class="clk" data-act="pat" data-id="' + p.id + '"><td><b>' + esc(p.nome) + '</b><div class="tiny muted">' + esc(p.eixo) + '</div></td>' + cols.map(k => '<td class="c">' + cell(st.cells[k] ? st.cells[k].score : null) + '</td>').join('') + '<td class="c">' + (st.cards ? '<span class="cell ok">' + st.cards + '</span>' : '<span class="cell">–</span>') + '</td><td class="nowrap tiny muted">' + (st.last ? fmtShort(st.last) : '—') + '</td></tr>'; }).join('');
  const feitos = list.filter(p => patStats(p.id).n).length;
  return '<div class="row wrap" style="margin-bottom:12px"><input style="max-width:260px" id="pq" placeholder="Buscar aplicação…" data-chg="pron-q" value="' + esc(f.q) + '"><span class="muted small">' + feitos + ' de ' + list.length + ' com registro</span></div>' +
    '<div class="tbl-wrap"><table><thead>' + head + '</thead><tbody>' + (rows || '<tr><td colspan="10"><div class="empty">Nenhuma aplicação encontrada.</div></td></tr>') + '</tbody></table></div><p class="tiny muted" style="margin-top:8px">Cada célula mostra a nota mais recente de S1 a S6 (e do exame físico, C2) naquela aplicação. Clique na linha para abrir a ficha: manifestações, exame, fisiopatologia, SOAP, prescrição e treinos.</p>';
}
function vProntuarios() {
  const f = UI.pron, aba = f.aba || 'soi';
  const tabs = '<div class="tabs" style="margin-bottom:12px">' + [['soi', 'Patologias SOI'], ['ped', 'HAM · Pediátrico'], ['adu', 'HAM · Adulto']].map(x => '<button class="tab' + (aba === x[0] ? ' on' : '') + '" data-act="paba" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  if (aba !== 'soi') {
    const ns = (S.semio || []).filter(p => p.sistema === (aba === 'ped' ? 'HAM · Pediátrico' : 'HAM · Adulto')).length;
    return page('Prontuários', 'Aplicações semiológicas do HAM IV · ' + ns + ' nesta divisão', regBtn('Registrar'), tabs + vSemioTab(aba));
  }
  return vProntuariosSoi(tabs);
}
function vProntuariosSoi(tabs) {
  const f = UI.pron; const sis = [...new Set(S.pats.map(p => p.sistema))];
  let list = S.pats.filter(p => (!f.sis || p.sistema === f.sis) && (!f.per || p.periodo === f.per) && (!f.q || p.nome.toLowerCase().includes(f.q.toLowerCase())));
  const comReg = S.pats.filter(p => patStats(p.id).n).length, comAnki = S.pats.filter(p => patStats(p.id).cards).length;
  const head = '<tr><th>Patologia</th><th>Período</th>' + PAT_SKILLS.map(k => '<th class="c" title="' + esc(skillById(k).nome) + '">' + k + '</th>').join('') + '<th class="c">Anki</th><th>Última</th></tr>';
  const rows = list.map(p => { const st = patStats(p.id); return '<tr class="clk" data-act="pat" data-id="' + p.id + '"><td><b>' + esc(p.nome) + '</b><div class="tiny muted">' + esc(p.sistema) + '</div></td><td>' + p.periodo + '</td>' + PAT_SKILLS.map(k => '<td class="c">' + cell(st.cells[k] ? st.cells[k].score : null) + '</td>').join('') + '<td class="c">' + (st.cards ? '<span class="cell ok">' + st.cards + '</span>' : '<span class="cell">–</span>') + '</td><td class="nowrap tiny muted">' + (st.last ? fmtShort(st.last) : '—') + '</td></tr>'; }).join('');
  return page('Prontuários', comReg + ' de ' + S.pats.length + ' patologias com registro · ' + comAnki + ' com cards no Anki', regBtn('Registrar'),
    tabs + '<div class="row wrap" style="margin-bottom:12px"><input style="max-width:260px" id="pq" placeholder="Buscar patologia…" data-chg="pron-q" value="' + esc(f.q) + '"><div class="chips"><button class="chip' + (!f.sis ? ' on' : '') + '" data-act="pfilt" data-k="sis" data-v="">Todos</button>' + sis.map(s => '<button class="chip' + (f.sis === s ? ' on' : '') + '" data-act="pfilt" data-k="sis" data-v="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div><div class="chips right">' + ['', 'SOI III', 'SOI IV'].map(p => '<button class="chip' + (f.per === p ? ' on' : '') + '" data-act="pfilt" data-k="per" data-v="' + p + '">' + (p || 'Todos os períodos') + '</button>').join('') + '</div></div>' +
    '<div class="tbl-wrap"><table><thead>' + head + '</thead><tbody>' + (rows || '<tr><td colspan="15"><div class="empty">Nenhuma patologia encontrada.</div></td></tr>') + '</tbody></table></div><p class="tiny muted" style="margin-top:8px">Cada célula mostra a nota mais recente da habilidade naquela patologia (drills e casos). Clique na linha para abrir o prontuário.</p>');
}
function openSemio(id) {
  const p = semioById(id), st = patStats(id), ps = patState(id);
  const tl = timeline().filter(r => r.pat === id);
  const ul = a => '<ul class="list">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const sk = SEMIO_SKILLS.map(k => '<div class="card flat" style="padding:10px"><div class="row"><b>' + k + '</b>' + cell(st.cells[k] ? st.cells[k].score : null) + '</div><div class="tiny muted" style="min-height:30px">' + esc(skillById(k).nome.slice(0, 40)) + '</div><button class="btn sm" data-act="reg" data-k="treino" data-skill="' + k + '" data-pat="' + id + '">registrar</button></div>').join('');
  openModal('<div class="row wrap"><h2 style="margin:0">' + esc(p.nome) + '</h2>' + badge(p.periodo, 'pri') + badge(p.sistema) + '</div><div class="tiny muted" style="margin-top:4px">' + esc(p.eixo) + '</div><div class="sp8"></div>' +
    '<div class="stat-row small"><span><b>' + st.n + '</b> registros</span><span>média <b>' + (st.media == null ? '–' : st.media + '%') + '</b></span><span><b>' + st.cards + '</b> cards no Anki (' + st.lotes + ' lote(s))</span><span>último treino <b>' + (st.last ? fmtDate(st.last) : '—') + '</b></span></div><div class="sp8"></div>' +
    '<div class="grid g2"><div><h4>Manifestações clínicas</h4>' + ul(p.manifest) + '<h4>Exame físico dirigido</h4>' + ul(p.exame) + '<h4>Sinais de alarme</h4>' + ul(p.alarme) + '</div><div><h4>Fisiopatologia (o porquê de cada achado)</h4>' + ul(p.fisio) + '<h4>SOAP-modelo</h4><p class="small">' + esc(p.soap) + '</p><h4>Prescrição / posologia (referência de estudo)</h4><p class="small">' + esc(p.presc) + '</p></div></div><div class="sp8"></div>' +
    '<h4>Habilidades nesta aplicação</h4><div class="grid g4" style="margin:8px 0 14px">' + sk + '</div>' +
    '<div class="row wrap"><button class="btn pri" data-act="goCaso" data-id="' + id + '">' + ico('case') + 'Montar treino desta aplicação</button><button class="btn" data-act="reg" data-k="treino" data-pat="' + id + '">Registrar treino</button><button class="btn" data-act="reg" data-k="anki" data-pat="' + id + '">Registrar lote no Anki</button></div><div class="sp"></div>' +
    '<h4>Anotações do prontuário</h4><textarea data-chg="patnote" data-id="' + id + '" rows="3" placeholder="Pontos fracos, macetes, pendências…">' + esc(ps.note || '') + '</textarea><div class="sp"></div>' +
    '<h4>Histórico</h4>' + (tl.length ? tl.map(r => tlItem(r, true)).join('') : '<div class="empty">Sem registros para esta aplicação.</div>'), true);
}
function openPat(id) {
  if (isSemio(id)) return openSemio(id);
  const p = patById(id), st = patStats(id), ps = patState(id);
  const tl = timeline().filter(r => r.pat === id);
  const sk = PAT_SKILLS.map(k => '<div class="card flat" style="padding:10px"><div class="row"><b>' + k + '</b>' + cell(st.cells[k] ? st.cells[k].score : null) + '</div><div class="tiny muted" style="min-height:30px">' + esc(skillById(k).nome.slice(0, 40)) + '</div><button class="btn sm" data-act="reg" data-k="treino" data-skill="' + k + '" data-pat="' + id + '">registrar</button></div>').join('');
  openModal('<div class="row wrap"><h2 style="margin:0">' + esc(p.nome) + '</h2>' + badge(p.periodo, 'pri') + badge(p.sistema) + '</div><div class="sp8"></div>' +
    '<div class="stat-row small"><span><b>' + st.n + '</b> registros</span><span>média <b>' + (st.media == null ? '–' : st.media + '%') + '</b></span><span><b>' + st.cards + '</b> cards no Anki (' + st.lotes + ' lote(s))</span><span>último treino <b>' + (st.last ? fmtDate(st.last) : '—') + '</b></span></div><div class="sp8"></div>' +
    '<h4>Habilidades nesta patologia</h4><div class="grid g4" style="margin:8px 0 14px">' + sk + '</div>' +
    '<div class="row wrap"><button class="btn pri" data-act="goCaso" data-id="' + id + '">' + ico('case') + 'Montar caso desta patologia</button><button class="btn" data-act="reg" data-k="caso" data-pat="' + id + '">Registrar caso</button><button class="btn" data-act="reg" data-k="anki" data-pat="' + id + '">Registrar lote no Anki</button></div><div class="sp"></div>' +
    '<h4>Anotações do prontuário</h4><textarea data-chg="patnote" data-id="' + id + '" rows="3" placeholder="Pontos fracos, macetes, pendências…">' + esc(ps.note || '') + '</textarea><div class="sp"></div>' +
    '<h4>Histórico</h4>' + (tl.length ? tl.map(r => tlItem(r, true)).join('') : '<div class="empty">Sem registros para esta patologia.</div>'), true);
}

/* ======================= CENTRO DE CASOS ======================= */
const CASO_CATS = ['Casos clínicos', 'Plantão', 'Misto', 'Drills', 'Semiologia', 'Bases'];
function casoPromptList() { return getPrompts().filter(p => CASO_CATS.includes(p.cat)); }
function vCasos() {
  const list = casoPromptList(); if (!UI.casoPrompt || !list.find(p => p.id === UI.casoPrompt)) UI.casoPrompt = (promptByTitle('Caso completo') || list[0]).id;
  const p = getPrompts().find(x => x.id === UI.casoPrompt); let txt = fillPrompt(p.corpo, UI.casoPat); if (UI.casoFoot) txt = withFooter(txt);
  const sel = '<select data-chg="casoPrompt">' + CASO_CATS.map(c => '<optgroup label="' + c + '">' + list.filter(x => x.cat === c).map(x => '<option value="' + x.id + '"' + (x.id === UI.casoPrompt ? ' selected' : '') + '>' + esc(x.titulo) + '</option>').join('') + '</optgroup>').join('') + '</select>';
  const casos = state.casos.slice().sort(byDate).reverse();
  const tbl = casos.length ? '<div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Patologia</th><th class="c">Nota</th><th>Por habilidade</th><th></th></tr></thead><tbody>' + casos.map(c => '<tr><td class="nowrap">' + fmtDate(c.date) + '</td><td>' + casoLabel(c.tipo) + (c.origem === 'chat' ? ' ' + badge('via Claude', 'pri') : '') + '</td><td>' + (patLink(c.pat) || '—') + '</td><td class="c">' + cell(c.score) + '</td><td class="tiny">' + Object.keys(c.por || {}).map(k => k + ' ' + c.por[k]).join(' · ') + '</td><td><button class="btn ghost sm" data-act="del" data-kind="casos" data-id="' + c.id + '">' + ico('trash') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">Nenhum caso registrado. Monte um caso acima, rode no chat com a IA e registre o resultado.</div>';
  const sugg = S.pats.map(pt => ({ pt, st: patStats(pt.id) })).sort((a, b) => (a.st.n - b.st.n) || ((a.pt.periodo === 'SOI IV' ? 0 : 1) - (b.pt.periodo === 'SOI IV' ? 0 : 1)))[0];
  return page('Centro de casos clínicos', 'Os casos são rodados no chat com a IA. Aqui você monta o prompt e registra o resultado.', regBtn('Registrar caso', 'caso'),
    '<div class="grid" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="card"><h3>1. Monte o prompt</h3><div class="grid g2">' + fld('Patologia', patSelect(UI.casoPat, 'x', ' data-chg="casoPat"')) + fld('Modelo de prompt', sel) + '</div><div class="sp8"></div>' + cenarioField('data-chg="cenario"') + '<div class="sp8"></div>' + nivelField('data-chg="nivel"') + (p.corpo.includes('[HABILIDADES]') ? mixField() : '') +
    '<div class="row" style="margin:8px 0"><button class="btn sm" data-act="casoSug" data-id="' + sugg.pt.id + '">Sugerir patologia</button><span class="tiny muted">menos treinada: ' + esc(sugg.pt.nome) + '</span></div>' +
    (S.footer ? '<label class="row small" style="margin:6px 0"><input type="checkbox" data-chg="casoFoot"' + (UI.casoFoot ? ' checked' : '') + '>Incluir pedido de "resultado para o painel" no final do prompt</label>' : '') +
    '<div class="small" style="margin:6px 0">' + (UI.casoPat ? 'Patologia aplicada: <b>' + esc(patName(UI.casoPat)) + '</b> (' + esc(patById(UI.casoPat).sistema) + ')' : '<span style="color:var(--warn)">Escolha a patologia para preencher [PATOLOGIA] e [SISTEMA] no prompt.</span>') + (phList(txt).length ? '<div class="tiny muted">Campos que ainda faltam preencher à mão: ' + phList(txt).map(esc).join(' · ') + '</div>' : '') + '</div>' +
    '<div class="pre" id="casotxt">' + esc(txt) + '</div><div class="sp8"></div><div class="row"><button class="btn pri" data-act="copysrc" data-src="casotxt">' + ico('copy') + 'Copiar prompt</button><button class="btn" data-act="reg" data-k="caso" data-pat="' + UI.casoPat + '">Registrar resultado</button></div></div>' +
    '<div class="card"><h3>Como funciona</h3><ol class="steps"><li>Escolha a patologia e o modelo; copie o prompt.</li><li>Cole no chat com a IA e faça o caso (ou drill) até o fim.</li><li>No final, a IA entrega o <b>resultado para o painel</b>.</li><li>Cole esse resultado aqui no chat com o Claude, que atualiza saúde, prontuário e evolução. Ou registre direto neste site.</li></ol><div class="callout small" style="margin-top:12px">Caso fragmentado: dias de semana (A anamnese, B exame/exames, C interpretação/fluxograma, D prescrição). Caso completo: sábado, A+B+C+D.</div></div></div>' +
    '<div class="sp"></div><h2>Histórico de casos</h2><div class="sp8"></div>' + tbl);
}

/* ======================= FARMÁCIA DE PROMPTS ======================= */
function vPrompts() {
  const all = getPrompts(); const cats = ['Todos', 'Favoritos', ...new Set(all.map(p => p.cat))];
  let list = all.filter(p => (UI.pcat === 'Todos' || (UI.pcat === 'Favoritos' ? p.fav : p.cat === UI.pcat)) && (!UI.pq || (p.titulo + p.corpo + (p.tags || []).join(' ')).toLowerCase().includes(UI.pq.toLowerCase())));
  const cards = list.map(p => '<div class="card"><div class="row"><b>' + esc(p.titulo) + '</b><button class="btn ghost sm right" title="Favoritar" data-act="pfav" data-id="' + p.id + '" style="color:' + (p.fav ? 'var(--warn)' : 'var(--muted)') + '">' + ico('star') + '</button></div><div class="row wrap" style="margin:6px 0">' + badge(p.cat, 'pri') + (p.custom ? badge('meu') : '') + (p.tags || []).map(t => '<span class="tiny muted">#' + esc(t) + '</span>').join(' ') + '</div><div class="small muted" style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;min-height:84px">' + esc(p.corpo) + '</div><div class="row" style="margin-top:10px"><button class="btn pri sm" data-act="use" data-id="' + p.id + '">' + ico('copy') + 'Usar</button><button class="btn sm" data-act="pedit" data-id="' + p.id + '">' + ico('edit') + 'Editar</button>' + (p.custom ? '<button class="btn ghost sm danger right" data-act="pdel" data-id="' + p.id + '">' + ico('trash') + '</button>' : '') + '</div></div>').join('');
  return page('Farmácia de prompts', all.length + ' prompts salvos · edições ficam guardadas', '<button class="btn pri" data-act="pnew">' + ico('plus') + 'Novo prompt</button>',
    '<div class="row wrap" style="margin-bottom:14px"><input style="max-width:280px" id="pqin" placeholder="Buscar prompt…" data-chg="pq" value="' + esc(UI.pq) + '"><div class="chips">' + cats.map(c => '<button class="chip' + (UI.pcat === c ? ' on' : '') + '" data-act="pcat" data-v="' + c + '">' + c + '</button>').join('') + '</div></div><div class="grid g-auto" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">' + (cards || '<div class="empty">Nenhum prompt encontrado.</div>') + '</div>');
}
const nivelField = (attrs) => fld('Nível do caso', '<select ' + attrs + '>' + NIVEIS_CASO.map(n => '<option value="' + n.id + '"' + (n.id === nivelAtual().id ? ' selected' : '') + '>' + esc(n.nome) + '</option>').join('') + '</select>');
const cenarioField = (attrs) => fld('Cenário de atendimento', '<input list="cenlist" ' + attrs + ' value="' + esc(cenarioAtual()) + '" placeholder="' + esc(CENARIO_PADRAO) + '"><datalist id="cenlist">' + CENARIOS.map(c => '<option value="' + esc(c) + '">').join('') + '</datalist>');
function mixBoxHtml() {
  const on = new Set(mixIds());
  const grp = (t, f) => '<div class="tiny muted" style="margin:6px 0 3px">' + t + '</div><div class="chips">' + S.skills.filter(f).map(s => '<button class="chip' + (on.has(s.id) ? ' on' : '') + '" title="' + esc(s.nome) + '" data-act="mixtog" data-id="' + s.id + '">' + s.id + '</button>').join('') + '</div>';
  return '<div class="small"><b>Habilidades deste treino</b> <span class="muted">(' + on.size + ' escolhida(s); ideal de 3 a 6)</span></div>' +
    '<div class="chips" style="margin:6px 0">' + MIX_PRESETS.map(p => '<button class="btn sm" data-act="mixpre" data-ids="' + p[1].join(',') + '">' + esc(p[0]) + '</button>').join('') + '<button class="btn ghost sm" data-act="mixpre" data-ids="">limpar</button></div>' +
    grp('Drills clínicos', s => s.grupo === 'C') + grp('Semiologia', s => s.grupo === 'S') + grp('Bases dos sistemas', s => s.grupo === 'H');
}
const mixField = () => '<div id="mixbox" class="callout" style="margin:8px 0">' + mixBoxHtml() + '</div>';
function phList(txt) { return [...new Set((txt.match(/\[[^\]\n]{2,90}\]/g) || []))].filter(x => x !== '[CENÁRIO]' && x !== '[HABILIDADES]'); }
function openUse(id) {
  const p = getPrompts().find(x => x.id === id); const ph = phList(p.corpo); const temNiv = p.corpo.includes('[NÍVEL]'), temCen = p.corpo.includes('[CENÁRIO]'), temMix = p.corpo.includes('[HABILIDADES]');
  openModal('<h2>' + esc(p.titulo) + '</h2>' + ((ph.length || temCen || temNiv) ? '<div class="grid g2" style="margin-bottom:8px">' + (ph.length ? fld('Patologia (preenche os campos de patologia)', patSelect('', 'usepat', ' data-inp="use"')) : '') + (temCen ? cenarioField('id="usecen" data-inp="use"') : '') + (temNiv ? nivelField('id="usenivel" data-inp="use"') : '') + '</div>' + (ph.length ? '<div class="grid g2">' : '<div>') + ph.map((x, i) => fld(esc(x), '<input data-inp="use" data-ph="' + esc(x) + '" placeholder="preencher (opcional)">')).join('') + '</div>' : '<p class="muted small">Este prompt não tem campos para preencher.</p>') +
    '<div class="sp8"></div>' + (temMix ? mixField() : '') + (S.footer ? '<label class="row small"><input type="checkbox" data-inp="use" id="usefoot" checked>Incluir pedido de "resultado para o painel" no final</label><div class="sp8"></div>' : '') + '<div class="pre" id="usetxt" data-id="' + id + '"></div><div class="sp8"></div><div class="row"><button class="btn pri" data-act="copysrc" data-src="usetxt">' + ico('copy') + 'Copiar</button><button class="btn" data-act="close">Fechar</button></div>', true);
  updateUse();
}
function updateUse() {
  const box = document.getElementById('usetxt'); if (!box) return;
  const p = getPrompts().find(x => x.id === box.dataset.id); let t = p.corpo;
  const nv = document.getElementById('usenivel'); if (nv && nv.value !== (state.settings.nivel || 'medio')) { state.settings.nivel = nv.value; touch(); }
  const cen = document.getElementById('usecen'); if (cen && cen.value.trim() !== (state.settings.cenario || '')) { state.settings.cenario = cen.value.trim(); touch(); }
  const pid = (document.querySelector('[data-f=usepat]') || {}).value; t = fillPrompt(t, pid || '');
  document.querySelectorAll('[data-ph]').forEach(e => { if (e.value.trim()) t = t.split(e.dataset.ph).join(e.value.trim()); });
  if (document.getElementById('usefoot') && document.getElementById('usefoot').checked) t = withFooter(t);
  box.textContent = t;
}
function openPEdit(id) {
  const p = id ? getPrompts().find(x => x.id === id) : { titulo: '', cat: 'Meus prompts', tags: [], corpo: '' };
  openModal('<h2>' + (id ? 'Editar prompt' : 'Novo prompt') + '</h2><div class="grid g2">' + fld('Título', '<input data-f="titulo" value="' + esc(p.titulo) + '">') + fld('Categoria', '<input data-f="cat" list="cats" value="' + esc(p.cat) + '"><datalist id="cats">' + [...new Set(getPrompts().map(x => x.cat).concat(['Meus prompts']))].map(c => '<option>' + esc(c) + '</option>').join('') + '</datalist>') + '</div><div class="sp8"></div>' + fld('Tags (separadas por vírgula)', '<input data-f="tags" value="' + esc((p.tags || []).join(', ')) + '">') + '<div class="sp8"></div>' + fld('Texto do prompt (use [CAMPO] para partes a preencher)', '<textarea data-f="corpo" rows="14">' + esc(p.corpo) + '</textarea>') +
    '<div class="sp"></div><div class="row"><button class="btn pri" data-act="psave" data-id="' + (id || '') + '">Salvar</button><button class="btn" data-act="close">Cancelar</button></div>', true);
}

/* ======================= EVOLUÇÃO ======================= */
function activityMap() {
  const m = {}; timeline().forEach(r => { m[r.date] = (m[r.date] || 0) + 1; });
  Object.keys(state.daily).forEach(d => { const n = Object.values(state.daily[d].blocks || {}).filter(Boolean).length; if (n) m[d] = (m[d] || 0) + 0.01; });
  return m;
}
function vEvolucao() {
  const t = todayISO(), N = UI.evoWeeks; const cw = weekStart(t); const weeks = []; for (let i = N - 1; i >= 0; i--) weeks.push(addDays(cw, -7 * i));
  const scoresOf = (a, b) => { const v = []; state.treinos.forEach(x => { if (x.date >= a && x.date <= b && x.score != null) v.push(+x.score); }); state.casos.forEach(c => { if (c.date >= a && c.date <= b) { if (c.score != null) v.push(+c.score); else { const k = Object.values(c.por || {}); if (k.length) v.push(avg(k)); } } }); return v; };
  const labels = weeks.map(w => fmtShort(w)), perf = weeks.map(w => { const v = scoresOf(w, addDays(w, 6)); return v.length ? Math.round(avg(v)) : null; });
  const vol = weeks.map(w => state.treinos.filter(x => x.date >= w && x.date <= addDays(w, 6)).length + state.casos.filter(x => x.date >= w && x.date <= addDays(w, 6)).length);
  const cards = weeks.map(w => state.anki.filter(x => x.date >= w && x.date <= addDays(w, 6)).reduce((s, a) => s + (+a.cards || 0), 0));
  const act = activityMap(); let streak = 0; for (let d = t; ; d = addDays(d, -1)) { if (act[d]) streak++; else if (d !== t) break; if (streak > 400) break; }
  const all30 = scoresOf(addDays(t, -29), t);
  const hs = healthAll().items.slice().sort((a, b) => (a.health == null ? 999 : a.health) - (b.health == null ? 999 : b.health));
  // mapa de calor: 26 semanas
  const start = addDays(cw, -25 * 7); let heat = ''; for (let i = 0; i < 26 * 7; i++) { const d = addDays(start, i); const n = Math.floor(act[d] || 0) + ((act[d] || 0) % 1 > 0 ? 1 : 0); const lv = d > t ? '' : n >= 5 ? 'l4' : n >= 3 ? 'l3' : n >= 2 ? 'l2' : n >= 1 ? 'l1' : ''; heat += '<i class="' + lv + '" title="' + fmtShort(d) + ': ' + Math.floor(act[d] || 0) + ' registro(s)"></i>'; }
  const sis = [...new Set(S.pats.map(p => p.sistema))].map(s => { const ps = S.pats.filter(p => p.sistema === s); const sts = ps.map(p => patStats(p.id)); const med = sts.filter(x => x.media != null).map(x => x.media); return '<tr><td>' + esc(s) + '</td><td class="c">' + sts.filter(x => x.n).length + '/' + ps.length + '</td><td class="c">' + cell(med.length ? Math.round(avg(med)) : null) + '</td><td class="c">' + sts.filter(x => x.cards).length + '/' + ps.length + '</td><td class="c">' + sts.reduce((a, x) => a + x.cards, 0) + '</td></tr>'; }).join('');
  const provas = state.provasRes.slice().sort(byDate);
  return page('Evolução', 'Desempenho, ritmo e volume ao longo do tempo', '<div class="chips"><button class="chip' + (N === 8 ? ' on' : '') + '" data-act="evo" data-v="8">8 semanas</button><button class="chip' + (N === 12 ? ' on' : '') + '" data-act="evo" data-v="12">12 semanas</button><button class="chip' + (N === 20 ? ' on' : '') + '" data-act="evo" data-v="20">20 semanas</button></div>',
    '<div class="grid g4"><div class="card kpi"><span>Registros totais</span><b>' + (state.treinos.length + state.casos.length + state.anki.length + state.provasRes.length) + '</b></div><div class="card kpi"><span>Média dos últimos 30 dias</span><b>' + (all30.length ? Math.round(avg(all30)) + '%' : '–') + '</b></div><div class="card kpi"><span>Sequência ativa</span><b>' + streak + ' dia(s)</b></div><div class="card kpi"><span>Cards enviados ao Anki</span><b>' + state.anki.reduce((s, a) => s + (+a.cards || 0), 0) + '</b></div></div><div class="sp"></div>' +
    '<div class="grid g2"><div class="card"><h3>Desempenho médio por semana</h3>' + lineChart(labels, perf, { meta: 80 }) + '<div class="tiny muted">Linha tracejada: meta de 80%.</div></div><div class="card"><h3>Treinos e casos por semana</h3>' + barChart(labels, vol) + '</div></div><div class="sp"></div>' +
    '<div class="grid g2"><div class="card"><h3>Saúde das habilidades</h3>' + hs.map(h => '<div class="row small" style="margin-bottom:7px"><b style="width:34px">' + h.id + '</b><div class="grow">' + bar(h.health, stClass(h.status)) + '</div><span style="width:44px;text-align:right">' + (h.health == null ? '–' : h.health + '%') + '</span></div>').join('') + '</div><div class="card"><h3>Cards enviados ao Anki por semana</h3>' + barChart(labels, cards, { color: 'var(--warn)' }) + '</div></div><div class="sp"></div>' +
    '<div class="card"><h3>Atividade (últimas 26 semanas)</h3><div style="overflow:auto"><div class="heat">' + heat + '</div></div><div class="legend" style="margin-top:8px"><span>Cada quadrado é um dia; quanto mais forte a cor, mais registros.</span></div></div><div class="sp"></div>' +
    '<div class="grid g2"><div class="card"><h3>Por sistema</h3><div class="tbl-wrap" style="border:0"><table><thead><tr><th>Sistema</th><th class="c">Com registro</th><th class="c">Média</th><th class="c">No Anki</th><th class="c">Cards</th></tr></thead><tbody>' + sis + '</tbody></table></div></div>' +
    '<div class="card"><h3>Notas de provas</h3>' + (provas.length ? lineChart(provas.map(p => fmtShort(p.date)), provas.map(p => +p.score), { meta: 70 }) + provas.slice().reverse().map(p => '<div class="item"><span class="tiny muted" style="width:48px">' + fmtShort(p.date) + '</span><div class="grow small">' + esc(p.prova) + '</div>' + cell(p.score) + '</div>').join('') : '<div class="empty">Sem notas de provas registradas.</div>') + '</div></div><div class="sp"></div>' + weekCard());
}

/* ======================= ANKI ======================= */
function vAnki() {
  const A = S.anki, tab = UI.ankiTab;
  const tabs = [['estrategia', 'Estratégia'], ['registro', 'Registro do que já foi'], ['fazer', 'O que fazer']];
  let body = '';
  if (tab === 'estrategia') {
    body = '<div class="callout">' + esc(A.resumo) + '</div><div class="sp"></div><div class="grid g2"><div class="card"><h3>Regras fixas dos cards</h3><ul class="list">' + A.regras.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul></div><div class="card"><h3>Fluxo de cada lote</h3><ol class="steps">' + A.fluxo.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol><h3 style="margin-top:16px">Ordem de prioridade</h3><ol class="steps">' + A.prioridade.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol></div></div><div class="sp"></div>' +
      '<div class="card"><h3>Modos de criação</h3>' + A.modos.map(m => { const p = m.p && promptByTitle(m.p); return '<div class="item"><div class="grow"><b>' + esc(m.n) + '</b><div class="small muted">' + esc(m.q) + '</div></div>' + (p ? '<button class="btn sm" data-act="use" data-id="' + p.id + '">' + ico('copy') + 'Prompt</button>' : '') + '</div>'; }).join('') + '</div><div class="sp"></div>' +
      '<div class="grid g2"><div class="card"><h3>Configuração e ritmo</h3><ul class="list">' + A.preset.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul></div><div class="card"><h3>Ritmo de trabalho</h3><ul class="list">' + A.ritmo.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul></div></div>';
  } else if (tab === 'registro') {
    const L = state.anki.slice().sort(byDate).reverse(); const total = L.reduce((s, a) => s + (+a.cards || 0), 0); const cob = S.pats.filter(p => patStats(p.id).cards).length;
    const sis = [...new Set(S.pats.map(p => p.sistema))].map(s => { const ps = S.pats.filter(p => p.sistema === s); const c = ps.filter(p => patStats(p.id).cards).length; return '<div class="small" style="margin-bottom:8px"><div class="row"><span>' + esc(s) + '</span><span class="right muted">' + c + '/' + ps.length + '</span></div>' + bar(c / ps.length * 100, c === ps.length ? 'ok' : 'warn') + '</div>'; }).join('');
    body = '<div class="grid g4"><div class="card kpi"><span>Cards enviados</span><b>' + total + '</b></div><div class="card kpi"><span>Lotes</span><b>' + L.length + '</b></div><div class="card kpi"><span>Patologias no Anki</span><b>' + cob + '/' + S.pats.length + '</b></div><div class="card kpi"><span>Cards nesta semana</span><b>' + weekCounts(isoWeek(todayISO()).key).anki + '</b></div></div><div class="sp"></div><div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="card"><div class="row"><h3>Lotes enviados</h3><button class="btn pri sm right" data-act="reg" data-k="anki">' + ico('plus') + 'Registrar lote</button></div>' + (L.length ? '<div class="tbl-wrap" style="border:0"><table><thead><tr><th>Data</th><th>Patologia / tópico</th><th class="c">Cards</th><th>Tipo</th><th></th></tr></thead><tbody>' + L.map(a => '<tr><td class="nowrap">' + fmtShort(a.date) + '</td><td>' + (a.pat ? patLink(a.pat) : '') + (a.topico ? '<div class="small">' + esc(a.topico) + '</div>' : '') + (a.tags ? '<div class="tiny muted">' + esc(a.tags) + '</div>' : '') + '</td><td class="c"><b>' + a.cards + '</b></td><td class="small">' + esc(a.tipo) + (a.origem === 'chat' ? ' ' + badge('via Claude', 'pri') : '') + '</td><td><button class="btn ghost sm" data-act="del" data-kind="anki" data-id="' + a.id + '">' + ico('trash') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">Nenhum lote registrado ainda.<br>Quando você importar cards no Anki, registre aqui (ou me avise no chat).</div>') + '</div><div class="card"><h3>Cobertura por sistema</h3>' + sis + '</div></div>';
  } else {
    const pend = ankiPendentes(); const hk = S.skills.filter(s => s.grupo === 'H').map(s => ({ s, done: state.anki.some(a => (a.topico || '').toUpperCase().startsWith(s.id)) }));
    body = '<div class="callout">Prioridade: cards de erro dos drills/casos primeiro; depois H1–H6; depois patologias da próxima prova (SOI IV, 05/11).</div><div class="sp"></div><div class="grid g2"><div class="card"><h3>Habilidades H1–H6 (tópico começa com o código)</h3>' + hk.map(x => '<div class="item"><span class="dot ' + (x.done ? 'ok' : 'warn') + '" style="margin-top:8px"></span><div class="grow small"><b>' + x.s.id + '</b> ' + esc(x.s.nome.slice(0, 60)) + '<div class="tiny muted">' + esc(x.s.dominio.replace('Anki: ', '')) + '</div></div>' + (x.done ? badge('feito', 'ok') : '<button class="btn sm" data-act="reg" data-k="anki" data-topico="' + x.s.id + ' · ">registrar</button>') + '</div>').join('') + '</div>' +
      '<div class="card"><h3>Patologias sem lote (' + pend.length + ')</h3><div style="max-height:520px;overflow:auto">' + (pend.length ? pend.map(p => '<div class="item"><div class="grow small"><b>' + esc(p.nome) + '</b><div class="tiny muted">' + p.periodo + ' · ' + esc(p.sistema) + '</div></div>' + (p.prova ? badge('prova 05/11', 'bad') : '') + '<button class="btn sm" data-act="reg" data-k="anki" data-pat="' + p.id + '">registrar</button></div>').join('') : '<div class="empty">Todas as patologias já têm lote no Anki.</div>') + '</div></div></div>';
  }
  return page('Anki', 'Estratégia e registro do que já foi enviado', regBtn('Registrar lote', 'anki'), '<div class="tabs">' + tabs.map(x => '<button class="tab' + (tab === x[0] ? ' on' : '') + '" data-act="atab" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' + body);
}

/* ======================= PESQUISA ======================= */
function vPesquisa() {
  const dias = daysBetween(todayISO(), '2026-11-30'); const keyOf = (gi, ii) => 'g' + gi + 'i' + ii;
  const tot = S.pesquisa.reduce((s, g) => s + g.i.length, 0), done = Object.values(state.pesq).filter(Boolean).length;
  return page('Pesquisa e carreira', 'Comunidade MB, revisão sistemática e trilha de tecnologia', '', '<div class="grid g3"><div class="card kpi"><span>Prazo ABNC (30/11/2026)</span><div class="countdown">' + dias + '<span style="font-size:15px;font-weight:500"> dia(s)</span></div></div><div class="card kpi"><span>Progresso geral</span><b>' + done + '/' + tot + '</b>' + bar(done / tot * 100, 'pri') + '</div><div class="card"><h3>Mentor de RS</h3><p class="small muted">Prompt para conduzir a revisão sistemática do megacólon chagásico passo a passo.</p><button class="btn sm" data-act="use" data-id="' + (promptByTitle('Mentor') || {}).id + '">' + ico('copy') + 'Usar prompt</button></div></div><div class="sp"></div>' +
    '<div class="grid g2">' + S.pesquisa.map((g, gi) => { const dn = g.i.filter((_, ii) => state.pesq[keyOf(gi, ii)]).length; return '<div class="card"><div class="row"><h3>' + esc(g.g) + '</h3><span class="right muted small">' + dn + '/' + g.i.length + '</span></div>' + bar(dn / g.i.length * 100, dn === g.i.length ? 'ok' : 'pri') + '<div class="sp8"></div>' + g.i.map((x, ii) => '<label class="row small" style="padding:4px 0"><input type="checkbox" data-chg="pesq" data-id="' + keyOf(gi, ii) + '"' + (state.pesq[keyOf(gi, ii)] ? ' checked' : '') + '>' + esc(x) + '</label>').join('') + '</div>'; }).join('') + '</div>');
}

/* ======================= CONFIG / CONEXÃO COM O CLAUDE ======================= */
function vConfig() {
  const srv = Store.mode === 'server';
  return page('Configurações e conexão com o Claude', '', '', '<div class="grid g2"><div class="card"><h3>Conexão com o Claude</h3>' +
    '<div class="callout' + (srv ? '' : ' warn') + '">' + (srv ? 'Servidor local ativo. Seus dados ficam em <b>data/state.json</b> dentro da pasta "Medical Brain Helen". Quando você registra aqui, o Claude vê no chat; quando o Claude registra, este painel se atualiza sozinho em poucos segundos.' : 'Você abriu o arquivo sem o servidor: os dados ficam só neste navegador. Para conectar ao Claude, abra pelo iniciar.bat.') + '</div><div class="sp8"></div>' +
    '<p class="small">Como atualizar pelo chat, é só dizer, por exemplo:</p><ul class="list small"><li>"Fiz o drill 03 em DRGE, nota 80, errei o diferencial de dispepsia."</li><li>"Caso completo de H. pylori: A 90, B 70, C 60, D 50."</li><li>"Mandei 21 cards de DRGE pro Anki (cloze padrão)."</li><li>"Tirei 8,5 na prova de IESC."</li><li>"Cole o resultado para o painel que a IA gerou."</li></ul>' +
    '<div class="row wrap"><button class="btn pri" data-act="copyresumo">' + ico('copy') + 'Copiar resumo do painel</button></div><p class="tiny muted" style="margin-top:8px">Cole o resumo no chat se quiser que o Claude analise onde estão os pontos fracos.</p>' +
    '<div class="sp8"></div><div class="small muted">Último salvamento: <b id="lastsave">' + (Store.lastSave ? Store.lastSave.toLocaleTimeString('pt-BR') : '—') + '</b>' + (state.sync.lastChat ? '<br>Última atualização pelo Claude: <b>' + esc(state.sync.lastChat) + '</b>' + (state.sync.nota ? ' · ' + esc(state.sync.nota) : '') : '') + '</div></div>' +
    '<div class="col"><div class="card"><h3>Aparência</h3><div class="row"><button class="btn" data-act="theme">Alternar claro/escuro</button></div><div class="sp8"></div>' + fld('Seu nome', '<input data-chg="nome" value="' + esc(state.settings.nome) + '">') + '</div>' +
    '<div class="card"><h3>Backup</h3><p class="small muted">Há um backup automático por dia em data/backups (últimos 30 dias).</p><div class="row wrap"><button class="btn" data-act="export">Exportar JSON</button><label class="btn" style="cursor:pointer">Importar JSON<input type="file" accept=".json" id="impfile" style="display:none" data-chg="import"></label><button class="btn" data-act="resetprompts">Restaurar prompts originais</button></div></div></div></div>');
}

const VIEWS = { recepcao: vRecepcao, plantao: vPlantao, provas: vProvas, enfermaria: vEnfermaria, prontuarios: vProntuarios, casos: vCasos, prompts: vPrompts, evolucao: vEvolucao, anki: vAnki, pesquisa: vPesquisa, config: vConfig };
