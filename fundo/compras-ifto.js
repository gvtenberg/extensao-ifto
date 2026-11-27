// v0.38.0 (saiu de fundo.js): peças do Compras IFTO para o editor do SEI (spec compras-ifto-no-sei).
// ---------- Peças do Compras IFTO para o SEI (v0.19.0, spec compras-ifto-no-sei) ----------
// A ponte entra na página do Compras IFTO só com a permissão opcional dada (D2): a cada página que termina
// de abrir e logo depois que a pessoa permite (abas já abertas).
async function porPonte (idDaAba) {
  try {
    await navegador.scripting.executeScript({ target: { tabId: idDaAba }, files: ['comum/compras-ifto.js', 'sites/compras-ifto/ponte.js'] })
  } catch (erro) {
    // Sem permissão ou aba fechada: nada a fazer.
  }
}
navegador.tabs.onUpdated.addListener((idDaAba, mudanca, aba) => {
  if (mudanca.status === 'complete' && aba.url && compras.ehDoCompras(aba.url)) porPonte(idDaAba)
})
if (navegador.permissions && navegador.permissions.onAdded) {
  navegador.permissions.onAdded.addListener(async () => {
    try {
      const abas = await navegador.tabs.query({ url: compras.ORIGENS_COMPRAS })
      for (const aba of abas) porPonte(aba.id)
    } catch (erro) {
      console.warn('[extensão IFTO] Não consegui preparar as abas do Compras IFTO:', erro.message)
    }
  })
}

// D8: lista de peças esperando, no navegador (storage.local "pecasCompras").
async function receberPeca (peca, remetente) {
  const endereco = remetente.url || (remetente.tab && remetente.tab.url) || ''
  if (!compras.ehDoCompras(endereco)) return { erro: 'endereço não permitido' }
  const lida = compras.lerPeca({ origem: 'compras-ifto', tipo: 'enviar-ao-sei', peca })
  if (lida.erro) return { erro: lida.erro }
  const { pecasCompras } = await navegador.storage.local.get('pecasCompras')
  const lista = compras.juntarPeca(pecasCompras, lida.peca, Date.now())
  await navegador.storage.local.set({ pecasCompras: lista })
  return { ok: true, total: lista.length }
}

// Etapa 3: abre o editor do documento recém-criado numa janela, põe o texto e salva (nunca assina).
// A página do SEI recebe o resultado pelo recado "comprasResultado".
const CHAVE_EDITOR = 'comprasTarefa'
const ESPERA_DO_EDITOR = 120000
async function abrirEditor ({ urlEditor, idDocumento, html }, abaSei) {
  let endereco
  try { endereco = new URL(urlEditor) } catch (erro) { return { erro: 'endereço do editor inválido' } }
  if (endereco.hostname !== 'sei.ifto.edu.br' || endereco.searchParams.get('acao') !== 'editor_montar') return { erro: 'endereço do editor inválido' }
  if (!abaSei || typeof html !== 'string' || !html) return { erro: 'pedido incompleto' }
  // v0.37.0 (T260): a janela do editor abre sem tirar o foco de onde a pessoa está (navegador que não aceita
  // "focused: false" abre do jeito de antes).
  const opcoesDaJanela = { url: endereco.href, type: 'popup', width: 1100, height: 820 }
  const janela = await navegador.windows.create({ ...opcoesDaJanela, focused: false }).catch(() => navegador.windows.create(opcoesDaJanela))
  const idAba = janela.tabs && janela.tabs[0] ? janela.tabs[0].id : null
  const tarefa = { idAbaSei: abaSei.id, idJanela: janela.id, idAba, idDocumento: String(idDocumento || ''), html, estado: 'abrindo', inicio: Date.now() }
  await navegador.storage.local.set({ [CHAVE_EDITOR]: tarefa })
  setTimeout(async () => {
    const atual = await lerTarefaDoEditor()
    if (atual && atual.inicio === tarefa.inicio) concluirEditor({ ok: false, erro: 'O editor do SEI demorou demais para salvar.' }, false)
  }, ESPERA_DO_EDITOR)
  return { ok: true }
}
async function lerTarefaDoEditor () {
  const { [CHAVE_EDITOR]: tarefa } = await navegador.storage.local.get(CHAVE_EDITOR)
  return tarefa || null
}
navegador.tabs.onUpdated.addListener(async (idDaAba, mudanca, aba) => {
  if (mudanca.status !== 'complete' || !aba.url || !/[?&]acao=editor_montar/.test(aba.url)) return
  const tarefa = await lerTarefaDoEditor()
  if (!tarefa || (tarefa.idAba !== null && tarefa.idAba !== idDaAba)) return
  // O editor antigo salva recarregando a página: se ela volta depois do Salvar, salvou.
  if (tarefa.estado === 'salvando') { concluirEditor({ ok: true, salvou: 'recarregou' }, true); return }
  tarefa.estado = 'salvando'
  tarefa.idAba = idDaAba
  await navegador.storage.local.set({ [CHAVE_EDITOR]: tarefa })
  try {
    const [execucao] = await navegador.scripting.executeScript({ target: { tabId: idDaAba }, world: 'MAIN', func: globalThis.ExtensaoIFTO.editorPreencher, args: [tarefa.html] })
    const resultado = execucao && execucao.result
    if (resultado) concluirEditor(resultado, resultado.ok)
  } catch (erro) {
    // Página recarregada no meio do Salvar (editor antigo): o próximo "complete" conclui.
  }
})
// Fecha a janela do editor só quando deu certo (com erro, a pessoa vê o editor e termina à mão).
async function concluirEditor (resultado, fecharJanela) {
  const tarefa = await lerTarefaDoEditor()
  if (!tarefa) return
  await navegador.storage.local.remove(CHAVE_EDITOR)
  if (fecharJanela) { try { await navegador.windows.remove(tarefa.idJanela) } catch (erro) { /* janela já fechada */ } }
  await entregar(tarefa.idAbaSei, { tipo: 'comprasResultado', idDocumento: tarefa.idDocumento, resultado })
  await trazerAbaParaFrente(tarefa.idAbaSei)
}
navegador.runtime.onStartup.addListener(() => navegador.storage.local.remove(CHAVE_EDITOR))
