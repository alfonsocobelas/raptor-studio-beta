import { RegisterSaleInput } from '../../application/dtos/register-sale-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterSaleInput[] = [
  {
    id: '019eb800-47d9-7000-8000-000000000001',
    reference: 'SEED-SALE-1',
    saleDate: '2026-01-01',
    vehicleLabel: 'VehicleLabel seed 1',
    clientLabel: 'ClientLabel seed 1',
    amount: 1,
    paymentMethod: 'cash',
    status: 'pending'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000002',
    reference: 'SEED-SALE-2',
    saleDate: '2026-01-02',
    vehicleLabel: 'VehicleLabel seed 2',
    clientLabel: 'ClientLabel seed 2',
    amount: 2,
    paymentMethod: 'financing',
    status: 'delivered'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterSaleInput)
const CUSTOM: RegisterSaleInput[] = [
  {
    id: '019eb800-47d9-7000-8000-000000000101',
    reference: 'V-2026-0001',
    saleDate: '2026-01-09',
    vehicleLabel: 'Opel Corsa 1.2 T Edition (6710 LTF)',
    clientLabel: 'Javier Lamas Castro',
    salesperson: 'Marta Gil',
    amount: 14500,
    discount: 500,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000102',
    reference: 'V-2026-0002',
    saleDate: '2026-01-21',
    vehicleLabel: 'Toyota Corolla 1.8 Hybrid (usado 2022)',
    clientLabel: 'Laura Fernández Ruiz',
    salesperson: 'Sergio Peña',
    amount: 21300,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000103',
    reference: 'V-2026-0003',
    saleDate: '2026-02-04',
    vehicleLabel: 'Volkswagen T-Roc 1.5 TSI Sport',
    clientLabel: 'Carmen Ortega Vidal',
    salesperson: 'Marta Gil',
    amount: 24800,
    discount: 1200,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000104',
    reference: 'V-2026-0004',
    saleDate: '2026-02-17',
    vehicleLabel: 'Renault Clio E-Tech Techno',
    clientLabel: 'Ana Belén Cruz Marín',
    salesperson: 'Nuria Salas',
    amount: 18900,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000105',
    reference: 'V-2026-0005',
    saleDate: '2026-02-26',
    vehicleLabel: 'Peugeot 308 1.2 PureTech Allure',
    clientLabel: 'Reformas Vega Hermanos SL',
    salesperson: 'Sergio Peña',
    amount: 23400,
    discount: 800,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000106',
    reference: 'V-2026-0006',
    saleDate: '2026-03-06',
    vehicleLabel: 'Mercedes-Benz Clase A 200 AMG Line (2205 LYG)',
    clientLabel: 'Clínica Dental Sonrisa SLU',
    salesperson: 'Marta Gil',
    amount: 27900,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000107',
    reference: 'V-2026-0007',
    saleDate: '2026-03-19',
    vehicleLabel: 'Kia Ceed 1.0 T-GDi Drive',
    clientLabel: 'Miguel Ángel Soto Prada',
    salesperson: 'Nuria Salas',
    amount: 17200,
    discount: 400,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000108',
    reference: 'V-2026-0008',
    saleDate: '2026-03-27',
    vehicleLabel: 'Hyundai Tucson 1.6 T-GDi HEV',
    clientLabel: 'Transportes Iberia SL',
    salesperson: 'Sergio Peña',
    amount: 31800,
    discount: 1500,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000109',
    reference: 'V-2026-0009',
    saleDate: '2026-04-08',
    vehicleLabel: 'Seat Arona 1.0 TSI Style',
    clientLabel: 'Laura Fernández Ruiz',
    salesperson: 'Marta Gil',
    amount: 16900,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000110',
    reference: 'V-2026-0010',
    saleDate: '2026-04-22',
    vehicleLabel: 'Tesla Model Y RWD',
    clientLabel: 'Clínica Dental Sonrisa SLU',
    salesperson: 'Nuria Salas',
    amount: 41200,
    discount: 2000,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000111',
    reference: 'V-2026-0011',
    saleDate: '2026-05-05',
    vehicleLabel: 'Cupra León 1.5 eTSI',
    clientLabel: 'Javier Lamas Castro',
    salesperson: 'Sergio Peña',
    amount: 28600,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000112',
    reference: 'V-2026-0012',
    saleDate: '2026-05-14',
    vehicleLabel: 'Volkswagen Golf 2.0 TDI Life',
    clientLabel: 'Transportes Iberia SL',
    salesperson: 'Marta Gil',
    amount: 22400,
    discount: 900,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000113',
    reference: 'V-2026-0013',
    saleDate: '2026-05-28',
    vehicleLabel: 'Dacia Duster 1.3 TCe Journey',
    clientLabel: 'Reformas Vega Hermanos SL',
    salesperson: 'Nuria Salas',
    amount: 19700,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000114',
    reference: 'V-2026-0014',
    saleDate: '2026-06-03',
    vehicleLabel: 'Toyota RAV4 2.5 Hybrid Advance',
    clientLabel: 'Carmen Ortega Vidal',
    salesperson: 'Marta Gil',
    amount: 36400,
    discount: 1100,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000115',
    reference: 'V-2026-0015',
    saleDate: '2026-06-16',
    vehicleLabel: 'Ford Puma 1.0 EcoBoost ST-Line',
    clientLabel: 'Ana Belén Cruz Marín',
    salesperson: 'Sergio Peña',
    amount: 21800,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000116',
    reference: 'V-2026-0016',
    saleDate: '2026-06-25',
    vehicleLabel: 'BMW X1 sDrive18d',
    clientLabel: 'Clínica Dental Sonrisa SLU',
    salesperson: 'Nuria Salas',
    amount: 39500,
    discount: 1800,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000117',
    reference: 'V-2026-0017',
    saleDate: '2026-07-07',
    vehicleLabel: 'Hyundai Ioniq 5 77 kWh (3319 MPD)',
    clientLabel: 'Miguel Ángel Soto Prada',
    salesperson: 'Marta Gil',
    amount: 42600,
    discount: 1600,
    paymentMethod: 'financing',
    status: 'pending'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000118',
    reference: 'V-2026-0018',
    saleDate: '2026-07-15',
    vehicleLabel: 'Toyota Corolla 1.8 Hybrid (9012 MTT)',
    clientLabel: 'Laura Fernández Ruiz',
    salesperson: 'Sergio Peña',
    amount: 26700,
    paymentMethod: 'financing',
    status: 'pending'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000119',
    reference: 'V-2026-0019',
    saleDate: '2026-07-22',
    vehicleLabel: 'Seat Ibiza 1.0 MPI Reference',
    clientLabel: 'Javier Lamas Castro',
    salesperson: 'Nuria Salas',
    amount: 15400,
    paymentMethod: 'cash',
    status: 'cancelled'
  },
  {
    id: '019eb800-47d9-7000-8000-000000000120',
    reference: 'V-2026-0020',
    saleDate: '2026-07-28',
    vehicleLabel: 'Kia Sportage 1.6 T-GDi HEV (4478 MJB)',
    clientLabel: 'Transportes Iberia SL',
    salesperson: 'Marta Gil',
    amount: 29400,
    discount: 700,
    paymentMethod: 'leasing',
    status: 'pending'
  }
]
// @ai:end

export const SEED_SALES: RegisterSaleInput[] = [...DERIVED, ...CUSTOM]
