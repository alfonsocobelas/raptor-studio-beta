import { v7 as uuidv7 } from 'uuid'
import { Visita } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita'
import { VisitaPrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita-types'
import { VisitaConfirmada } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-confirmada.vo'
import { VisitaFecha } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-fecha.vo'
import { VisitaInteresado } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-interesado.vo'
import { VisitaObservaciones } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-observaciones.vo'
import { VisitaReferencia } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-referencia.vo'
import { VisitaId } from '../../../../../src/contexts/shared/domain/value-objects/visitas/visita-id.vo'
import { PropiedadId } from '../../../../../src/contexts/shared/domain/value-objects/propiedades/propiedad-id.vo'

export class VisitaBuilder {
  private props: VisitaPrimitiveProps = {
    id: uuidv7(),
    referencia: 'Referencia 1',
    fecha: '2026-01-15',
    interesado: '',
    observaciones: '',
    confirmada: false,
    propiedadId: uuidv7(),
    propiedadName: 'PropiedadName 1'
  }

  static aVisita(): VisitaBuilder {
    return new VisitaBuilder()
  }

  withId(id: string): VisitaBuilder {
    this.props.id = id
    return this
  }

  withPropiedadId(propiedadId: string): VisitaBuilder {
    this.props.propiedadId = propiedadId
    return this
  }

  withProps(overrides?: Partial<VisitaPrimitiveProps>): VisitaBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Visita {
    return Visita.create({
      id: VisitaId.create(this.props.id),
      referencia: VisitaReferencia.create(this.props.referencia),
      fecha: VisitaFecha.create(this.props.fecha),
      interesado: VisitaInteresado.create(this.props.interesado),
      observaciones: VisitaObservaciones.create(this.props.observaciones),
      confirmada: VisitaConfirmada.create(this.props.confirmada),
      propiedadId: PropiedadId.create(this.props.propiedadId),
      propiedadName: this.props.propiedadName
    })
  }

  build(): Visita {
    return Visita.fromPrimitives(this.props)
  }
}
