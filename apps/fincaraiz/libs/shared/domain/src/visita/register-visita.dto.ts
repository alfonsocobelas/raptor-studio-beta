export interface RegisterVisitaDto {
  id: string
  referencia: string
  fecha: string
  interesado?: string
  observaciones?: string
  confirmada: boolean
  propiedadId: string
  propiedadName: string
}
