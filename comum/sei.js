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
    while ((achado = padrao.exec(texto))) valores.push(achado[1] !== undefined ? achado[1].replace(/\\(.)/g, '$1') : (achado[2] === 'null' ? null : achado[2]))
    return valores
  }
  function lerArvore (textoDoScript) {
    const texto = textoDoScript || ''
    const nos = {}
    const padraoNo = /Nos\[(\d+)\]\s*=\s*new infraArvoreNo\((.*?)\);?\s*\n/g
    let achado
    while ((achado = padraoNo.exec(texto))) {
      const [tipo, id, pai, , , rotulo, , icone] = lerArgumentos(achado[2])
      nos[achado[1]] = { tipo, id, pai, rotulo: rotulo || '', icone: icone || '', src: '' }
    }
    const padraoSrc = /Nos\[(\d+)\]\.src\s*=\s*'([^']*)'/g
    while ((achado = padraoSrc.exec(texto))) if (nos[achado[1]]) nos[achado[1]].src = achado[2]
    // v0.16.0: ícones de ação do documento (link "Consultar/Alterar Documento Externo").
    const padraoAcoes = /Nos\[(\d+)\]\.acoes\s*=\s*'((?:[^'\\]|\\.)*)'/g
    while ((achado = padraoAcoes.exec(texto))) if (nos[achado[1]]) nos[achado[1]].acoes = achado[2]
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
      // v0.16.0: alterar o documento externo (preencher Sicaf e Anexo em branco).
      linkAlterar: ((/href="(controlador\.php\?acao=documento_alterar_recebido[^"]*)"/.exec(no.acoes || '') || [])[1] || '').replace(/&amp;/g, '&')
    }))
    return { idProcesso: processo ? processo.id : null, numero: processo ? processo.rotulo : null, documentos }
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

  const api = { versaoDoSei, atributosDoCampoDeSenha, lerArvore, ligadaNaUnidade, nomeNaArvore }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { sei: api })
})(globalThis)
