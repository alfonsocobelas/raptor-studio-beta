import { RegisterVehicleInput } from '../../application/dtos/register-vehicle-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterVehicleInput[] = [
  {
    id: '019eb800-ee32-7000-8000-000000000001',
    vin: 'SEED-VEHICLE-1',
    brand: 'Brand seed 1',
    model: 'Model seed 1',
    fuel: 'gasoline',
    year: 1990,
    mileage: 1,
    price: 1,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000002',
    vin: 'SEED-VEHICLE-2',
    brand: 'Brand seed 2',
    model: 'Model seed 2',
    fuel: 'diesel',
    year: 1990,
    mileage: 2,
    price: 2,
    status: 'reserved'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterVehicleInput)
const CUSTOM: RegisterVehicleInput[] = [
  {
    id: '019eb800-ee32-7000-8000-000000000101',
    vin: 'VSSZZZKL8PR041233',
    brand: 'Seat',
    model: 'León',
    version: '1.5 eTSI FR DSG',
    plate: '4521 MKL',
    color: 'Gris magnético',
    fuel: 'hybrid',
    year: 2024,
    mileage: 12500,
    price: 24900,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000102',
    vin: 'WVWZZZAUZPW339812',
    brand: 'Volkswagen',
    model: 'Golf',
    version: '2.0 TDI Life',
    plate: '7830 LZR',
    color: 'Blanco puro',
    fuel: 'diesel',
    year: 2023,
    mileage: 41200,
    price: 22400,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000103',
    vin: 'JTDKBRFU9P3079441',
    brand: 'Toyota',
    model: 'Corolla',
    version: '1.8 Hybrid Active Tech',
    plate: '9012 MTT',
    color: 'Rojo emoción',
    fuel: 'hybrid',
    year: 2025,
    mileage: 8900,
    price: 26700,
    status: 'reserved'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000104',
    vin: 'VF3MCBHZWPS102284',
    brand: 'Peugeot',
    model: '2008',
    version: '1.2 PureTech Allure',
    plate: '2340 LKP',
    color: 'Azul vértigo',
    fuel: 'gasoline',
    year: 2023,
    mileage: 35600,
    price: 19900,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000105',
    vin: '5YJ3E7EB1PF412908',
    brand: 'Tesla',
    model: 'Model 3',
    version: 'Long Range AWD',
    plate: '1187 MSW',
    color: 'Negro sólido',
    fuel: 'electric',
    year: 2024,
    mileage: 22100,
    price: 38900,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000106',
    vin: 'WBA5R1C0XPV882341',
    brand: 'BMW',
    model: 'Serie 3',
    version: '320d xDrive',
    plate: '5644 LNC',
    color: 'Azul portimao',
    fuel: 'diesel',
    year: 2022,
    mileage: 58700,
    price: 31500,
    status: 'workshop'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000107',
    vin: 'VF1RJA00871129034',
    brand: 'Renault',
    model: 'Captur',
    version: 'E-Tech Techno',
    plate: '8402 MHV',
    color: 'Naranja atacama',
    fuel: 'hybrid',
    year: 2024,
    mileage: 15300,
    price: 23800,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000108',
    vin: 'KMHLC81GFPU204476',
    brand: 'Hyundai',
    model: 'Ioniq 5',
    version: '77 kWh Energy RWD',
    plate: '3319 MPD',
    color: 'Gris cyber',
    fuel: 'electric',
    year: 2025,
    mileage: 4200,
    price: 42600,
    status: 'reserved'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000109',
    vin: 'W0VZZZ26ZPB077615',
    brand: 'Opel',
    model: 'Corsa',
    version: '1.2 T Edition',
    plate: '6710 LTF',
    color: 'Blanco jade',
    fuel: 'gasoline',
    year: 2022,
    mileage: 47900,
    price: 14500,
    status: 'sold'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000110',
    vin: 'VSSZZZ7NZPR118842',
    brand: 'Cupra',
    model: 'Formentor',
    version: '1.5 eTSI DSG',
    plate: '9954 MRC',
    color: 'Gris grafito mate',
    fuel: 'hybrid',
    year: 2025,
    mileage: 6800,
    price: 33200,
    status: 'stock'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000111',
    vin: 'WDD1770121J884529',
    brand: 'Mercedes-Benz',
    model: 'Clase A',
    version: 'A 200 AMG Line',
    plate: '2205 LYG',
    color: 'Plata iridio',
    fuel: 'gasoline',
    year: 2021,
    mileage: 71400,
    price: 27900,
    status: 'sold'
  },
  {
    id: '019eb800-ee32-7000-8000-000000000112',
    vin: 'MMBJNKL30PH014763',
    brand: 'Kia',
    model: 'Sportage',
    version: '1.6 T-GDi HEV Drive',
    plate: '4478 MJB',
    color: 'Verde experience',
    fuel: 'hybrid',
    year: 2024,
    mileage: 18600,
    price: 29400,
    status: 'stock'
  }
]
// @ai:end

export const SEED_VEHICLES: RegisterVehicleInput[] = [...DERIVED, ...CUSTOM]
