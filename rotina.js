/* Medical Brain · Helen — Rotina semanal + ciclo mensal adaptativo (v1)
   Registro por bloco (feito, pulado, remarcado + energia 1 a 5), curva real de energia, coringas, escada de corte,
   proposta de sexta, níveis automáticos e registro de ajustes com desfazer.
   Trava de segurança: nada muda sozinho antes de 3 semanas com dados seus; só mudanças protetoras se aplicam sozinhas. */
UI.rday = UI.rday || null;

/* ---------- modelo da semana (v3.1). dow: 0 domingo ... 6 sábado ---------- */
const CAT = {
  apgS: ['APG de sexta', 0], apgM: ['APG de segunda', 0], ham: ['HAM pré-aula', 0], pesq: ['Pesquisa', 1], mb: ['Medical Brain', 0],
  ia: ['Engenharia de IA e cloud', 2], ing: ['Inglês', 3], soi: ['SOI', 0], cur: ['Currículo e horas', 1], coringa: ['Coringa', 0],
};
/* escada de corte: número = ordem em que sai (1 sai primeiro). 0 = nunca cortar */
const CORTE = { pesq: 1, ia: 2, ing: 3, cur: 4 };
const TIPOS_SEM = { 1: ['S1 Ataque', 'APG forte: 3h na terça e na quarta'], 2: ['S2 Pesquisa', 'pesquisa sobe; APG fica no núcleo'], 3: ['S3 Consolidação', 'fila de revisão ampliada, conteúdo novo no mínimo'], 4: ['S4 Descarga', 'cerca de 30% a menos; fechamento do mês'] };
const BL = (id, dow, ini, fim, cat, nome, extra) => Object.assign({ id, dow, ini, fim, cat, nome }, extra || {});
const ROTINA = [
  BL('seg_ham', 1, '07:30', '09:00', 'ham', 'HAM Pediátrico, estudo pré-aula'),
  BL('seg_fc', 1, '11:00', '11:25', 'mb', 'Flashcards'),
  BL('seg_dr', 1, '11:25', '11:40', 'mb', 'Drill C13 a C22'),
  BL('seg_pq', 1, '11:40', '12:30', 'pesq', 'Pesquisa'),
  BL('seg_tm', 1, '17:45', '18:10', 'mb', 'Treino misto (3 habilidades)', { mix: 1 }),
  BL('seg_cor', 1, '18:10', '19:30', 'coringa', 'Coringa (folga e remanejo)', { coringa: 1 }),
  BL('ter_apg1', 2, '07:30', '09:35', 'apgS', 'APG de sexta (núcleo)'),
  BL('ter_fc', 2, '09:35', '10:00', 'mb', 'Flashcards'),
  BL('ter_pl', 2, '10:00', '11:00', 'mb', 'Plantão P3 (resgate)'),
  BL('ter_rt', 2, '11:00', '11:20', 'mb', 'Retorno de patologia'),
  BL('ter_ing', 2, '11:20', '11:50', 'ing', 'Inglês'),
  BL('ter_soi', 2, '11:50', '12:30', 'soi', 'Estudo SOI IV'),
  BL('ter_apg2', 2, '13:05', '14:00', 'apgS', 'APG de sexta (2º bloco)', { m: { 2: 'off', 3: 'off', 4: 'off' } }),
  BL('qua_ham', 3, '07:30', '09:00', 'ham', 'HAM Adulto, estudo pré-aula'),
  BL('qua_fc', 3, '09:00', '09:30', 'mb', 'Flashcards'),
  BL('qua_tm', 3, '15:00', '15:25', 'mb', 'Treino misto (inclui drill de base)', { mix: 1 }),
  BL('qua_apg', 3, '16:00', '19:00', 'apgS', 'APG de sexta (3h, pausa de 10 min)', { m: { 2: { fim: '18:00' }, 3: { fim: '18:00' }, 4: { fim: '18:00' } } }),
  BL('qui_ham', 4, '07:30', '09:00', 'ham', 'HAM Pediátrico, estudo pré-aula'),
  BL('qui_fc', 4, '09:00', '09:30', 'mb', 'Flashcards'),
  BL('qui_pq1', 4, '09:30', '10:00', 'pesq', 'Pesquisa'),
  BL('qui_pl', 4, '10:00', '11:00', 'mb', 'Plantão P4 (âncora)'),
  BL('qui_rt', 4, '11:00', '11:20', 'mb', 'Retorno de patologia'),
  BL('qui_ing', 4, '11:20', '11:50', 'ing', 'Inglês'),
  BL('qui_pq2', 4, '11:50', '12:30', 'pesq', 'Pesquisa'),
  BL('qui_apg', 4, '16:30', '18:00', 'apgS', 'Revisão da APG (1h30)', { m: { 4: { fim: '17:30' } } }),
  BL('qui_shm', 4, '18:00', '18:30', 'apgS', 'Smart Heat Map (marcar o que domina da APG)', { m: { 4: 'off' } }),
  BL('sex_pq1', 5, '09:40', '11:00', 'pesq', 'Pesquisa', { m: { 4: 'off' } }),
  BL('sex_pq2', 5, '13:30', '14:10', 'pesq', 'Pesquisa leve (triagem, referências)', { m: { 4: 'off' } }),
  BL('sex_fc', 5, '14:10', '14:35', 'mb', 'Flashcards'),
  BL('sex_tm', 5, '14:35', '14:50', 'mb', 'Treino misto / drill', { mix: 1 }),
  BL('sex_rt', 5, '14:50', '15:10', 'mb', 'Retorno de patologia'),
  BL('sex_ing', 5, '15:10', '15:40', 'ing', 'Inglês'),
  BL('sex_rev', 5, '15:40', '16:00', 'mb', 'Revisão semanal (o painel propõe a próxima semana)'),
  BL('sex_apg', 5, '16:00', '16:40', 'apgS', 'Revisão rápida da APG'),
  BL('sab_apg', 6, '09:30', '12:30', 'apgM', 'Estudo da APG de segunda', { m: { 2: { fim: '11:30' }, 4: { fim: '11:30' } } }),
  BL('sab_ia', 6, '14:00', '17:00', 'ia', 'Engenharia de IA + prova de cloud (conjunto)', { m: { 4: { fim: '15:30' } } }),
  BL('sab_cor', 6, '17:00', '19:00', 'coringa', 'Coringa (folga e remanejo)', { coringa: 1 }),
  BL('dom_fc', 0, '10:00', '10:10', 'mb', 'Flashcards leves (opcional)', { opc: 1 }),
  BL('dom_cur', 0, '17:00', '17:30', 'cur', 'Currículo e horas complementares (30 min)', { opc: 1, m: { 4: { fim: '18:30', nome: 'Fechamento do mês (indicadores, Lattes, horas, editais, plano do mês)' } } }),
];
/* blocos extras por tipo de semana (todos opcionais) */
const EXTRAS_TIPO = {
  2: [BL('x2_qua', 3, '18:00', '19:00', 'pesq', 'Pesquisa extra', { opc: 1 }), BL('x2_dom', 0, '17:30', '20:00', 'pesq', 'Pesquisa extra (domingo, até 20:00)', { opc: 1 })],
  3: [BL('x3_dom', 0, '17:30', '18:45', 'mb', 'Fila ampliada: C12 das patologias antigas + questões', { opc: 1 })],
};
const EXTRAS_MOD = {
  prazo: [BL('xm_prazo', 0, '18:00', '19:00', 'cur', 'Prazo próximo (edital ou congresso): montar documentos', { opc: 1 })],
  pesqmais: [BL('xm_pesq', 0, '18:00', '19:00', 'pesq', 'Pesquisa +1h (semana forte)', { opc: 1 })],
};
/* curva genérica de energia (hipótese) até existirem dados reais */
const ENERGIA_GENERICA = { 6: 3.5, 7: 4, 8: 4.4, 9: 4.6, 10: 4.5, 11: 4.2, 12: 3.4, 13: 2.8, 14: 3.0, 15: 3.4, 16: 3.5, 17: 3.3, 18: 3.0, 19: 2.6, 20: 2.2 };
const hm = s => { const [h, m] = s.split(':'); return +h * 60 + +m; };
const dur = b => hm(b.fim) - hm(b.ini);
const hfmt = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h + 'h' + (m ? pad(m) : ''); };

/* ---------- estado ---------- */
function ensureRot() { state.rotina = state.rotina || {}; state.rotina.reg = state.rotina.reg || {}; return state.rotina; }
function ensureCiclo() { const c = (state.ciclo = state.ciclo || {}); c.over = c.over || {}; c.mod = c.mod || {}; c.log = c.log || []; c.avaliada = c.avaliada || {}; c.pend = c.pend === undefined ? null : c.pend; return c; }
const rotReg = (d, id) => ((ensureRot().reg[d] || {})[id]) || null;
function rotSet(d, id, patch) {
  const R = ensureRot(); R.reg[d] = R.reg[d] || {};
  const cur = R.reg[d][id] || {};
  const nx = Object.assign({}, cur, patch, { t: Date.now() });
  if (nx.s == null && nx.e == null) delete R.reg[d][id]; else R.reg[d][id] = nx;
  touch();
}

/* ---------- tipo da semana e blocos ---------- */
function tipoPadrao(ws) { const dia = +ws.slice(8, 10); return dia <= 7 ? 1 : dia <= 14 ? 2 : dia <= 21 ? 3 : 4; }
function tipoSemana(ws) { const c = ensureCiclo(); return +(c.over[ws] || tipoPadrao(ws)); }
function blocosDia(date) {
  const ws = weekStart(date), tp = tipoSemana(ws), dow = parseISO(date).getDay(), c = ensureCiclo();
  let out = [];
  ROTINA.forEach(b => {
    if (b.dow !== dow) return;
    let x = Object.assign({}, b); const m = b.m && b.m[tp];
    if (m === 'off') return;
    if (m) Object.assign(x, m);
    out.push(x);
  });
  (EXTRAS_TIPO[tp] || []).concat((c.mod[ws] || []).flatMap(k => EXTRAS_MOD[k] || [])).forEach(b => { if (b.dow === dow) out.push(Object.assign({}, b)); });
  return out.sort((a, b) => hm(a.ini) - hm(b.ini));
}
const semanaDias = ws => [1, 2, 3, 4, 5, 6, 0].map(k => addDays(ws, k === 0 ? 6 : k - 1));
function planoSemana(ws) {
  const out = {}; semanaDias(ws).forEach(d => blocosDia(d).forEach(b => { if (b.coringa) return; out[b.cat] = (out[b.cat] || 0) + dur(b); }));
  return out;
}
function horasFeitas(ws) {
  const out = {}; semanaDias(ws).forEach(d => blocosDia(d).forEach(b => { const r = rotReg(d, b.id); if (r && r.s === 'f') out[b.cat] = (out[b.cat] || 0) + dur(b); }));
  return out;
}
/* métricas de uma semana (a partir do registro) */
function semMetrics(ws) {
  let f = 0, marc = 0, es = 0, en = 0;
  semanaDias(ws).forEach(d => blocosDia(d).forEach(b => {
    const r = rotReg(d, b.id); if (!r) return;
    if (r.s && !b.opc) { marc++; if (r.s === 'f') f++; } /* opcionais não pesam na aderência */
    if (r.e != null) { es += r.e; en++; }
  }));
  const plan = planoSemana(ws), feito = horasFeitas(ws), cats = {};
  Object.keys(plan).forEach(k => { if (CAT[k] && k !== 'soi') cats[k] = plan[k] ? (feito[k] || 0) / plan[k] : null; });
  const sc = [];
  state.casos.concat(state.treinos).forEach(x => { if (x.score != null && x.date >= ws && x.date <= addDays(ws, 6)) sc.push(+x.score); });
  return { ws, marc, ader: marc ? f / marc : null, energia: en ? es / en : null, nEn: en, cats, nota: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null, nNota: sc.length };
}
function dadosSuficientes() {
  let k = 0; const w0 = weekStart(todayISO());
  for (let i = 0; i < 8; i++) if (semMetrics(addDays(w0, -7 * i)).marc >= 10) k++;
  return k >= 3;
}

/* ---------- proposta de sexta ---------- */
function atrasosFila() { return typeof internacoes === 'function' ? internacoes().filter(x => x.due <= todayISO() && x.atraso > 3).length : 0; }
function prazosProximos(dias) { const t = todayISO(), lim = addDays(t, dias); return ((state.cur && state.cur.prazos) || []).filter(p => !p.feito && p.data >= t && p.data <= lim); }
function cicloProposta() {
  const t = todayISO(), w0 = weekStart(t), next = addDays(w0, 7);
  const m0 = semMetrics(w0), m1 = semMetrics(addDays(w0, -7)), m2 = semMetrics(addDays(w0, -14));
  const base = tipoPadrao(next), suf = dadosSuficientes();
  const P = { next, base, tipo: base, suficiente: suf, motivos: [], mods: [], protetor: false, m0, m1 };
  if (!suf) { P.motivos.push('Ainda sem dados suficientes (preciso de 3 semanas com 10 ou mais blocos registrados). Segue o ciclo padrão do mês.'); return P; }
  const ruim = m => m.ader != null && m.energia != null && (m.ader < 0.8 || m.energia < 2.5);
  const atr = atrasosFila(), pz = prazosProximos(14);
  const forte = m => m.ader != null && m.energia != null && m.ader > 0.9 && m.energia > 3.8;
  const ns = [m2.nota, m1.nota, m0.nota];
  const caindo = ns.every(x => x != null) && ns[0] > ns[1] && ns[1] > ns[2];
  let tipo = base;
  if (ruim(m0) && ruim(m1)) { tipo = 4; P.protetor = true; P.motivos.push('Aderência abaixo de 80% ou energia média abaixo de 2,5 por duas semanas seguidas: próxima semana vira descarga (S4).'); }
  else if (atr > 4) { tipo = 3; P.protetor = true; P.motivos.push(atr + ' revisões com mais de 3 dias de atraso: próxima semana vira consolidação (S3) e o conteúdo novo é segurado.'); }
  if (pz.length) { P.mods.push('prazo'); P.motivos.push('Prazo em até 14 dias (' + pz.map(p => p.titulo).join(', ') + '): entra um bloco extra de currículo, tirando da escada de corte.'); }
  if (tipo === base && !P.protetor) {
    if (caindo) { tipo = 1; P.motivos.push('Notas de treino e caso caindo por duas semanas: semana seguinte vira S1, com questões mais difíceis.'); }
    else if (forte(m0) && forte(m1)) { P.mods.push('pesqmais'); P.motivos.push('Aderência acima de 90% e energia acima de 3,8 por duas semanas: pode subir pesquisa em 1h (precisa da sua aprovação).'); }
  }
  const baixas = Object.keys(m0.cats).filter(k => m0.cats[k] != null && m0.cats[k] < 0.6 && m1.cats[k] != null && m1.cats[k] < 0.6).map(k => CAT[k][0]);
  if (baixas.length) P.motivos.push('Abaixo de 60% do orçamento por duas semanas: ' + baixas.join(', ') + '. Esses módulos sobem de prioridade no plano e saem por último na escada de corte.');
  P.tipo = tipo;
  if (!P.motivos.length) P.motivos.push('Nenhuma regra disparou. Segue o ciclo padrão do mês.');
  return P;
}
function cicloAplicar(P, auto) {
  const c = ensureCiclo(), prev = { over: c.over[P.next] || null, mod: c.mod[P.next] || null };
  if (P.tipo !== P.base) c.over[P.next] = P.tipo; else delete c.over[P.next];
  if (P.mods.length) c.mod[P.next] = P.mods.slice(); else delete c.mod[P.next];
  c.log.unshift({ id: uid(), k: 'semana', date: todayISO(), semana: P.next, de: P.base, para: P.tipo, motivos: P.motivos.slice(), auto: !!auto, prev, desfeito: false });
  c.pend = null; c.avaliada[P.next] = true; touch();
}
function cicloDesfazer(id) {
  const c = ensureCiclo(), e = c.log.find(x => x.id === id); if (!e || e.desfeito) return;
  if (e.k === 'semana') { if (e.prev.over) c.over[e.semana] = e.prev.over; else delete c.over[e.semana]; if (e.prev.mod) c.mod[e.semana] = e.prev.mod; else delete c.mod[e.semana]; c.avaliada[e.semana] = true; }
  else if (e.k === 'nivel') { state.settings.nivel = e.de; c.nivelDesde = e.prevDesde || null; c.nivelPausa = e.antes || null; }
  e.desfeito = true; touch();
}
/* nível do caso: sobe com 2 notas seguidas >= 80, desce com nota < 60. Só age com 3 casos pontuados, e nunca em duplicidade */
function nivelAuto() {
  if (state.settings.nivelAuto === false) return;
  const rec = state.casos.filter(c => c.score != null && c.score !== '');
  if (rec.length < 3) return;
  const c = ensureCiclo(), ini = c.nivelDesde ? rec.findIndex(x => x.id === c.nivelDesde) + 1 : 0, novos = rec.slice(Math.max(0, ini));
  if (!novos.length) return;
  const ids = NIVEIS_CASO.map(n => n.id), cur = ids.indexOf(state.settings.nivel || 'medio'), last = novos[novos.length - 1], pen = novos[novos.length - 2];
  let nx = cur, why = '';
  if (+last.score < 60 && cur > 0) { nx = cur - 1; why = 'nota ' + Math.round(last.score) + ' no último caso (abaixo de 60)'; }
  else if (novos.length >= 2 && +last.score >= 80 && +pen.score >= 80 && cur < ids.length - 1) { nx = cur + 1; why = 'duas notas seguidas de 80 ou mais (' + Math.round(pen.score) + ' e ' + Math.round(last.score) + ')'; }
  if (nx === cur) return;
  c.log.unshift({ id: uid(), k: 'nivel', date: todayISO(), de: ids[cur], para: ids[nx], motivos: ['Nível do caso ' + (nx > cur ? 'subiu' : 'desceu') + ': ' + why + '.'], auto: true, prevDesde: c.nivelDesde || null, desfeito: false });
  state.settings.nivel = ids[nx]; c.nivelDesde = last.id; touch();
}
/* roda ao abrir e ao renderizar; é idempotente. Sexta depois das 15:40 (ou fim de semana) avalia a próxima semana uma vez */
function cicloTick() {
  const c = ensureCiclo(), now = new Date(), dow = now.getDay(), hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const janela = dow === 6 || dow === 0 || (dow === 5 && hhmm >= '15:40');
  const next = addDays(weekStart(todayISO()), dow === 0 ? 0 : 7);
  if (janela && !c.avaliada[next]) {
    const P = cicloProposta();
    c.avaliada[next] = true;
    if (P.suficiente && P.protetor && state.settings.cicloAuto !== false) cicloAplicar(P, true);
    else if (P.suficiente && (P.tipo !== P.base || P.mods.length)) c.pend = P;
    else c.pend = null;
    touch();
  }
  nivelAuto();
}
window.addEventListener('DOMContentLoaded', () => { const _render = render; render = function () { try { cicloTick(); } catch (e) { console.error('cicloTick', e); } _render(); }; });

/* ---------- coringa: o que foi pulado volta em até 48h ---------- */
function corFila() {
  const t = todayISO(), ws = weekStart(t), pend = [], slots = [];
  const todos = semanaDias(ws).concat(semanaDias(addDays(ws, 7)));
  semanaDias(ws).forEach(d => { if (d > t) return; blocosDia(d).forEach(b => { const r = rotReg(d, b.id); if (r && (r.s === 'p' || r.s === 'r') && !b.opc && !b.coringa && !r.ok) pend.push({ d, b, r }); }); });
  todos.forEach(d => { if (d < t || d > addDays(t, 2)) return; blocosDia(d).forEach(b => { if (!b.coringa) return; const r = rotReg(d, b.id); const usado = r && r.s === 'f'; slots.push({ d, b, livre: usado ? 0 : dur(b) }); }); });
  pend.sort((x, y) => (CORTE[x.b.cat] || 99) - (CORTE[y.b.cat] || 99) || 0).reverse();
  const fila = [];
  pend.forEach(p => {
    const need = dur(p.b), s = slots.find(x => x.livre >= need);
    if (s) { s.livre -= need; fila.push({ p, onde: s }); } else fila.push({ p, onde: null });
  });
  return { fila, slots };
}

/* ---------- curva de energia real ---------- */
function curvaEnergia() {
  const R = ensureRot().reg, soma = {}, n = {};
  Object.keys(R).forEach(d => blocosDia(d).forEach(b => {
    const r = R[d][b.id]; if (!r || r.e == null || b.coringa) return;
    const h = Math.floor(hm(b.ini) / 60); soma[h] = (soma[h] || 0) + r.e; n[h] = (n[h] || 0) + 1;
  }));
  const pts = []; let total = 0;
  for (let h = 6; h <= 20; h++) { total += n[h] || 0; pts.push({ h, real: n[h] ? soma[h] / n[h] : null, n: n[h] || 0, gen: ENERGIA_GENERICA[h] }); }
  return { pts, total, calibrada: total >= 40 };
}

/* ---------- telas ---------- */
const STS = { f: ['Feito', 'ok'], p: ['Pulado', 'bad'], r: ['Remarcado', 'warn'] };
function rotBlocoHtml(d, b) {
  const r = rotReg(d, b.id) || {}, now = new Date(), agora = d === todayISO() && pad(now.getHours()) + ':' + pad(now.getMinutes()), dentro = agora && agora >= b.ini && agora < b.fim;
  const btns = ['f', 'p', 'r'].map(k => '<button class="chip' + (r.s === k ? ' on' : '') + '" data-act="rotst" data-d="' + d + '" data-id="' + b.id + '" data-v="' + k + '" style="' + (r.s === k ? 'background:var(--' + STS[k][1] + ');border-color:var(--' + STS[k][1] + ')' : '') + '">' + STS[k][0] + '</button>').join('');
  const en = b.coringa ? '' : '<span class="tiny muted" style="margin-left:6px">energia</span>' + [1, 2, 3, 4, 5].map(k => '<button class="chip' + (r.e === k ? ' on' : '') + '" data-act="rotenergia" data-d="' + d + '" data-id="' + b.id + '" data-v="' + k + '" style="padding:1px 8px">' + k + '</button>').join('');
  return '<div class="item"' + (dentro ? ' style="background:var(--pri-l);border-radius:8px;padding-left:8px"' : '') + '><div class="tiny muted nowrap" style="width:92px;padding-top:4px">' + b.ini + ' – ' + b.fim + '</div><div class="grow"><div class="row wrap" style="gap:6px"><b>' + esc(b.nome) + '</b>' + badge(CAT[b.cat][0], b.coringa ? 'warn' : '') + (b.opc ? badge('opcional', '') : '') + (dentro ? badge('agora', 'ok') : '') + '</div><div class="chips" style="margin-top:6px;align-items:center">' + btns + en + '</div></div></div>';
}
function curvaHtml() {
  const C = curvaEnergia(), W = 560, H = 150, L = 24, B = 22, T = 8, bw = (W - L) / C.pts.length;
  let g = [1, 2, 3, 4, 5].map(v => { const y = T + (H - T - B) * (1 - v / 5); return '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)"/><text x="4" y="' + (y + 4) + '" style="font-size:10px;fill:var(--muted)">' + v + '</text>'; }).join('');
  C.pts.forEach((p, i) => {
    const x = L + i * bw + bw * .15, w = bw * .7, Y = v => T + (H - T - B) * (1 - v / 5);
    const usa = p.n >= 3 ? p.real : null;
    g += '<rect x="' + x + '" y="' + Y(p.gen) + '" width="' + w + '" height="' + (H - B - Y(p.gen)) + '" fill="var(--sem-l)" rx="3"/>';
    if (p.real != null) g += '<rect x="' + (x + w * .2) + '" y="' + Y(p.real) + '" width="' + w * .6 + '" height="' + (H - B - Y(p.real)) + '" fill="' + (usa != null ? 'var(--pri)' : 'var(--warn)') + '" rx="3"/>';
    g += '<text x="' + (x + w / 2) + '" y="' + (H - 7) + '" text-anchor="middle" style="font-size:10px;fill:var(--muted)">' + p.h + 'h</text>';
  });
  const top = C.pts.filter(p => p.n >= 3).sort((a, b) => b.real - a.real).slice(0, 3).map(p => p.h + 'h (' + (Math.round(p.real * 10) / 10).toString().replace('.', ',') + ')').join(', ');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px">' + g + '</svg><div class="tiny muted">Cinza: curva genérica (hipótese). Azul: sua média real por hora de início do bloco (mínimo 3 registros). Âmbar: poucos registros.</div><div class="small" style="margin-top:6px">' +
    (C.calibrada ? '<b>Curva calibrada</b> com ' + C.total + ' registros. Melhores janelas: ' + (top || 'ainda sem 3 registros na mesma hora') + '.' : 'Registros de energia: ' + C.total + ' de 40 para calibrar. Até lá o painel usa a curva genérica.') + '</div>';
}
function vRotina() {
  const t = todayISO(), d = UI.rday || t, ws = weekStart(d), tp = tipoSemana(ws), tpn = TIPOS_SEM[tp];
  const dias = semanaDias(ws), NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const tabs = '<div class="chips" style="margin-bottom:12px">' + dias.map((x, i) => {
    const bl = blocosDia(x).filter(b => !b.coringa && !b.opc), feitos = bl.filter(b => (rotReg(x, b.id) || {}).s === 'f').length;
    return '<button class="chip' + (x === d ? ' on' : '') + '" data-act="rotday" data-v="' + x + '">' + NOMES[i] + ' ' + fmtShort(x) + (x === t ? ' · hoje' : '') + ' (' + feitos + '/' + bl.length + ')</button>';
  }).join('') + '</div>';
  const blocos = blocosDia(d), lista = blocos.length ? blocos.map(b => rotBlocoHtml(d, b)).join('') : '<div class="empty">Sem blocos neste dia.</div>';
  const plan = planoSemana(ws), feito = horasFeitas(ws);
  const hor = Object.keys(plan).filter(k => k !== 'soi' || plan[k]).map(k => '<tr><td>' + CAT[k][0] + '</td><td>' + hfmt(plan[k]) + '</td><td>' + hfmt(feito[k] || 0) + '</td><td style="width:36%">' + bar(plan[k] ? (feito[k] || 0) / plan[k] * 100 : 0, '') + '</td></tr>').join('');
  const cf = corFila();
  const filaHtml = cf.fila.length ? cf.fila.map(x => '<div class="item"><div class="grow"><b>' + esc(x.p.b.nome) + '</b> <span class="tiny muted">(' + fmtShort(x.p.d) + ' ' + x.p.b.ini + ', ' + hfmt(dur(x.p.b)) + ')</span><div class="small">' + (x.onde ? 'vai para o coringa de ' + fmtLong(x.onde.d) + ', ' + x.onde.b.ini + ' – ' + x.onde.b.fim : (CORTE[x.p.b.cat] ? 'sem coringa livre nas próximas 48h: <b>cai pela escada de corte</b> (nível ' + CORTE[x.p.b.cat] + ')' : 'sem coringa livre: <b>não pode ser cortado</b>, encaixe no próximo bloco livre (nunca à noite)')) + '</div></div><button class="btn sm ghost" data-act="rotok" data-d="' + x.p.d + '" data-id="' + x.p.b.id + '">dar como resolvido</button></div>').join('') : '<div class="muted small">Nada pulado ou remarcado esperando coringa.</div>';
  return page('Rotina da semana', tpn[0] + ' · ' + tpn[1] + ' · ' + fmtShort(ws) + ' a ' + fmtShort(addDays(ws, 6)), '<button class="btn" data-act="rotday" data-v="' + addDays(ws, -7) + '">← semana</button><button class="btn" data-act="rotday" data-v="' + t + '">hoje</button><button class="btn" data-act="rotday" data-v="' + addDays(ws, 7) + '">semana →</button>',
    tabs + '<div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="card"><h3>' + fmtLong(d) + '</h3>' + lista + '</div><div class="col">' +
    '<div class="card"><h3>Horas da semana por módulo</h3><table style="width:100%"><thead><tr><th align="left">Módulo</th><th align="left">Plano</th><th align="left">Feito</th><th></th></tr></thead><tbody>' + hor + '</tbody></table><div class="tiny muted" style="margin-top:6px">O plano é calculado do horário desta semana (tipo ' + tpn[0] + '), sem os coringas.</div></div>' +
    '<div class="card"><h3>Fila dos coringas</h3>' + filaHtml + '</div></div></div><div class="sp"></div>' +
    '<div class="card"><h3>Curva de energia</h3>' + curvaHtml() + '</div><div class="sp"></div><a class="btn" href="#/ciclo">Ver ciclo do mês e proposta de sexta</a>');
}
VIEWS.rotina = vRotina;

function vCiclo() {
  const t = todayISO(), c = ensureCiclo(), w0 = weekStart(t), suf = dadosSuficientes(), P = cicloProposta();
  const sem = [0, 1, 2, 3, 4].map(i => { const ws = addDays(w0, 7 * (i - 1)), tp = tipoSemana(ws); return '<div class="card flat" style="' + (ws === w0 ? 'outline:2px solid var(--pri)' : '') + '"><div class="tiny muted">' + (ws === w0 ? 'esta semana' : ws < w0 ? 'semana passada' : 'em ' + (i - 1) + ' sem.') + ' · ' + fmtShort(ws) + '</div><b>' + TIPOS_SEM[tp][0] + '</b>' + (c.over[ws] ? '<div class="tiny">' + badge('ajustada', 'warn') + '</div>' : '') + '</div>'; }).join('');
  const m0 = P.m0, m1 = P.m1, f1 = v => v == null ? '–' : Math.round(v * 100) + '%', f2 = v => v == null ? '–' : (Math.round(v * 10) / 10).toString().replace('.', ',');
  const prop = c.pend ? '<div class="callout warn"><b>Proposta para a semana de ' + fmtShort(c.pend.next) + ': ' + TIPOS_SEM[c.pend.tipo][0] + (c.pend.mods.length ? ' + ajustes' : '') + '</b><ul style="margin:6px 0 0 18px">' + c.pend.motivos.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><div class="row" style="margin-top:8px"><button class="btn pri" data-act="cicloaceita">Aceitar</button><button class="btn" data-act="ciclorecusa">Manter o ciclo padrão</button></div></div>'
    : '<div class="callout"><b>Prévia da próxima semana (' + fmtShort(P.next) + '): ' + TIPOS_SEM[P.tipo][0] + '</b><ul style="margin:6px 0 0 18px">' + P.motivos.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><div class="tiny muted" style="margin-top:6px">A avaliação oficial roda na sexta depois das 15:40. Aqui é só uma prévia com os dados de hoje.</div></div>';
  const log = c.log.length ? c.log.slice(0, 20).map(e => '<div class="item"><div class="tiny muted nowrap" style="width:48px;padding-top:3px">' + fmtShort(e.date) + '</div><div class="grow"><div class="row wrap" style="gap:6px">' + badge(e.k === 'nivel' ? 'nível do caso' : 'semana ' + fmtShort(e.semana), e.auto ? 'warn' : '') + badge(e.auto ? 'automático' : 'aceito por você', '') + (e.desfeito ? badge('desfeito', 'bad') : '') + '</div><div class="small">' + e.motivos.map(esc).join(' ') + (e.k === 'semana' ? ' (' + TIPOS_SEM[e.de][0] + ' → ' + TIPOS_SEM[e.para][0] + ')' : ' (' + nivelCurto(e.de) + ' → ' + nivelCurto(e.para) + ')') + '</div></div>' + (e.desfeito ? '' : '<button class="btn sm" data-act="ciclodesfaz" data-id="' + e.id + '">Desfazer</button>') + '</div>').join('') : '<div class="muted small">Nenhum ajuste ainda. Cada mudança automática aparece aqui, com botão para desfazer.</div>';
  const regras = [
    ['Aderência e energia', 'aderência ' + f1(m0.ader) + ' (sem. passada ' + f1(m1.ader) + ') · energia ' + f2(m0.energia) + ' (' + f2(m1.energia) + ')', 'abaixo de 80% ou 2,5 por 2 semanas: descarga (S4)'],
    ['Fila de revisão', atrasosFila() + ' revisões com mais de 3 dias de atraso', 'mais de 4: S3 e conteúdo novo segurado'],
    ['Prazo', prazosProximos(14).length + ' prazo(s) em até 14 dias', 'bloco extra de currículo'],
    ['Notas', 'média da semana ' + f2(m0.nota) + ' (' + m0.nNota + ' notas)', 'caindo por 2 semanas: S1 com casos mais difíceis'],
    ['Semana forte', 'aderência acima de 90% e energia acima de 3,8 por 2 semanas', 'sobe pesquisa +1h (com sua aprovação)'],
  ].map(r => '<tr><td><b>' + r[0] + '</b></td><td class="small">' + r[1] + '</td><td class="small muted">' + r[2] + '</td></tr>').join('');
  const nv = nivelAtual();
  return page('Ciclo do mês', 'Quatro tipos de semana sobre o mesmo chassi. O painel propõe toda sexta; você aceita ou muda.', '<a class="btn" href="#/rotina">Rotina</a>',
    '<div class="grid" style="grid-template-columns:repeat(5,minmax(0,1fr))">' + sem + '</div><div class="sp"></div>' + prop + '<div class="sp"></div>' +
    '<div class="grid g2"><div class="card"><h3>Travas de segurança</h3><div class="small">' +
    '<p>' + (suf ? '<b>Dados suficientes.</b> O painel já pode ajustar.' : '<b>Modo observação.</b> Faltam semanas com dados seus (preciso de 3 com 10 ou mais blocos registrados). Nada muda sozinho até lá.') + '</p>' +
    '<p>Sempre intocáveis: sono, treino, plantões, núcleo de APG, HAM pré-aula, mínimo de 3 revisões por semana, nada depois das 20:00.</p>' +
    '<label class="row" style="margin:6px 0"><input type="checkbox" data-chg="cicloAuto"' + (state.settings.cicloAuto !== false ? ' checked' : '') + '> aplicar sozinho só mudanças protetoras (S3 e S4)</label>' +
    '<label class="row"><input type="checkbox" data-chg="nivelAutoOn"' + (state.settings.nivelAuto !== false ? ' checked' : '') + '> ajustar o nível do caso sozinho (sobe com 2 notas ≥ 80, desce com nota &lt; 60)</label>' +
    '<p style="margin-top:8px">Nível do caso agora: <b>' + esc(nivelCurto(nv.id)) + '</b></p></div></div>' +
    '<div class="card"><h3>Regras desta semana</h3><table style="width:100%"><tbody>' + regras + '</tbody></table><div class="tiny muted" style="margin-top:6px">Se mais de uma regra disparar, vale a mais protetora: descarga, depois fila de revisão, depois prazo.</div></div></div><div class="sp"></div>' +
    '<div class="card"><h3>Registro de ajustes</h3>' + log + '</div>');
}
VIEWS.ciclo = vCiclo;

Object.assign(window.ACT_EXTRA = window.ACT_EXTRA || {}, {
  rotday: el => { UI.rday = el.dataset.v; if (route() !== 'rotina') location.hash = '#/rotina'; else render(); },
  rotst: el => { const d = el.dataset.d, id = el.dataset.id, v = el.dataset.v, r = rotReg(d, id) || {}; rotSet(d, id, { s: r.s === v ? null : v, ok: false }); render(); },
  rotenergia: el => { const d = el.dataset.d, id = el.dataset.id, v = +el.dataset.v, r = rotReg(d, id) || {}; rotSet(d, id, { e: r.e === v ? null : v }); render(); },
  rotok: el => { rotSet(el.dataset.d, el.dataset.id, { ok: true }); render(); },
  cicloaceita: () => { const c = ensureCiclo(); if (c.pend) { cicloAplicar(c.pend, false); toast('Semana ajustada'); render(); } },
  ciclorecusa: () => { const c = ensureCiclo(); c.pend = null; touch(); toast('Mantido o ciclo padrão'); render(); },
  ciclodesfaz: el => { cicloDesfazer(el.dataset.id); toast('Ajuste desfeito'); render(); },
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.chg;
  if (k === 'cicloAuto') { state.settings.cicloAuto = el.checked; touch(); render(); }
  else if (k === 'nivelAutoOn') { state.settings.nivelAuto = el.checked; touch(); render(); }
});

/* avisos na Recepção */
(function () {
  const orig = pendencias;
  pendencias = function () {
    const out = orig(), c = ensureCiclo();
    if (c.pend) out.unshift({ k: 'warn', t: 'Proposta para a próxima semana: ' + TIPOS_SEM[c.pend.tipo][0], d: c.pend.motivos[0], go: '#/ciclo' });
    const cf = corFila().fila.filter(x => !x.onde && !CORTE[x.p.b.cat]);
    if (cf.length) out.push({ k: 'bad', t: cf.length + ' bloco(s) essenciais pulados sem coringa livre', d: 'Encaixe antes de a semana virar.', go: '#/rotina' });
    return out;
  };
})();
