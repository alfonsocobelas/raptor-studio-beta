export interface RegisterAgenteDto {
  id: string
  nombre: string
  email?: string
  telefono?: string
  comisionPorcentaje: number
  activo: boolean
}
