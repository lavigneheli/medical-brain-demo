/* Medical Brain · Helen — núcleo: utilitários, armazenamento, saúde das habilidades */
const S = window.SEED;
const VITALS = [
  ['biblia', 'Bíblia (40 min)'], ['leitura', 'Leitura (30 min)'], ['sono', 'Sono de 9 h'], ['treino', 'Treino'],
  ['anki', 'Anki'], ['drill', 'Drill do dia'], ['estudo', 'Bloco de estudo'],
];
const WEEK_MANUAL = [['mb', 'Aulas MB Comunidade'], ['treino', 'Treinos físicos'], ['apg', 'Preparações de APG']];
const PROVA_TIPOS = ['IESC 4', 'HAM Adulto', 'HAM Pediátrico', 'SOI IV', 'APG', 'Simulado externo', 'Outra'];
const CASO_TIPOS = [['plantao', 'Plantão da patologia'], ['retorno', 'Retorno (revisão)'], ['fragmentado', 'Caso fragmentado'], ['completo', 'Caso completo']];
const casoLabel = t => (CASO_TIPOS.find(x => x[0] === t) || [0, t])[1];
const ANKI_TIPOS = ['Cloze padrão', 'Modo Fármaco', 'Mapa de Captura', 'Cards de erro', 'Mini-casos'];
const PAT_SKILLS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C12'];
const SEMIO_SKILLS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'C2'];
/* cenário de atendimento: variável [CENÁRIO] presente em todos os prompts */
const CENARIO_PADRAO = 'ESF/UBS e pronto-atendimento no interior de Pernambuco';
const CENARIOS = [CENARIO_PADRAO, 'ESF/UBS (atenção primária)', 'UPA / pronto-atendimento', 'Pronto-socorro hospitalar', 'Enfermaria de clínica médica', 'Enfermaria pediátrica', 'Maternidade / alojamento conjunto', 'Puericultura na UBS', 'Ambulatório de especialidade', 'Visita domiciliar', 'Estação de prova prática (OSCE)'];
/* nível do caso clínico: variável [NÍVEL] presente em todos os prompts */
const NIVEIS_CASO = [
  { id: 'basico', nome: 'Básico (fixação)', desc: 'caso típico, com os sinais clássicos e poucos dados de ruído; uma decisão por etapa; dicas permitidas após o erro; sem apresentação atípica. Serve para fixar o essencial e a sequência do raciocínio.' },
  { id: 'medio', nome: 'Médio (estudante de medicina de alto nível)', desc: 'padrão das provas de HAM e SOI: caso realista, com dados de ruído, um diferencial plausível, um ponto de virada, decisões encadeadas e uso de critérios e escores; apresentação típica na maior parte das vezes, sem doenças raras.' },
  { id: 'avancado', nome: 'Avançado (interno)', desc: 'apresentação atípica em parte dos casos, comorbidades e polifarmácia, 2 a 3 diferenciais próximos, exames discordantes, decisões sob incerteza e priorização de riscos, com interação entre problemas.' },
  { id: 'desafio', nome: 'Desafio (início de residência)', desc: 'casos complexos com vários problemas simultâneos, dados conflitantes, raciocínio probabilístico explícito, decisões de risco e benefício e discussão de evidência; cobrança de justificativa em cada passo.' },
];
const nivelAtual = () => NIVEIS_CASO.find(n => n.id === ((typeof state !== 'undefined' && state.settings && state.settings.nivel) || 'medio')) || NIVEIS_CASO[1];
const nivelCurto = id => { const n = NIVEIS_CASO.find(x => x.id === id); return n ? n.nome.split(' (')[0] : ''; };
const nivelTexto = () => { const n = nivelAtual(); return n.nome + ' — ' + n.desc; };
/* treino misto: habilidades escolhidas entram no prompt pela variável [HABILIDADES] */
const MIX_PRESETS = [
  ['Plantão clínico', ['C1', 'C2', 'C3', 'C5', 'C8', 'C9']],
  ['Raciocínio e diagnóstico', ['S4', 'C4', 'C7', 'S5', 'C19']],
  ['Conduta e destino', ['C5', 'C18', 'C8', 'C9', 'C10']],
  ['Do exame à fisiopatologia', ['C2', 'H5', 'S6', 'C4']],
  ['Registro e prescrição', ['S2', 'S3', 'C9']],
  ['Exames complementares', ['C6', 'C22', 'C20', 'C21', 'C7']],
];
const mixIds = () => ((typeof state !== 'undefined' && state.settings && state.settings.mix) || []).filter(id => skillById(id));
function mixText() {
  const ids = mixIds();
  if (!ids.length) return '(nenhuma escolhida: sorteie de 4 a 6 habilidades que combinem com esta patologia, diga quais são antes de começar e siga a ordem clínica)';
  return ids.map(id => { const s = skillById(id), d = drillById(id); return '- ' + id + ' · ' + s.nome + ': ' + (d ? d.objetivo + ' Entrega: ' + d.entrega : s.treino); }).join('\n');
}
const cenarioAtual = () => ((typeof state !== 'undefined' && state.settings && state.settings.cenario) || CENARIO_PADRAO);

/* ---------- utilitários ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const todayISO = () => iso(new Date());
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const DOW = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDate = s => { if (!s) return '—'; const d = parseISO(s); return DOW[d.getDay()].slice(0, 3) + ', ' + pad(d.getDate()) + ' ' + MES[d.getMonth()]; };
const fmtShort = s => { if (!s) return '—'; const d = parseISO(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
const fmtLong = s => { const d = parseISO(s); return DOW[d.getDay()] + ', ' + d.getDate() + ' de ' + MESL[d.getMonth()]; };
function isoWeek(s) {
  const d = parseISO(s); d.setHours(12); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  const w = 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return { y: d.getFullYear(), w, key: d.getFullYear() + '-W' + pad(w) };
}
const weekStart = s => { const d = parseISO(s); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return iso(d); };
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

/* ---------- estado e armazenamento ---------- */
const DEF = () => ({
  v: 2, daily: {}, agendaDone: {}, treinos: [], casos: [], anki: [], provasRes: [], pats: {}, prompts: null,
  weekly: {}, pesq: {}, notas: {}, settings: { theme: 'light', nome: 'Aluna Demo', cenario: '', nivel: 'medio', mix: [] }, sync: { lastChat: '', nota: '' },
});
let state = DEF();
const Store = {
  mode: 'local', saving: null, lastSave: null, stamp: 0, dirty: false, error: false, retry: null, rescued: false,
  normalize(loaded) {
    const s = Object.assign(DEF(), loaded || {});
    s.settings = Object.assign(DEF().settings, s.settings || {});
    s.sync = Object.assign(DEF().sync, s.sync || {});
    ['treinos', 'casos', 'anki', 'provasRes'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
    // H1, H2, H3, H4 e H6 viraram os drills C13 a C17: converte registros antigos
    const H2C = { H1: 'C13', H2: 'C14', H3: 'C15', H4: 'C16', H6: 'C17' };
    s.treinos.forEach(t => { if (H2C[t.skill]) t.skill = H2C[t.skill]; });
    s.casos.forEach(c => { Object.keys(c.por || {}).forEach(k => { if (H2C[k]) { c.por[H2C[k]] = c.por[k]; delete c.por[k]; } }); });
    if (Array.isArray(s.prompts)) {
      // prompts do seed são atualizados quando a versão sobe (exceto os que a Helen editou); os criados por ela ficam intactos
      const seedIds = new Set(S.prompts.map(p => p.id));
      s.prompts = s.prompts.filter(p => p.custom || p.edited || seedIds.has(p.id));
      const byId = new Map(s.prompts.map(p => [p.id, p]));
      S.prompts.forEach(sp => {
        const cur = byId.get(sp.id), cl = JSON.parse(JSON.stringify(sp));
        if (!cur) s.prompts.push(cl);
        else if (!cur.custom && !cur.edited && (cur.v || 0) < (sp.v || 0)) Object.assign(cur, cl, { fav: cur.fav });
      });
    }
    return s;
  },
  async load() {
    let loaded = null;
    try {
      const r = await fetch('/api/state', { cache: 'no-store' });
      if (r.ok) { loaded = await r.json(); this.mode = 'server'; this.stamp = +r.headers.get('X-Stamp') || 0; }
    } catch (e) { this.mode = 'local'; }
    let local = null; try { local = JSON.parse(localStorage.getItem('mbh_state') || 'null'); } catch (e) { }
    if (this.mode === 'local') loaded = local;
    else if ((!loaded || !Object.keys(loaded).length) && local && Object.keys(local).length) { loaded = local; this.rescued = true; } // banco vazio: recupera o que estava salvo neste navegador
    state = this.normalize(loaded);
    if (this.rescued) { this.dirty = true; setTimeout(() => this.flush(), 200); }
  },
  save() {
    this.dirty = true;
    clearTimeout(this.saving);
    this.saving = setTimeout(() => this.flush(), 150);
    try { localStorage.setItem('mbh_state', JSON.stringify(state)); } catch (e) { }
  },
  async flush() {
    if (this.mode !== 'server') { this.dirty = false; this.lastSave = new Date(); updateStatus(); return; }
    try {
      const r = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Base-Stamp': String(this.stamp) }, body: JSON.stringify(state) });
      if (r.status === 409) {
        // o arquivo foi alterado por fora (ex.: Claude registrou algo): une os registros e salva de novo
        const cur = await r.json();
        state = this.merge(this.normalize(cur.state), state);
        this.stamp = cur.stamp;
        this.dirty = true;
        return this.flush();
      }
      const j = await r.json();
      if (j.ok) { this.stamp = j.stamp; this.dirty = false; this.error = false; this.lastSave = new Date(); } else { this.error = true; this.scheduleRetry(); }
    } catch (e) { this.error = true; this.scheduleRetry(); }
    updateStatus();
  },
  scheduleRetry() { clearTimeout(this.retry); this.retry = setTimeout(() => this.flush(), 4000); },
  merge(server, local) {
    const out = server;
    ['treinos', 'casos', 'anki', 'provasRes'].forEach(k => {
      const ids = new Set(out[k].map(x => x.id));
      local[k].forEach(x => { if (!ids.has(x.id)) out[k].push(x); });
    });
    ['daily', 'agendaDone', 'weekly', 'pesq', 'pats', 'notas'].forEach(k => { out[k] = Object.assign({}, out[k], local[k]); });
    ['rotina', 'ciclo', 'cur'].forEach(k => { if (local[k] && !out[k]) out[k] = local[k]; });
    if (local.rotina && out.rotina) out.rotina.reg = Object.assign({}, out.rotina.reg, local.rotina.reg);
    if (local.prompts && !out.prompts) out.prompts = local.prompts;
    return out;
  },
  // verifica se o arquivo mudou por fora (Claude registrou algo) e recarrega
  async poll() {
    if (this.mode !== 'server' || this.dirty) return false;
    try {
      const r = await fetch('/api/stamp', { cache: 'no-store' });
      const j = await r.json();
      if (j.stamp && j.stamp !== this.stamp) {
        const rr = await fetch('/api/state', { cache: 'no-store' });
        state = this.normalize(await rr.json());
        this.stamp = +rr.headers.get('X-Stamp') || j.stamp;
        return true;
      }
    } catch (e) { }
    return false;
  },
};
const touch = () => Store.save();

/* ---------- acessos de dados ---------- */
const day = d => (state.daily[d] = state.daily[d] || { blocks: {}, vitals: {}, note: '' });
const getPrompts = () => state.prompts || S.prompts;
const ensurePrompts = () => { if (!state.prompts) state.prompts = JSON.parse(JSON.stringify(S.prompts)); return state.prompts; };
const patState = id => (state.pats[id] = state.pats[id] || { note: '', rev: '' });
const skillById = id => S.skills.find(s => s.id === id);
const drillById = id => S.drills.find(d => d.id === id);
const semioById = id => (S.semio || []).find(p => p.id === id);
const isSemio = id => !!semioById(id);
const patById = id => S.pats.find(p => p.id === id) || semioById(id);
const patName = id => { const p = patById(id); return p ? p.nome : ''; };
const origemTxt = o => o === 'chat' ? 'via Claude' : 'no painel';

/* ---------- registros ---------- */
function addTreino(r) { const x = Object.assign({ id: uid(), date: todayISO(), skill: '', pat: '', score: null, nota: '', nivel: nivelAtual().id, origem: 'painel' }, r); state.treinos.push(x); touch(); return x; }
function addCaso(r) { const x = Object.assign({ id: uid(), date: todayISO(), tipo: 'completo', pat: '', score: null, por: {}, nota: '', nivel: nivelAtual().id, origem: 'painel' }, r); state.casos.push(x); touch(); return x; }
function addAnki(r) { const x = Object.assign({ id: uid(), date: todayISO(), pat: '', topico: '', cards: 0, tipo: 'Cloze padrão', tags: '', nota: '', origem: 'painel' }, r); state.anki.push(x); touch(); return x; }
function addProva(r) { const x = Object.assign({ id: uid(), date: todayISO(), prova: '', score: null, nota: '', origem: 'painel' }, r); state.provasRes.push(x); touch(); return x; }
function removeReg(kind, id) { state[kind] = state[kind].filter(x => x.id !== id); touch(); }

/* tentativas de uma habilidade: drills/treinos + notas por eixo de casos completos */
function attemptsFor(id) {
  const out = state.treinos.filter(l => l.skill === id && l.score != null).map(l => ({ date: l.date, score: +l.score, pat: l.pat, src: 'treino' }));
  state.casos.forEach(c => { if (c.por && c.por[id] != null && c.por[id] !== '') out.push({ date: c.date, score: +c.por[id], pat: c.pat, src: 'caso' }); });
  return out.sort(byDate);
}
const cadOf = id => { const d = drillById(id); return d && d.cad ? d.cad : 10; };

/* ---------- saúde (desempenho + ritmo) ---------- */
function healthOf(id) {
  const cad = cadOf(id);
  const at = attemptsFor(id);
  if (!at.length) return { id, n: 0, status: 'sem', label: 'Sem treino registrado', health: null, perf: null, rhythm: 0, cad, since: null, trend: 0, dominio: false };
  const last = at.slice(-5);
  let ws = 0, tot = 0; last.forEach((a, i) => { ws += (i + 1); tot += a.score * (i + 1); });
  const perf = tot / ws;
  const since = daysBetween(at[at.length - 1].date, todayISO());
  const rec = since <= cad ? 100 : Math.max(0, 100 - (since - cad) / cad * 100);
  const cutoff = addDays(todayISO(), -28);
  const cnt = at.filter(a => a.date >= cutoff).length;
  const freq = Math.min(1, cnt / (28 / cad)) * 100;
  const rhythm = 0.6 * rec + 0.4 * freq;
  const health = Math.round(0.6 * perf + 0.4 * rhythm);
  let trend = 0;
  if (at.length >= 4) { const a = avg(at.slice(-3).map(x => x.score)), b = avg(at.slice(-6, -3).map(x => x.score)); trend = a - b; }
  const status = health >= 75 ? 'ok' : health >= 50 ? 'warn' : 'bad';
  const label = { ok: 'Saudável', warn: 'Atenção', bad: 'Crítico' }[status];
  const dominio = at.length >= 2 && at.slice(-2).every(a => a.score >= 80);
  return { id, n: at.length, status, label, health, perf: Math.round(perf), rhythm: Math.round(rhythm), cad, since, trend: Math.round(trend), last: at[at.length - 1], dominio };
}
function healthAll() {
  const hs = S.skills.map(s => healthOf(s.id));
  const withData = hs.filter(h => h.health != null);
  return { items: hs, geral: withData.length ? Math.round(avg(withData.map(h => h.health))) : null, comDados: withData.length, total: hs.length };
}
const statusOf = v => v == null ? 'sem' : v >= 75 ? 'ok' : v >= 50 ? 'warn' : 'bad';

/* ---------- prontuário por patologia ---------- */
function patStats(id) {
  const cells = {}; let last = '', n = 0;
  const feed = (sk, date, score) => { if (score == null || score === '') return; const c = cells[sk]; if (!c || date >= c.date) cells[sk] = { date, score: +score }; };
  state.treinos.filter(t => t.pat === id).forEach(t => { n++; if (t.date > last) last = t.date; feed(t.skill, t.date, t.score); });
  state.casos.filter(c => c.pat === id).forEach(c => { n++; if (c.date > last) last = c.date; Object.keys(c.por || {}).forEach(k => feed(k, c.date, c.por[k])); });
  const ak = state.anki.filter(a => a.pat === id);
  const cards = ak.reduce((s, a) => s + (+a.cards || 0), 0);
  const akLast = ak.reduce((m, a) => a.date > m ? a.date : m, '');
  const sc = Object.values(cells).map(c => c.score);
  return { cells, last, n, cards, lotes: ak.length, akLast, media: sc.length ? Math.round(avg(sc)) : null };
}

/* ---------- rotina / rodízio ---------- */
function drillDoDia(dateStr) {
  const d = parseISO(dateStr).getDay();
  const par = isoWeek(dateStr).w % 2 === 0;
  return (par ? S.rodizio.par : S.rodizio.impar)[d];
}
function weekKeyStart(wkey) {
  const [y, n] = wkey.split('-W').map(Number); const j = new Date(y, 0, 4); const dd = new Date(j);
  dd.setDate(j.getDate() - ((j.getDay() + 6) % 7) + (n - 1) * 7); return iso(dd);
}
function weekCounts(wkey) {
  const w = state.weekly[wkey] || {};
  const start = weekKeyStart(wkey), end = addDays(start, 6);
  const inW = d => d >= start && d <= end;
  const tr = state.treinos.filter(l => inW(l.date));
  return {
    start, end, drills: tr.filter(l => l.skill[0] === 'C').length, semio: tr.filter(l => l.skill[0] === 'S').length, hskills: tr.filter(l => l.skill[0] === 'H').length,
    frag: state.casos.filter(c => inW(c.date) && (c.tipo === 'fragmentado' || c.tipo === 'plantao')).length,
    retornos: state.casos.filter(c => inW(c.date) && c.tipo === 'retorno').length,
    caso: state.casos.filter(c => inW(c.date) && c.tipo === 'completo').length,
    anki: state.anki.filter(a => inW(a.date)).reduce((s, a) => s + (+a.cards || 0), 0),
    lotes: state.anki.filter(a => inW(a.date)).length,
    mb: w.mb || 0, treino: w.treino || 0, apg: w.apg || 0,
  };
}
function progressDia(dateStr) {
  const bl = S.rotina[parseISO(dateStr).getDay()] || [];
  const dd = state.daily[dateStr];
  const done = bl.filter(b => dd && dd.blocks[b.id]).length;
  return { done, total: bl.length, pct: bl.length ? Math.round(done / bl.length * 100) : 0 };
}
function proximaProva() {
  const t = todayISO();
  const p = S.provas.filter(x => x.d >= t).sort((a, b) => a.d < b.d ? -1 : 1)[0];
  return p ? Object.assign({ dias: daysBetween(t, p.d) }, p) : null;
}
function ankiPendentes() {
  // patologias sem nenhum lote no Anki, SOI IV primeiro (próxima prova)
  const t = todayISO();
  return S.pats.filter(p => patStats(p.id).cards === 0).sort((a, b) => (a.periodo === 'SOI IV' ? 0 : 1) - (b.periodo === 'SOI IV' ? 0 : 1)).map(p => Object.assign({ prova: p.periodo === 'SOI IV' && t <= '2026-11-05' }, p));
}
function pendencias() {
  const out = []; const t = todayISO();
  const hs = healthAll();
  hs.items.forEach(h => {
    if (h.health != null && h.status !== 'ok') out.push({ k: 'skill', t: 'Reforçar ' + h.id + ' · ' + skillById(h.id).nome, d: 'Saúde ' + h.health + '% (' + h.label + '): desempenho ' + h.perf + '%, ritmo ' + h.rhythm + '%', go: '#/enfermaria' });
  });
  S.skills.filter(s => s.id[0] === 'H').forEach(s => {
    const h = healthOf(s.id);
    if (h.n && !h.dominio && h.last && h.last.score < 80) out.push({ k: 'h', t: s.id + ' abaixo da meta de 80%', d: 'Última nota ' + h.last.score + '%. Domínio = 2 tentativas seguidas ≥ 80%.', go: '#/enfermaria' });
  });
  const sem = hs.items.filter(h => h.n === 0 && h.id[0] === 'C');
  if (sem.length) out.push({ k: 'skill', t: sem.length + ' drills ainda sem registro', d: sem.map(x => x.id).join(', '), go: '#/enfermaria' });
  const semS = hs.items.filter(h => h.n === 0 && h.id[0] === 'S');
  if (semS.length) out.push({ k: 'skill', t: semS.length + ' habilidades de semiologia (S) sem registro', d: semS.map(x => x.id).join(', '), go: '#/enfermaria' });
  const atr = retornosDevidos().filter(x => x.atraso > 0);
  if (atr.length) out.push({ k: 'bad', t: atr.length + ' retorno(s) de patologia em atraso', d: atr.slice(0, 3).map(x => x.pat.nome + ' (+' + x.step + ')').join(', ') + (atr.length > 3 ? '…' : ''), go: '#/plantoes' });
  const semAnki = S.pats.filter(p => p.periodo === 'SOI IV' && patStats(p.id).cards === 0);
  if (semAnki.length && t <= '2026-11-05') out.push({ k: 'anki', t: semAnki.length + ' patologias do SOI IV sem lote no Anki', d: semAnki.slice(0, 3).map(p => p.nome).join(', ') + (semAnki.length > 3 ? '…' : ''), go: '#/anki' });
  const old = S.pats.filter(p => { const st = patStats(p.id); return st.last && daysBetween(st.last, t) > 30; });
  if (old.length) out.push({ k: 'pat', t: old.length + ' patologias sem revisão há mais de 30 dias', d: old.slice(0, 3).map(p => p.nome).join(', ') + (old.length > 3 ? '…' : ''), go: '#/prontuarios' });
  if (typeof notasAlertas === 'function') notasAlertas().forEach(a => out.unshift(a));
  return out;
}

/* linha do tempo unificada de registros */
function timeline() {
  const L = [];
  state.treinos.forEach(r => L.push({ id: r.id, kind: 'treinos', date: r.date, tipo: 'Treino', titulo: r.skill + ' · ' + (skillById(r.skill) ? skillById(r.skill).nome : ''), pat: r.pat, score: r.score, nota: r.nota, origem: r.origem, nivel: r.nivel }));
  state.casos.forEach(r => L.push({ id: r.id, kind: 'casos', date: r.date, tipo: 'Caso', titulo: casoLabel(r.tipo), pat: r.pat, score: r.score, nota: r.nota, origem: r.origem, nivel: r.nivel }));
  state.anki.forEach(r => L.push({ id: r.id, kind: 'anki', date: r.date, tipo: 'Anki', titulo: r.cards + ' cards · ' + r.tipo + (r.topico ? ' · ' + r.topico : ''), pat: r.pat, score: null, nota: r.nota, origem: r.origem }));
  state.provasRes.forEach(r => L.push({ id: r.id, kind: 'provasRes', date: r.date, tipo: 'Prova', titulo: r.prova, pat: '', score: r.score, nota: r.nota, origem: r.origem }));
  return L.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
}

/* prompt preenchido com a patologia */
function fillPrompt(corpo, patId) {
  corpo = corpo.replace(/\[CENÁRIO\]/g, cenarioAtual()).replace(/\[HABILIDADES\]/g, () => mixText()).replace(/\[NÍVEL\]/g, () => nivelTexto());
  const p = patById(patId);
  if (!p) return corpo;
  return corpo.replace(/\[PATOLOGIA[^\]]*\]/g, p.nome).replace(/\[SISTEMA\]/g, p.sistema).replace(/\[X\]/g, p.nome).replace(/\[DIAGNÓSTICO INFECCIOSO\]/g, p.nome);
}
const withFooter = t => t + S.footer;

/* resumo de status para colar no chat */
function resumoTexto() {
  const hs = healthAll(); const wk = weekCounts(isoWeek(todayISO()).key); const pr = proximaProva();
  const L = ['MEDICAL BRAIN HELEN · resumo de ' + todayISO(), ''];
  L.push('Saúde geral: ' + (hs.geral == null ? 'sem dados' : hs.geral + '%') + ' (' + hs.comDados + '/' + hs.total + ' habilidades com registro)');
  if (pr) L.push('Próxima prova: ' + pr.n + ' em ' + pr.dias + ' dia(s)');
  L.push('Semana: ' + wk.drills + '/' + S.meta.drills + ' drills, ' + wk.frag + ' fragmentado, ' + wk.caso + ' completo, ' + wk.anki + ' cards no Anki');
  L.push('', 'Habilidades:');
  hs.items.forEach(h => L.push('- ' + h.id + ' ' + (h.health == null ? 'sem dados' : h.health + '% ' + h.label + ' (desempenho ' + h.perf + '%, ritmo ' + h.rhythm + '%, último há ' + h.since + 'd)')));
  const pd = pendencias(); if (pd.length) { L.push('', 'Pendências:'); pd.forEach(p => L.push('- ' + p.t)); }
  return L.join('\n');
}

/* ---------- plantão por patologia: internações, retornos e ronda ---------- */
function internacoes() {
  const RS = S.plantao.retornos, out = [];
  S.pats.forEach(p => {
    const pl = state.casos.filter(c => c.pat === p.id && c.tipo === 'plantao').sort(byDate);
    if (!pl.length) return;
    const P = pl[0].date;
    const rets = state.casos.filter(c => c.pat === p.id && c.tipo === 'retorno' && c.date > P).sort(byDate);
    let i = 0, due = addDays(P, RS[0]);
    rets.forEach(r => {
      if (i >= RS.length) return;
      if (r.score != null && +r.score < 70) due = addDays(r.date, 3);
      else { i++; due = i < RS.length ? addDays(P, RS[i]) : ''; }
    });
    const completo = i >= RS.length;
    out.push({ pat: p, plantao: P, i, step: completo ? null : RS[i], due: completo ? '' : due, completo, retornos: rets.length, atraso: completo ? 0 : daysBetween(due, todayISO()), media: patStats(p.id).media });
  });
  return out;
}
function retornosDevidos() {
  return internacoes().filter(x => !x.completo && x.due <= todayISO()).sort((a, b) => (a.pat.periodo === 'SOI IV' ? 0 : 1) - (b.pat.periodo === 'SOI IV' ? 0 : 1) || (a.due < b.due ? -1 : 1));
}
function proximosRetornos() { return internacoes().filter(x => !x.completo && x.due > todayISO()).sort((a, b) => a.due < b.due ? -1 : 1); }
function rondaSOI3(n) {
  const t = todayISO();
  return S.pats.filter(p => p.periodo === 'SOI III').map(p => ({ p, st: patStats(p.id) })).filter(x => x.st.last !== t)
    .sort((a, b) => (a.st.last || '').localeCompare(b.st.last || '') || ((a.st.media == null ? -1 : a.st.media) - (b.st.media == null ? -1 : b.st.media)))
    .slice(0, n || 1).map(x => x.p);
}
function patDoDia(d) {
  const feitos = new Set(state.casos.filter(c => c.tipo === 'plantao').map(c => c.pat));
  const doDia = [];
  S.agenda.filter(a => a.d === d && a.pats).forEach(a => a.pats.forEach(id => { if (!doDia.includes(id)) doDia.push(id); }));
  if (doDia.length) return { origem: 'agenda', pats: doDia.map(patById), feitos };
  // fila: patologias do SOI IV ainda sem plantão, na ordem em que aparecem na agenda, depois o resto
  const ordem = []; S.agenda.forEach(a => (a.pats || []).forEach(id => { if (!ordem.includes(id)) ordem.push(id); }));
  const iv = S.pats.filter(p => p.periodo === 'SOI IV' && !feitos.has(p.id));
  iv.sort((a, b) => { const x = ordem.indexOf(a.id), y = ordem.indexOf(b.id); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y); });
  return { origem: 'fila', pats: iv.slice(0, 1), feitos };
}
function plantaoPromptText(patId, id) {
  const p = getPrompts().find(x => x.id === id); return p ? fillPrompt(p.corpo, patId) : '';
}

/* salva de imediato ao fechar/trocar de aba, mesmo com alteração pendente */
function flushNow() {
  if (Store.mode !== 'server' || !Store.dirty) return;
  try { fetch('/api/state', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Base-Stamp': String(Store.stamp) }, body: JSON.stringify(state) }); } catch (e) { }
}
window.addEventListener('pagehide', flushNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
