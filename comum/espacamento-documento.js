// v0.26.11 (spec conferir-documento, etapa 7): espaço entre as partes do documento, em todo tipo. No SEI 5 as
// linhas do timbre e da assinatura têm altura de linha de 10% e os estilos "sem espaço" não têm margem, então
// número, data, "Processo nº", destinatário e o nome de quem assina ficam grudados. A parte da página
// (sites/sei/editor-espacamento.js) mede, no editor, a distância entre a última linha de cada parte e a
// primeira da seguinte; estas regras escolhem as distâncias menores que meia linha e montam um bloco de estilo
// escondido no texto (como v0.25.0, numeracao-edital.js; o SEI guarda e imprime o bloco), que põe uma linha de
// espaço só ali. Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const MARCA = 'extensao-ifto: espacamento'
  // Distâncias em "tamanho da letra": menos de meia linha é grudado; o espaço novo deixa uma linha inteira.
  const LIMITE = 0.5
  const LINHA = 1
  // v0.34.2 (Notificação 3394735): depois do timbre, uma linha e meia; depois do número do documento, uma linha
  // inteira mesmo quando já havia meia. Nesses dois lugares a distância menor que a desejada já recebe o espaço.
  const LINHA_DO_TIMBRE = 1.5
  const ehDoTimbre = bloco => (bloco.classes || []).some(classe => /^IFTO_Cabe(ç|&ccedil;)alho/i.test(classe))
  const ehIdentificador = bloco => /^Identificador/i.test(bloco.secao || '')
  function espacoDesejado (ultimo, bloco) {
    if (ultimo.raiz !== bloco.raiz && ehDoTimbre(ultimo)) return { limite: LINHA_DO_TIMBRE, linha: LINHA_DO_TIMBRE }
    if (ultimo.raiz !== bloco.raiz && ehIdentificador(ultimo)) return { limite: LINHA, linha: LINHA }
    return { limite: LIMITE, linha: LINHA }
  }

  const doNode = typeof module !== 'undefined' && module.exports
  const regrasData = () => doNode ? require('./data-documento.js') : raiz.ExtensaoIFTO.dataDocumento
  const regrasConferir = () => doNode ? require('./conferir-documento.js') : raiz.ExtensaoIFTO.conferirDocumento

  // O texto já tem o bloco? (o editor tira os atributos do <style>, o comentário fica)
  const temEspacamento = html => String(html || '').includes(MARCA)

  // Tira o bloco ("Desfazer"); o resto do texto fica igual.
  function tirarEspacamento (html) {
    return String(html || '').replace(/<style\b[^>]*>(?:(?!<\/style>)[\s\S])*?extensao-ifto: espacamento[\s\S]*?<\/style>/gi, '')
  }

  // Nome de classe ou de seção no CSS, só com letras sem acento (o "ç" vira "\0000e7"): o bloco não depende
  // da codificação da página nem leva aspas ou ">" (que o editor poderia trocar por "&gt;").
  function escapar (nome) {
    return String(nome).replace(/[^A-Za-z0-9_-]|^-?[0-9]/g, letra => {
      const digito = letra.length === 2 ? letra[1] : letra
      const antes = letra.length === 2 ? '-' : ''
      return antes + '\\' + digito.codePointAt(0).toString(16).padStart(6, '0')
    })
  }

  // Seletor de um bloco: "p.IFTO_Alin_direita" ou "div" (a caixa sem classe que junta "Processo/Interessado/
  // Assunto"). Outros blocos (tabela, lista) não entram.
  function seletorDe (bloco) {
    if (!bloco || !['p', 'div'].includes(bloco.tag)) return null
    if (bloco.tag === 'div' && (bloco.classes || []).length) return null
    return bloco.tag + (bloco.classes || []).map(classe => '.' + escapar(classe)).join('')
  }

  // Posições de uma lista de irmãos em que o seletor "a+b(+c)" acerta (a posição é a do último).
  const combina = (parte, bloco) => Boolean(bloco) && parte.tag === bloco.tag && (parte.classes || []).every(classe => (bloco.classes || []).includes(classe))
  function acertos (partes, irmaos) {
    const achados = []
    for (let i = partes.length - 1; i < irmaos.length; i++) {
      if (partes.every((parte, m) => combina(parte, irmaos[i - partes.length + 1 + m]))) achados.push(i)
    }
    return achados
  }

  // Início do rodapé: a seção que tem o parágrafo do rodapé, e tudo depois dela, fica de fora.
  function inicioDoRodape (blocos) {
    const ehDoRodape = regrasConferir().ehDoRodape
    let i = blocos.findIndex(bloco => (bloco.classes || []).some(ehDoRodape))
    if (i < 0) return blocos.length
    while (i > 0 && blocos[i - 1].raiz === blocos[i].raiz) i--
    return i
  }

  // documento: { blocos, outras }. blocos: os blocos de cima do texto, na ordem de todas as seções juntas (como
  // o SEI monta o documento): { tag, classes, raiz (nº da seção), secao (nome), posicao (no editor, a partir de
  // 1), vazio, outro, texto (1ª linha), textoFim (última), acima, abaixo (do texto até a borda do bloco, em px),
  // margemTopo, margemBaixo, fonte (da letra), fonteDoBloco }. outras: listas de irmãos de dentro dos blocos
  // (só para o seletor não acertar onde não deve).
  // v0.33.0: linha em branco (vazio): altura (px), margens e semNada (só a linha vazia do editor, sem espaço,
  // texto ou quebra de linha de verdade). A medida pela posição na página (topo e base, v0.29.3) saiu.
  // Lacunas conferidas: entre a última linha de uma seção e a primeira da seguinte e, dentro da mesma seção,
  // antes e depois da linha da data ("Palmas, 18 de novembro de 2026.", D21). Linha em branco de verdade no
  // meio conta como espaço. Devolve { lacunas: [{ indice, margem (em), seletor, secao, posicao, antes, depois }],
  // css, bloco } (bloco vazio quando não há o que fazer).
  // v0.33.0: o documento salvo é diferente do editor. A seção que só tem uma linha vazia do editor ("Separador
  // de seção" com <p><br data-cke-filler></p>: semNada) não é salva; no editor ela e a borda de cada seção
  // afastam as partes, mas no documento salvo e no PDF elas ficam grudadas (timbre e número, "Assunto" e
  // destinatário). Então a distância é a do documento salvo: o que sobra do bloco de cima e do de baixo, as
  // linhas em branco que existem de verdade (altura medida) e as margens entre eles.
  function semFantasmas (blocos) {
    const porSecao = new Map()
    for (const bloco of blocos) porSecao.set(bloco.raiz, [...(porSecao.get(bloco.raiz) || []), bloco])
    // Também a seção só de linhas em branco logo depois do timbre (Capa de Processo, 19/11/2026: o SEI não a salva).
    const secoes = [...porSecao]
    const fantasmas = new Set(secoes.filter(([, lista], i) => lista.every(bloco => bloco.vazio && bloco.semNada) ||
      (i > 0 && lista.every(bloco => bloco.vazio) && secoes[i - 1][1].some(ehDoTimbre))).map(([raiz]) => raiz))
    return blocos.filter(bloco => !fantasmas.has(bloco.raiz))
  }

  function planejarEspacamento (documento) {
    const blocos = semFantasmas((documento && documento.blocos) || [])
    const outras = (documento && documento.outras) || []
    const ehData = texto => Boolean(texto) && regrasData().ehLinhaDaData(texto)
    const fim = inicioDoRodape(blocos)
    const candidatas = []
    // O espaço também vai depois da última linha de quem assina, antes do rodapé (o resto do rodapé fica de fora).
    let anterior = -1
    for (let i = 0; i <= Math.min(fim, blocos.length - 1); i++) {
      const bloco = blocos[i]
      if (bloco.outro) { anterior = -1; continue }
      if (bloco.vazio) continue
      const indiceDoUltimo = anterior
      anterior = i
      if (indiceDoUltimo < 0) continue
      const ultimo = blocos[indiceDoUltimo]
      if (ultimo.raiz === bloco.raiz && !ehData(bloco.texto) && !ehData(ultimo.textoFim)) continue
      const fonte = Number(bloco.fonte) || 0
      if (fonte <= 0) continue
      // Sequência no documento salvo: bloco de cima, linhas em branco, bloco de baixo. "resto" é tudo menos a
      // margem logo acima do bloco de baixo (a que o espaço novo troca).
      const sequencia = blocos.slice(indiceDoUltimo, i + 1)
      let resto = (ultimo.abaixo || 0) + (bloco.acima || 0)
      for (let k = 1; k < sequencia.length; k++) {
        if (k < sequencia.length - 1) resto += (sequencia[k].altura || 0) + Math.max(sequencia[k - 1].margemBaixo || 0, sequencia[k].margemTopo || 0)
      }
      const margemDeCima = sequencia[sequencia.length - 2].margemBaixo || 0
      const distancia = resto + Math.max(margemDeCima, bloco.margemTopo || 0)
      const { limite, linha } = espacoDesejado(ultimo, bloco)
      if (distancia >= limite * fonte) continue
      const margem = Math.ceil((linha * fonte - resto) / (Number(bloco.fonteDoBloco) || fonte) * 100) / 100
      candidatas.push({ indice: i, margem, secao: bloco.secao, posicao: bloco.posicao, antes: ultimo.textoFim || '', depois: bloco.texto || '' })
    }

    // Seletor do documento salvo (no SEI as seções viram parágrafos irmãos): "anterior+bloco"; se acertar
    // também em outro lugar, "o de antes+anterior+bloco"; se ainda acertar, essa lacuna fica como está.
    const alvos = new Set(candidatas.map(lacuna => lacuna.indice))
    const valido = partes => partes.every(seletorDe) &&
      acertos(partes, blocos).every(i => alvos.has(i)) && outras.every(irmaos => !acertos(partes, irmaos).length)
    const lacunas = []
    for (const lacuna of candidatas) {
      const [antes2, antes, bloco] = [blocos[lacuna.indice - 2], blocos[lacuna.indice - 1], blocos[lacuna.indice]]
      let partes = [antes, bloco]
      if (!valido(partes)) partes = antes2 && !antes2.vazio && !antes2.outro ? [antes2, antes, bloco] : null
      if (!partes || !valido(partes)) continue
      lacunas.push({ ...lacuna, seletor: partes.map(seletorDe).join('+') })
    }
    if (!lacunas.length) return { lacunas, css: '', bloco: '' }

    const finais = new Map()
    for (const lacuna of lacunas) finais.set(lacuna.seletor, Math.max(lacuna.margem, finais.get(lacuna.seletor) || 0))
    // No editor cada seção é uma caixa separada: a regra é pelo nome da seção e pela posição do bloco nela (só
    // vale no editor; no documento salvo não há essas caixas). Regra separada, porque o gerador do PDF ignora
    // a regra inteira quando não entende um dos seletores.
    const doEditor = lacunas.map(lacuna => {
      const secao = '[aria-label=' + escapar(lacuna.secao) + ']'
      return '.ck-editor__editable' + secao + ' :nth-child(' + lacuna.posicao + '):not(' + secao + ' * *){margin-top:' + lacuna.margem + 'em!important}'
    })
    const css = '/* ' + MARCA + ' */' + [...finais].map(([seletor, margem]) => seletor + '{margin-top:' + margem + 'em!important}').join('') + doEditor.join('')
    return { lacunas, css, bloco: '<style>' + css + '</style>' }
  }

  // v0.33.0: regras do documento salvo de um bloco (sem as do editor), para ver se o bloco que o documento já tem
  // é o mesmo que a extensão poria agora.
  function seletoresDoBloco (texto) {
    const css = (String(texto || '').match(/extensao-ifto: espacamento \*\/([\s\S]*?)(?:<\/style>|$)/) || [])[1] || ''
    return [...css.matchAll(/([^{}]+)\{margin-top/g)].map(([, seletor]) => seletor.trim()).filter(seletor => !seletor.startsWith('.ck-editor')).sort()
  }
  // v0.34.2: também o tamanho do espaço (antes, um espaço menor ficava para sempre); diferença de até 0,1 é só
  // arredondamento da medida.
  function margensDoBloco (texto) {
    const css = (String(texto || '').match(/extensao-ifto: espacamento \*\/([\s\S]*?)(?:<\/style>|$)/) || [])[1] || ''
    return new Map([...css.matchAll(/([^{}]+)\{margin-top:\s*(-?[\d.]+)em/g)].map(([, seletor, margem]) => [seletor.trim(), Number(margem)]))
  }
  function mesmoEspacamento (textoAtual, plano) {
    const seletores = seletoresDoBloco(textoAtual)
    if (seletores.join('|') !== seletoresDoBloco(plano.bloco).join('|')) return false
    const [atuais, novas] = [margensDoBloco(textoAtual), margensDoBloco(plano.bloco)]
    return seletores.every(seletor => Math.abs(atuais.get(seletor) - novas.get(seletor)) <= 0.1)
  }

  const api = { seletoresDoBloco, mesmoEspacamento, semFantasmas, MARCA, LIMITE, LINHA, temEspacamento, tirarEspacamento, escapar, seletorDe, acertos, planejarEspacamento }
  if (doNode) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { espacamentoDocumento: api })
})(globalThis)
