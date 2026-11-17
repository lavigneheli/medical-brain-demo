/* Medical Brain · versão demonstração: estado fictício, salvo só neste navegador (localStorage). */
(function () {
  try { if (localStorage.getItem('mbh_state')) return; } catch (e) { return; }
  const S = window.SEED, pad = n => String(n).padStart(2, '0');
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
  const id = () => Math.random().toString(36).slice(2, 9);
  const P = S.pats.map(p => p.id);
  const sk = ['C1', 'C3', 'C5', 'C6', 'C8', 'C9', 'C12'];
  const treinos = [], casos = [], anki = [], provasRes = [];
  const scores = [58, 64, 61, 70, 66, 74, 72, 79, 76, 83, 81, 88, 85, 90];
  scores.forEach((sc, i) => treinos.push({ id: id(), date: d(scores.length - i), skill: sk[i % sk.length], pat: P[i % 8], score: sc, nota: 'Registro fictício de demonstração.', nivel: 'medio', origem: 'demo' }));
  [72, 78, 84, 80, 91].forEach((sc, i) => casos.push({ id: id(), date: d(12 - i * 2), tipo: 'completo', pat: P[(i * 2) % 10], score: sc, por: { C1: sc - 4, C3: sc + 2, C8: sc - 1 }, nota: 'Caso clínico fictício.', nivel: 'medio', origem: 'demo' }));
  ['Fisiopatologia da HAS', 'Classes de anti-hipertensivos', 'Critérios de Framingham (IC)', 'Sinais de Chagas agudo', 'Estenose aórtica'].forEach((t, i) => anki.push({ id: id(), date: d(9 - i), pat: P[i], topico: t, cards: 6 + i * 2, tipo: 'Cloze padrão', tags: 'demo', nota: '', origem: 'demo' }));
  [['Simulado A (demo)', 68], ['Simulado B (demo)', 77], ['Simulado C (demo)', 84]].forEach((p, i) => provasRes.push({ id: id(), date: d(14 - i * 5), prova: p[0], score: p[1], nota: '', origem: 'demo' }));
  const pats = {};
  [['Revisar escores de risco e metas pressóricas.', 5], ['Lembrar diagnósticos diferenciais da dispneia.', 3], ['Treinar leitura de ECG nesta patologia.', 1]].forEach((x, i) => { pats[P[i + 1]] = { note: x[0], rev: d(x[1]) }; });
  const daily = {}; daily[d(0)] = { blocks: {}, vitals: {}, note: 'Dia de demonstração.' };
  const st = { v: 2, daily, agendaDone: {}, treinos, casos, anki, provasRes, pats, prompts: null, weekly: {}, pesq: {}, notas: {}, settings: { theme: 'light', nome: 'Aluna Demo', cenario: 'UBS e pronto-atendimento (demonstração)', nivel: 'medio', mix: [] }, sync: { lastChat: '', nota: 'demo' } };
  try { localStorage.setItem('mbh_state', JSON.stringify(st)); } catch (e) { }
})();
