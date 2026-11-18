// v0.26.0 (spec conferir-documento): conferir o documento do SEI (número do processo, timbre, rodapé) e os
// dados das unidades da pessoa ("Minhas unidades" nas configurações). Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const sohTexto = valor => String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim()

  // Sigla do SEI em maiúsculas e sem espaços ("cgoc / pal/rei/ifto" → "CGOC/PAL/REI/IFTO").
  function siglaDaUnidade (sigla) {
    return String(sigla || '').replace(/\s+/g, '').toUpperCase()
  }

  // Unidade do Campus Palmas: sigla com "/PAL/" (D5) ou a própria "PAL/REI/IFTO".
  function ehUnidadePalmas (sigla) {
    const limpa = siglaDaUnidade(sigla)
    return limpa.includes('/PAL/') || limpa.startsWith('PAL/')
  }

  // Unidade como foi digitada → unidade guardada: sigla limpa, telefone e e-mail sem espaços nas pontas,
  // linhas do setor sem linhas vazias.
  function limparUnidade (unidade) {
    const u = unidade || {}
    const linhas = Array.isArray(u.linhas) ? u.linhas : String(u.linhas || '').split('\n')
    return {
      sigla: siglaDaUnidade(u.sigla),
      telefone: sohTexto(u.telefone),
      email: sohTexto(u.email).toLowerCase(),
      linhas: linhas.map(sohTexto).filter(Boolean)
    }
  }

  // Lista guardada: só unidades com sigla, sem repetir a sigla (fica a última digitada).
  function limparUnidades (unidades) {
    const porSigla = new Map()
    for (const unidade of Array.isArray(unidades) ? unidades : []) {
      const limpa = limparUnidade(unidade)
      if (limpa.sigla) porSigla.set(limpa.sigla, limpa)
    }
    return [...porSigla.values()]
  }

  function acharUnidade (unidades, sigla) {
    const procurada = siglaDaUnidade(sigla)
    return limparUnidades(unidades).find(u => u.sigla === procurada) || null
  }

  const api = { siglaDaUnidade, ehUnidadePalmas, limparUnidade, limparUnidades, acharUnidade }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { conferirDocumento: api })
})(globalThis)
