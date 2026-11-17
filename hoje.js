/* Medical Brain · Helen — tela HOJE: o que fazer agora, escolhido pelo painel.
   Fluxo: abrir, copiar o prompt, executar no chat, registrar a nota, seguir para o próximo item.
   Escolhas (patologia e drill) são calculadas uma vez por dia e congeladas em state.daily[dia].hoje.plano. */
const HJ = {
  pesqDia: 120,                       // minutos de pesquisa por dia útil (10h/semana)
  meta: { pesq: 600, flash: 5, ingles: 3, plant: 2, ret: 3, drills: 3 },
  foco: ['C22', 'C21', 'C20'],        // habilidade-foco da semana, em rodízio
  temaIds: ['C13', 'C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22'],
  comPat: id => /^C(1|2|3|4|5|6|7|8|9|10|11|12|18|19|20|21|22)$/.test(id),
};
/* modelo da semana: horário sugerido e tipo de cada item (o dia da semana vem de Date.getDay: 0 = domingo) */
const HJ_DIA = {
  1: [['07:50 e 17:30', 'pesq'], ['11:00', 'flash'], ['18:30', 'drill', 'Drill de tema (C13 a C22)']],
  2: [['07:30', 'pesq'], ['09:30', 'flash'], ['10:00', 'plant', 'resgate'], ['11:00', 'ret'], ['11:20', 'ingles']],
  3: [['07:30', 'pesq'], ['09:30', 'flash'], ['14:30', 'drill', 'Drill de base (H) ou semiologia (S)']],
  4: [['07:30', 'pesq'], ['09:30', 'flash'], ['10:00', 'plant', 'ancora'], ['11:00', 'ret'], ['11:20', 'ingles']],
  5: [['09:40 e 13:30', 'pesq'], ['14:10', 'flash'], ['14:35', 'drill', 'Drill da habilidade com pior saúde'], ['14:50', 'ret'], ['15:10', 'ingles'], ['15:40', 'rev']],
};
/* modo prova: pesquisa e inglês pausados até a data (state.settings.pausa = { ate: 'AAAA-MM-DD', itens: ['pesq','ingles'] }) */
const hjPausa = (d, k) => { const p = state.settings.pausa; return !!(p && p.ate && d <= p.ate && (p.itens || []).includes(k)); };
const hdoc = d => { const x = day(d); if (!x.hoje) x.hoje = { pesq: 0, flash: false, ingles: false, rev: false, plano: null }; return x.hoje; };
const ws0 = d => hjWeekDays(d);
const hjWeekDays = d => { const s = weekStart(d); return [0, 1, 2, 3, 4, 5, 6].map(i => addDays(s, i)); };
const hjFoco = d => HJ.foco[isoWeek(d).w % 3];

/* prioridade de uma habilidade: nunca treinada > cadência vencida > saúde baixa; recém-treinada desce */
function hjPrio(id, bonus) {
  const h = healthOf(id); let s;
  if (h.n === 0) s = 100;
  else {
    s = Math.max(0, h.since - h.cad) * 3 + (100 - h.health) * 0.8 + (h.since >= h.cad ? 20 : 0);
    if (h.dominio && h.since < h.cad) s -= 40;
    if (h.since <= 2) s -= 60;
  }
  return s + (bonus || 0);
}
function hjPick(ids, d, bonusMap) {
  const done = new Set(); hjWeekDays(d).forEach(x => state.treinos.filter(t => t.date === x).forEach(t => done.add(t.skill)));
  const c = ids.filter(id => skillById(id)).map(id => ({ id, p: hjPrio(id, (bonusMap || {})[id]) - (done.has(id) ? 80 : 0) }));
  c.sort((a, b) => b.p - a.p); return c.length ? c[0].id : null;
}

/* temas da semana: sugeridos pelo painel e editáveis */
function temasSemana(d) {
  const k = isoWeek(d).key, w = (state.weekly[k] = state.weekly[k] || {}); w.temas = w.temas || {}; const T = w.temas; let ch = false;
  if (!T.ancora) { const pd = patDoDia(d); if (pd.pats[0]) { T.ancora = pd.pats[0].id; ch = true; } }
  if (!T.resgate) { const r = rondaSOI3(1)[0]; if (r) { T.resgate = r.id; ch = true; } }
  if (ch && d === todayISO()) touch();
  return T;
}

/* plano do dia, calculado uma vez e congelado */
function planoDoDia(d) {
  const h = hdoc(d); if (h.plano && h.plano.v === 1) return h.plano;
  const dow = parseISO(d).getDay(), T = temasSemana(d), foco = hjFoco(d);
  const p = { v: 1, drill: null, drillPat: '', ret: [], ancora: T.ancora || '', resgate: T.resgate || '' };
  const CS = S.skills.map(s => s.id);
  if (dow === 1) p.drill = hjPick(HJ.temaIds, d, { [foco]: 60 });
  else if (dow === 3) p.drill = hjPick(CS.filter(i => i[0] === 'H' || i[0] === 'S'), d);
  else if (dow === 5) p.drill = hjPick(CS.filter(i => i[0] === 'C' && !HJ.temaIds.includes(i) || i[0] === 'S' || i[0] === 'H'), d);
  if (p.drill && HJ.comPat(p.drill)) p.drillPat = T.ancora || '';
  if (dow === 2 || dow === 4 || dow === 5) {
    const dev = retornosDevidos().filter(x => !state.casos.some(c => c.tipo === 'retorno' && c.pat === x.pat.id && c.date === d));
    if (dev.length) p.ret = [dev[0].pat.id];
  }
  if (d === todayISO()) { h.plano = p; touch(); }
  return p;
}

/* contagens da semana */
function hjSemana(d) {
  const ds = hjWeekDays(d), a = ds[0], b = ds[6], inW = x => x >= a && x <= b;
  let pesq = 0, flash = 0, ingles = 0;
  ds.forEach(x => { const h = state.daily[x] && state.daily[x].hoje; if (h) { pesq += +h.pesq || 0; if (h.flash) flash++; if (h.ingles) ingles++; } });
  return {
    pesq, flash, ingles,
    plant: state.casos.filter(c => inW(c.date) && (c.tipo === 'plantao' || c.tipo === 'fragmentado' || c.tipo === 'completo')).length,
    ret: state.casos.filter(c => inW(c.date) && c.tipo === 'retorno').length,
    drills: state.treinos.filter(t => inW(t.date)).length,
  };
}

/* ---------------- montagem dos itens do dia ---------------- */
const hjBtn = (act, label, attrs, cls) => '<button class="btn sm' + (cls ? ' ' + cls : '') + '" data-act="' + act + '"' + (attrs || '') + '>' + label + '</button>';
function hjItems(d) {
  const dow = parseISO(d).getDay(), h = hdoc(d), pl = planoDoDia(d), it = [];
  (HJ_DIA[dow] || []).forEach(m => {
    const [t, k, x] = m;
    if (hjPausa(d, k)) return;
    if (k === 'pesq') {
      const ok = h.pesq >= HJ.pesqDia;
      it.push({ k, t, done: ok, titulo: 'Pesquisa científica', sub: 'Meta do dia: 2h em bloco sem celular · registrado hoje: ' + (h.pesq / 60).toFixed(1).replace('.', ',') + 'h',
        btns: hjBtn('hjpesq', '+30 min', ' data-m="30"') + hjBtn('hjpesq', '+1h', ' data-m="60"') + hjBtn('hjpesq', '−30', ' data-m="-30"', 'ghost') });
    } else if (k === 'flash') {
      it.push({ k, t, done: !!h.flash, titulo: 'Flashcards (25 min)', sub: 'Revisão do dia + até 20 cartões novos, 70% P4 e 30% P3. Todo erro de caso ou drill vira card.',
        btns: hjBtn('hjflag', h.flash ? 'Desmarcar' : 'Concluir', ' data-f="flash"', h.flash ? '' : 'pri') + hjBtn('reg', 'Registrar lote', ' data-k="anki"') });
    } else if (k === 'ingles') {
      it.push({ k, t, done: !!h.ingles, titulo: 'Inglês (30 min)', sub: 'Terça, quinta e sexta.', btns: hjBtn('hjflag', h.ingles ? 'Desmarcar' : 'Concluir', ' data-f="ingles"', h.ingles ? '' : 'pri') });
    } else if (k === 'rev') {
      it.push({ k, t, done: !!h.rev, titulo: 'Revisão semanal (15 min)', sub: 'Olhe retornos devidos e habilidades críticas aqui embaixo e confirme os temas da próxima semana.', btns: hjBtn('hjflag', h.rev ? 'Desmarcar' : 'Concluir', ' data-f="rev"', h.rev ? '' : 'pri') });
    } else if (k === 'drill') {
      const id = pl.drill, s = id && skillById(id);
      if (!s) { it.push({ k, t, done: false, info: true, titulo: x, sub: 'Sem habilidade disponível.' }); return; }
      const pat = pl.drillPat, done = state.treinos.some(r => r.date === d && r.skill === id);
      it.push({ k, t, done, titulo: 'Drill ' + id + ' · ' + s.nome, sub: x + (pat ? ' · patologia: ' + patName(pat) : '') + ' · ' + hjPorque(id, d),
        btns: hjBtn('ficha', 'Ficha', ' data-id="' + id + '"') + hjBtn('hjprompt', ico('copy') + 'Copiar prompt', ' data-sk="' + id + '" data-pat="' + pat + '"') + hjBtn('reg', 'Registrar nota', ' data-k="treino" data-skill="' + id + '" data-pat="' + pat + '" data-date="' + d + '"', 'pri') });
    } else if (k === 'plant') {
      const TT = temasSemana(d), id = x === 'ancora' ? TT.ancora : TT.resgate, p = id && patById(id);
      const nome = x === 'ancora' ? 'Plantão · patologia-âncora de P4 (nível Avançado)' : 'Plantão · resgate de P3 (nível Médio)';
      if (!p) { it.push({ k, t, done: false, info: true, titulo: nome, sub: 'Escolha a patologia em "Temas da semana" abaixo.' }); return; }
      const done = state.casos.some(c => c.tipo === 'plantao' && c.pat === id && c.date === d);
      it.push({ k, t, done, titulo: nome + ': ' + p.nome, sub: '60 min em 5 estações (admissão, anamnese e exame, raciocínio, exames, conduta). Cobre C1 a C10.',
        btns: hjBtn('copyp', ico('copy') + 'Copiar prompt', ' data-pid="plantao60" data-pat="' + id + '"') + hjBtn('plantao', 'Registrar plantão', ' data-id="' + id + '"', 'pri') });
    } else if (k === 'ret') {
      const id = pl.ret[0], p = id && patById(id);
      if (p) {
        const inter = internacoes().find(z => z.pat.id === id), done = state.casos.some(c => c.tipo === 'retorno' && c.pat === id && c.date === d);
        it.push({ k, t, done, titulo: 'Retorno (20 min): ' + p.nome, sub: inter && inter.step ? 'Revisão adaptativa · intervalo de ' + inter.step + ' dias (' + (inter.fase || 'inicial') + ') · foque nas estações em que você errou.' : 'Revisão do eixo mais fraco.',
          btns: hjBtn('copyp', ico('copy') + 'Copiar prompt', ' data-pid="retorno" data-pat="' + id + '"') + hjBtn('retorno', 'Registrar retorno', ' data-id="' + id + '"', 'pri') });
      } else {
        const r = rondaSOI3(1)[0], prox = proximosRetornos()[0];
        const done = r && state.treinos.some(z => z.date === d && z.skill === 'C12' && z.pat === r.id);
        it.push({ k, t, done: !!done, titulo: 'Sem retorno devido hoje' + (prox ? ' (próximo: ' + prox.pat.nome + ', ' + fmtShort(prox.due) + ')' : ''), sub: r ? 'Alternativa de 20 min: revisão C12 de ' + r.nome + ' (a mais antiga ou mais fraca de P3).' : 'Aproveite para adiantar a revisão semanal.',
          btns: r ? hjBtn('copyp', ico('copy') + 'Copiar prompt', ' data-pid="ronda" data-pat="' + r.id + '"') + hjBtn('reg', 'Registrar C12', ' data-k="treino" data-skill="C12" data-pat="' + r.id + '"', 'pri') : '' });
      }
    }
  });
  return it;
}
function hjPorque(id, d) {
  const h = healthOf(id), foco = hjFoco(d);
  if (id === foco) return 'foco da semana';
  if (h.n === 0) return 'ainda sem registro';
  if (h.since > h.cad) return 'cadência vencida (há ' + h.since + 'd)';
  if (h.status !== 'ok') return 'saúde ' + h.health + '%';
  return 'rodízio';
}

/* ---------------- tela ---------------- */
function vHoje() {
  const t = todayISO(), d = UI.hjday || t, dow = parseISO(d).getDay(), hr = new Date().getHours();
  const greet = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const T = temasSemana(d), sem = hjSemana(d), foco = hjFoco(d), pr = proximaProva();
  const strip = '<div class="chips" style="margin-bottom:14px">' + ws0(d).map(x => { const hh = state.daily[x] && state.daily[x].hoje; const n = hh ? [hh.flash, hh.ingles, hh.rev, hh.pesq >= HJ.pesqDia].filter(Boolean).length : 0; return '<button class="chip' + (x === d ? ' on' : '') + '" data-act="hjday" data-v="' + x + '">' + DOW[parseISO(x).getDay()].slice(0, 3) + ' ' + pad(parseISO(x).getDate()) + (x === t ? ' •' : '') + '</button>'; }).join('') + '</div>';
  const items = hjItems(d), ativos = items.filter(i => !i.info), feitos = ativos.filter(i => i.done).length, pct = ativos.length ? Math.round(feitos / ativos.length * 100) : 0;
  const prox = ativos.find(i => !i.done);

  let lista;
  if (!items.length) {
    lista = '<div class="callout">' + (dow === 6 ? '<b>Sábado:</b> engenharia de IA e prova de cloud, mais 1h de sol. Flashcards leves, se quiser (10 min).' : '<b>Domingo:</b> Clube Fé e Razão, Academia Freya e 1h de sol. Flashcards leves, se quiser (10 min).') + '</div>';
  } else {
    lista = items.map(i => '<div class="item" style="align-items:flex-start;' + (i.done ? 'opacity:.55' : '') + '"><div class="tiny muted nowrap" style="width:92px;padding-top:4px">' + esc(i.t) + '</div>' +
      '<div class="grow"><div class="row wrap" style="gap:6px">' + (i.done ? badge('feito', 'ok') : i === prox ? badge('agora', 'pri') : '') + '<b class="small"' + (i.done ? ' style="text-decoration:line-through"' : '') + '>' + esc(i.titulo) + '</b></div><div class="tiny muted" style="margin:3px 0 7px">' + esc(i.sub) + '</div>' + (i.btns ? '<div class="row wrap" style="gap:6px">' + i.btns + '</div>' : '') + '</div></div>').join('');
  }

  const hero = '<div class="hero"><h1>' + (d === t ? greet + ', ' + esc(state.settings.nome) + '.' : 'Dia ' + fmtShort(d) + ' · ' + DOW[dow]) + '</h1><div class="sub">' + fmtLong(d) + (d === t ? ' (hoje)' : '') + ' · semana ' + isoWeek(d).w + ' · ' + (pr ? pr.n + ' em ' + pr.dias + ' dia(s)' : 'sem prova agendada') + ' · nível dos casos: ' + esc(nivelCurto(nivelAtual().id)) + '</div></div>';
  const topo = '<div class="card"><div class="row"><h3>Hoje</h3><span class="right muted small">' + feitos + ' de ' + ativos.length + ' itens (' + pct + '%)</span></div>' + bar(pct, pct >= 100 ? 'ok' : 'pri') + '<div class="sp8"></div>' +
    (prox ? '<div class="callout"><b>Próximo: ' + esc(prox.titulo) + '</b><div class="tiny muted">' + esc(prox.t) + '</div></div><div class="sp8"></div>' : (ativos.length ? '<div class="callout"><b>Dia concluído.</b> Bom descanso, a leitura e o sono também contam.</div><div class="sp8"></div>' : '')) + lista + '</div>';

  const mrow = (lb, v, goal, fmt) => '<div style="margin-bottom:10px"><div class="row small"><span>' + lb + '</span><span class="right muted">' + (fmt ? fmt(v) + ' / ' + fmt(goal) : v + ' / ' + goal) + '</span></div>' + bar(v / goal * 100, v >= goal ? 'ok' : 'pri') + '</div>';
  const horas = x => (x / 60).toFixed(1).replace('.', ',') + 'h';
  const ws = hjWeekDays(d);
  const pa = state.settings.pausa && state.settings.pausa.ate >= t ? state.settings.pausa : null;
  const metas = '<div class="card"><h3>Metas da semana <span class="muted small">(' + fmtShort(ws[0]) + ' a ' + fmtShort(ws[6]) + ')</span></h3>' +
    (pa && pa.itens.includes('pesq') ? '<div class="tiny muted" style="margin-bottom:8px">Modo prova até ' + fmtShort(pa.ate) + ': pesquisa e inglês pausados.</div>' : mrow('Pesquisa científica', sem.pesq, HJ.meta.pesq, horas)) + mrow('Plantões e casos', sem.plant, HJ.meta.plant) + mrow('Retornos', sem.ret, HJ.meta.ret) + mrow('Drills', sem.drills, HJ.meta.drills) +
    mrow('Flashcards (dias)', sem.flash, HJ.meta.flash) + (pa && pa.itens.includes('ingles') ? '' : mrow('Inglês', sem.ingles, HJ.meta.ingles)) + '</div>';

  const patOpts = (sel, per) => '<option value="">— escolher —</option>' + S.pats.filter(p => !per || p.periodo === per).map(p => '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nome) + ' (' + p.periodo + ')</option>').join('');
  const dev = retornosDevidos(), old = S.pats.filter(p => { const st = patStats(p.id); return st.last && daysBetween(st.last, t) > 30; }).sort((a, b) => patStats(a.id).last < patStats(b.id).last ? -1 : 1);
  const temas = '<div class="card"><h3>Temas da semana</h3><div class="tiny muted" style="margin-bottom:8px">O painel sugere; você pode trocar. Os plantões de terça e quinta seguem o que estiver aqui; o drill e o retorno do dia ficam fixos depois que você abre a tela.</div>' +
    '<div class="grid g2">' + fld('Âncora (P4): patologia da aula de HAM', '<select data-chg="hjtema" data-k="ancora">' + patOpts(T.ancora, 'SOI IV') + '</select>') + fld('Resgate (P3): saúde mais baixa', '<select data-chg="hjtema" data-k="resgate">' + patOpts(T.resgate, 'SOI III') + '</select>') + '</div><div class="sp8"></div>' +
    '<div class="small"><b>Repetição:</b> ' + (dev.length ? dev.slice(0, 3).map(x => esc(x.pat.nome) + ' (+' + x.step + ')').join(', ') : 'nenhum retorno devido') + (old.length ? ' · <b>C12 do mês:</b> ' + esc(old[0].nome) : '') + '</div>' +
    '<div class="small" style="margin-top:4px"><b>Habilidade-foco:</b> ' + foco + ' · ' + esc(skillById(foco).nome) + '</div></div>';

  const crit = healthAll().items.filter(x => x.health != null && x.status !== 'ok').sort((a, b) => a.health - b.health).slice(0, 4);
  const fila = '<div class="card"><div class="row"><h3>Habilidades para reforçar</h3><a class="right small" href="#/enfermaria">enfermaria</a></div>' +
    (crit.length ? crit.map(h => '<div class="item"><span class="id" style="width:42px"><b>' + h.id + '</b></span><div class="grow small">' + esc(skillById(h.id).nome.slice(0, 70)) + '<div class="tiny muted">saúde ' + h.health + '% · há ' + h.since + ' dia(s)</div></div>' + hjBtn('reg', 'Registrar', ' data-k="treino" data-skill="' + h.id + '"') + '</div>').join('') : '<div class="empty">Nenhuma habilidade fora da faixa saudável.</div>') +
    '<div class="tiny muted" style="margin-top:8px">Mapa patologia × habilidade: <a href="#/prontuarios">Prontuários</a> · retornos: <a href="#/plantoes">Plantão por patologia</a></div></div>';

  return page('Hoje', 'Abra, veja o que fazer, execute, registre a nota e continue', '<button class="btn" data-act="hjday" data-v="' + addDays(d, -1) + '">‹</button><button class="btn" data-act="hjday" data-v="' + t + '">Hoje</button><button class="btn" data-act="hjday" data-v="' + addDays(d, 1) + '">›</button>' + regBtn('Registrar'), strip + (d !== t ? '<div class="callout warn" style="margin-bottom:12px">Você está vendo <b>' + fmtLong(d) + '</b>. Marcações e pesquisa entram nesse dia; o registro de notas usa a data de hoje, ajuste a data no formulário se precisar.</div>' : '') + hero + '<div class="sp"></div><div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div>' + topo + '</div><div class="col">' + metas + temas + fila + '</div></div>');
}
VIEWS.hoje = vHoje;

Object.assign(window.ACT_EXTRA = window.ACT_EXTRA || {}, {
  hjday: el => { UI.hjday = el.dataset.v === todayISO() ? null : el.dataset.v; render(); },
  hjpesq: el => { const h = hdoc(UI.hjday || todayISO()); h.pesq = Math.max(0, (+h.pesq || 0) + (+el.dataset.m)); touch(); render(); },
  hjflag: el => { const h = hdoc(UI.hjday || todayISO()), k = el.dataset.f; h[k] = !h[k]; touch(); render(); },
  hjprompt: el => { const p = promptForSkill(el.dataset.sk); if (p) copyText(withFooter(fillPrompt(p.corpo, el.dataset.pat || ''))); else toast('Prompt não encontrado'); },
});
document.addEventListener('change', e => {
  const el = e.target; if (el.dataset.chg !== 'hjtema') return;
  const w = (state.weekly[isoWeek(todayISO()).key] = state.weekly[isoWeek(todayISO()).key] || {}); w.temas = w.temas || {}; w.temas[el.dataset.k] = el.value; touch(); toast('Tema da semana atualizado');
});
