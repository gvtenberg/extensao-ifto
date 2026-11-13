// v0.11.0: parte da extensão que roda por trás (Firefox: página de fundo; Chrome: service worker).
// SICAF automático: menu do botão direito "Buscar SICAF deste CNPJ" (também no leitor de PDF do
// navegador, onde a extensão não entra na página) e recado do CNPJ escolhido para a página do SEI.
/* global importScripts */
if (typeof importScripts === 'function' && !(globalThis.ExtensaoIFTO && globalThis.ExtensaoIFTO.sicaf)) {
  importScripts('/comum/sei.js', '/comum/sicaf.js')
}
const navegador = globalThis.browser || globalThis.chrome
const regras = globalThis.ExtensaoIFTO.sicaf
const MENU = 'buscar-sicaf'
const SEI = '*://sei.ifto.edu.br/*'
// Páginas do SEI onde a extensão entra (as outras não respondem).
const PAGINAS_DO_SEI = '*://sei.ifto.edu.br/*controlador.php?acao=*'

// ---------- Menu do botão direito ----------
function criarMenu () {
  navegador.contextMenus.removeAll(() => {
    navegador.contextMenus.create({ id: MENU, title: 'Buscar SICAF deste CNPJ', contexts: ['selection'], documentUrlPatterns: [SEI] })
  })
}
navegador.runtime.onInstalled.addListener(criarMenu)
navegador.runtime.onStartup.addListener(criarMenu)

navegador.contextMenus.onClicked.addListener((info, aba) => {
  if (info.menuItemId !== MENU) return
  const achado = regras.cnpjDaSelecao(info.selectionText)
  levarParaOSei({ tipo: 'sicafCnpj', cnpj: achado ? achado.cnpj : null, valido: Boolean(achado && achado.valido), texto: String(info.selectionText || '').slice(0, 60), origem: 'menu' }, aba)
})

// ---------- Recados ----------
navegador.runtime.onMessage.addListener((recado, remetente) => {
  if (!recado || typeof recado !== 'object') return
  if (recado.tipo === 'sicafCnpj') {
    levarParaOSei({ ...recado, valido: regras.cnpjValido(recado.cnpj) }, remetente.tab)
  }
})

// Leva o CNPJ para a página principal do SEI (quadro 0) da aba; se a aba não tem a página da extensão
// (PDF aberto sozinho numa aba), usa a aba do SEI usada por último e a traz para a frente.
async function levarParaOSei (recado, aba) {
  if (aba && aba.id >= 0 && await entregar(aba.id, recado)) return
  const abas = await navegador.tabs.query({ url: PAGINAS_DO_SEI })
  abas.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
  for (const outra of abas) {
    if (aba && outra.id === aba.id) continue
    if (await entregar(outra.id, recado)) {
      await navegador.tabs.update(outra.id, { active: true })
      if (outra.windowId !== undefined) await navegador.windows.update(outra.windowId, { focused: true })
      return
    }
  }
}
async function entregar (idDaAba, recado) {
  try {
    const resposta = await navegador.tabs.sendMessage(idDaAba, recado, { frameId: 0 })
    return Boolean(resposta && resposta.recebido)
  } catch (erro) {
    return false
  }
}
