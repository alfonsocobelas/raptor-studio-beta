import { Project } from '../../../../src/contexts/sap-licensing/modules/projects/domain/project'
import { ProjectMother } from './mothers/project.mother'

describe('Project', () => {
  /**
   * El mapeo es lo que más se rompe al añadir un campo: si `toPrimitives` se olvida de uno,
   * o `fromPrimitives` lo pierde por el camino, el redondeo deja de cerrar.
   */
  it('round-trips through primitives without losing fields', () => {
    const primitives = ProjectMother.primitives()

    expect(Project.fromPrimitives(primitives).toPrimitives()).toEqual(primitives)
  })
})
