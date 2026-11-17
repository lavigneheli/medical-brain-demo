/* Medical Brain · Helen — motor de revisão adaptativa (v1)
   Substitui o calendário fixo de retornos (+2, +7, +21, depois nada) por intervalos que dependem das suas notas.
   Escada de intervalos: 2, 7, 21, 45, 75, 120 dias.
   - nota >= 80 (ou sem nota): sobe um degrau
   - nota 70 a 79: repete o mesmo degrau
   - nota < 70: desce um degrau e volta em 3 dias
   Teto de intervalo por período: SOI IV (P4) 45 dias, SOI III (P3) 75 dias. A patologia nunca "completa": entra em manutenção.
   Mantém o mesmo formato de saída de internacoes() para as telas existentes. */
const ADAPT = {
  escada: [2, 7, 21, 45, 75, 120],
  teto: { 'SOI IV': 45, 'SOI III': 75 },
  bom: 80, ok: 70, falhaDias: 3,
  capSemana: 8,          // revisões de patologia que cabem por semana (5 filas rápidas + folga dos plantões)
};
const adaptCfg = () => Object.assign({}, ADAPT, (typeof state !== 'undefined' && state.settings && state.settings.adapt) || {});
function adaptTetoIdx(per) {
  const c = adaptCfg(), lim = c.teto[per] || 45; let k = 0;
  c.escada.forEach((d, i) => { if (d <= lim) k = i; });
  return k;
}
/* calcula o estado de revisão de uma patologia a partir do plantão e dos retornos já registrados */
function adaptEstado(p, plantaoData, rets) {
  const c = adaptCfg(), E = c.escada, max = adaptTetoIdx(p.periodo);
  let idx = 0, due = addDays(plantaoData, E[0]), ultima = plantaoData, falhas = 0, seguidosBons = 0;
  rets.forEach(r => {
    const s = (r.score == null || r.score === '') ? null : +r.score;
    ultima = r.date;
    if (s != null && s < c.ok) { idx = Math.max(0, idx - 1); due = addDays(r.date, c.falhaDias); falhas++; seguidosBons = 0; }
    else {
      if (s == null || s >= c.bom) { idx = Math.min(max, idx + 1); seguidosBons++; } else seguidosBons = 0;
      due = addDays(r.date, E[idx]);
    }
  });
  return { idx, due, ultima, falhas, dominada: seguidosBons >= 2, intervalo: E[idx] };
}
/* mesmo formato de internacoes() do core.js, agora sem fim */
function internacoes() {
  const out = [];
  S.pats.forEach(p => {
    const pl = state.casos.filter(c => c.pat === p.id && c.tipo === 'plantao').sort(byDate);
    if (!pl.length) return;
    const P = pl[0].date;
    const rets = state.casos.filter(c => c.pat === p.id && c.tipo === 'retorno' && c.date > P).sort(byDate);
    const e = adaptEstado(p, P, rets), t = todayISO();
    out.push({
      pat: p, plantao: P, i: e.idx, step: e.intervalo, due: e.due, completo: false, retornos: rets.length,
      atraso: Math.max(0, daysBetween(e.due, t)), media: patStats(p.id).media,
      fase: e.idx >= 3 ? 'manutenção' : 'inicial', dominada: e.dominada, ultima: e.ultima, falhas: e.falhas,
    });
  });
  return out;
}
/* retornos vencidos: SOI IV primeiro, depois o mais atrasado em relação ao seu próprio intervalo */
function retornosDevidos() {
  const t = todayISO();
  return internacoes().filter(x => x.due <= t).sort((a, b) =>
    (a.pat.periodo === 'SOI IV' ? 0 : 1) - (b.pat.periodo === 'SOI IV' ? 0 : 1) ||
    (b.atraso / Math.max(1, b.step)) - (a.atraso / Math.max(1, a.step)) || (a.due < b.due ? -1 : 1));
}
function proximosRetornos() { const t = todayISO(); return internacoes().filter(x => x.due > t).sort((a, b) => a.due < b.due ? -1 : 1); }
/* carga: quanto vence nos próximos 7 dias e quanto está atrasado, contra a capacidade semanal */
function adaptCarga() {
  const t = todayISO(), c = adaptCfg(), all = internacoes();
  const vencidos = all.filter(x => x.due <= t), prox7 = all.filter(x => x.due > t && x.due <= addDays(t, 7));
  const demanda = vencidos.length + prox7.length;
  const sobra = c.capSemana - demanda;
  return { vencidos: vencidos.length, atrasados: vencidos.filter(x => x.atraso > 3).length, prox7: prox7.length, demanda, cap: c.capSemana, sobra, sobrecarga: sobra < 0 };
}
/* aviso nas pendências quando a fila passa da capacidade */
(function () {
  const orig = pendencias;
  pendencias = function () {
    const out = orig();
    const k = adaptCarga();
    if (k.sobrecarga) out.unshift({ k: 'bad', t: 'Fila de revisão acima da capacidade (' + k.demanda + ' para ' + k.cap + ' por semana)', d: k.vencidos + ' vencida(s), ' + k.atrasados + ' com mais de 3 dias de atraso. Segure conteúdo novo e priorize o SOI IV.', go: '#/plantao' });
    return out;
  };
})();
