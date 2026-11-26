// Regras de leitura das páginas do SEI, sem depender da página (testáveis no computador).
// Base: SEI++ (https://github.com/jonatasrs/sei, GPL-3.0), getSeiVersion.js.
(function (raiz) {
  // Versão do SEI a partir do endereço do script "js/sei.js?<versão>"; sempre com 4 números.
  function versaoDoSei (enderecoDoScript) {
    const achado = /\?([^=-]+)/.exec(enderecoDoScript || '')
    if (!achado) return null
    const numeros = achado[1].split('.').slice(0, 4)
    while (numeros.length < 4) numeros.push('0')
    return numeros.join('.')
  }

  // v0.17.6: versão do SEI em que a extensão foi testada (só os três primeiros números contam).
  const VERSAO_SEI_TESTADA = '5.0.4'
  function seiTestado (versao) {
    return (versao || '').split('.').slice(0, 3).join('.') === VERSAO_SEI_TESTADA
  }

  // v0.28.0 (spec aviso-versao-sei): SEI numa versão não testada. A pessoa escolhe continuar ou desativar a
  // extensão no SEI; a escolha vale só para aquela versão (D3). Versão testada: sempre ligada, sem aviso.
  // Devolve 'testado', 'perguntar', 'ligada' ou 'desligada'.
  const tresNumeros = versao => String(versao || '').split('.').slice(0, 3).join('.')
  function estadoNoSei (versao, escolha) {
    if (!versao || seiTestado(versao)) return 'testado'
    if (!escolha || tresNumeros(escolha.versao) !== tresNumeros(versao)) return 'perguntar'
    return escolha.ligada ? 'ligada' : 'desligada'
  }

  // Leitura e gravação da escolha no navegador (só dentro da extensão). A versão vem da própria página
  // (script "js/sei.js?...") ou, nas páginas sem ele (janelas, quadros), da última vista (seiVisto).
  const navegador = () => raiz.browser || raiz.chrome
  async function estadoAtualNoSei () {
    const { seiVisto, seiEscolha } = await navegador().storage.local.get(['seiVisto', 'seiEscolha'])
    const script = raiz.document && raiz.document.querySelector('script[src^="js/sei.js?"]')
    const versao = (script && versaoDoSei(script.getAttribute('src'))) || (seiVisto && seiVisto.versao) || null
    return { versao, estado: estadoNoSei(versao, seiEscolha) }
  }
  // D2: desativada, nenhuma função da extensão age no SEI. Cada script do SEI espera esta resposta antes de agir.
  async function ligadaNoSei () {
    try { return (await estadoAtualNoSei()).estado !== 'desligada' } catch (erro) { return true }
  }
  async function gravarEscolhaNoSei (versao, ligada) {
    await navegador().storage.local.set({ seiEscolha: { versao: tresNumeros(versao), ligada: Boolean(ligada), em: new Date().toISOString() } })
  }

  // v0.1.1: o SEI 5 troca o campo de senha por um campo de texto que mostra "●" (MaskedPassword) e guarda
  // a senha num campo escondido; assim o navegador não reconhece a senha. A extensão volta a pôr um campo
  // de senha de verdade, com os mesmos atributos do campo visível (tabindex, onkeypress, maxlength...).
  const ATRIBUTOS_DESCARTADOS = ['type', 'name', 'value', 'autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']
  function atributosDoCampoDeSenha (atributos, nome) {
    const resultado = []
    for (const { name, value } of atributos || []) {
      const chave = name.toLowerCase()
      if (ATRIBUTOS_DESCARTADOS.includes(chave) || chave.startsWith('_')) continue
      if (chave === 'class') {
        const classes = value.split(/\s+/).filter(c => c && c !== 'masked').join(' ')
        if (classes) resultado.push(['class', classes])
        continue
      }
      resultado.push([name, value])
    }
    resultado.push(['type', 'password'], ['name', nome || 'pwdSenha'], ['autocomplete', 'current-password'])
    return resultado
  }

  // v0.8.0 (em comum/sei.js desde v0.9.2, usada também pela lista de assinaturas): lê a árvore do processo a partir do script do quadro da árvore (Nos[n] = new infraArvoreNo(...)).
  // Externo com arquivo: tem o link de baixar (documento_download_anexo) ou o ícone de PDF; feito no SEI:
  // ícone documento_interno. Em branco: ícone documento_sem_conteudo (visto no SEI 5.0.4) ou externo sem
  // nenhum dos sinais acima.
  function lerArgumentos (texto) {
    const valores = []
    const padrao = /"((?:[^"\\]|\\.)*)"|(null|true|false|-?\d+)/g
    let achado
    while ((achado = padrao.exec(texto))) {
      const [, entreAspas, solto] = achado
      if (entreAspas !== undefined) valores.push(entreAspas.replace(/\\(.)/g, '$1'))
      else valores.push(solto === 'null' ? null : solto)
    }
    return valores
  }
  // v0.36.1: link da árvore do processo já com um documento escolhido (o SEI o devolve depois de salvar).
  function linkDaArvoreComDocumento (html) {
    const achado = /controlador\.php\?acao=procedimento_visualizar[^"'\s<>\\]*?[?&](?:amp;)?id_documento=(\d+)[^"'\s<>\\]*/.exec(html || '')
    return achado ? { id: achado[1], link: achado[0].replace(/&amp;/g, '&') } : null
  }
  // Qual documento abrir depois de incluir vários: o primeiro da árvore (número interno menor, o mais antigo).
  // salvos: [{ id, link }]; sem nenhum, o primeiro da árvore nova que não existia antes (antes e depois: ids).
  function primeiroIncluido (salvos, antes, depois) {
    const numero = id => Number(id) || 0
    const comId = (salvos || []).filter(salvo => salvo && numero(salvo.id))
    if (comId.length) return comId.reduce((a, b) => numero(b.id) < numero(a.id) ? b : a)
    const maior = Math.max(0, ...(antes || []).map(numero))
    const novo = (depois || []).find(id => numero(id) > maior)
    return novo ? { id: novo } : null
  }

  function lerArvore (textoDoScript) {
    const texto = textoDoScript || ''
    const nos = {}
    const padraoNo = /Nos\[(\d+)\]\s*=\s*new infraArvoreNo\((.*?)\);?\s*\n/g
    let achado
    while ((achado = padraoNo.exec(texto))) {
      const [tipo, id, pai, linkArvore, , rotulo, , icone] = lerArgumentos(achado[2])
      nos[achado[1]] = { tipo, id, pai, linkArvore: linkArvore || '', rotulo: rotulo || '', icone: icone || '', src: '' }
    }
    const padraoSrc = /Nos\[(\d+)\]\.src\s*=\s*'([^']*)'/g
    while ((achado = padraoSrc.exec(texto))) if (nos[achado[1]]) nos[achado[1]].src = achado[2]
    // v0.16.0: ícones de ação do documento (link "Consultar/Alterar Documento Externo").
    const padraoAcoes = /Nos\[(\d+)\]\.acoes\s*=\s*'((?:[^'\\]|\\.)*)'/g
    while ((achado = padraoAcoes.exec(texto))) if (nos[achado[1]]) nos[achado[1]].acoes = achado[2]
    // v0.35.0: quem já assinou cada documento ("Assinado por:\nNome\nCargo\nUnidade"), linha por linha.
    const assinaturas = {}
    const padraoAssinatura = /new infraArvoreAcao\("ASSINATURA",\s*"[^"]*",\s*"(\d+)",((?:"(?:[^"\\]|\\.)*"|[^"\n])*?)\);/g
    while ((achado = padraoAssinatura.exec(texto))) {
      const textoDaDica = lerArgumentos(achado[2].replace(/\\r?\\n|\\n/g, '\u2028')).find(valor => /^\s*(Assinado|Autenticado)/.test(valor || '')) || ''
      assinaturas[achado[1]] = textoDaDica.split('\u2028').map(linha => linha.trim()).filter(Boolean)
    }
    const lista = Object.values(nos)
    const processo = lista.find(no => no.tipo === 'PROCESSO')
    const documentos = lista.filter(no => no.tipo === 'DOCUMENTO').map(no => ({
      id: no.id,
      rotulo: no.rotulo,
      feitoNoSei: /documento_interno/.test(no.icone),
      semConteudo: /documento_sem_conteudo/.test(no.icone),
      temArquivo: /documento_download_anexo/.test(no.src) || /documento_pdf/.test(no.icone),
      // v0.10.0: endereço do documento (ver o texto ou baixar o arquivo), para o SICAF automático.
      link: no.src.replace(/&amp;/g, '&'),
      // v0.20.0: página do documento na árvore (com os botões dele, como "Editar Conteúdo"), para o Compras IFTO.
      linkArvore: no.linkArvore.replace(/&amp;/g, '&'),
      // v0.35.0: lista para a direção: só documentos que esta unidade pode assinar (feitos nela ou recebidos em bloco).
      podeAssinar: /title="Assinar Documento"/.test(no.acoes || ''),
      assinaturas: assinaturas[no.id] || [],
      // v0.36.0: "Consultar/Alterar Documento" do documento feito no SEI (duplicar documento, só leitura).
      linkCadastro: ((/href="(controlador\.php\?acao=documento_alterar&[^"]*)"/.exec(no.acoes || '') || [])[1] || '').replace(/&amp;/g, '&'),
      // v0.16.0: alterar o documento externo (preencher Sicaf e Anexo em branco).
      linkAlterar: ((/href="(controlador\.php\?acao=documento_alterar_recebido[^"]*)"/.exec(no.acoes || '') || [])[1] || '').replace(/&amp;/g, '&')
    }))
    const link = padrao => ((padrao.exec(texto) || [])[1] || '').replace(/&amp;/g, '&')
    const acoesDoProcesso = (processo && processo.acoes) || ''
    return {
      idProcesso: processo ? processo.id : null,
      numero: processo ? processo.rotulo : null,
      documentos,
      // v0.35.0: "Atribuir Processo" (só com o processo aberto na unidade) e "Abrir todas as Pastas".
      linkAtribuir: ((/href="(controlador\.php\?acao=procedimento_atribuicao_cadastrar[^"]*)"/.exec(acoesDoProcesso) || [])[1] || '').replace(/&amp;/g, '&'),
      linkAbrirPastas: link(/infraArvoreAcao\("ABRIR_PASTAS",\s*"[^"]*",\s*"[^"]*",\s*"([^"]*)"/)
    }
  }

  // v0.9.2: opção de uma função nas configurações: "automatica" (só na unidade dela), "sempre" ou
  // "desligada". A mesma regra serve à lista de assinaturas e aos documentos do pagamento.
  function ligadaNaUnidade (opcao, unidadeAberta, unidadeDaFuncao) {
    if (opcao === 'sempre') return true
    if (opcao === 'desligada') return false
    return String(unidadeAberta || '').trim().toUpperCase() === unidadeDaFuncao
  }

  // v0.14.0 (v0.17.0: em comum/sei.js, vale para todo documento externo): "Nome na Árvore" do SEI tem no
  // máximo 50 letras (maxlength="50"): corta na última palavra inteira e tira ponto ou vírgula do fim.
  function nomeNaArvore (texto, maximo = 50) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim()
    if (limpo.length <= maximo) return limpo
    const cortado = limpo.slice(0, maximo + 1)
    const espaco = cortado.lastIndexOf(' ')
    return (espaco > 0 ? cortado.slice(0, espaco) : limpo.slice(0, maximo)).replace(/[\s.,;:-]+$/, '')
  }

  // O endereço pode ter só o número da unidade (nome gravado pelas páginas do SEI); senão, vem da página do SEI em
  // volta ou da janela que abriu o editor (v0.22.0; v0.35.2: veio de caixa-editor.js, para a conferência ao assinar).
  async function unidadeAberta () {
    const numero = numeroDaUnidade(location.href)
    const { unidadesSei = {} } = await navegador().storage.local.get('unidadesSei')
    if (numero && unidadesSei[numero]) return unidadesSei[numero]
    for (const janela of [window.opener, window.top]) {
      try {
        const campo = janela && janela.top.document.getElementById('lnkInfraUnidade')
        if (campo) return campo.textContent.trim()
      } catch (erro) {
        // Janela de outro site ou já fechada: tenta a próxima.
      }
    }
    return ''
  }

  // v0.22.0: unidade do SEI pelo número dela (infra_unidade_atual), lido no endereço ou no link da unidade.
  function numeroDaUnidade (texto) {
    const achado = /[?&;]infra_unidade_atual=(\d+)/.exec(String(texto || ''))
    return achado ? achado[1] : ''
  }

  // v0.22.0: Direção-geral (Gabinete) em um lugar só: lista de assinaturas e marca MINUTA dos editais.
  const UNIDADE_DIRECAO_GERAL = 'PAL/REI/IFTO'
  // v0.37.0: equipe de licitação (CCL): "Remover Formatação da AGU" (o Compras IFTO tem a mesma sigla em comum/compras-ifto.js).
  const UNIDADE_CCL = 'CCL/GAC/DAP/PAL/REI/IFTO'

  // v0.23.0: tipo do documento pelo título da janela do editor ("SEI/IFTO - 3163788 - Ofício"): a parte
  // depois do número. Usado pela marca MINUTA (Edital) e pela data de hoje (Ofício, Portaria).
  function tipoDoDocumento (titulo) {
    const partes = String(titulo || '').split(/\s+[-–]\s+/).slice(1)
    return (partes.find(parte => !/^\d+$/.test(parte.trim())) || '').trim()
  }

  const api = { linkDaArvoreComDocumento, primeiroIncluido, tipoDoDocumento, versaoDoSei, VERSAO_SEI_TESTADA, seiTestado, estadoNoSei, estadoAtualNoSei, ligadaNoSei, gravarEscolhaNoSei, atributosDoCampoDeSenha, lerArvore, ligadaNaUnidade, nomeNaArvore, numeroDaUnidade, UNIDADE_DIRECAO_GERAL, UNIDADE_CCL, unidadeAberta }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { sei: api })
})(globalThis)
