// v0.34.0: botão "Blocos Internos" na barra de botões do Controle de Processos, logo depois de
// "Controle de Prazos". Usa o mesmo endereço do menu Blocos > Internos (o SEI exige o código de segurança
// daquele link), e copia o botão vizinho para ficar com o mesmo tamanho e espaçamento dos ícones do SEI.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  const opcoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  if (!opcoes.botaoBlocosInternos) return
  const navegador = globalThis.browser || globalThis.chrome
  const prazos = document.querySelector('a[onclick*="acao=controle_prazo_definir"] img[src*="controle_prazo_gerenciar"]')
  const menu = document.querySelector('a[link="bloco_interno_listar"]')
  if (!prazos || !menu || document.querySelector('[data-extensao-ifto="blocos-internos"]')) return
  const vizinho = prazos.closest('a')
  const botao = vizinho.cloneNode(true)
  botao.removeAttribute('onclick')
  botao.href = menu.getAttribute('href')
  botao.dataset.extensaoIfto = 'blocos-internos'
  const icone = botao.querySelector('img')
  icone.src = navegador.runtime.getURL('icones/bloco-interno.svg')
  icone.alt = icone.title = 'Blocos Internos'
  // O espaço entre os botões do SEI vem da quebra de linha entre eles no HTML.
  vizinho.after(document.createTextNode('\n'), botao)
})()
