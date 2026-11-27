// v0.38.0 (#355, usuário): a árvore do processo é estreita e corta nomes compridos. Com o mouse sobre o nome
// de um documento (do SEI ou externo), aparece o nome inteiro. As pastas do processo chegam depois (o SEI
// monta aos poucos): por isso a extensão olha a árvore de novo quando ela muda.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  const darNomes = () => {
    for (const link of document.querySelectorAll('a.infraArvoreNo')) {
      const nome = link.textContent.trim()
      if (nome && !link.title) link.title = nome
    }
  }
  if (!document.querySelector('a.infraArvoreNo, #divArvore')) return
  darNomes()
  let espera = null
  new MutationObserver(() => { clearTimeout(espera); espera = setTimeout(darNomes, 300) }).observe(document.body, { childList: true, subtree: true })
})()
