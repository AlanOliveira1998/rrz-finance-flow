// Field maps: camelCase key → snake_case value
export const INVOICE_FIELD_MAP: Record<string, string> = {
  dataEmissao: 'data_emissao',
  dataVencimento: 'data_vencimento',
  dataRecebimento: 'data_recebimento',
  valorBruto: 'valor_bruto',
  valorEmitido: 'valor_emitido',
  valorRecebido: 'valor_recebido',
  valorLivreImpostos: 'valor_livre_impostos',
  valorLivre: 'valor_livre',
  clienteId: 'cliente_id',
  numeroParcela: 'numero_parcela',
  valorParcela: 'valor_parcela',
  totalParcelas: 'total_parcelas',
  projetoId: 'projeto_id',
  tipoProjeto: 'tipo_projeto',
}

export const CLIENT_FIELD_MAP: Record<string, string> = {
  razaoSocial: 'razao_social',
  nomeFantasia: 'nome_fantasia',
}

export const PROPOSAL_FIELD_MAP: Record<string, string> = {
  clientId: 'client_id',
  projectId: 'project_id',
  docuSignId: 'docusign_id',
  arquivoUrl: 'arquivo_url',
}

export function toSnakeCase(
  obj: Record<string, unknown>,
  map: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[map[key] ?? key] = value
  }
  return result
}

export function toCamelCase(
  obj: Record<string, unknown>,
  map: Record<string, string>,
): Record<string, unknown> {
  const inverted = Object.fromEntries(Object.entries(map).map(([c, s]) => [s, c]))
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[inverted[key] ?? key] = value
  }
  return result
}
