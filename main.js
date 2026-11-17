/* Medical Brain · Helen — roteador, eventos e inicialização */
const NAV = [
  ['hoje', 'Hoje', 'target'], ['recepcao', 'Recepção', 'home'], ['plantao', 'Plantão de hoje', 'clock'], ['rotina', 'Rotina da semana', 'cal'], ['ciclo', 'Ciclo do mês', 'pulse'], ['provas', 'Agenda de provas', 'cal'],
  ['--', 'Clínica'],
  ['plantoes', 'Plantão por patologia', 'case'], ['enfermaria', 'Enfermaria de habilidades', 'pulse'], ['prontuarios', 'Prontuários', 'folder'], ['casos', 'Centro de casos', 'cards2'], ['prompts', 'Farmácia de prompts', 'pill'],
  ['--', 'Acompanhamento'],
  ['curriculo', 'Currículo e horas', 'folder'], ['editais', 'Pontuação por edital', 'grade'], ['notas', 'Notas e aprovação', 'grade'], ['evolucao', 'Evolução', 'chart'], ['anki', 'Anki', 'cards'], ['pesquisa', 'Pesquisa', 'flask'], ['config', 'Configurações', 'gear'],
];
const route = () => (location.hash.replace(/^#\/?/, '') || 'hoje').split('/')[0];

function renderSide() {
  const cur = route(), np = pendencias().length;
  document.getElementById('side').innerHTML = '<div class="brand"><div class="cross"><svg viewBox="0 0 24 24"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/></svg></div><div><b>Medical Brain</b><span>Hospital de estudos · Helen</span></div></div>' +
    NAV.map(n => n[0] === '--' ? '<div class="nav-sec">' + n[1] + '</div>' : '<a class="nav' + (cur === n[0] ? ' on' : '') + '" href="#/' + n[0] + '">' + ico(n[2]) + '<span>' + n[1] + '</span>' + (n[0] === 'recepcao' && np ? '<i class="cnt" style="font-style:normal">' + np + '</i>' : '') + '</a>').join('') +
    '<div class="sync" id="syncst"></div>';
  updateStatus();
}
function updateStatus() {
  const el = document.getElementById('syncst'); if (!el) return;
  const srv = Store.mode === 'server';
  const cls = Store.error ? 'bad' : (srv ? 'ok' : 'warn');
  const txt = Store.error ? 'NÃO SALVO: tentando de novo…' : srv ? (Store.dirty ? 'Salvando…' : 'Salvo no banco' + (Store.lastSave ? ' às ' + Store.lastSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')) : 'Sem servidor: nada vai para o banco';
  el.innerHTML = '<span class="dot ' + cls + '"></span><span>' + txt + '</span>';
  let b = document.getElementById('banner');
  if (!srv || Store.error) {
    if (!b) { b = document.createElement('div'); b.id = 'banner'; b.className = 'callout warn'; b.style.cssText = 'position:sticky;top:0;z-index:40;margin:-26px -32px 16px;border-radius:0'; document.getElementById('main').prepend(b); }
    b.innerHTML = !srv ? '<b>Esta página não está ligada ao banco de dados.</b> O que você marcar aqui <u>não é guardado</u>. Abra o painel por <b>http://localhost:3939</b> (atalho "Medical Brain Helen" na área de trabalho).' : '<b>Não consegui gravar no banco.</b> Verifique se o painel está ligado (instalar-inicio-automatico.bat). Vou tentar de novo sozinho.';
  } else if (b) b.remove();
  const ls = document.getElementById('lastsave'); if (ls && Store.lastSave) ls.textContent = Store.lastSave.toLocaleTimeString('pt-BR');
}
function mixRefresh() {
  const b = document.getElementById('mixbox');
  if (b && document.getElementById('usetxt')) { b.innerHTML = mixBoxHtml(); updateUse(); } else render();
}
function render() {
  const a = document.activeElement; const fid = a && a.id && ['pq', 'pqin'].includes(a.id) ? a.id : null; const sel = fid ? a.selectionStart : 0;
  const v = VIEWS[route()] || VIEWS.recepcao; const sc = window.scrollY;
  document.getElementById('main').innerHTML = v();
  document.body.classList.toggle('dark', state.settings.theme === 'dark');
  renderSide();
  window.scrollTo(0, sc);
  updateStatus();
  if (fid) { const e = document.getElementById(fid); if (e) { e.focus(); try { e.setSelectionRange(sel, sel); } catch (x) { } } }
}

/* ---------- ações por clique ---------- */
const ACT = {
  close: () => closeModal(),
  reg: el => { const d = el.dataset; openRegistrar(d.k, { skill: d.skill, pat: d.pat, date: d.date, topico: d.topico, tipo: d.tipo }); },
  'reg-tab': el => openRegistrar(el.dataset.k),
  'reg-save': () => saveRegistro(),
  pday: el => { UI.pday = el.dataset.v; render(); },
  ficha: el => openFicha(el.dataset.id),
  pat: (el, e) => { e.preventDefault(); openPat(el.dataset.id); },
  copyprompt: el => { const p = promptForSkill(el.dataset.sk); if (p) copyText(withFooter(fillPrompt(p.corpo, ''))); },
  copysrc: el => copyText(document.getElementById(el.dataset.src).textContent),
  copyresumo: () => copyText(resumoTexto()),
  use: el => openUse(el.dataset.id),
  del: el => { if (confirm('Excluir este registro?')) { removeReg(el.dataset.kind, el.dataset.id); render(); if (modalOpen()) closeModal(); } },
  mixtog: el => {
    const s = (state.settings.mix = (state.settings.mix || []).slice()), id = el.dataset.id, i = s.indexOf(id);
    if (i >= 0) s.splice(i, 1); else s.push(id);
    touch(); mixRefresh();
  },
  mixpre: el => { state.settings.mix = el.dataset.ids ? el.dataset.ids.split(',') : []; touch(); mixRefresh(); },
  paba: el => { UI.pron.aba = el.dataset.v; UI.pron.q = ''; render(); },
  pfilt: el => { UI.pron[el.dataset.k] = el.dataset.v; render(); },
  pcat: el => { UI.pcat = el.dataset.v; render(); },
  pfav: el => { const p = ensurePrompts().find(x => x.id === el.dataset.id); p.fav = !p.fav; touch(); render(); },
  pedit: el => openPEdit(el.dataset.id),
  pnew: () => openPEdit(''),
  psave: el => {
    const o = readForm(document.querySelector('.modal')); if (!o.titulo.trim() || !o.corpo.trim()) return toast('Preencha título e texto');
    const tags = o.tags.split(',').map(x => x.trim()).filter(Boolean); const P = ensurePrompts();
    if (el.dataset.id) { Object.assign(P.find(x => x.id === el.dataset.id), { titulo: o.titulo, cat: o.cat || 'Meus prompts', tags, corpo: o.corpo, edited: true }); }
    else P.push({ id: 'u' + uid(), titulo: o.titulo, cat: o.cat || 'Meus prompts', tags, corpo: o.corpo, fav: false, custom: true });
    touch(); closeModal(); toast('Prompt salvo'); render();
  },
  pdel: el => { if (confirm('Excluir este prompt?')) { state.prompts = ensurePrompts().filter(x => x.id !== el.dataset.id); touch(); render(); } },
  resetprompts: () => { if (confirm('Voltar os prompts originais? Seus prompts novos e edições serão perdidos.')) { state.prompts = null; touch(); toast('Prompts restaurados'); render(); } },
  casoSug: el => { UI.casoPat = el.dataset.id; saveUI(); render(); },
  goCaso: el => { UI.casoPat = el.dataset.id; if (isSemio(el.dataset.id)) UI.casoPrompt = 'sem_trilha'; saveUI(); closeModal(); location.hash = '#/casos'; render(); },
  wk: el => { const k = isoWeek(todayISO()).key; const w = (state.weekly[k] = state.weekly[k] || {}); w[el.dataset.k] = Math.max(0, (w[el.dataset.k] || 0) + (+el.dataset.d)); touch(); render(); },
  evo: el => { UI.evoWeeks = +el.dataset.v; render(); },
  atab: el => { UI.ankiTab = el.dataset.v; render(); },
  theme: () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; touch(); render(); },
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' })); a.download = 'medical-brain-' + todayISO() + '.json'; a.click(); },
};
Object.assign(ACT, window.ACT_EXTRA || {});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) { if (e.target.id === 'ov') closeModal(); return; }
  const f = ACT[el.dataset.act]; if (f) f(el, e);
});

/* ---------- mudanças em campos ---------- */
document.addEventListener('change', e => {
  const el = e.target; const k = el.dataset.chg; if (!k) return;
  const t = todayISO();
  if (k === 'blk') { const d = UI.pday || t; day(d).blocks[el.dataset.id] = el.checked; touch(); render(); }
  else if (k === 'vit') { day(UI.pday || t).vitals[el.dataset.id] = el.checked; touch(); }
  else if (k === 'dnote') { day(UI.pday || t).note = el.value; touch(); }
  else if (k === 'agenda') { state.agendaDone[el.dataset.id] = el.checked; touch(); render(); }
  else if (k === 'pesq') { state.pesq[el.dataset.id] = el.checked; touch(); render(); }
  else if (k === 'patnote') { patState(el.dataset.id).note = el.value; touch(); }
  else if (k === 'plpick') { UI.plPick = el.value; }
  else if (k === 'casoPat') { UI.casoPat = el.value; saveUI(); render(); }
  else if (k === 'casoPrompt') { UI.casoPrompt = el.value; saveUI(); render(); }
  else if (k === 'casoFoot') { UI.casoFoot = el.checked; render(); }
  else if (k === 'nivel') { state.settings.nivel = el.value; touch(); render(); }
  else if (k === 'cenario') { state.settings.cenario = el.value.trim(); touch(); render(); }
  else if (k === 'nome') { state.settings.nome = el.value || 'Aluna Demo'; touch(); renderSide(); }
  else if (k === 'import') {
    const f = el.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { state = Store.normalize(JSON.parse(r.result)); touch(); toast('Dados importados'); render(); } catch (x) { toast('Arquivo inválido'); } };
    r.readAsText(f);
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.inp === 'use') updateUse();
  if (el.dataset.chg === 'casoPat') { UI.casoPat = el.value; saveUI(); render(); }
  if (el.dataset.chg === 'pron-q') { UI.pron.q = el.value; render(); }
  if (el.dataset.chg === 'pq') { UI.pq = el.value; render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOpen()) closeModal(); });
window.addEventListener('hashchange', () => { closeModal(); window.scrollTo(0, 0); render(); });

/* ---------- atualização automática quando o Claude registra algo ---------- */
setInterval(async () => {
  if (modalOpen() || Store.dirty) return;
  const a = document.activeElement; if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return;
  if (await Store.poll()) { render(); toast('Painel atualizado com novos registros'); }
}, 3000);

/* ---------- recarrega a página sozinha quando o painel é atualizado (arquivos novos) ---------- */
let VER = null, PENDING_RELOAD = false;
setInterval(async () => {
  if (Store.mode !== 'server') return;
  try {
    const j = await (await fetch('/api/version', { cache: 'no-store' })).json();
    if (VER == null) { VER = j.v; return; }
    if (j.v !== VER) PENDING_RELOAD = true;
    if (PENDING_RELOAD) {
      const a = document.activeElement; const typing = a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName);
      if (!modalOpen() && !typing && !Store.dirty) { await Store.flush(); location.reload(); }
    }
  } catch (e) { }
}, 2500);

(async function init() {
  await Store.load();
  if (!location.hash) location.hash = '#/hoje';
  render();
})();
