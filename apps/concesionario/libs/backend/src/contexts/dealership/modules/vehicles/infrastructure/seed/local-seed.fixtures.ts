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
    id: '019eb801-0011-7000-8000-000000000001',
    vin: 'VF1RJL00X67891234',
    brand: 'Renault',
    model: 'Clio',
    version: 'TCe 90 Techno',
    plate: '8812 MJC',
    color: 'Blanco Glacier',
    fuel: 'gasoline',
    year: 2024,
    mileage: 7400,
    price: 17950,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000002',
    vin: 'WVWZZZAUZNP123456',
    brand: 'Volkswagen',
    model: 'Golf',
    version: '2.0 TDI Life',
    plate: '9034 KZT',
    color: 'Gris Indium',
    fuel: 'diesel',
    year: 2022,
    mileage: 41200,
    price: 23500,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000003',
    vin: 'JTDBR32E730123456',
    brand: 'Toyota',
    model: 'Corolla',
    version: '125H Active Tech',
    plate: '4821 LKM',
    color: 'Azul Denim',
    fuel: 'hybrid',
    year: 2023,
    mileage: 18500,
    price: 24900,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000004',
    vin: '5YJ3E7EA8KF123456',
    brand: 'Tesla',
    model: 'Model 3',
    version: 'RWD',
    plate: '1276 MNB',
    color: 'Negro Solido',
    fuel: 'electric',
    year: 2024,
    mileage: 9800,
    price: 36900,
    status: 'reserved',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000005',
    vin: 'VSSZZZKLZPR123456',
    brand: 'SEAT',
    model: 'Leon',
    version: '1.5 eTSI FR',
    plate: '5540 LLP',
    color: 'Rojo Desire',
    fuel: 'hybrid',
    year: 2023,
    mileage: 22100,
    price: 25800,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000006',
    vin: 'WBA8E9G50HNU12345',
    brand: 'BMW',
    model: 'Serie 3',
    version: '320d xDrive',
    plate: '3391 KHF',
    color: 'Blanco Alpine',
    fuel: 'diesel',
    year: 2021,
    mileage: 58300,
    price: 32400,
    status: 'workshop',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000007',
    vin: 'TMAJ3815AMJ123456',
    brand: 'Hyundai',
    model: 'Tucson',
    version: '1.6 T-GDI HEV',
    plate: '6620 LTR',
    color: 'Verde Amazon',
    fuel: 'hybrid',
    year: 2023,
    mileage: 26700,
    price: 29900,
    status: 'reserved',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000008',
    vin: 'VF3CCHMZ3JT123456',
    brand: 'Peugeot',
    model: '208',
    version: 'PureTech 100 Allure',
    plate: '2258 KWS',
    color: 'Amarillo Faro',
    fuel: 'gasoline',
    year: 2022,
    mileage: 33900,
    price: 16400,
    status: 'sold',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000009',
    vin: 'U5YPH812ANL123456',
    brand: 'Kia',
    model: 'Sportage',
    version: '1.6 CRDi MHEV',
    plate: '7745 LVG',
    color: 'Gris Steel',
    fuel: 'diesel',
    year: 2023,
    mileage: 19800,
    price: 28700,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000010',
    vin: 'UU1DJF00X67123456',
    brand: 'Dacia',
    model: 'Sandero',
    version: 'ECO-G 100 Stepway',
    plate: '9917 MRD',
    color: 'Naranja Arizona',
    fuel: 'gasoline',
    year: 2024,
    mileage: 5100,
    price: 14200,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000011',
    vin: 'W1N2479871J123456',
    brand: 'Mercedes-Benz',
    model: 'GLA',
    version: '200d Progressive',
    plate: '1183 KQX',
    color: 'Gris Montana',
    fuel: 'diesel',
    year: 2022,
    mileage: 47600,
    price: 35800,
    status: 'stock',
    notes: ''
  },
  {
    id: '019eb801-0011-7000-8000-000000000012',
    vin: 'SJNFAAJ11U1234567',
    brand: 'Nissan',
    model: 'Qashqai',
    version: 'DIG-T 140 mHEV',
    plate: '4419 KYU',
    color: 'Blanco Storm',
    fuel: 'hybrid',
    year: 2022,
    mileage: 36800,
    price: 24600,
    status: 'stock',
    notes: ''
  }
]
// @ai:end

export const SEED_VEHICLES: RegisterVehicleInput[] = [...CUSTOM]
