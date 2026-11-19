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

  // v0.26.11 (D22): com o editor aberto o documento nunca está assinado (o SEI tira a assinatura ao abrir).
  // v0.33.0: o documento que já tem o espaço é conferido de novo; se o espaço novo for diferente (lacunas que
  // faltavam, como depois do timbre e antes do destinatário), o bloco antigo é trocado pelo novo.
  const medido = await caixaEditor.pedirAoFundo('espacamentoMedir')
  if (!medido || !medido.ok || !medido.documento) return
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
  const curto = texto => texto.length > 60 ? texto.slice(0, 57) + '…' : texto
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
