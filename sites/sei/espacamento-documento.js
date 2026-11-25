// v0.26.11 (spec conferir-documento, etapa 7, D1, D9, D21, D22–D24): ao abrir o editor do SEI, em todo tipo de documento
// ainda não assinado (v0.33.0: também com o espaçamento antigo, que é refeito se faltava alguma parte), a extensão põe uma linha de espaço entre as partes que estão
// grudadas (timbre, número, data, "Processo nº", destinatário, nome de quem assina) e avisa numa caixa com o
// botão "Desfazer". Fica no documento só quando a pessoa clica em Salvar.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const { configuracoes, caixaEditor, espacamentoDocumento: regras } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.espacamentoDocumento) return

  const curto = texto => texto.length > 60 ? texto.slice(0, 57) + '…' : texto

  // v0.35.3 (pedido do usuário, 24/11/2026): linha em branco antes e depois de quem assina, só onde não há
  // nenhuma e só com o clique. No clique mede de novo (a pessoa pode ter mudado o texto depois do aviso).
  // Depois o espaço automático é refeito, para não somar com a linha nova.
  function oferecerLinhas (faltam) {
    if (!faltam.length) return
    const rotulo = faltam.length > 1 ? 'Adicionar as linhas em branco' : 'Adicionar a linha em branco'
    const caixa = caixaEditor.criarCaixa('linhas-em-branco', 'Falta uma linha em branco perto de quem assina. Adicionar?', rotulo)
    const lista = caixaEditor.criar('ul')
    for (const linha of faltam) lista.append(caixaEditor.criar('li', { textContent: linha.antes ? `Entre "${curto(linha.antes)}" e "${curto(linha.depois)}"` : `Antes de "${curto(linha.depois)}"` }))
    caixa.botao.before(lista)
    caixa.botao.addEventListener('click', async () => {
      caixa.botao.disabled = true
      caixa.botao.textContent = 'Adicionando…'
      const agora = await caixaEditor.pedirAoFundo('espacamentoMedir')
      const linhas = agora && agora.ok ? regras.linhasQueFaltam(agora.documento) : []
      if (agora && agora.ok && !linhas.length) return caixa.mostrar('ok', 'As linhas em branco já estão no documento.')
      const posto = agora && agora.ok ? await caixaEditor.pedirAoFundo('espacamentoLinhas', { linhas }) : agora
      if (!posto || !posto.ok) return caixa.mostrar('erro', 'Não consegui adicionar. ' + ((posto && posto.erro) || '') + ' Nada foi salvo.')
      const depois = await caixaEditor.pedirAoFundo('espacamentoMedir')
      if (depois && depois.ok && depois.jaTem) {
        const novo = regras.planejarEspacamento(depois.documento)
        if (!novo.lacunas.length) await caixaEditor.pedirAoFundo('espacamentoDesfazer')
        else if (!regras.mesmoEspacamento(depois.atual, novo)) await caixaEditor.pedirAoFundo('espacamentoPor', { bloco: novo.bloco, substituir: true })
      }
      caixa.mostrar('ok', 'Pronto. Confira e clique em Salvar no editor. Para desfazer, apague a linha ou feche o editor sem salvar.')
    })
  }

  // v0.26.11 (D22): com o editor aberto o documento nunca está assinado (o SEI tira a assinatura ao abrir).
  // v0.33.0: o documento que já tem o espaço é conferido de novo; se o espaço novo for diferente (lacunas que
  // faltavam, como depois do timbre e antes do destinatário), o bloco antigo é trocado pelo novo.
  const medido = await caixaEditor.pedirAoFundo('espacamentoMedir')
  if (!medido || !medido.ok || !medido.documento) return
  oferecerLinhas(regras.linhasQueFaltam(medido.documento))
  const plano = regras.planejarEspacamento(medido.documento)
  if (medido.jaTem ? regras.mesmoEspacamento(medido.atual, plano) : !plano.lacunas.length) return
  if (medido.jaTem && !plano.lacunas.length) return
  const posto = await caixaEditor.pedirAoFundo('espacamentoPor', { bloco: plano.bloco, substituir: medido.jaTem })
  if (!posto || !posto.ok || posto.jaTinha) return

  const frase = medido.jaTem
    ? 'A extensão atualizou o espaço entre as partes do documento. Agora há uma linha de espaço antes de:'
    : 'As partes do documento estavam grudadas: a extensão pôs uma linha de espaço antes de:'
  const caixa = caixaEditor.criarCaixa('espacamento', frase, 'Desfazer')
  const lista = caixaEditor.criar('ul')
  for (const lacuna of plano.lacunas) lista.append(caixaEditor.criar('li', { textContent: `"${curto(lacuna.depois)}"` }))
  const dica = caixaEditor.criar('p', { textContent: 'Confira e clique em Salvar no editor. Sem Salvar, nada muda no documento.' })
  caixa.botao.before(lista, dica)
  caixa.botao.addEventListener('click', async () => {
    caixa.botao.disabled = true
    caixa.botao.textContent = 'Desfazendo…'
    const resultado = await caixaEditor.pedirAoFundo('espacamentoDesfazer')
    if (!resultado || !resultado.ok) {
      caixa.mostrar('erro', 'Não consegui desfazer. ' + ((resultado && resultado.erro) || '') + ' Use Ctrl+Z ou feche o editor sem salvar.')
      return
    }
    caixa.mostrar('ok', 'Pronto, o espaço foi tirado. Clique em Salvar no editor para guardar assim.')
  })
})()
