import { RegisterProjectInput } from '../../application/dtos/register-project-input.dto'

// UUIDv7 deterministas. Categoría 0007 = proyectos. Reproducibles entre ejecuciones.
const projectId = (n: number): string => `019eb800-0007-7000-8000-${pad(n)}`
// Clientes ya sembrados por el seed de customers (0001 mockup, 0002 demo).
const customerId = (n: number): string => `019eb800-0001-7000-8000-${pad(n)}`
const demoCustomerId = (n: number): string => `019eb800-0002-7000-8000-${pad(n)}`
const pad = (n: number): string => n.toString().padStart(12, '0')

// Los 11 proyectos del mockup (aurora-catalyst-prototype/.../sap-projects.service.ts),
// ligados a los clientes sembrados por su UUID (los customerId 1-8 del prototipo coinciden
// 1:1 con los clientes sembrados). La idempotencia la da la unicidad (customerId, name).
const MOCKUP_PROJECTS: RegisterProjectInput[] = [
  {
    id: projectId(1),
    customerId: customerId(1),
    customerName: 'Ferrovial Construcción S.A.',
    name: 'S/4HANA Greenfield Implementation',
    description: 'Implementación de S/4HANA Cloud para finanzas y compras.',
    startDate: '2023-02-01',
    endDate: '2024-06-30',
    status: 'closed',
    implementer: 'AVVALE'
  },
  {
    id: projectId(2),
    customerId: customerId(1),
    customerName: 'Ferrovial Construcción S.A.',
    name: 'SuccessFactors EC Rollout',
    description: 'Despliegue Employee Central en 12 países.',
    startDate: '2024-09-01',
    endDate: '2025-12-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(3),
    customerId: customerId(2),
    customerName: 'Mercadona S.A.',
    name: 'Programa Omnichannel Retail',
    description: 'S/4HANA + Ariba integrados con el resto del ecosistema retail.',
    startDate: '2022-04-01',
    endDate: '2025-03-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(4),
    customerId: customerId(3),
    customerName: 'Inditex Group',
    name: 'Digital Core Inditex',
    description: 'Migración desde ECC a S/4HANA en modelo Selective Transition.',
    startDate: '2023-10-01',
    endDate: '2026-06-30',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(5),
    customerId: customerId(3),
    customerName: 'Inditex Group',
    name: 'Talent Ecosystem',
    description: 'Integración SuccessFactors con LMS propio.',
    startDate: '2024-01-15',
    endDate: '2024-11-30',
    status: 'closed',
    implementer: 'THIRD_PARTY'
  },
  {
    id: projectId(6),
    customerId: customerId(4),
    customerName: 'Iberdrola S.A.',
    name: 'Utility Core S/4HANA',
    description: 'Nueva plataforma ERP con IS-U.',
    startDate: '2022-08-01',
    endDate: '2025-12-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(7),
    customerId: customerId(5),
    customerName: 'Grupo Logista',
    name: 'Logística 360',
    description: 'Despliegue Concur + integración con TMS.',
    startDate: '2024-02-01',
    endDate: '2025-06-30',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(8),
    customerId: customerId(6),
    customerName: 'Laboratorios Rovi',
    name: 'ERP Pharma Compliance',
    description: 'S/4HANA adaptado a regulación GMP.',
    startDate: '2023-05-01',
    endDate: '2024-12-31',
    status: 'closed',
    implementer: 'AVVALE'
  },
  {
    id: projectId(9),
    customerId: customerId(7),
    customerName: 'Acciona Energía',
    name: 'Green Core Acciona',
    description: 'S/4HANA + Sustainability Control Tower.',
    startDate: '2024-09-15',
    endDate: '2026-03-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(10),
    customerId: customerId(8),
    customerName: 'Puig Brands',
    name: 'Beauty Digital Backbone',
    description: 'Renovación ERP + Materials Management.',
    startDate: '2023-12-01',
    endDate: '2025-09-30',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(11),
    customerId: customerId(8),
    customerName: 'Puig Brands',
    name: 'Omnichannel Launch',
    description: 'Fase 1 de Commerce Cloud.',
    startDate: '2025-06-01',
    endDate: '2026-08-31',
    status: 'planning',
    implementer: 'AVVALE'
  }
]

// Proyectos de los clientes demo (ids 12+): dan volumen a la tabla (>20 filas para probar
// paginado y filtros) y cubren el estado `onhold`, que el mockup no ejercita.
const DEMO_PROJECTS: RegisterProjectInput[] = [
  {
    id: projectId(12),
    customerId: demoCustomerId(1),
    customerName: 'Aceros del Cantábrico S.A.',
    name: 'S/4HANA Brownfield Conversion',
    description: 'Conversión del ECC industrial a S/4HANA Private Cloud.',
    startDate: '2024-04-01',
    endDate: '2026-09-30',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(13),
    customerId: demoCustomerId(2),
    customerName: 'Bodegas Riofrío S.L.',
    name: 'Cloud ERP Vitivinícola',
    description: 'Implantación de Cloud ERP con trazabilidad de lotes.',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    status: 'planning',
    implementer: 'AVVALE'
  },
  {
    id: projectId(14),
    customerId: demoCustomerId(3),
    customerName: 'Naviera Atlántica S.A.',
    name: 'Fleet Maintenance Core',
    description: 'S/4HANA con mantenimiento de flota (PM/EAM).',
    startDate: '2023-07-01',
    endDate: '2026-12-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(15),
    customerId: demoCustomerId(3),
    customerName: 'Naviera Atlántica S.A.',
    name: 'Concur Rollout Flota',
    description: 'Gastos de viaje de tripulaciones con Concur.',
    startDate: '2024-03-01',
    endDate: '2024-12-20',
    status: 'closed',
    implementer: 'AVVALE'
  },
  {
    id: projectId(16),
    customerId: demoCustomerId(4),
    customerName: 'Grupo Asegurador Levante S.A.',
    name: 'Core Asegurador S/4',
    description: 'Nueva plataforma financiera; en pausa por revisión regulatoria.',
    startDate: '2023-01-10',
    endDate: '2026-12-31',
    status: 'onhold',
    implementer: 'AVVALE'
  },
  {
    id: projectId(17),
    customerId: demoCustomerId(5),
    customerName: 'Banca Meridional S.A.',
    name: 'Banking Analytics Platform',
    description: 'SAP Analytics Cloud para reporting regulatorio.',
    startDate: '2024-06-01',
    endDate: '2026-11-30',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(18),
    customerId: demoCustomerId(6),
    customerName: 'Textiles Bergara S.L.',
    name: 'HR Cloud Textil',
    description: 'SuccessFactors EC para plantilla de producción.',
    startDate: '2025-01-01',
    endDate: '2026-10-31',
    status: 'active',
    implementer: 'THIRD_PARTY'
  },
  {
    id: projectId(19),
    customerId: demoCustomerId(7),
    customerName: 'Cerámicas Castellón S.A.',
    name: 'Azulejo Digital',
    description: 'Digitalización de planta con S/4HANA PP.',
    startDate: '2022-05-01',
    endDate: '2023-11-30',
    status: 'closed',
    implementer: 'AVVALE'
  },
  {
    id: projectId(20),
    customerId: demoCustomerId(8),
    customerName: 'Distribuciones Alimentarias del Sur S.L.',
    name: 'Ariba Procurement Sur',
    description: 'Compras indirectas con Ariba Buying.',
    startDate: '2025-04-01',
    endDate: '2026-12-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(21),
    customerId: demoCustomerId(9),
    customerName: 'Química Ebro S.A.',
    name: 'Migración Cloud Química Ebro',
    description: 'Salida del on-premise rescindido hacia Cloud ERP.',
    startDate: '2024-10-01',
    endDate: '2027-03-31',
    status: 'active',
    implementer: 'AVVALE'
  },
  {
    id: projectId(22),
    customerId: demoCustomerId(10),
    customerName: 'Clínicas Mediterráneo S.L.',
    name: 'Historia Clínica Integrada',
    description: 'Integración del ERP con el HIS corporativo.',
    startDate: '2026-10-01',
    endDate: '2027-12-31',
    status: 'planning',
    implementer: 'THIRD_PARTY'
  },
  {
    id: projectId(23),
    customerId: demoCustomerId(11),
    customerName: 'Autopartes Galicia S.L.',
    name: 'Automotive Core Upgrade',
    description: 'Upgrade S/4HANA; en pausa por renovación de contrato.',
    startDate: '2024-02-01',
    endDate: '2026-12-31',
    status: 'onhold',
    implementer: 'AVVALE'
  },
  {
    id: projectId(24),
    customerId: demoCustomerId(13),
    customerName: 'Hoteles Costa Brava Group S.A.',
    name: 'Revenue & Expense Suite',
    description: 'Concur y analítica de ingresos hotelera.',
    startDate: '2025-05-01',
    endDate: '2026-09-30',
    status: 'active',
    implementer: 'AVVALE'
  }
]

export const SEED_PROJECTS: RegisterProjectInput[] = [...MOCKUP_PROJECTS, ...DEMO_PROJECTS]
