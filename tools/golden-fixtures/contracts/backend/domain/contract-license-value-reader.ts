/**
 * Proyección de lectura (spec 40): valor de contrato derivado = suma del annualValue de sus
 * licencias. Lee la tabla de licencias del propio contexto (acoplamiento intra-contexto
 * deliberado: es un read model de contracts, no una operación sobre el agregado License).
 * SAP no provee importe de contrato; la única fuente veraz es la suma de sus licencias.
 */
export abstract class ContractLicenseValueReader {
  /** Mapa contractId → suma de annualValue de sus licencias; ausente = contrato sin licencias */
  abstract totalValueByContractIds(contractIds: string[]): Promise<Record<string, number>>
}
