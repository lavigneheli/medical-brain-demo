/* Medical Brain · Helen — biblioteca de editais (baremas de currículo) e tipos de atividade.
   Fonte: editais 2027 salvos em estrategia/editais. Itens marcados com a (aprox.) não foram lidos por inteiro: confira no PDF.
   Cada item: f(q, P) devolve os pontos. q(tipos, pred) soma as quantidades (semestres, anos ou unidades) das atividades;
   P é o perfil (média, conceito Enamed da faculdade, hospital próprio etc.). */
const TIPOS_ATIV = {
  monitoria:     { nome: 'Monitoria', un: 'semestres', h: 64, hc: 'Ensino' },
  ic_bolsa:      { nome: 'Iniciação científica com bolsa', un: 'semestres', h: 120, hc: 'Pesquisa' },
  ic_sem:        { nome: 'Iniciação científica sem bolsa', un: 'semestres', h: 120, hc: 'Pesquisa' },
  artigo_pubmed: { nome: 'Artigo (PubMed/MEDLINE)', un: 'artigos', h: 120, hc: 'Pesquisa' },
  artigo_scielo: { nome: 'Artigo (SciELO)', un: 'artigos', h: 100, hc: 'Pesquisa' },
  artigo_outro:  { nome: 'Artigo (outra indexação)', un: 'artigos', h: 60, hc: 'Pesquisa' },
  oral:          { nome: 'Apresentação oral em evento', un: 'trabalhos', h: 30, hc: 'Pesquisa', nivel: 1 },
  poster:        { nome: 'Pôster em evento', un: 'trabalhos', h: 20, hc: 'Pesquisa', nivel: 1 },
  congresso_part:{ nome: 'Participação em congresso/jornada', un: 'eventos', h: 12, hc: 'Eventos', nivel: 1 },
  congresso_org: { nome: 'Organização de congresso/jornada', un: 'eventos', h: 30, hc: 'Eventos', nivel: 1 },
  extensao:      { nome: 'Projeto de extensão / PET / VER-SUS', un: 'semestres', h: 60, hc: 'Extensão' },
  liga:          { nome: 'Liga acadêmica', un: 'anos', h: 80, hc: 'Extensão' },
  representacao: { nome: 'Representação estudantil (CA, DA, colegiado)', un: 'anos', h: 60, hc: 'Representação' },
  idioma:        { nome: 'Proficiência em inglês (TOEFL, IELTS, Cambridge)', un: 'certificados', h: 80, hc: 'Cursos' },
  suporte_vida:  { nome: 'ACLS / ATLS / PALS / BLS', un: 'cursos', h: 16, hc: 'Cursos' },
  estagio_ext:   { nome: 'Estágio extracurricular', un: 'meses de estágio', h: 80, hc: 'Estágios' },
  voluntario:    { nome: 'Trabalho voluntário / campanha de saúde', un: 'atividades', h: 20, hc: 'Extensão' },
  livro:         { nome: 'Livro ou capítulo de livro', un: 'publicações', h: 60, hc: 'Pesquisa' },
  resumo_anais:  { nome: 'Resumo publicado em anais', un: 'resumos', h: 15, hc: 'Pesquisa' },
  ca_dir:        { nome: 'Centro/diretório acadêmico, atlética (diretoria)', un: 'anos', h: 60, hc: 'Representação' },
  premio:        { nome: 'Prêmio ou distinção acadêmica', un: 'prêmios', h: 20, hc: 'Outros' },
  teste_progresso:{ nome: 'Teste de Progresso / prova interinstitucional', un: 'participações', h: 5, hc: 'Outros' },
};
const ART = ['artigo_pubmed', 'artigo_scielo', 'artigo_outro'], ARTIDX = ['artigo_pubmed', 'artigo_scielo'];
const mn = (a, b) => Math.min(a, b);

const EDITAIS = [
  { id: 'sespe', nome: 'SES-PE (Residência SUS-PE) 2027', uf: 'PE', peso: 10, max: 100, esc: '0 a 100', pdf: 'EDITAL-RESIDENCIA-MEDICA-SUS-PE-2027-PUBLICACAO.pdf', lido: 'completo',
    nota: 'Currículo classificatório, 10% da nota. Sem documento comprobatório por item, nota zero no item.',
    itens: [
      { id: 'hist', nome: 'Aproveitamento curricular (média global)', max: 30, f: (q, P) => P.media == null ? 0 : P.media >= 90 ? 30 : P.media >= 80 ? 20 : P.media >= 70 ? 10 : 0, dica: 'Média global do histórico: 90+ = 30, 80+ = 20, 70+ = 10. Informe no Perfil.', perfil: true },
      { id: 'mon', nome: 'Monitoria e/ou PID (5 por semestre)', max: 15, f: q => mn(15, 5 * q(['monitoria'])), t: 'monitoria' },
      { id: 'ic', nome: 'Iniciação científica (5 por ano de projeto)', max: 15, f: q => mn(15, 5 * Math.floor(q(['ic_bolsa', 'ic_sem']) / 2)), t: 'ic_bolsa' },
      { id: 'ext', nome: 'Extensão, PET-Saúde, PET ou VER-SUS (5 por semestre)', max: 20, f: q => mn(20, 5 * q(['extensao'])), t: 'extensao' },
      { id: 'art', nome: 'Artigos publicados com orientador/preceptor (5 por artigo)', max: 5, f: q => mn(5, 5 * q(ART)), t: 'artigo_scielo' },
      { id: 'oral', nome: 'Apresentação oral (2 por trabalho, até 5 trabalhos)', max: 10, f: q => 2 * mn(5, q(['oral'])), t: 'oral' },
      { id: 'post', nome: 'Pôster (1 por trabalho, até 5)', max: 5, f: q => mn(5, q(['poster'])), t: 'poster' },
    ] },
  { id: 'uspsp', nome: 'USP-SP (FMUSP) 2027, acesso direto', uf: 'SP', peso: 'Peso 1 (2ª fase)', max: 100, esc: '0 a 100', pdf: 'rm2027-edital-02-2026 - USP.pdf', lido: 'parcial',
    nota: 'Itens 1 a 3 dependem da sua faculdade (informe no Perfil). O fator Enamed da IES multiplica o total (teto 100). Item 9 (pôster) aproximado.',
    mult: P => P.enamedIES === 5 ? 1.2 : P.enamedIES === 4 ? 1.1 : 1,
    itens: [
      { id: 'pos', nome: 'Pós-graduação da faculdade (CAPES, Medicina I a III/Saúde Coletiva)', max: 15, f: (q, P) => mn(15, P.uspPos || 0), perfil: true, dica: 'Pontos que sua faculdade rende (0 a 15). Peça a declaração à diretoria.' },
      { id: 'hosp', nome: 'Hospital de ensino (próprio 12, conveniado 3)', max: 12, f: (q, P) => P.hosp === 'proprio' ? 12 : P.hosp === 'conv' ? 3 : 0, perfil: true, dica: 'Termo da diretoria.' },
      { id: 'doc', nome: 'Corpo docente com doutorado stricto sensu', max: 8, f: (q, P) => mn(8, P.uspDoc || 0), perfil: true, dica: 'Declaração da diretoria. Faixas: >80% = 8, 60 a 80% = 4, 50 a 60% = 2.' },
      { id: 'mon', nome: 'Monitoria (1 sem = 1, 2 sem = 3, mais de 2 = 4)', max: 4, f: q => { const n = q(['monitoria']); return n > 2 ? 4 : n === 2 ? 3 : n === 1 ? 1 : 0; }, t: 'monitoria', dica: 'Carga horária mínima: 64h por semestre.' },
      { id: 'ic', nome: 'Iniciação científica (bolsa com artigo 14; bolsa sem artigo 2 por projeto; sem bolsa com artigo 8)', max: 14, f: q => {
          const pb = q(['ic_bolsa'], a => a.pub) >= 2 ? 14 : 0, sb = q(['ic_bolsa'], a => !a.pub), sp = q(['ic_sem'], a => a.pub) >= 2 ? 8 : 0;
          return mn(14, Math.max(pb, sp, 2 * mn(2, Math.floor(sb / 2))));
        }, t: 'ic_bolsa', dica: 'Marque "gerou publicação" na atividade quando houver artigo.' },
      { id: 'pub', nome: 'Publicação diferente da IC (PubMed 10, SciELO 8; máx. 1)', max: 10, f: q => q(['artigo_pubmed']) >= 1 ? 10 : q(['artigo_scielo']) >= 1 ? 8 : 0, t: 'artigo_pubmed' },
      { id: 'cong', nome: 'Organização e participação em congressos', max: 5, f: q => {
          const orgN = mn(1, q(['congresso_org'], a => a.nivel === 'nac' || a.nivel === 'int')) * 4, orgJ = mn(2, q(['congresso_org'], a => a.nivel === 'jor')) * 1;
          const parN = mn(2, q(['congresso_part'], a => a.nivel === 'nac' || a.nivel === 'int')) * 1, parJ = mn(1, q(['congresso_part'], a => a.nivel === 'jor'));
          return mn(5, orgN + orgJ + parN + parJ);
        }, t: 'congresso_part', dica: 'Entidade reconhecida pela AMB conta mais. Marque o nível do evento.' },
      { id: 'oral', nome: 'Apresentação oral (int. premiado 8, int. 7, nac. premiado 6, nac. 5, jornada 4)', max: 8, f: q => {
          const v = []; const c = (n, p) => { if (n > 0) v.push(p); };
          c(q(['oral'], a => a.nivel === 'int' && a.premio), 8); c(q(['oral'], a => a.nivel === 'int' && !a.premio), 7); c(q(['oral'], a => a.nivel === 'nac' && a.premio), 6); c(q(['oral'], a => a.nivel === 'nac' && !a.premio), 5); c(q(['oral'], a => a.nivel === 'jor'), 4);
          return mn(8, v.reduce((s, x) => s + x, 0));
        }, t: 'oral' },
      { id: 'post', nome: 'Pôster como autor responsável (aprox.: 1 por pôster)', max: 4, f: q => mn(4, q(['poster'])), t: 'poster', aprox: true },
      { id: 'ext', nome: 'Extensão (diretoria 1 ano = 5; 2 anos = 3; 1 ano = 1), exceto liga', max: 5, f: q => { const n = q(['extensao']); return n >= 4 ? 3 : n >= 2 ? 1 : 0; }, t: 'extensao', aprox: true, dica: 'Aproximado: 4 semestres = 3, 2 semestres = 1. Diretoria vale 5 (não modelado).' },
      { id: 'pos2', nome: 'Aprimoramento profissional I (mestrado, doutorado, outra residência)', max: 8, f: () => 0, dica: 'Não se aplica antes da formatura.' },
      { id: 'sv', nome: 'Suporte de vida no prazo (2 por curso, máx. 2)', max: 4, f: q => mn(4, 2 * q(['suporte_vida'])), t: 'suporte_vida' },
      { id: 'rep', nome: 'Representação estudantil, exceto liga (2 anos = 3; 1 ano = 1)', max: 3, f: q => { const n = q(['representacao']); return n >= 2 ? 3 : n >= 1 ? 1 : 0; }, t: 'representacao' },
    ] },
  { id: 'usprp', nome: 'USP-RP (HCFMRP) 2027, acesso direto', uf: 'SP', peso: 10, max: 10, esc: '0 a 10', pdf: 'acessodireto_usp-rp_edital2027.pdf', lido: 'parcial',
    nota: 'Peso 0,1. Os examinadores julgam qualidade e pertinência, não quantidade, e podem pontuar menos. Item 3 aproximado.',
    itens: [
      { id: 'hist', nome: 'Histórico acadêmico (hospital universitário 0,5 + pós CAPES até 0,5 + conceito Enamed da IES × 0,1)', max: 1.5, f: (q, P) => (P.hosp === 'proprio' ? .5 : 0) + (P.nPos >= 5 ? .5 : P.nPos >= 2 ? .3 : P.nPos === 1 ? .2 : 0) + (P.enamedIES ? P.enamedIES * .1 : 0), perfil: true, dica: 'Informe hospital, nº de programas de pós e conceito Enamed da IES no Perfil.' },
      { id: 'ass', nome: 'Atividades assistenciais (liga 0,5/ano; voluntário 0,5 por 120h; máx. 1 cada)', max: 2, f: q => mn(1, .5 * q(['liga'])) + mn(1, .5 * Math.floor(q.h(['voluntario']) / 120)), t: 'liga' },
      { id: 'cie', nome: 'Atividades científicas (artigo 1 cada, IC 0,5 a 0,7 por ano, pôster até 0,6) (aprox.)', max: 3, f: q => mn(3, mn(3, q(['artigo_pubmed', 'artigo_scielo', 'artigo_outro'])) + .5 * Math.floor(q(['ic_sem']) / 2) + .7 * Math.floor(q(['ic_bolsa']) / 2) + mn(.6, .2 * q(['poster']))), t: 'artigo_pubmed', aprox: true },
      { id: 'ens', nome: 'Ensino (monitoria bolsista 0,25/sem, eventos organizados 0,3, provas 0,5, prêmios 0,2)', max: 1.5, f: q => mn(1.5, mn(1, .25 * q(['monitoria'])) + mn(.6, .3 * q(['congresso_org'])) + mn(1, .5 * q(['teste_progresso'])) + mn(.4, .2 * q(['premio']))), t: 'teste_progresso' },
      { id: 'est', nome: 'Atividades estudantis (CA/DA, representação: 0,5 por ano)', max: 2, f: q => mn(2, .5 * q(['representacao'])), t: 'representacao' },
    ] },
  { id: 'sirio', nome: 'Sírio-Libanês 2027, acesso direto', uf: 'SP', peso: 10, max: 100, esc: '0 a 100', pdf: 'sirio_libanes_edital2027.pdf', lido: 'completo',
    nota: 'Currículo vale 10% nos programas com prova objetiva. Pôster conta só se feito durante a residência (não conta graduação).',
    itens: [
      { id: 'art', nome: 'Artigo completo (SciELO 20, PubMed 40; máx. 2 SciELO ou 1 PubMed)', max: 40, f: q => q(['artigo_pubmed']) >= 1 ? 40 : 20 * mn(2, q(['artigo_scielo'])), t: 'artigo_pubmed' },
      { id: 'post', nome: 'Pôster durante a residência pré-requisito', max: 10, f: () => 0, dica: 'Não se aplica na graduação.' },
      { id: 'ing', nome: 'Proficiência em inglês (TOEFL iBT 72, IELTS 6, Cambridge B2, DET 100)', max: 20, f: q => q(['idioma']) >= 1 ? 20 : 0, t: 'idioma' },
      { id: 'ativ', nome: 'Atividade adicional (estágio, congresso na área, COREME, missão): 10 cada, máx. 3', max: 30, f: q => 10 * mn(3, q(['estagio_ext']) + q(['congresso_part']) + q(['representacao'])), t: 'estagio_ext' },
    ] },
  { id: 'unifesp', nome: 'Unifesp (EPM) 2027, quadro geral', uf: 'SP', peso: 'Peso 1 (3ª fase)', max: 12, esc: '0 a 12 → nota 0 a 10', conv: 10 / 12, pdf: 'edital-residencia-medica-unifesp-2027.pdf', lido: 'parcial',
    nota: 'Há variações por programa (o Enamed da IES também entra em vários, com IES × 0,1). Este é o quadro geral de 12 pontos.',
    itens: [
      { id: 'exc', nome: 'Formação em centro de excelência (hospital de ensino, residência, multiprofissional e pós CAPES)', max: 2, f: (q, P) => P.centroExc ? 2 : 0, perfil: true, dica: 'Só se a faculdade cumprir os 4 requisitos e você provar com documentos.' },
      { id: 'art', nome: 'Artigo em MEDLINE/PubMed (1º ou 2º autor 2; outra posição 1)', max: 2, f: q => q(['artigo_pubmed'], a => (a.autoria || 1) <= 2) >= 1 ? 2 : q(['artigo_pubmed']) >= 1 ? 1 : 0, t: 'artigo_pubmed' },
      { id: 'cong', nome: 'Congresso nos últimos 2 anos (com apresentação 2; sem 1)', max: 2, f: q => { const r = d => d && d >= addDays(todayISO(), -730); return q(['oral', 'poster'], a => r(a.data)) >= 1 ? 2 : q(['congresso_part'], a => r(a.data)) >= 1 ? 1 : 0; }, t: 'poster' },
      { id: 'rep', nome: 'Representação estudantil (mín. 12 meses)', max: 1, f: q => q(['representacao']) >= 1 ? 1 : 0, t: 'representacao' },
      { id: 'ic', nome: 'Iniciação científica (mín. 12 meses: bolsa 2; voluntária 1)', max: 2, f: q => q(['ic_bolsa']) >= 2 ? 2 : q(['ic_sem']) >= 2 ? 1 : 0, t: 'ic_bolsa' },
      { id: 'ext', nome: 'Atividade extracurricular acadêmica, científica ou de extensão (mín. 12 meses)', max: 1, f: q => q(['extensao']) >= 2 || q(['liga']) >= 1 ? 1 : 0, t: 'extensao' },
      { id: 'pre', nome: 'Prêmio ou distinção acadêmica', max: 1, f: q => q(['premio']) >= 1 ? 1 : 0, t: 'premio' },
      { id: 'ing', nome: 'Fluência em idioma por teste oficial', max: 1, f: q => q(['idioma']) >= 1 ? 1 : 0, t: 'idioma' },
    ] },
  { id: 'fmabc', nome: 'FMABC 2027, acesso direto (Anexo I completo)', uf: 'SP', peso: 10, max: 10, esc: '0 a 10', pdf: 'edital-residencia-medica-fmabc-2027.pdf', lido: 'completo',
    nota: 'Currículo vale 10% (prova 90%). Só contam atividades feitas durante a Medicina. Certificado sem a categoria explícita (ouvinte, pôster etc.) não pontua.',
    itens: [
      { id: 'est', nome: 'Estágios e atividades extracurriculares (máx. 4,0): Teste do Progresso de consórcio 1; estágio >120h 1; CA/liga 0,5; projeto social 0,5; ACLS 0,5; colegiado 0,5', max: 4, f: q => mn(4, (q(['teste_progresso']) >= 4 ? 1 : 0) + (q(['estagio_ext']) >= 1 ? 1 : 0) + (q(['liga', 'ca_dir']) >= 1 ? .5 : 0) + (q(['voluntario', 'extensao']) >= 1 ? .5 : 0) + (q(['suporte_vida']) >= 1 ? .5 : 0) + (q(['representacao']) >= 1 ? .5 : 0)), t: 'estagio_ext' },
      { id: 'mon', nome: 'Monitorias (1 ano = 1,0; 1 semestre = 0,5)', max: 1.5, f: q => { const n = q(['monitoria']); return n >= 2 ? 1 : n === 1 ? .5 : 0; }, t: 'monitoria' },
      { id: 'ic', nome: 'Iniciação científica, 1 ano ou mais (1,0)', max: 1, f: q => q(['ic_bolsa', 'ic_sem']) >= 2 ? 1 : 0, t: 'ic_bolsa' },
      { id: 'art', nome: 'Artigo completo PubMed ou Lilacs (1 = 0,5; 2 ou mais = 1,0)', max: 1, f: q => { const n = q(['artigo_pubmed']); return n >= 2 ? 1 : n === 1 ? .5 : 0; }, t: 'artigo_pubmed' },
      { id: 'apr', nome: 'Trabalho apresentado em evento (1 = 0,5; 2 ou mais = 1,0)', max: 1, f: q => { const n = q(['oral', 'poster']); return n >= 2 ? 1 : n === 1 ? .5 : 0; }, t: 'poster' },
      { id: 'org', nome: 'Organização de liga, jornada, curso ou congresso', max: .5, f: q => q(['congresso_org']) >= 1 ? .5 : 0, t: 'congresso_org' },
      { id: 'ouv', nome: 'Participação como ouvinte (até 3 eventos 0,25; 4 ou mais 0,5)', max: .5, f: q => { const n = q(['congresso_part']); return n >= 4 ? .5 : n >= 1 ? .25 : 0; }, t: 'congresso_part' },
      { id: 'ing', nome: 'Inglês: Cambridge, TOEIC, IELTS ou FCE (cursos de inglês não valem)', max: .5, f: q => q(['idioma']) >= 1 ? .5 : 0, t: 'idioma' },
    ] },
  { id: 'scsc', nome: 'Santa Casa de São Carlos 2027 (Anexo II)', uf: 'SP', peso: 'Fase 2', max: 10, esc: '0 a 10', pdf: 'scsaocarlos_edital2027.pdf', lido: 'parcial',
    nota: 'O Enamed da faculdade rende até 3 pontos: (conceito ÷ 5) × 3. Anexo lido em parte.',
    itens: [
      { id: 'ena', nome: 'Desempenho institucional no Enamed ((conceito ÷ 5) × 3)', max: 3, f: (q, P) => P.enamedIES ? P.enamedIES / 5 * 3 : 0, perfil: true, dica: 'Informe o conceito Enamed da sua faculdade no Perfil.' },
      { id: 'rec', nome: 'Currículo sem recuperação', max: 1, f: (q, P) => P.semRecup ? 1 : 0, perfil: true },
      { id: 'mon', nome: 'Monitoria oficial (0,5 cada)', max: 1, f: q => mn(1, .5 * q(['monitoria'])), t: 'monitoria' },
      { id: 'ic', nome: 'Bolsa de iniciação científica (0,5 cada)', max: 1, f: q => mn(1, .5 * q(['ic_bolsa', 'ic_sem'])), t: 'ic_bolsa' },
      { id: 'tra', nome: 'Trabalho apresentado em evento (0,1 cada)', max: 1, f: q => mn(1, .1 * q(['oral', 'poster'])), t: 'poster' },
      { id: 'art', nome: 'Artigo em revista indexada (0,5 cada)', max: 1, f: q => mn(1, .5 * q(ARTIDX)), t: 'artigo_pubmed' },
      { id: 'est', nome: 'Estágio extracurricular (0,25 por mês-certificado, máx. 0,5)', max: .5, f: q => mn(.5, .25 * q(['estagio_ext'])), t: 'estagio_ext' },
      { id: 'sv', nome: 'ATLS, ACLS e PALS (0,5 cada, máx. 1,5)', max: 1.5, f: q => mn(1.5, .5 * q(['suporte_vida'])), t: 'suporte_vida' },
    ] },
];

/* regras do Enamed por seletivo: o que a sua situação rende */
const ENAMED_REGRAS = [
  { n: 'ENARE (acesso direto)', modo: 'Prova teórica', r: P => 'A nota do Enamed substitui a prova. Precisa de resultado "Proficiente" (vale a maior nota entre edições).' },
  { n: 'HBU, UNIFAE', modo: 'Prova teórica (60%)', r: P => 'Enamed é 1ª fase, 60% da nota. Exige "Proficiente"; UNIFAE usa a nota original do Inep.' },
  { n: 'Cesupa, HUV, Fundhacre', modo: 'Prova teórica', r: P => 'Enamed substitui a prova no acesso direto; Cesupa exige 50% da pontuação, HUV exige Proficiente (validade de 3 anos).' },
  { n: 'PUCPR', modo: 'Currículo (condição)', r: P => P.enamedInd === 'proficiente' ? 'Você terá o currículo analisado.' : 'Sem boletim "Proficiente" o currículo vale zero.' },
  { n: 'Unitau', modo: 'Currículo (individual)', r: P => P.enamedInd === 'proficiente' ? '10 pontos no currículo.' : 'Proficiência = 10 pontos; sem ela, 0.' },
  { n: 'UEM', modo: 'Currículo (individual)', r: P => P.enamedNota === 5 ? '0,5 ponto.' : 'Nota 5 no exame = 0,5 ponto.' },
  { n: 'PUC-Campinas', modo: 'Currículo (IES e individual)', r: P => 'IES: ≥4 = 4 pts, 3 = 1 pt. Individual: nota ≥8 = 4 pts, 6 a 8 = 2 pts.' + (P.enamedIES ? ' Sua IES (conceito ' + P.enamedIES + '): ' + (P.enamedIES >= 4 ? 4 : P.enamedIES === 3 ? 1 : 0) + ' pts.' : '') },
  { n: 'FMJ', modo: 'Currículo (IES)', r: P => P.enamedIES ? 'Sua IES: ' + (P.enamedIES === 5 ? '0,50' : P.enamedIES >= 3 ? '0,25' : '0') + ' ponto.' : 'Conceito 5 = 0,50; 3 ou 4 = 0,25.' },
  { n: 'Santa Casa de São Carlos', modo: 'Currículo (IES)', r: P => P.enamedIES ? 'Sua IES: ' + (P.enamedIES / 5 * 3).toFixed(1).replace('.', ',') + ' pontos (de 3).' : '(conceito ÷ 5) × 3.' },
  { n: 'USP-SP', modo: 'Multiplicador (IES)', r: P => P.enamedIES ? 'Sua IES: × ' + (P.enamedIES === 5 ? '1,20' : P.enamedIES === 4 ? '1,10' : '1,00') + ' sobre o currículo.' : 'IES 5 = ×1,20; 4 = ×1,10; 1 a 3 = ×1,00.' },
  { n: 'Santa Casa de SP', modo: 'Currículo (IES)', r: P => P.enamedIES ? 'Sua IES: ' + ({ 5: '2,5', 4: '1,5', 3: '1', 2: '0,5', 1: '0' }[P.enamedIES]) + ' pontos (de 2,5).' : '5 = 2,5; 4 = 1,5; 3 = 1; 2 = 0,5.' },
  { n: 'USP-RP', modo: 'Currículo (IES)', r: P => P.enamedIES ? 'Sua IES: ' + (P.enamedIES * .1).toFixed(1).replace('.', ',') + ' ponto.' : 'Conceito × 0,1.' },
  { n: 'Unifesp', modo: 'Currículo (IES)', r: P => 'Nota da instituição × 0,1 em vários programas (varia por programa).' },
  { n: 'HPC', modo: 'Currículo (individual)', r: P => 'Proficiência vale até 1 ponto, junto da experiência na área.' },
];

const UC_PRE = [
  { id: 'preh', nome: 'Instituição do pré-requisito: hospital de ensino (próprio 10; conveniado 5)', max: 10, f: (q, P) => P.preHosp === 'proprio' ? 10 : P.preHosp === 'conv' ? 5 : 0, perfil: true, dica: 'Só se aplica depois de cursar o pré-requisito (Clínica Médica, Cirurgia etc.). Informe no Perfil.' },
  { id: 'prep', nome: 'Instituição do pré-requisito: pós-graduação (doutorado 10; mestrado 5)', max: 10, f: (q, P) => P.prePos === 'dout' ? 10 : P.prePos === 'mest' ? 5 : 0, perfil: true },
];
const UC_COMUM = [
  { id: 'ic', nome: 'Iniciação científica na graduação (bolsa 10; sem bolsa 5)', max: 10, f: q => q(['ic_bolsa']) ? 10 : q(['ic_sem']) ? 5 : 0, t: 'ic_bolsa' },
  { id: 'art', nome: 'Artigo completo (PubMed 10; SciELO 5)', max: 10, f: q => mn(10, 10 * q(['artigo_pubmed']) + 5 * q(['artigo_scielo'])), t: 'artigo_pubmed' },
  { id: 'cong', nome: 'Trabalho em congresso (internacional da área 10; nacional da área 8; jornada da área 6; fora da área 4)', max: 10, f: q => mn(10, q(['oral', 'poster'], a => a.nivel === 'int') ? 10 : q(['oral', 'poster'], a => a.nivel === 'nac') ? 8 : q(['oral', 'poster'], a => a.nivel === 'jor') ? 6 : q(['oral', 'poster']) ? 4 : 0), t: 'oral', aprox: true, dica: 'Assume evento relacionado à especialidade; fora da área vale menos.' },
];
EDITAIS.push(
  { id: 'unicamp', nome: 'Unicamp (FCM) 2027, acesso direto', uf: 'SP', peso: 'Peso 10 (2ª fase)', max: 100, esc: '0 a 100', pdf: '001-Edital-Acesso-Direto-2027.pdf', lido: 'completo',
    nota: 'Currículo em PDF único com formulário, Lattes, diploma e histórico. Item sem comprovante não pontua. Itens 1 e 2 dependem da faculdade.',
    itens: [
      { id: 'pos', nome: 'Pós-graduação da faculdade (doutorado 15; mestrado 10)', max: 15, f: (q, P) => P.posIES === 'dout' ? 15 : P.posIES === 'mest' ? 10 : 0, perfil: true, dica: 'Informe no Perfil. Documento da diretoria.' },
      { id: 'hosp', nome: 'Hospital de ensino (próprio 10; conveniado 5)', max: 10, f: (q, P) => P.hosp === 'proprio' ? 10 : P.hosp === 'conv' ? 5 : 0, perfil: true },
      { id: 'ic', nome: 'Iniciação científica (bolsa: >2 sem 20, até 2 sem 15; sem bolsa: >2 sem 10, até 2 sem 5)', max: 20, f: q => { const b = q(['ic_bolsa']), n = q(['ic_sem']); return b > 2 ? 20 : b >= 1 ? 15 : n > 2 ? 10 : n >= 1 ? 5 : 0; }, t: 'ic_bolsa' },
      { id: 'art', nome: 'Artigo completo (PubMed 10; SciELO 5)', max: 15, f: q => mn(15, 10 * q(['artigo_pubmed']) + 5 * q(['artigo_scielo'])), t: 'artigo_pubmed' },
      { id: 'cong', nome: 'Trabalho em congresso (sociedade médica: oral 10, pôster 6; local/regional: 2 cada)', max: 10, f: q => mn(10, (q(['oral'], a => a.nivel === 'nac' || a.nivel === 'int') ? 10 : 0) + (q(['poster'], a => a.nivel === 'nac' || a.nivel === 'int') ? 6 : 0) + 2 * q(['oral', 'poster'], a => a.nivel === 'jor')), t: 'oral' },
      { id: 'liga', nome: 'Liga acadêmica (mín. 2 semestres na mesma liga)', max: 5, f: q => q(['liga']) >= 1 ? 5 : 0, t: 'liga' },
      { id: 'mon', nome: 'Monitoria (>2 sem 5; até 2 sem 2)', max: 5, f: q => { const n = q(['monitoria']); return n > 2 ? 5 : n >= 1 ? 2 : 0; }, t: 'monitoria' },
      { id: 'ext', nome: 'Extensão (>96h 10; 48 a 96h 5), fora do currículo regular', max: 10, f: q => q(['extensao'], a => (a.horas || 0) > 96) ? 10 : q(['extensao'], a => (a.horas || 0) > 48) ? 5 : 0, t: 'extensao', dica: 'Informe a carga horária na atividade.' },
      { id: 'rep', nome: 'Representação discente em colegiados (mín. 2 semestres)', max: 5, f: q => q(['representacao']) >= 1 ? 5 : 0, t: 'representacao' },
      { id: 'ca', nome: 'Centro/diretório acadêmico ou atlética, diretoria (2 cada; equipe esportiva 1), mín. 2 sem', max: 5, f: q => mn(5, 2 * q(['ca_dir'])), t: 'ca_dir' },
    ] },
  { id: 'unic_cli', nome: 'Unicamp 2027, especialidades clínicas (pré-requisito)', uf: 'SP', peso: 'Peso 10 (2ª fase)', max: 75, esc: 'itens 1 a 8 lidos', pdf: '004-Edital-Especialidades-Clinicas-2027.pdf', lido: 'parcial',
    nota: 'Para quem já fez o pré-requisito (ex.: Clínica Médica para Cardiologia). Itens 1 e 2 repetem a graduação. Lido até o item 8; o final do quadro não foi mapeado.',
    itens: [
      { id: 'pos', nome: 'Graduação: pós da faculdade (doutorado 10; mestrado 5)', max: 10, f: (q, P) => P.posIES === 'dout' ? 10 : P.posIES === 'mest' ? 5 : 0, perfil: true },
      { id: 'hosp', nome: 'Graduação: hospital de ensino (próprio 10; conveniado 5)', max: 10, f: (q, P) => P.hosp === 'proprio' ? 10 : P.hosp === 'conv' ? 5 : 0, perfil: true },
    ].concat(UC_PRE, UC_COMUM, [
      { id: 'apr', nome: 'Aprimoramento profissional (pós stricto sensu concluída 5; mestrado/doutorado profissional 3; outro curso universitário 2)', max: 5, f: (q, P) => P.aprimora || 0, perfil: true, dica: 'Informe os pontos no Perfil (0 a 5).' },
    ]) },
  { id: 'unic_cir', nome: 'Unicamp 2027, especialidades cirúrgicas (pré-requisito)', uf: 'SP', peso: 'Peso 10 (2ª fase)', max: 70, esc: 'itens 1 a 7 lidos', pdf: '003-Edital-Especialidades-Cirurgicas-2027.pdf', lido: 'parcial',
    nota: 'Mesma estrutura das clínicas. Item 7 (congresso) lido só no início; o restante do quadro não foi mapeado.',
    itens: [
      { id: 'pos', nome: 'Graduação: pós da faculdade (doutorado 10; mestrado 5)', max: 10, f: (q, P) => P.posIES === 'dout' ? 10 : P.posIES === 'mest' ? 5 : 0, perfil: true },
      { id: 'hosp', nome: 'Graduação: hospital de ensino (próprio 10; conveniado 5)', max: 10, f: (q, P) => P.hosp === 'proprio' ? 10 : P.hosp === 'conv' ? 5 : 0, perfil: true },
    ].concat(UC_PRE, UC_COMUM) },
  { id: 'unic_esp', nome: 'Unicamp 2027, áreas de atuação e demais especialidades', uf: 'SP', peso: 'Peso 10 (2ª fase)', max: 60, esc: 'itens 1 a 6 lidos', pdf: '006-Edital-Especialidades-2027.pdf', lido: 'parcial',
    nota: 'Para quem já tem a especialidade-base. Itens 1 a 6 (o item 6 mistura pós, mestrado profissional e inglês).',
    itens: UC_PRE.concat(UC_COMUM, [
      { id: 'apr', nome: 'Aprimoramento (pós stricto sensu 10; mestrado profissional 6; proficiência em inglês 4)', max: 10, f: (q, P) => mn(10, (P.aprimora || 0) + (q(['idioma']) ? 4 : 0)), t: 'idioma', aprox: true },
    ]) },
  { id: 'hcpa', nome: 'HCPA (Porto Alegre) 2027, acesso direto', uf: 'RS', peso: 10, max: 10, esc: '0 a 10 (prova 90, currículo 10)', pdf: 'HCPA-MEDICA-Edital-de-Abertura-das-Inscricoes.pdf', lido: 'parcial',
    nota: 'Currículo eliminatório/classificatório, até 10 pontos. Item J (suporte de vida e pós) lido só em parte; fator de impacto dos artigos é suposto maior que 1.',
    itens: [
      { id: 'A', nome: 'Histórico (maioria de conceitos A 0,6; B 0,3)', max: .6, f: (q, P) => P.media == null ? 0 : P.media > 90 ? .6 : P.media > 80 ? .3 : 0, perfil: true },
      { id: 'B', nome: 'Nota do curso no Enade (5 = 0,5; 4 = 0,3; 3 = 0,1)', max: .5, f: (q, P) => ({ 5: .5, 4: .3, 3: .1 })[P.enade] || 0, perfil: true, dica: 'Informe o conceito Enade da faculdade no Perfil.' },
      { id: 'C', nome: 'Pós-graduação da instituição (doutorado 0,5; mestrado 0,2)', max: .5, f: (q, P) => P.posIES === 'dout' ? .5 : P.posIES === 'mest' ? .2 : 0, perfil: true },
      { id: 'D', nome: 'Teste do Progresso (0,05 por participação)', max: .2, f: q => mn(.2, .05 * q(['teste_progresso'])), t: 'teste_progresso' },
      { id: 'E', nome: 'Produção científica (artigo FI>1 1,0; sem FI 0,2; livro 0,3; anais 0,05 a 0,1)', max: 1.5, f: q => mn(1.5, q(['artigo_pubmed']) + .5 * q(['artigo_scielo']) + mn(.5, .2 * q(['artigo_outro'])) + mn(.6, .3 * q(['livro'])) + mn(.5, .05 * q(['resumo_anais']))), t: 'artigo_pubmed', aprox: true },
      { id: 'F', nome: 'Eventos (organização, prêmios, participação, oral 0,4, pôster 0,2)', max: 1.2, f: q => mn(1.2, mn(.6, .3 * q(['congresso_org'], a => a.nivel !== 'jor')) + mn(.4, .2 * q(['congresso_org'], a => a.nivel === 'jor')) + mn(.6, .3 * q(['oral', 'poster'], a => a.premio)) + mn(.5, .1 * q(['congresso_part'], a => a.nivel === 'int')) + mn(.5, .05 * q(['congresso_part'], a => a.nivel !== 'int')) + mn(.8, .4 * q(['oral'])) + mn(.6, .2 * q(['poster']))), t: 'oral' },
      { id: 'G', nome: 'Monitoria (0,2/sem), extensão (0,1), liga (0,2/ano), IC (bolsa 0,3/sem; sem 0,2/sem)', max: 2, f: q => mn(2, mn(.6, .2 * q(['monitoria'])) + mn(.5, .1 * Math.floor(q(['extensao']) / 2)) + mn(.6, .2 * q(['liga'])) + mn(.9, .3 * q(['ic_bolsa'])) + mn(.6, .2 * q(['ic_sem']))), t: 'ic_bolsa' },
      { id: 'H', nome: 'Inglês (proficiência 1,0; outros níveis 0,5)', max: 1, f: q => q(['idioma']) >= 1 ? 1 : 0, t: 'idioma' },
      { id: 'I', nome: 'Voluntariado (0,1 a 0,3 por atividade) e representação (0,2/ano, máx. 0,6)', max: 1, f: q => mn(1, .3 * q(['voluntario'], a => (a.horas || 0) > 96) + .15 * q(['voluntario'], a => (a.horas || 0) >= 48 && (a.horas || 0) <= 96) + .1 * q(['voluntario'], a => (a.horas || 0) < 48) + mn(.6, .2 * q(['representacao', 'ca_dir']))), t: 'representacao', aprox: true },
    ] },
  { id: 'maedeus', nome: 'Mãe de Deus (Porto Alegre) 2027', uf: 'RS', peso: 10, max: 10, esc: '0 a 10', pdf: 'Edital_2027.pdf', lido: 'completo',
    nota: 'Segunda etapa vale 10% e só vai quem tiver 50% na prova AMRIGS. Em Clínica Médica a 2ª etapa é 100% currículo; em outras, currículo 50% e arguição 50%. A pontuação adicional de 10% (PRMFC) é separada.',
    itens: [
      { id: 'hist', nome: 'Histórico (maioria A 2,0; B 1,0; C 0,5)', max: 2, f: (q, P) => P.media == null ? 0 : P.media >= 90 ? 2 : P.media >= 80 ? 1 : P.media >= 70 ? .5 : 0, perfil: true },
      { id: 'cie', nome: 'Produção científica (artigo internacional 1,0, nacional 0,5, livro 0,5, congresso int. 0,25, nac. 0,10)', max: 2, f: q => mn(2, q(['artigo_pubmed']) + .5 * (q(['artigo_scielo']) + q(['artigo_outro'])) + .5 * q(['livro']) + .25 * q(['oral', 'poster'], a => a.nivel === 'int') + .1 * q(['oral', 'poster'], a => a.nivel !== 'int')), t: 'artigo_pubmed', aprox: true },
      { id: 'mon', nome: 'Monitoria (0,5/sem) e bolsa de IC ou extensão (0,5/sem)', max: 2, f: q => mn(2, .5 * q(['monitoria']) + .5 * q(['ic_bolsa']) + .5 * q(['extensao'], a => a.bolsa)), t: 'monitoria' },
      { id: 'ing', nome: 'Inglês (avançado/proficiência 1,0; intermediário 0,5; básico 0,25)', max: 1, f: q => q(['idioma']) >= 1 ? 1 : 0, t: 'idioma' },
      { id: 'est', nome: 'Estágio extracurricular (0,5 por mês)', max: 1, f: q => mn(1, .5 * q(['estagio_ext'])), t: 'estagio_ext' },
      { id: 'out', nome: 'Outras (evento/curso 0,1; campanha de saúde 0,1; comitê de liga 0,3)', max: 2, f: q => mn(2, .1 * q(['congresso_part']) + .1 * q(['voluntario']) + .3 * q(['congresso_org'])), t: 'congresso_part' },
    ] },
  { id: 'ucpel', nome: 'UCPel / HUSFP (Pelotas) 2027', uf: 'RS', peso: 10, max: 10, esc: '0 a 10', pdf: 'ixAohevaQlsvW7hJXwM2.pdf', lido: 'completo',
    nota: 'Só contam documentos de 25/08/2021 a 23/11/2026. Sem enviar o formulário (Anexo II) a nota é zero, sem eliminação.',
    itens: [
      { id: 'proj', nome: 'Projetos, extensão, vivências, monitorias, ligas (40 a 120h 0,25; 121 a 300h 0,5; >300h 1,0 por certificado)', max: 3, f: q => mn(3, .25 * q(['monitoria', 'extensao', 'liga'], a => (a.horas || 0) >= 40 && (a.horas || 0) <= 120) + .5 * q(['monitoria', 'extensao', 'liga'], a => (a.horas || 0) > 120 && (a.horas || 0) <= 300) + 1 * q(['monitoria', 'extensao', 'liga'], a => (a.horas || 0) > 300)), t: 'monitoria', dica: 'Informe a carga horária de cada atividade.' },
      { id: 'bolsa', nome: 'Bolsa de iniciação científica (0,25 por projeto)', max: .5, f: q => mn(.5, .25 * q(['ic_bolsa'])), t: 'ic_bolsa' },
      { id: 'org', nome: 'Organização de eventos, mín. 40h (0,25 cada)', max: 1, f: q => mn(1, .25 * q(['congresso_org'], a => (a.horas || 0) >= 40)), t: 'congresso_org' },
      { id: 'ing', nome: 'Proficiência em língua estrangeira (0,25 cada)', max: .5, f: q => mn(.5, .25 * q(['idioma'])), t: 'idioma' },
      { id: 'apr', nome: 'Apresentação de trabalho ou resumo em anais (0,25 por trabalho)', max: 1.5, f: q => mn(1.5, .25 * q(['oral', 'poster', 'resumo_anais'])), t: 'poster' },
      { id: 'pub', nome: 'Artigo indexado com DOI (1º autor 1,0; outra posição 0,5) e livro/capítulo (0,5)', max: 2, f: q => mn(2, q(ART, a => (a.autoria || 1) === 1) + .5 * q(ART, a => (a.autoria || 1) > 1) + .5 * q(['livro'])), t: 'artigo_pubmed' },
      { id: 'sv', nome: 'ATLS/ACLS/PALS/ALSO/PHTLS no prazo (0,5 cada)', max: 1, f: q => mn(1, .5 * q(['suporte_vida'])), t: 'suporte_vida' },
    ] },
  { id: 'scmgf', nome: 'Santa Casa de Maringá 2027', uf: 'PR', peso: 'Fase 2', max: 10, esc: '0 a 10', pdf: 'scm_edital2027.pdf', lido: 'completo',
    nota: 'Currículo impresso, encadernado, entregue presencialmente. Zero se faltar documento ou prazo, sem eliminação. O histórico vale pelo Enade (nota 4 ou 5: até 3,0; nota 3: até 2,0).',
    itens: [
      { id: 'enade', nome: 'Histórico universitário pelo Enade (4 ou 5 = 3,0; 3 = 2,0)', max: 3, f: (q, P) => P.enade >= 4 ? 3 : P.enade === 3 ? 2 : 0, perfil: true, dica: 'Informe o conceito Enade da faculdade no Perfil.' },
      { id: 'mon', nome: 'Monitoria (0,25 cada)', max: .5, f: q => mn(.5, .25 * q(['monitoria'])), t: 'monitoria' },
      { id: 'est', nome: 'Estágios extracurriculares (0,2 cada)', max: .4, f: q => mn(.4, .2 * q(['estagio_ext'])), t: 'estagio_ext' },
      { id: 'ic', nome: 'Iniciação científica (0,5 cada)', max: 1, f: q => mn(1, .5 * q(['ic_bolsa', 'ic_sem'])), t: 'ic_bolsa' },
      { id: 'art', nome: 'Artigo indexado (0,4 cada; não indexado 0,2, máx. 0,4)', max: 1.2, f: q => mn(.8, .4 * q(ARTIDX)) + mn(.4, .2 * q(['artigo_outro'])), t: 'artigo_pubmed' },
      { id: 'liv', nome: 'Capítulo de livro (0,10 cada)', max: .2, f: q => mn(.2, .1 * q(['livro'])), t: 'livro' },
      { id: 'apr', nome: 'Oral 0,25 (máx. 0,5); pôster 0,1 (máx. 0,5); anais 0,25 (máx. 0,5)', max: 1.5, f: q => mn(.5, .25 * q(['oral'])) + mn(.5, .1 * q(['poster'])) + mn(.5, .25 * q(['resumo_anais'])), t: 'oral' },
      { id: 'ev', nome: 'Participação em eventos científicos (aprox. 0,1 cada)', max: .5, f: q => mn(.5, .1 * q(['congresso_part'])), t: 'congresso_part', aprox: true },
      { id: 'sv', nome: 'ACLS/PALS/ATLS/PHTLS (0,1 cada)', max: .2, f: q => mn(.2, .1 * q(['suporte_vida'])), t: 'suporte_vida' },
      { id: 'ing', nome: 'Língua estrangeira (0,25 cada)', max: .5, f: q => mn(.5, .25 * q(['idioma'])), t: 'idioma' },
      { id: 'liga', nome: 'Liga acadêmica (coordenação 0,2; membro 0,1)', max: .3, f: q => mn(.3, .1 * q(['liga'])), t: 'liga', aprox: true },
    ] },
);
/* editais sem currículo pontuável ou sem barema publicado */
const EDITAIS_SEM = [
  ['Einstein (SP)', 'Currículo vale peso 1 de 10 (prova 5, prática 4). Critérios: IC por horas, artigos PubMed (1º ou último autor, DOI, fator de impacto) e pós-graduação stricto sensu. Os pesos saem em aditivo ainda não publicado.'],
  ['UERJ (acesso direto e pré-requisito)', 'Sem análise curricular no edital: seleção por prova.'],
  ['SES-SP (Seleção Pública do Estado)', 'Sem análise curricular no edital: seleção por prova. Há pontuação diferenciada para pretos, pardos e indígenas.'],
  ['HECI / PSU ES-Sul', 'Sem análise curricular no edital. Há bonificação de 10% do PRMFC por fase.'],
  ['HUV (Vassouras)', 'O Enamed (Proficiente) é a 1ª etapa eliminatória; a 2ª etapa sai em edital suplementar.'],
  ['ENARE', 'O Enamed é a prova. Não há currículo no edital nacional.'],
];
