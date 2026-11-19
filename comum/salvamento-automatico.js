// v0.31.0 (spec copia-editor-sei): regras do salvamento automático do editor do SEI (sem página: funcionam no
// navegador e no Node). Uma cópia por documento, por cima da anterior, só neste computador.
(function (raiz) {
  const PREFIXO = 'salvamentoAutomatico:'
  const INDICE = 'salvamentoAutomaticoIndice' // { idDocumento: quando a cópia foi guardada (ms) }
  const DIAS = 7 // D6: cópia que o SEI nunca confirmou some 7 dias depois da última mudança
  const VIDA_JANELA = 70000 // a janela que guarda a cópia dá sinal a cada 30 s; sem sinal por 70 s, está fechada

  const textoSimples = html => {
    const estilos = typeof module !== 'undefined' && module.exports ? require('./todos-os-estilos.js') : raiz.ExtensaoIFTO.todosOsEstilos
    return estilos.textoSimples(html)
  }

  const chave = id => PREFIXO + id
  const chaveJanela = id => 'salvamentoAutomaticoJanela:' + id

  // Número do documento no endereço do editor ("id_documento=3662458").
  function idDoEndereco (endereco) {
    const achado = /[?&]id_documento=(\d+)/.exec(String(endereco || ''))
    return achado ? achado[1] : ''
  }

  // Comentários comparáveis: só o que importa (texto e lugar), na mesma ordem.
  function comentariosNormais (itens) {
    return (itens || []).map(c => [c.id, c.texto, c.inicioPosicao, c.inicioDeslocamento, c.fimPosicao, c.fimDeslocamento].join('|')).sort()
  }

  // A cópia e o que está no editor têm o mesmo texto e os mesmos comentários?
  function mesmoConteudo (a, b) {
    if (!a || !b) return false
    const sa = a.secoes || {}
    const sb = b.secoes || {}
    const nomes = new Set([...Object.keys(sa), ...Object.keys(sb)])
    for (const nome of nomes) if ((sa[nome] || '') !== (sb[nome] || '')) return false
    return JSON.stringify(comentariosNormais(a.comentarios)) === JSON.stringify(comentariosNormais(b.comentarios))
  }

  // Documentos com cópia vencida (mais de 7 dias sem mudar).
  function vencidas (indice, agora) {
    return Object.entries(indice || {}).filter(([, quando]) => agora - quando > DIAS * 86400000).map(([id]) => id)
  }

  // Documentos do mais antigo para o mais novo (para liberar espaço, D10), sem o documento aberto.
  function maisAntigas (indice, exceto) {
    return Object.entries(indice || {}).filter(([id]) => id !== String(exceto)).sort((a, b) => a[1] - b[1]).map(([id]) => id)
  }

  // A outra janela deste documento ainda está aberta (deu sinal há pouco)?
  function janelaViva (trava, minhaJanela, agora) {
    return Boolean(trava && trava.janela !== minhaJanela && agora - trava.vivo < VIDA_JANELA)
  }

  // "hoje às 10:42" ou "18/11/2026 às 10:42".
  function quando (ms, agora = Date.now()) {
    const d = new Date(ms)
    const dois = n => String(n).padStart(2, '0')
    const hora = dois(d.getHours()) + ':' + dois(d.getMinutes())
    const hoje = new Date(agora)
    if (d.toDateString() === hoje.toDateString()) return 'hoje às ' + hora
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear() + ' às ' + hora
  }

  // Blocos do texto (parágrafo, título, item de lista, célula de tabela, figura), na ordem.
  function paragrafos (html) {
    const blocos = []
    const busca = /<(p|h[1-6]|li|td|th|figure|blockquote|pre)\b[^>]*>[\s\S]*?<\/\1>/gi
    let achado
    while ((achado = busca.exec(String(html || '')))) blocos.push({ html: achado[0], texto: textoSimples(achado[0]) })
    return blocos
  }

  // Diferenças entre o texto do SEI (antes) e o da cópia (depois), parágrafo a parágrafo.
  // Devolve [{ tipo: 'novo'|'removido'|'mudado', numero, antes, depois, soFormatacao }], só o que mudou.
  function diferencas (htmlAntes, htmlDepois) {
    const a = paragrafos(htmlAntes)
    const b = paragrafos(htmlDepois)
    // Começo e fim iguais ficam de fora (quase sempre sobra pouco para comparar).
    let ini = 0
    while (ini < a.length && ini < b.length && a[ini].html === b[ini].html) ini++
    let fa = a.length
    let fb = b.length
    while (fa > ini && fb > ini && a[fa - 1].html === b[fb - 1].html) { fa--; fb-- }
    const ma = a.slice(ini, fa)
    const mb = b.slice(ini, fb)
    // Maior sequência comum (LCS) no meio.
    const n = ma.length
    const m = mb.length
    const tabela = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        tabela[i][j] = ma[i].html === mb[j].html ? tabela[i + 1][j + 1] + 1 : Math.max(tabela[i + 1][j], tabela[i][j + 1])
      }
    }
    const passos = []
    let i = 0
    let j = 0
    while (i < n || j < m) {
      if (i < n && j < m && ma[i].html === mb[j].html) { i++; j++; continue }
      // Empate: primeiro o removido, para juntar com o novo seguinte ("mudado").
      if (i < n && (j === m || tabela[i + 1][j] >= tabela[i][j + 1])) { passos.push({ tipo: 'removido', numero: ini + i + 1, antes: ma[i] }); i++ } else { passos.push({ tipo: 'novo', numero: ini + j + 1, depois: mb[j] }); j++ }
    }
    // Um removido seguido de um novo no mesmo lugar = parágrafo mudado.
    const lista = []
    for (let k = 0; k < passos.length; k++) {
      const atual = passos[k]
      const prox = passos[k + 1]
      if (atual.tipo === 'removido' && prox && prox.tipo === 'novo') {
        lista.push({ tipo: 'mudado', numero: prox.numero, antes: atual.antes.texto, depois: prox.depois.texto, soFormatacao: atual.antes.texto === prox.depois.texto })
        k++
      } else if (atual.tipo === 'novo') {
        lista.push({ tipo: 'novo', numero: atual.numero, antes: '', depois: atual.depois.texto, soFormatacao: false })
      } else {
        lista.push({ tipo: 'removido', numero: atual.numero, antes: atual.antes.texto, depois: '', soFormatacao: false })
      }
    }
    return lista
  }

  const api = { PREFIXO, INDICE, DIAS, chave, chaveJanela, idDoEndereco, comentariosNormais, mesmoConteudo, vencidas, maisAntigas, janelaViva, quando, paragrafos, diferencas }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { salvamentoAutomatico: api })
})(globalThis)
