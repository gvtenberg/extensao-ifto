// v0.38.0 (saiu de fundo.js): código posto na página do editor do SEI (world MAIN) para cada ajuda do editor:
// tabelas, numeração, caixas, AGU, digitação, estilos, salvamento, espaçamento, MINUTA, conferir, data.
// v0.22.0 (spec minuta-edital): lê o texto do editor; com "remover", tira a marca MINUTA das seções editáveis
// e confere de novo. Nunca salva: a pessoa confere e clica em Salvar.
// Devolve { ok, erro, marcas, removidas, restou, trechos }.
// v0.23.0: roda uma das funções de editor-minuta.js na janela do editor de onde veio o recado (MINUTA e data).
function rodarNoEditor (remetente) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  return async (func, args = []) => {
    const [execucao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func, args })
    return (execucao && execucao.result) || { ok: false, erro: 'O editor do SEI não respondeu.' }
  }
}

// v0.24.0 (spec tabelas-editor): põe as regras das margens e o código das tabelas dentro da página do editor
// (world MAIN) e liga o que a pessoa deixou ligado nas configurações.
async function tabelasNoEditor (remetente, recado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['comum/tabelas-editor.js', 'sites/sei/editor-tabelas.js'] })
  return rodarNoEditor(remetente)(opcoes => globalThis.ExtensaoIFTO.editorTabelas.preparar(opcoes), [{ mover: Boolean(recado.mover), margens: Boolean(recado.margens) }])
}

// v0.25.0 (spec numeracao-edital): põe as regras e o código da numeração dentro da página do editor (world
// MAIN); "preparar" procura os itens quebrados e fica de olho nas mudanças, "corrigir" põe o bloco de estilo.
async function numeracaoNoEditor (remetente, corrigir) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (!corrigir) await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['comum/numeracao-edital.js', 'sites/sei/editor-numeracao.js'] })
  return rodarNoEditor(remetente)(fazer => fazer ? globalThis.ExtensaoIFTO.editorNumeracao.corrigir() : globalThis.ExtensaoIFTO.editorNumeracao.preparar(), [corrigir])
}

// v0.37.0 (spec numeracao-caixas-ocultas): põe na página do editor (world MAIN) as regras e o código das caixas
// escondidas e dos números digitados (reusa acharEditor da numeração). "preparar" procura e fica de olho nas
// mudanças; "tirar", "listar", "ir" e "converter" só com o clique da pessoa. Nunca salva.
async function caixasNoEditor (remetente, acao, dado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (acao === 'preparar') {
    const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
    const arquivos = ['comum/numeracao-digitada.js', 'sites/sei/editor-caixas.js']
    if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
    await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  }
  const acoes = ['preparar', 'tirar', 'listar', 'ir', 'converter']
  if (!acoes.includes(acao)) return { ok: false, erro: 'Pedido desconhecido.' }
  return rodarNoEditor(remetente)((qual, valor) => {
    const caixas = globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorCaixas
    if (!caixas) return { ok: false, erro: 'A extensão ainda não estava pronta no editor. Feche o editor e abra de novo.' }
    const mapa = { preparar: () => caixas.preparar(), tirar: () => caixas.tirar(), listar: () => caixas.listar(), ir: () => caixas.irPara(valor), converter: () => caixas.converter(valor) }
    return mapa[qual]()
  }, [acao, dado === undefined ? null : dado])
}

// v0.37.0 (spec remover-formatacao-agu): põe na página do editor (world MAIN) as regras e o código das marcas
// da AGU (reusa acharEditor da numeração e o destaque e as partes editáveis das caixas escondidas, sem carregar de
// novo o que já está lá). "preparar" procura e fica de olho nas mudanças; "listar", "ir" e "remover" só com o
// clique da pessoa. Nunca salva.
async function aguNoEditor (remetente, acao, dado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (acao === 'preparar') {
    const [ja] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => { const e = globalThis.ExtensaoIFTO || {}; return { numeracao: Boolean(e.editorNumeracao), caixas: Boolean(e.editorCaixas && e.editorCaixas.destacar) } } })
    const tem = (ja && ja.result) || {}
    const arquivos = ['comum/formatacao-agu.js', 'sites/sei/editor-agu.js']
    if (!tem.caixas) arquivos.unshift('comum/numeracao-digitada.js', 'sites/sei/editor-caixas.js')
    if (!tem.numeracao) arquivos.unshift('sites/sei/editor-numeracao.js')
    await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  }
  const acoes = ['preparar', 'listar', 'ir', 'remover']
  if (!acoes.includes(acao)) return { ok: false, erro: 'Pedido desconhecido.' }
  return rodarNoEditor(remetente)((qual, valor) => {
    const agu = globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorAgu
    if (!agu) return { ok: false, erro: 'A extensão ainda não estava pronta no editor. Feche o editor e abra de novo.' }
    const mapa = { preparar: () => agu.preparar(), listar: () => agu.listar(), ir: () => agu.irPara(valor), remover: () => agu.remover(valor) }
    return mapa[qual]()
  }, [acao, dado === undefined ? null : dado])
}

// v0.38.0 (#355): ajustes de digitação no editor (valor por extenso, linha em branco, lista de estilos).
async function digitacaoNoEditor (remetente) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
  const arquivos = ['sites/sei/editor-digitacao.js']
  if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  return rodarNoEditor(remetente)(() => globalThis.ExtensaoIFTO.editorDigitacao.preparar(), [])
}

// v0.29.0 (spec todos-os-estilos): põe na página do editor (world MAIN) as regras e o código dos estilos extras
// (reusa acharEditor da numeração) e junta os estilos que faltam ao tipo de documento.
async function estilosNoEditor (remetente, aprendidos) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
  const arquivos = ['comum/todos-os-estilos.js', 'sites/sei/editor-estilos.js']
  if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  return rodarNoEditor(remetente)(lista => globalThis.ExtensaoIFTO.editorEstilos.preparar(lista), [aprendidos || {}])
}

// v0.31.0 (spec copia-editor-sei): põe na página do editor (world MAIN) o código da cópia; lê o texto e os
// comentários ou recarrega o editor com uma cópia (nunca salva).
async function salvamentoNoEditor (remetente, acao, dado) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  // v0.31.2: põe o código antes de toda leitura (nenhuma tela pedia "preparar", e o editor "não respondia";
  // o arquivo não se carrega duas vezes).
  await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: ['sites/sei/editor-salvamento.js'] })
  const rodar = rodarNoEditor(remetente)
  if (acao === 'montar') return rodar((secoes, comentarios) => globalThis.ExtensaoIFTO.editorSalvamento.montar(secoes, comentarios), [dado.secoes || {}, dado.comentarios || []])
  return rodar(desde => globalThis.ExtensaoIFTO.editorSalvamento.ler(desde), [Boolean(dado)])
}

// v0.26.11 (spec conferir-documento, etapa 7): põe na página do editor (world MAIN) o código que mede as partes
// do documento e põe ou tira o bloco de estilo do espaçamento (reusa acharEditor e porBloco da numeração).
async function espacamentoNoEditor (remetente, acao, bloco = '', substituir = false) {
  const alvo = { tabId: remetente.tab.id, frameIds: [remetente.frameId || 0] }
  if (acao === 'medir') {
    const [temNumeracao] = await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', func: () => Boolean(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.editorNumeracao) })
    const arquivos = ['comum/espacamento-documento.js', 'sites/sei/editor-espacamento.js']
    if (!(temNumeracao && temNumeracao.result)) arquivos.unshift('sites/sei/editor-numeracao.js')
    await navegador.scripting.executeScript({ target: alvo, world: 'MAIN', files: arquivos })
  }
  return rodarNoEditor(remetente)((qual, texto, trocar) => globalThis.ExtensaoIFTO.editorEspacamento[qual](texto, trocar), [acao, bloco, Boolean(substituir)])
}

async function minutaNoEditor (remetente, remover) {
  const regrasMinuta = globalThis.ExtensaoIFTO.minutaEdital
  const rodar = rodarNoEditor(remetente)
  const contar = secoes => secoes.filter(secao => regrasMinuta.temMarcaMinuta(secao.html)).length
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const marcas = contar(lido.secoes)
  if (!remover || !marcas) return { ok: true, marcas, removidas: 0, restou: marcas, trechos: [] }
  const mudancas = {}
  let removidas = 0
  for (const secao of lido.secoes) {
    if (!secao.editavel || !regrasMinuta.temMarcaMinuta(secao.html)) continue
    const limpo = regrasMinuta.tirarMarcaMinuta(secao.html)
    mudancas[secao.nome] = limpo.html
    removidas += limpo.removidas
  }
  if (!removidas) return { ok: false, erro: 'A marca está numa parte do documento que não dá para editar.', marcas }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [mudancas])
  if (!gravado.ok) return { ok: false, erro: gravado.erro, marcas }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const secoes = depois.ok ? depois.secoes : []
  const trechos = secoes.flatMap(secao => regrasMinuta.minutaNoTexto(secao.html)).slice(0, 3)
  return { ok: true, marcas, removidas, restou: depois.ok ? contar(secoes) : 0, trechos }
}

// v0.26.2 (spec conferir-documento): confere o texto do editor; com "qual" corrige só aquela parte e confere
// de novo. Nunca salva. 'processo': troca o número só na linha "Processo nº:". v0.26.5: 'timbre' e 'rodape'
// (só em unidades do Campus Palmas; dados da unidade em "Minhas unidades").
// v0.33.0: 'capa' (Data de Autuação, Tipo, Especificação e Interessados da Capa de Processo).
// v0.35.2: 'cargo' e 'italico'.
// Devolve { ok, erro, processo, timbre, rodape, capa, cargo, italico } (cada um null quando não há o que conferir).
async function conferirNoEditor (remetente, recado) {
  const regras = globalThis.ExtensaoIFTO.conferirDocumento
  const opcoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  const sigla = regras.siglaDaUnidade(recado.sigla)
  const palmas = regras.ehUnidadePalmas(sigla)
  const unidade = regras.acharUnidade(opcoes.unidades, sigla)
  const rodar = rodarNoEditor(remetente)
  // v0.33.0: Capa de Processo contra os dados do processo guardados pela tela do processo (dados-processo.js).
  const dadosProcesso = globalThis.ExtensaoIFTO.dadosProcesso
  const guardados = opcoes.conferirProcesso ? ((await navegador.storage.local.get(dadosProcesso.CHAVE))[dadosProcesso.CHAVE] || {}) : {}
  const capaDe = secoes => {
    const capa = dadosProcesso.lerCapa(secoes)
    const dados = capa && guardados[regras.processoDaReferencia(secoes)]
    const conferido = dados ? dadosProcesso.conferirCapa(capa, dados) : null
    return conferido ? { ...conferido, secao: capa.secao, avisos: dadosProcesso.avisosDaCapa(conferido), dados } : null
  }
  const conferir = secoes => ({
    processo: opcoes.conferirProcesso ? regras.conferirProcesso(secoes) : null,
    timbre: palmas && opcoes.conferirTimbre ? regras.conferirTimbre(secoes, unidade, sigla) : null,
    rodape: palmas && opcoes.conferirRodape ? regras.conferirRodape(secoes, unidade) : null,
    capa: opcoes.conferirProcesso ? capaDe(secoes) : null,
    // v0.35.3: o que dá para guardar em "Minhas unidades" (unidade sem timbre ou sem rodapé guardado).
    sugestao: palmas ? regras.sugerirUnidade(secoes, unidade, { timbre: opcoes.conferirTimbre, rodape: opcoes.conferirRodape }) : null,
    // v0.35.2: cargo da diretora-geral (só PAL/REI/IFTO) e "Campus"/"Campi" em itálico (toda unidade).
    cargo: opcoes.conferirCargo ? regras.conferirCargo(secoes, sigla, opcoes.cargosPorUnidade) : null,
    italico: opcoes.conferirItalico ? regras.conferirItalico(secoes) : null
  })
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const antes = conferir(lido.secoes)
  const qual = recado.qual
  if (!qual || !antes[qual] || antes[qual].certo) return { ok: true, ...antes }
  let secao = null
  let novo = null
  if (qual === 'processo') {
    secao = lido.secoes.find(outra => outra.nome === antes.processo.secao)
    novo = secao && !antes.processo.link && regras.corrigirProcesso(secao.html, antes.processo.processo)
  } else if (qual === 'timbre') {
    secao = regras.secaoCom(lido.secoes, regras.ehDoTimbre)
    novo = secao && regras.corrigirTimbre(secao.html, antes.timbre.esperado)
  } else if (qual === 'capa') {
    secao = lido.secoes.find(outra => outra.nome === antes.capa.secao)
    novo = secao && dadosProcesso.corrigirCapa(secao.html, antes.capa.dados, antes.capa)
  } else if (qual === 'rodape') {
    secao = regras.secaoCom(lido.secoes, regras.ehDoRodape)
    novo = secao && regras.corrigirRodape(secao.html, unidade)
  }
  if (qual === 'cargo') {
    secao = lido.secoes.find(outra => outra.nome === antes.cargo.secao)
    novo = secao && regras.corrigirCargo(secao.html, antes.cargo)
  }
  // O itálico pode estar em várias partes do documento.
  let mudancas = {}
  if (qual === 'italico') mudancas = regras.corrigirItalico(lido.secoes)
  else if (secao && secao.editavel && novo) mudancas = { [secao.nome]: novo }
  if (!Object.keys(mudancas).length) return { ok: false, erro: 'Essa parte do documento não dá para mudar no editor.' }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [mudancas])
  if (!gravado.ok) return { ok: false, erro: gravado.erro }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const conferido = depois.ok ? conferir(depois.secoes) : null
  const ficou = conferido && conferido[qual] && (conferido[qual].certo || (qual === 'italico' && conferido.italico.quantos === conferido.italico.travados))
  if (!ficou) return { ok: false, erro: 'O editor não ficou com o texto novo.' }
  return { ok: true, ...conferido }
}

// v0.23.0 (spec data-documento): data do Ofício e da Portaria. v0.26.9 (spec conferir-documento, etapa 8):
// confere a data de todo documento (mês ou ano errado, dia que não chegou ou, v0.34.2, que já passou,
// fora do padrão). Com "trocar", corrige só essa data e confere de novo. Nunca salva.
// Devolve { ok, erro, conferido, nova }.
async function dataNoEditor (remetente, trocar, titulo) {
  const regras = globalThis.ExtensaoIFTO.dataDocumento
  const rodar = rodarNoEditor(remetente)
  const hoje = new Date()
  const conferir = secoes => regras.conferirData(secoes, hoje)
  const lido = await rodar(globalThis.ExtensaoIFTO.editorLer)
  if (!lido.ok) return { ok: false, erro: lido.erro }
  const conferido = conferir(lido.secoes)
  if (!trocar || !conferido || conferido.certo) return { ok: true, conferido }
  const secao = lido.secoes.find(outra => outra.nome === conferido.secao)
  const novo = secao && regras.corrigirData(secao.html, conferido)
  if (!novo) return { ok: false, erro: 'Não achei a data no texto do editor.' }
  const gravado = await rodar(globalThis.ExtensaoIFTO.editorGravar, [{ [secao.nome]: novo }])
  if (!gravado.ok) return { ok: false, erro: gravado.erro }
  const depois = await rodar(globalThis.ExtensaoIFTO.editorLer)
  const agora = depois.ok ? conferir(depois.secoes) : null
  if (!depois.ok || (agora && !agora.certo && agora.texto === conferido.texto)) return { ok: false, erro: 'O editor não ficou com a data nova.' }
  return { ok: true, conferido: agora, nova: conferido.nova }
}
