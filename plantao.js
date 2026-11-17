/* Medical Brain · Helen — plantão por patologia (admissão, retornos e ronda) */
function plantaoHojeCard(d) {
  const pd = patDoDia(d), dev = retornosDevidos(), r3 = rondaSOI3(1)[0];
  return '<div class="card"><div class="row"><h3>Plantão por patologia</h3><a class="right small" href="#/plantoes">abrir</a></div>' +
    pd.pats.map(p => '<div class="item"><div class="grow small"><b>' + esc(p.nome) + '</b><div class="tiny muted">' + (pd.origem === 'agenda' ? 'agenda de hoje' : 'próxima da fila do SOI IV') + '</div></div>' + (pd.feitos.has(p.id) ? badge('feito', 'ok') : '<button class="btn sm pri" data-act="plantao" data-id="' + p.id + '">Iniciar</button>') + '</div>').join('') +
    '<div class="small muted" style="margin-top:8px">Retornos devidos: <b>' + dev.length + '</b>' + (r3 ? ' · Ronda SOI III: <b>' + esc(r3.nome) + '</b>' : '') + '</div></div>';
}

function estacoesTabela() {
  const E = S.plantao.estacoes;
  return '<div class="tbl-wrap" style="border:0"><table><thead><tr><th>Estação</th><th class="c">Min</th><th>Drills</th><th>O que faz</th></tr></thead><tbody>' +
    E.map(e => '<tr><td><b>' + esc(e.n) + '</b></td><td class="c">' + e.min + '</td><td>' + e.skills.join(', ') + '</td><td class="small">' + esc(e.o) + '</td></tr>').join('') + '</tbody></table></div>';
}

function vPlantoes() {
  const t = todayISO(), pd = patDoDia(t), dev = retornosDevidos(), prox = proximosRetornos();
  const inter = internacoes().sort((a, b) => a.plantao < b.plantao ? 1 : -1);
  const r4 = dev.find(x => x.pat.periodo === 'SOI IV') || prox.find(x => x.pat.periodo === 'SOI IV'); const r3 = rondaSOI3(2);

  const hoje = '<div class="card"><h3>Patologia de hoje</h3><div class="tiny muted" style="margin-bottom:6px">' + (pd.origem === 'agenda' ? 'Pela agenda do SOI IV' : 'Próxima da fila do SOI IV (sem plantão ainda)') + '</div>' +
    (pd.pats.length ? pd.pats.map(p => '<div class="item"><div class="grow"><b>' + esc(p.nome) + '</b><div class="tiny muted">' + esc(p.sistema) + ' · ' + p.periodo + '</div></div>' + (pd.feitos.has(p.id) ? badge('feito', 'ok') : '') + '<button class="btn sm pri" data-act="plantao" data-id="' + p.id + '">Iniciar plantão</button></div>').join('') : '<div class="empty">Todas as patologias do SOI IV já tiveram plantão.</div>') +
    '<div class="sp8"></div><div class="row"><div class="grow">' + patSelect('', 'x', ' data-chg="plpick"') + '</div><button class="btn" data-act="plpick">Plantão de outra</button></div></div>';

  const devHtml = '<div class="card"><h3>Retornos devidos (' + dev.length + ')</h3>' +
    (dev.length ? dev.map(x => '<div class="item"><div class="grow small"><b>' + esc(x.pat.nome) + '</b><div class="tiny muted">retorno +' + x.step + ' · ' + x.pat.periodo + ' · ' + (x.atraso > 0 ? '<span style="color:var(--bad)">' + x.atraso + ' dia(s) de atraso</span>' : 'vence hoje') + '</div></div><button class="btn sm" data-act="copyp" data-pid="retorno" data-pat="' + x.pat.id + '">Prompt</button><button class="btn sm pri" data-act="retorno" data-id="' + x.pat.id + '">Registrar</button></div>').join('') : '<div class="empty">Nenhum retorno vencendo hoje.</div>') +
    (prox.length ? '<div class="tiny muted" style="margin-top:8px">Próximos: ' + prox.slice(0, 4).map(x => esc(x.pat.nome) + ' (' + fmtShort(x.due) + ', +' + x.step + ')').join(' · ') + '</div>' : '') + '</div>';

  const ronda = '<div class="card"><h3>Ronda de hoje (20 min)</h3>' +
    (r4 ? '<div class="item"><span class="badge pri">SOI IV</span><div class="grow small"><b>' + esc(r4.pat.nome) + '</b><div class="tiny muted">retorno +' + r4.step + ' · ' + (r4.due <= t ? 'devido' : 'em ' + fmtShort(r4.due)) + '</div></div><button class="btn sm pri" data-act="retorno" data-id="' + r4.pat.id + '">Registrar</button></div>' : '<div class="item small muted">Sem retorno do 4º período no momento.</div>') +
    r3.map((p, i) => '<div class="item"><span class="badge">SOI III</span><div class="grow small"><b>' + esc(p.nome) + '</b><div class="tiny muted">' + (i ? 'alternativa' : 'a mais antiga ou mais fraca') + '</div></div><button class="btn sm" data-act="copyp" data-pid="ronda" data-pat="' + p.id + '">Prompt</button><button class="btn sm pri" data-act="reg" data-k="treino" data-skill="C12" data-pat="' + p.id + '">Registrar</button></div>').join('') + '</div>';

  const tab = '<div class="card"><h3>Internações (' + inter.length + ')</h3>' + (inter.length ? '<div class="tbl-wrap" style="border:0"><table><thead><tr><th>Patologia</th><th>Plantão</th><th class="c">Retornos</th><th>Próximo</th><th class="c">Média</th></tr></thead><tbody>' +
    inter.map(x => '<tr class="clk" data-act="pat" data-id="' + x.pat.id + '"><td><b>' + esc(x.pat.nome) + '</b></td><td>' + fmtShort(x.plantao) + '</td><td class="c">' + x.retornos + '</td><td>' + (x.completo ? badge('alta', 'ok') : fmtShort(x.due) + ' (+' + x.step + ')' + (x.atraso > 0 ? ' ' + badge('atrasado', 'bad') : '')) + '</td><td class="c">' + cell(x.media) + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">Nenhuma internação ainda. Inicie o primeiro plantão acima.</div>') + '</div>';

  const como = '<div class="card"><h3>Como funciona</h3>' + estacoesTabela() + '<ul class="list small" style="margin-top:10px"><li>Retornos: <b>dia +2</b> (Drill 12, 10 min), <b>+7</b> (caso fragmentado no eixo fraco, 20 min) e <b>+21</b> (Drill 12 e 10, 10 min). Nota menor que 70 repete o retorno em 3 dias.</li><li>Ronda de 20 min junto do Anki: 1 retorno do 4º período e 1 patologia do 3º, sempre a mais antiga ou mais fraca.</li><li>Sábado: caso completo da patologia mais fraca da semana, como alta definitiva.</li><li>Até 05/11 o 3º período fica só na ronda; depois a divisão passa a ser 50/50.</li></ul></div>';

  return page('Plantão por patologia', 'Admissão, plantão de 60 min, retornos espaçados e ronda do 3º período', regBtn('Registrar caso', 'caso', ' data-tipo="plantao"'),
    '<div class="grid g2">' + hoje + devHtml + '</div><div class="sp"></div><div class="grid g2">' + ronda + como + '</div><div class="sp"></div>' + tab);
}

function openPlantao(id, mode) {
  mode = mode || 'plantao'; const p = patById(id); if (!p) return; const E = S.plantao.estacoes; const isRet = mode === 'retorno';
  const inter = internacoes().find(x => x.pat.id === id); const step = inter && !inter.completo ? inter.step : null;
  const body = isRet
    ? '<div class="callout">' + esc(step ? S.plantao.ret_info[String(step)] : 'Revisão extra, fora do calendário de retornos.') + '</div><div class="sp8"></div><div class="row wrap"><button class="btn" data-act="copyp" data-pid="retorno" data-pat="' + id + '">' + ico('copy') + 'Copiar prompt do retorno</button></div><div class="sp8"></div><div class="grid g2">' + fld('Data', '<input type="date" data-f="date" value="' + todayISO() + '">') + fld('Nota do retorno (0 a 100)', '<input type="number" min="0" max="100" data-f="score">') + '</div><p class="tiny muted">Menor que 70: o retorno se repete em 3 dias.</p>'
    : '<div class="row wrap" style="margin-bottom:10px"><button class="btn pri" data-act="copyp" data-pid="plantao60" data-pat="' + id + '">' + ico('copy') + 'Copiar prompt do plantão completo</button><span class="tiny muted">60 min em 5 estações; ao final a IA entrega o resultado para o painel.</span></div>' +
      E.map(e => '<div class="card flat" style="margin-bottom:8px;padding:12px"><div class="row wrap"><b>' + esc(e.n) + '</b><span class="badge">' + e.min + ' min</span><span class="tiny muted">' + esc(e.o) + '</span></div><div class="grid g4" style="margin-top:8px">' + e.skills.map(k => fld(k + ' · nota', '<input type="number" min="0" max="100" data-p="' + k + '" placeholder="–">')).join('') + '</div></div>').join('') +
      '<div class="grid g2">' + fld('Data', '<input type="date" data-f="date" value="' + todayISO() + '">') + fld('Nota geral (vazio = média das estações)', '<input type="number" min="0" max="100" data-f="score">') + '</div>';
  openModal('<h2>' + (isRet ? 'Retorno' : 'Plantão') + ': ' + esc(p.nome) + '</h2><div class="row wrap" style="margin-bottom:10px">' + badge(p.periodo, 'pri') + badge(p.sistema) + '</div>' + body + '<div class="sp8"></div>' + fld('Erros e observações (viram cards no Anki)', '<textarea data-f="nota" rows="3"></textarea>') + '<div class="sp"></div><div class="row"><button class="btn pri" data-act="plsave" data-id="' + id + '" data-mode="' + mode + '">Salvar registro</button><button class="btn" data-act="close">Cancelar</button></div>', true);
}

function savePlantao(id, mode) {
  const o = readForm(document.querySelector('.modal')); const vals = Object.values(o.por);
  let sc = o.score === '' ? null : clamp(+o.score, 0, 100);
  if (sc == null && vals.length) sc = Math.round(avg(vals));
  if (sc == null) return toast('Informe a nota');
  addCaso({ date: o.date, tipo: mode, pat: id, score: sc, por: o.por, nota: o.nota, nivel: nivelAtual().id }); closeModal(); toast('Registrado'); render();
}

VIEWS.plantoes = vPlantoes;
UI.plPick = '';
window.ACT_EXTRA = {
  plantao: el => openPlantao(el.dataset.id, 'plantao'),
  retorno: el => openPlantao(el.dataset.id, 'retorno'),
  plpick: () => { if (UI.plPick) openPlantao(UI.plPick, 'plantao'); else toast('Escolha uma patologia'); },
  plsave: el => savePlantao(el.dataset.id, el.dataset.mode),
  copyp: el => copyText(withFooter(plantaoPromptText(el.dataset.pat, el.dataset.pid))),
};
