// v0.38.0 (saiu de fundo.js): consulta do Simples Nacional, na mesma aba, depois do SICAF (spec consulta-simples).
// ---------- Consulta do Simples Nacional (v0.17.2) ----------
// Fim do SICAF: a mesma aba abre a consulta do Simples Nacional (ou termina, se não falta nenhuma).
async function irParaOSimples (tarefa, idDaAba) {
  if (!tarefa.simplesFaltam || !tarefa.simplesFaltam.length || idDaAba == null) return terminar(tarefa)
  tarefa.fase = 'simples'
  await gravarTarefa(tarefa)
  try { await navegador.tabs.update(idDaAba, { url: simples.URL_CONSULTA_SIMPLES }) } catch (erro) { await terminar(tarefa) }
}
// A página do Simples Nacional pergunta qual CNPJ digitar: o da nota ou, se o site recusou, o da matriz.
async function simplesQualCnpj (aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples' || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.simplesPosicao >= tarefa.simplesFaltam.length) return { fim: true }
  const fornecedor = tarefa.simplesFaltam[tarefa.simplesPosicao]
  return {
    cnpj: tarefa.simplesMatriz ? regras.cnpjMatriz(fornecedor) : fornecedor,
    fornecedor,
    pesquisado: tarefa.simplesPesquisado,
    posicao: tarefa.simplesPosicao,
    total: tarefa.simplesFaltam.length
  }
}
async function simplesPesquisei (cnpj) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples') return { ok: false }
  tarefa.simplesPesquisado = true
  await gravarTarefa(tarefa)
  return { ok: true }
}
// PDF (ou erro) de um fornecedor. Filial recusada: tenta a matriz uma vez (D7).
async function receberSimples (recado, aba) {
  const tarefa = await lerTarefa()
  if (!tarefa || tarefa.fase !== 'simples' || !aba || aba.id !== tarefa.idAbaSicaf || tarefa.simplesFaltam[tarefa.simplesPosicao] !== recado.fornecedor) return { fim: true }
  tarefa.simplesPesquisado = false
  const matriz = regras.cnpjMatriz(recado.fornecedor)
  if (recado.recusado && !tarefa.simplesMatriz && matriz !== recado.fornecedor) {
    tarefa.simplesMatriz = true
    await gravarTarefa(tarefa)
    return { repetir: true }
  }
  if (recado.arquivo) {
    const nomeDoArquivo = simples.nomeDoArquivo(recado.fornecedor)
    const salvo = await salvarSeConfigurado('copiaConsulta', recado.arquivo, nomeDoArquivo)
    tarefa.consultas[recado.fornecedor] = { nome: recado.nome || '', situacao: recado.situacao || '', cnpjConsultado: recado.cnpj, arquivo: recado.arquivo, nomeDoArquivo, salvo }
  } else {
    tarefa.simplesErros[recado.fornecedor] = recado.erro || 'O Simples Nacional não respondeu.'
  }
  tarefa.simplesPosicao++
  tarefa.simplesMatriz = false
  if (tarefa.simplesPosicao < tarefa.simplesFaltam.length) {
    await gravarTarefa(tarefa)
    return { proximo: true }
  }
  await terminar(tarefa)
  return { fim: true }
}
