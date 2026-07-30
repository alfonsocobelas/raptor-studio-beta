import { RegisterLicenseInput } from '../../application/dtos/register-license-input.dto'
import { ConsumptionRecord } from '../../domain/license-types'

// UUIDv7 deterministas. Categorías: 0005 licencias, 0006 registros de consumo.
// Enlaces a clientes (0001) y contratos (0004) ya sembrados.
const licenseId = (n: number): string => `019eb800-0005-7000-8000-${pad(n)}`
const consumptionId = (n: number): string => `019eb800-0006-7000-8000-${pad(n)}`
const customerId = (n: number): string => `019eb800-0001-7000-8000-${pad(n)}`
const demoCustomerId = (n: number): string => `019eb800-0002-7000-8000-${pad(n)}`
const contractId = (n: number): string => `019eb800-0004-7000-8000-${pad(n)}`
const pad = (n: number): string => n.toString().padStart(12, '0')

// Metadatos de los contratos ya sembrados (módulo contracts). Cada licencia enlaza a uno
// de ellos: 1-10 replican la distribución cliente/contrato del prototipo; 11+ son los
// contratos de los clientes demo (dan volumen a la tabla para paginado y filtros).
interface ContractMeta {
  customerId: string
  customerName: string
  contractNumber: string
  contractEndDate: string
}

const CONTRACTS: Record<number, ContractMeta> = {
  1: {
    customerId: customerId(1),
    customerName: 'Ferrovial Construcción S.A.',
    contractNumber: 'AVV-FER-2023-001',
    contractEndDate: '2026-01-14'
  },
  2: {
    customerId: customerId(1),
    customerName: 'Ferrovial Construcción S.A.',
    contractNumber: 'AVV-FER-2024-012',
    contractEndDate: '2027-05-31'
  },
  3: {
    customerId: customerId(2),
    customerName: 'Mercadona S.A.',
    contractNumber: 'AVV-MER-2022-008',
    contractEndDate: '2026-02-28'
  },
  4: {
    customerId: customerId(2),
    customerName: 'Mercadona S.A.',
    contractNumber: 'SAP-MER-DIRECT-2021',
    contractEndDate: '2026-09-30'
  },
  5: {
    customerId: customerId(3),
    customerName: 'Inditex Group',
    contractNumber: 'AVV-IND-2023-015',
    contractEndDate: '2026-08-31'
  },
  6: {
    customerId: customerId(4),
    customerName: 'Iberdrola S.A.',
    contractNumber: 'AVV-IBE-2022-003',
    contractEndDate: '2026-06-30'
  },
  7: {
    customerId: customerId(5),
    customerName: 'Grupo Logista',
    contractNumber: 'AVV-LOG-2024-021',
    contractEndDate: '2027-12-31'
  },
  8: {
    customerId: customerId(6),
    customerName: 'Laboratorios Rovi',
    contractNumber: 'AVV-ROV-2023-007',
    contractEndDate: '2026-03-31'
  },
  9: {
    customerId: customerId(7),
    customerName: 'Acciona Energía',
    contractNumber: 'AVV-ACC-2024-004',
    contractEndDate: '2027-08-31'
  },
  10: {
    customerId: customerId(8),
    customerName: 'Puig Brands',
    contractNumber: 'AVV-PUI-2023-019',
    contractEndDate: '2026-10-31'
  },
  11: {
    customerId: demoCustomerId(1),
    customerName: 'Aceros del Cantábrico S.A.',
    contractNumber: 'AVV-ACE-2024-030',
    contractEndDate: '2027-02-28'
  },
  12: {
    customerId: demoCustomerId(2),
    customerName: 'Bodegas Riofrío S.L.',
    contractNumber: 'AVV-RIO-2025-002',
    contractEndDate: '2028-01-14'
  },
  13: {
    customerId: demoCustomerId(3),
    customerName: 'Naviera Atlántica S.A.',
    contractNumber: 'AVV-NAV-2023-011',
    contractEndDate: '2026-11-30'
  },
  14: {
    customerId: demoCustomerId(4),
    customerName: 'Grupo Asegurador Levante S.A.',
    contractNumber: 'AVV-LEV-2022-005',
    contractEndDate: '2026-08-31'
  },
  15: {
    customerId: demoCustomerId(5),
    customerName: 'Banca Meridional S.A.',
    contractNumber: 'AVV-BME-2024-018',
    contractEndDate: '2027-04-30'
  },
  17: {
    customerId: demoCustomerId(6),
    customerName: 'Textiles Bergara S.L.',
    contractNumber: 'AVV-TEX-2024-026',
    contractEndDate: '2027-10-31'
  },
  18: {
    customerId: demoCustomerId(7),
    customerName: 'Cerámicas Castellón S.A.',
    contractNumber: 'AVV-CER-2023-009',
    contractEndDate: '2027-03-14'
  },
  19: {
    customerId: demoCustomerId(8),
    customerName: 'Distribuciones Alimentarias del Sur S.L.',
    contractNumber: 'AVV-DAS-2025-007',
    contractEndDate: '2028-01-31'
  },
  21: {
    customerId: demoCustomerId(9),
    customerName: 'Química Ebro S.A.',
    contractNumber: 'AVV-QEB-2024-031',
    contractEndDate: '2027-12-31'
  },
  22: {
    customerId: demoCustomerId(10),
    customerName: 'Clínicas Mediterráneo S.L.',
    contractNumber: 'AVV-CME-2024-022',
    contractEndDate: '2027-06-30'
  },
  23: {
    customerId: demoCustomerId(11),
    customerName: 'Autopartes Galicia S.L.',
    contractNumber: 'AVV-AGA-2023-016',
    contractEndDate: '2026-07-31'
  }
}

// Especificación de cada licencia: contrato, área de solución (subSolutionAreaName, dato real
// de SAP), métrica, unidades/precio y consumo "actual" (última lectura). El consumo actual
// define el estado de salud final (mezcla saludable/infrautilizada/sobreuso/infracción).
interface LicenseSpec {
  ref: number
  contract: number
  subSolutionAreaName: string
  metricId: string
  metricName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  current: number
}

const LICENSE_SPECS: LicenseSpec[] = [
  // Ferrovial — AVV-FER-2023-001 (S/4HANA + BTP)
  {
    ref: 1,
    contract: 1,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 180,
    pricePerUnit: 320,
    current: 172
  },
  {
    ref: 2,
    contract: 1,
    subSolutionAreaName: 'SAP Integration Suite',
    metricId: 'CP228',
    metricName: 'Users - SAP Integration Suite',
    metric: 'user',
    licensedUnits: 250,
    pricePerUnit: 95,
    current: 210
  },
  // Ferrovial — AVV-FER-2024-012 (SuccessFactors)
  {
    ref: 3,
    contract: 2,
    subSolutionAreaName: 'Core HR and Payroll',
    metricId: 'CS06',
    metricName: 'Users - SuccessFactors EC',
    metric: 'user',
    licensedUnits: 4500,
    pricePerUnit: 12,
    current: 1200
  },
  // Mercadona — AVV-MER-2022-008 (Avvale)
  {
    ref: 4,
    contract: 3,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 320,
    pricePerUnit: 310,
    current: 335
  },
  {
    ref: 5,
    contract: 3,
    subSolutionAreaName: 'Intelligent Spend Management',
    metricId: 'AR88',
    metricName: 'Documents - Ariba',
    metric: 'document',
    licensedUnits: 500000,
    pricePerUnit: 0.08,
    current: 420000
  },
  // Mercadona — SAP-MER-DIRECT-2021 (SAP direct)
  {
    ref: 6,
    contract: 4,
    subSolutionAreaName: 'Customer Experience',
    metricId: 'CX12',
    metricName: 'Users - Customer Experience',
    metric: 'user',
    licensedUnits: 600,
    pricePerUnit: 45,
    current: 180
  },
  // Inditex — AVV-IND-2023-015
  {
    ref: 7,
    contract: 5,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 450,
    pricePerUnit: 305,
    current: 445
  },
  {
    ref: 8,
    contract: 5,
    subSolutionAreaName: 'Core HR and Payroll',
    metricId: 'CS06',
    metricName: 'Users - SuccessFactors EC',
    metric: 'user',
    licensedUnits: 12000,
    pricePerUnit: 11,
    current: 11200
  },
  {
    ref: 9,
    contract: 5,
    subSolutionAreaName: 'Data & Analytics',
    metricId: 'CA45',
    metricName: 'Users - SAP Analytics Cloud',
    metric: 'user',
    licensedUnits: 300,
    pricePerUnit: 55,
    current: 90
  },
  // Iberdrola — AVV-IBE-2022-003 (expiring)
  {
    ref: 10,
    contract: 6,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 260,
    pricePerUnit: 315,
    current: 275
  },
  {
    ref: 11,
    contract: 6,
    subSolutionAreaName: 'Intelligent Spend Management',
    metricId: 'AR88',
    metricName: 'Documents - Ariba',
    metric: 'document',
    licensedUnits: 200000,
    pricePerUnit: 0.09,
    current: 55000
  },
  // Logista — AVV-LOG-2024-021
  {
    ref: 12,
    contract: 7,
    subSolutionAreaName: 'Travel and Expense Management',
    metricId: 'CN30',
    metricName: 'Users - Concur',
    metric: 'user',
    licensedUnits: 800,
    pricePerUnit: 18,
    current: 770
  },
  // Rovi — AVV-ROV-2023-007
  {
    ref: 13,
    contract: 8,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 90,
    pricePerUnit: 330,
    current: 35
  },
  // Acciona — AVV-ACC-2024-004
  {
    ref: 14,
    contract: 9,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 150,
    pricePerUnit: 320,
    current: 148
  },
  {
    ref: 15,
    contract: 9,
    subSolutionAreaName: 'Customer Experience',
    metricId: 'CX12',
    metricName: 'Users - Customer Experience',
    metric: 'user',
    licensedUnits: 180,
    pricePerUnit: 48,
    current: 175
  },
  // Puig — AVV-PUI-2023-019
  {
    ref: 16,
    contract: 10,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 110,
    pricePerUnit: 325,
    current: 112
  },
  {
    ref: 17,
    contract: 10,
    subSolutionAreaName: 'Core HR and Payroll',
    metricId: 'CS06',
    metricName: 'Users - SuccessFactors EC',
    metric: 'user',
    licensedUnits: 3200,
    pricePerUnit: 13,
    current: 900
  },
  // Licencias de los contratos demo (refs 18+): dan volumen a la tabla (>20 filas) manteniendo
  // la mezcla de estados de salud (saludable / infrautilizada / sobreuso / infracción).
  // Aceros del Cantábrico — AVV-ACE-2024-030
  {
    ref: 18,
    contract: 11,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 140,
    pricePerUnit: 318,
    current: 132
  },
  // Bodegas Riofrío — AVV-RIO-2025-002 (infracción)
  {
    ref: 19,
    contract: 12,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 45,
    pricePerUnit: 330,
    current: 47
  },
  // Naviera Atlántica — AVV-NAV-2023-011
  {
    ref: 20,
    contract: 13,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 210,
    pricePerUnit: 312,
    current: 175
  },
  {
    ref: 21,
    contract: 13,
    subSolutionAreaName: 'Travel and Expense Management',
    metricId: 'CN30',
    metricName: 'Users - Concur',
    metric: 'user',
    licensedUnits: 350,
    pricePerUnit: 18,
    current: 120
  },
  // Grupo Asegurador Levante — AVV-LEV-2022-005 (sobreuso)
  {
    ref: 22,
    contract: 14,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 280,
    pricePerUnit: 308,
    current: 271
  },
  // Banca Meridional — AVV-BME-2024-018
  {
    ref: 23,
    contract: 15,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 520,
    pricePerUnit: 300,
    current: 460
  },
  {
    ref: 24,
    contract: 15,
    subSolutionAreaName: 'Data & Analytics',
    metricId: 'CA45',
    metricName: 'Users - SAP Analytics Cloud',
    metric: 'user',
    licensedUnits: 400,
    pricePerUnit: 52,
    current: 130
  },
  // Textiles Bergara — AVV-TEX-2024-026
  {
    ref: 25,
    contract: 17,
    subSolutionAreaName: 'Core HR and Payroll',
    metricId: 'CS06',
    metricName: 'Users - SuccessFactors EC',
    metric: 'user',
    licensedUnits: 900,
    pricePerUnit: 12,
    current: 780
  },
  // Cerámicas Castellón — AVV-CER-2023-009
  {
    ref: 26,
    contract: 18,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 160,
    pricePerUnit: 322,
    current: 150
  },
  // Distribuciones Alimentarias del Sur — AVV-DAS-2025-007 (infracción)
  {
    ref: 27,
    contract: 19,
    subSolutionAreaName: 'Intelligent Spend Management',
    metricId: 'AR88',
    metricName: 'Documents - Ariba',
    metric: 'document',
    licensedUnits: 300000,
    pricePerUnit: 0.08,
    current: 315000
  },
  // Química Ebro — AVV-QEB-2024-031
  {
    ref: 28,
    contract: 21,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 190,
    pricePerUnit: 315,
    current: 168
  },
  // Clínicas Mediterráneo — AVV-CME-2024-022 (infrautilizada)
  {
    ref: 29,
    contract: 22,
    subSolutionAreaName: 'Customer Experience',
    metricId: 'CX12',
    metricName: 'Users - Customer Experience',
    metric: 'user',
    licensedUnits: 250,
    pricePerUnit: 46,
    current: 92
  },
  // Autopartes Galicia — AVV-AGA-2023-016 (sobreuso)
  {
    ref: 30,
    contract: 23,
    subSolutionAreaName: 'Cloud ERP Private',
    metricId: 'CY301',
    metricName: 'FUE - Cloud ERP',
    metric: 'FUE',
    licensedUnits: 130,
    pricePerUnit: 320,
    current: 126
  }
]

export const SEED_LICENSES: RegisterLicenseInput[] = LICENSE_SPECS.map(spec => {
  const meta = CONTRACTS[spec.contract]
  return {
    id: licenseId(spec.ref),
    contractId: contractId(spec.contract),
    customerId: meta.customerId,
    customerName: meta.customerName,
    contractNumber: meta.contractNumber,
    contractEndDate: meta.contractEndDate,
    metricId: spec.metricId,
    metricName: spec.metricName,
    subSolutionAreaName: spec.subSolutionAreaName,
    metric: spec.metric,
    licensedUnits: spec.licensedUnits,
    pricePerUnit: spec.pricePerUnit,
    status: 'active'
  }
})

// 6 meses de historial por licencia (ene–jun 2026) con rampa suave hasta el consumo "actual";
// el mes más reciente (junio) fija la última lectura y, por tanto, el estado de salud derivado.
const RAMP = [0.78, 0.82, 0.88, 0.92, 0.96, 1] as const

const history = (spec: LicenseSpec): ConsumptionRecord[] =>
  RAMP.map((factor, i) => ({
    id: consumptionId((spec.ref - 1) * RAMP.length + i + 1),
    licenseId: licenseId(spec.ref),
    periodYear: 2026,
    periodMonth: i + 1,
    units: Math.round(spec.current * factor),
    source: 'MANUAL'
  }))

export const SEED_CONSUMPTION: ConsumptionRecord[] = LICENSE_SPECS.flatMap(history)
