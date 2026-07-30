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
    id: '019eb801-0033-7000-8000-000000000001',
    reference: 'V-2026-0148',
    saleDate: '2026-07-28',
    vehicleLabel: 'Peugeot 208 PureTech 100 Allure',
    clientLabel: 'Sara Castaño Vigil',
    salesperson: 'R. Argüelles',
    amount: 16400,
    discount: 0,
    paymentMethod: 'cash',
    status: 'pending'
  },
  {
    id: '019eb801-0033-7000-8000-000000000002',
    reference: 'V-2026-0147',
    saleDate: '2026-07-24',
    vehicleLabel: 'Citroen C4 BlueHDi 130',
    clientLabel: 'Transportes Llanera SL',
    salesperson: 'M. Peláez',
    amount: 18900,
    discount: 400,
    paymentMethod: 'financing',
    status: 'pending'
  },
  {
    id: '019eb801-0033-7000-8000-000000000003',
    reference: 'V-2026-0146',
    saleDate: '2026-07-19',
    vehicleLabel: 'Kia Ceed 1.0 T-GDi Drive',
    clientLabel: 'Diego Álvarez Pando',
    salesperson: 'R. Argüelles',
    amount: 19200,
    discount: 300,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000004',
    reference: 'V-2026-0145',
    saleDate: '2026-07-11',
    vehicleLabel: 'Toyota RAV4 220H Advance',
    clientLabel: 'Clínica Dental Nalón',
    salesperson: 'A. Cueto',
    amount: 38600,
    discount: 1200,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000005',
    reference: 'V-2026-0144',
    saleDate: '2026-07-04',
    vehicleLabel: 'Dacia Duster ECO-G 100',
    clientLabel: 'Carmen Suárez Vega',
    salesperson: 'M. Peláez',
    amount: 18300,
    discount: 0,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000006',
    reference: 'V-2026-0143',
    saleDate: '2026-06-27',
    vehicleLabel: 'VW T-Roc 1.5 TSI Style',
    clientLabel: 'María Fernández Ruiz',
    salesperson: 'A. Cueto',
    amount: 27400,
    discount: 600,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000007',
    reference: 'V-2026-0142',
    saleDate: '2026-06-20',
    vehicleLabel: 'Renault Captur E-Tech 145',
    clientLabel: 'Panadería El Hórreo SL',
    salesperson: 'R. Argüelles',
    amount: 24100,
    discount: 500,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000008',
    reference: 'V-2026-0141',
    saleDate: '2026-06-09',
    vehicleLabel: 'Hyundai i20 1.2 MPI Klass',
    clientLabel: 'Lucía Menéndez Soto',
    salesperson: 'M. Peláez',
    amount: 15800,
    discount: 0,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000009',
    reference: 'V-2026-0140',
    saleDate: '2026-05-30',
    vehicleLabel: 'Ford Puma 1.0 EcoBoost',
    clientLabel: 'Pablo Iglesias Noval',
    salesperson: 'A. Cueto',
    amount: 22600,
    discount: 450,
    paymentMethod: 'financing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000010',
    reference: 'V-2026-0139',
    saleDate: '2026-05-16',
    vehicleLabel: 'SEAT Ibiza 1.0 TSI Style',
    clientLabel: 'José Antonio Cabal',
    salesperson: 'R. Argüelles',
    amount: 17100,
    discount: 0,
    paymentMethod: 'cash',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000011',
    reference: 'V-2026-0138',
    saleDate: '2026-05-02',
    vehicleLabel: 'BMW X1 sDrive18d',
    clientLabel: 'Asesoría Buenavista',
    salesperson: 'A. Cueto',
    amount: 36900,
    discount: 900,
    paymentMethod: 'leasing',
    status: 'delivered'
  },
  {
    id: '019eb801-0033-7000-8000-000000000012',
    reference: 'V-2026-0137',
    saleDate: '2026-04-21',
    vehicleLabel: 'Opel Corsa 1.2 T Edition',
    clientLabel: 'Reformas Cantábrico SL',
    salesperson: 'M. Peláez',
    amount: 16900,
    discount: 250,
    paymentMethod: 'financing',
    status: 'cancelled'
  }
]
// @ai:end

export const SEED_SALES: RegisterSaleInput[] = [...CUSTOM]
