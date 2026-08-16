import { v7 as uuidv7 } from 'uuid'
import { Muestra } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra'
import { MuestraPrimitiveProps } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-types'
import { MuestraCodigo } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-codigo.vo'
import { MuestraEstado } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-estado.vo'
import { MuestraImporte } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-importe.vo'
import { MuestraLimiteinforme } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-limiteinforme.vo'
import { MuestraRecogida } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-recogida.vo'
import { MuestraTecnico } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-tecnico.vo'
import { MuestraId } from '../../../../../src/contexts/shared/domain/value-objects/muestras/muestra-id.vo'
import { PuntoId } from '../../../../../src/contexts/shared/domain/value-objects/puntos/punto-id.vo'

export class MuestraBuilder {
  private props: MuestraPrimitiveProps = {
    id: uuidv7(),
    codigo: 'Codigo 1',
    estado: 'recibida',
    tecnico: '',
    recogida: '2026-01-15',
    limiteInforme: '2026-01-15',
    importe: 0,
    puntoId: uuidv7(),
    puntoName: 'PuntoName 1'
  }

  static aMuestra(): MuestraBuilder {
    return new MuestraBuilder()
  }

  withId(id: string): MuestraBuilder {
    this.props.id = id
    return this
  }

  withEstado(estado: string): MuestraBuilder {
    this.props.estado = estado
    return this
  }

  withPuntoId(puntoId: string): MuestraBuilder {
    this.props.puntoId = puntoId
    return this
  }

  withProps(overrides?: Partial<MuestraPrimitiveProps>): MuestraBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Muestra {
    return Muestra.create({
      id: MuestraId.create(this.props.id),
      codigo: MuestraCodigo.create(this.props.codigo),
      estado: MuestraEstado.create(this.props.estado),
      tecnico: MuestraTecnico.create(this.props.tecnico),
      recogida: MuestraRecogida.create(this.props.recogida),
      limiteInforme: MuestraLimiteinforme.create(this.props.limiteInforme),
      importe: MuestraImporte.create(this.props.importe),
      puntoId: PuntoId.create(this.props.puntoId),
      puntoName: this.props.puntoName
    })
  }

  build(): Muestra {
    return Muestra.fromPrimitives(this.props)
  }
}
