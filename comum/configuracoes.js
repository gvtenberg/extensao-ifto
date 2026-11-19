// Configurações da extensão, guardadas no navegador (D5). Toda opção nova entra em PADROES.
(function (raiz) {
  const PADROES = Object.freeze({
    // v0.6.0: data de hoje, Nato-digital e Público em todo documento externo novo
    preencherDocumentoExterno: true,
    // v0.33.0: Tipo, Especificação e Interessados na tela do processo (lidos da página "Consultar/Alterar Processo")
    dadosDoProcesso: true,
    // v0.27.0 (spec base-e-sei, etapa 2): valores do documento externo novo. Nível "publico" ou "restrito"
    // (com a hipótese legal: parte do nome dela na lista do SEI); formato "nato" ou "digitalizado" (com o
    // tipo de conferência: nome na lista do SEI; vazio = a pessoa escolhe).
    externoNivel: 'publico',
    externoHipoteseLegal: '',
    externoFormato: 'nato',
    externoConferencia: '',
    // D14: tipo pelo nome do arquivo; depois as regras da pessoa ({ contem, tipo }); depois o tipo padrão.
    externoTipoPadrao: '',
    externoRegras: Object.freeze([]),
    // D7: "Nome na Árvore" a partir do nome do arquivo. D9: "#" no nome do arquivo vira "_".
    externoNomeArvore: true,
    externoCorrigirNome: true,
    // v0.27.1 (etapa 3): arrastar arquivos para a árvore do processo (lista para conferir antes de incluir).
    // D6: data do documento = hoje; ligada, a data do arquivo (última modificação).
    arrastarArquivos: true,
    arrastarDataDoArquivo: false,
    senhaReconhecidaPeloNavegador: true,
    // v0.2.0: "automatica" (só na Direção-geral, PAL/REI/IFTO), "sempre" ou "desligada"
    listaAssinaturas: 'automatica',
    // v0.10.0: SICAF automático: "automatica" (notas sem SICAF, só na CGOC), "sempre" (botão "Incluir SICAF"
    // em qualquer unidade) ou "desligada". v0.18.0: o botão "Incluir Sicaf, Consulta e Anexo" (documentos em
    // branco) saiu; o botão das notas faz tudo. "sempre" = só "Incluir SICAF" (equipe de licitação).
    incluirSicaf: 'automatica',
    // v0.18.2: cópia de cada PDF buscado na pasta Downloads (o PDF vai para o SEI de qualquer jeito).
    copiaSicaf: true,
    copiaConsulta: true,
    // v0.19.0: peças do Compras IFTO no SEI: "automatica" (só na CCL), "sempre" ou "desligada".
    comprasIfto: 'automatica',
    // v0.21.3: clicar sozinho em SerproID na entrada do Gov.br (SICAF sem login). Desligada: precisa do
    // acesso opcional à página de login do Gov.br, que a pessoa dá ao ligar a opção.
    entrarComSerproId: false,
    // v0.22.0: botão "Remover marca MINUTA" no editor dos editais: "automatica" (só na Direção-geral),
    // "sempre" ou "desligada".
    minutaEdital: 'automatica',
    // v0.24.0: no editor do SEI, recortar e colar trecho com tabela sem perder a formatação, e a caixa
    // "Margens" na janela "Propriedades da tabela". Todas as unidades e todos os tipos de documento.
    moverTabelas: true,
    margensTabela: true,
    // v0.25.0: aviso "Corrigir a numeração" quando um item de edital tem o número longo demais ("10.10.").
    numeracaoEdital: true,
    // v0.26.0 (spec conferir-documento): conferir número do processo, timbre e rodapé e dar espaço entre as
    // partes do documento (todas ligadas, D10). "unidades": "Minhas unidades" (sigla, telefone, e-mail e
    // linhas do setor no timbre), só neste navegador.
    conferirProcesso: true,
    conferirTimbre: true,
    conferirRodape: true,
    // v0.26.9 (etapa 8): data do documento ainda não assinado (mês ou ano errado, dia que não chegou, padrão).
    conferirData: true,
    espacamentoDocumento: true,
    // v0.29.2 (spec todos-os-estilos, D4): todos os estilos em todos os documentos (texto principal), todas as unidades.
    todosOsEstilos: true,
    // v0.31.0 (spec copia-editor-sei, D5): salvamento automático do documento no editor (a cada 30 s, só neste
    // computador) e os botões "Copiar conteúdo" / "Colar conteúdo"; desligados até a pessoa ligar.
    salvamentoAutomatico: false,
    copiarColarConteudo: false,
    // v0.26.1 (D15): nomes de quem assinou podem ser selecionados e copiados na página do documento.
    copiarAssinaturas: true,
    // v0.30.0: menu de cópia do ícone do documento na árvore: todo clique copia, fecha 1 s depois, Esc e clique fora fecham.
    menuCopiar: true,
    unidades: Object.freeze([])
  })

  // Junta o que o usuário gravou com os padrões; opções que não existem mais são ignoradas.
  // v0.31.1: opções que mudaram de nome; quem já tinha ligado com o nome antigo continua com ela ligada.
  const NOMES_ANTIGOS = { copiaAutomatica: 'salvamentoAutomatico' }
  function comPadroes (gravadas) {
    const resultado = { ...PADROES }
    for (const [antigo, novo] of Object.entries(NOMES_ANTIGOS)) {
      if (gravadas && antigo in gravadas && !(novo in gravadas)) gravadas = { ...gravadas, [novo]: gravadas[antigo] }
    }
    for (const chave of Object.keys(PADROES)) {
      if (gravadas && chave in gravadas) resultado[chave] = gravadas[chave]
      // v0.26.0: listas são copiadas, para não mexer no padrão.
      if (Array.isArray(resultado[chave])) resultado[chave] = [...resultado[chave]]
    }
    return resultado
  }

  // Leitura e gravação no navegador (só existe dentro da extensão; Chrome usa "chrome").
  const navegador = () => raiz.browser || raiz.chrome
  async function lerConfiguracoes () {
    const { configuracoes } = await navegador().storage.local.get('configuracoes')
    return comPadroes(configuracoes)
  }
  async function gravarConfiguracoes (configuracoes) {
    await navegador().storage.local.set({ configuracoes: comPadroes(configuracoes) })
  }

  // v0.27.2 (spec base-e-sei, etapa 5; D5): cópia das configurações num arquivo, para guardar ou passar a um
  // colega. Vai tudo o que está em "configuracoes" (inclusive "Minhas unidades" e as regras do tipo pelo
  // nome do arquivo); permissões do navegador não vão (cada pessoa permite no próprio navegador).
  const MARCA_ARQUIVO = 'extensao-ifto-configuracoes'
  function paraArquivo (configuracoes, versao = '', agora = new Date()) {
    return JSON.stringify({ marca: MARCA_ARQUIVO, versao, data: agora.toISOString(), configuracoes: comPadroes(configuracoes) }, null, 2)
  }
  // Nome do arquivo: configuracoes-extensao-ifto-2026-11-18.json
  function nomeDoArquivo (agora = new Date()) {
    const dois = n => String(n).padStart(2, '0')
    return `configuracoes-extensao-ifto-${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}.json`
  }
  // Lê o arquivo: só aceita o arquivo da extensão; cada opção só entra se for do mesmo tipo do padrão (sim/não,
  // texto ou lista); opções que não existem nesta versão são ignoradas. Erro com texto simples para a pessoa.
  function doArquivo (texto) {
    let lido
    try { lido = JSON.parse(String(texto || '').replace(/^﻿/, '')) } catch (erro) { lido = null }
    if (!lido || typeof lido !== 'object' || lido.marca !== MARCA_ARQUIVO || !lido.configuracoes || typeof lido.configuracoes !== 'object') {
      throw new Error('Este arquivo não é uma cópia das configurações da extensão. Escolha o arquivo baixado em "Baixar cópia das configurações".')
    }
    const aceitas = {}
    const ignoradas = []
    for (const [chave, valor] of Object.entries(lido.configuracoes)) {
      if (!(chave in PADROES)) continue
      const padrao = PADROES[chave]
      const mesmoTipo = Array.isArray(padrao)
        ? Array.isArray(valor) && valor.every(item => item && typeof item === 'object' && !Array.isArray(item))
        : typeof valor === typeof padrao
      if (mesmoTipo) aceitas[chave] = valor
      else ignoradas.push(chave)
    }
    return { configuracoes: comPadroes(aceitas), ignoradas, versao: String(lido.versao || ''), data: String(lido.data || '') }
  }

  const api = { PADROES, comPadroes, lerConfiguracoes, gravarConfiguracoes, paraArquivo, nomeDoArquivo, doArquivo }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { configuracoes: api })
})(globalThis)
