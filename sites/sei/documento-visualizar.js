// v0.26.1 (spec conferir-documento, D15): página do documento no SEI (quadro "documento_visualizar" da árvore).
// No SEI 5 a caixa "Documento assinado eletronicamente por …" vem com unselectable="on" e user-select:none,
// e não dá para copiar o nome de quem assinou. A extensão só libera a seleção nesta página: nada é gravado
// no SEI e o PDF do SEI não muda.
(async function () {
  const { lerConfiguracoes } = globalThis.ExtensaoIFTO.configuracoes
  const configuracoes = await lerConfiguracoes()
  if (!configuracoes.copiarAssinaturas) return

  const MARCA = 'data-extensao-ifto-selecionavel'
  const estilo = document.createElement('style')
  // !important na folha vence o user-select:none escrito no próprio elemento (sem !important).
  estilo.textContent = `[${MARCA}], [${MARCA}] * { -moz-user-select: text !important; -webkit-user-select: text !important; user-select: text !important; }`
  document.head.append(estilo)
  for (const caixa of document.querySelectorAll('[unselectable="on"]')) {
    if (!/assinado eletronicamente/i.test(caixa.textContent)) continue
    caixa.removeAttribute('unselectable')
    caixa.setAttribute(MARCA, '')
  }
})()
