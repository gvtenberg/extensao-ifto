// v0.6.0: documento externo novo (Incluir Documento › Externo): marca a data de hoje, o formato
// Nato-digital e o nível de acesso Público, só nos campos ainda vazios. Nunca clica em Salvar aqui.
(async function () {
  const { documentoExterno: regras, configuracoes } = globalThis.ExtensaoIFTO
  if (!regras.ehDocumentoExternoNovo(location.href)) return
  const { preencherDocumentoExterno } = await configuracoes.lerConfiguracoes()
  if (!preencherDocumentoExterno) return

  const campoData = document.getElementById('txtDataElaboracao')
  const nato = document.getElementById('optNato')
  const digitalizado = document.getElementById('optDigitalizado')
  const publico = document.getElementById('optPublico')
  const formulario = document.getElementById('frmDocumentoCadastro')
  if (!campoData || !nato || !publico || !formulario) return

  const niveis = ['optPublico', 'optRestrito', 'optSigiloso'].map(id => document.getElementById(id)).filter(Boolean)
  const falta = regras.oQuePreencher({
    data: campoData.value,
    formatoMarcado: nato.checked || (digitalizado && digitalizado.checked),
    nivelMarcado: niveis.some(opcao => opcao.checked)
  })
  if (!falta.data && !falta.formato && !falta.nivel) return

  if (falta.data) {
    campoData.value = regras.dataDeHoje()
    campoData.dispatchEvent(new Event('change', { bubbles: true }))
  }
  // O clique roda as funções do próprio SEI (mostrar/esconder o tipo de conferência, hipótese legal).
  if (falta.formato) nato.click()
  if (falta.nivel) publico.click()

  const nota = document.createElement('div')
  nota.dataset.extensaoIfto = 'documento-externo'
  nota.textContent = 'Preenchido pela extensão: confira a data, o formato e o nível de acesso.'
  Object.assign(nota.style, {
    margin: '6px 0', padding: '6px 10px', borderRadius: '4px',
    background: '#E8F5EC', color: '#1E5631', border: '1px solid #B7DCC3', fontWeight: '600', width: 'fit-content'
  })
  formulario.prepend(nota)
})()
